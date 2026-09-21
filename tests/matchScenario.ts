import { LocalGameSession } from "../src/local/localGame";
import { canBuildRoad, hasRoad } from "../src/game/roads";
import { points, samePoint, coordinate } from "../src/game/geometry";
import { stoneAt } from "../src/game/movement";
import { getReproductionPoints } from "../src/game/reproduction";
import type { GameAction, GameEvent, Player, Point } from "../src/game/types";

/** Cooperative, legal hot-seat match from the real initial position. No state injection. */
export function fullMatch() {
  const session = new LocalGameSession();
  const transcript: {
    action: GameAction;
    clicks: string[];
    events: GameEvent[];
    turn: number;
  }[] = [];
  function dispatch(action: GameAction) {
    let clicks: string[] = [];
    if (action.type === "build-road")
      clicks = ["ROAD", coordinate(action.from), coordinate(action.to)];
    if (action.type === "move")
      clicks = [
        "MOVE",
        coordinate(session.game.stones.find((x) => x.id === action.stoneId)!),
        coordinate(action.to),
      ];
    if (action.type === "reproduce") clicks = [coordinate(action.at)];
    if (action.type === "capture")
      clicks = [
        coordinate(session.game.stones.find((x) => x.id === action.stoneId)!),
      ];
    session.dispatch(action);
    transcript.push({
      action,
      clicks,
      events: [...session.game.events],
      turn: session.game.turn,
    });
  }
  function filler() {
    for (const from of points)
      for (const to of points)
        if (canBuildRoad(session.game, from, to)) {
          dispatch({ type: "build-road", from, to });
          return;
        }
    throw new Error("No filler road available");
  }
  function turn(player: Player) {
    while (session.game.currentPlayer !== player) filler();
  }
  function resolve(spawn?: Point) {
    if (session.game.pending?.type === "reproduction")
      dispatch({
        type: "reproduce",
        at: spawn ?? getReproductionPoints(session.game)[0],
      });
    if (session.game.pending?.type === "capture")
      dispatch({ type: "capture", stoneId: session.game.pending.targetIds[0] });
  }
  function go(id: string, to: Point, spawn?: Point) {
    const stone = session.game.stones.find((x) => x.id === id);
    if (!stone) throw new Error(`Missing ${id}`);
    const from = { row: stone.row, col: stone.col },
      player = stone.player;
    if (samePoint(from, to)) return;
    const direct =
      hasRoad(session.game, from, to) || canBuildRoad(session.game, from, to);
    if (!direct) {
      const via = points.find(
        (p) =>
          !stoneAt(session.game, p) &&
          p.row > 0 &&
          p.row < 9 &&
          (hasRoad(session.game, from, p) ||
            canBuildRoad(session.game, from, p)) &&
          (hasRoad(session.game, p, to) || canBuildRoad(session.game, p, to)),
      );
      if (!via) throw new Error("No route");
      go(id, via);
      go(id, to, spawn);
      return;
    }
    turn(player);
    if (!hasRoad(session.game, from, to))
      dispatch({ type: "build-road", from, to });
    turn(player);
    dispatch({ type: "move", stoneId: id, to });
    resolve(spawn);
  }
  // Long diagonal; enemy capture completed by arrival, followed by voluntary suicide.
  go("s1", { row: 4, col: 4 });
  go("s7", { row: 4, col: 5 });
  go("s2", { row: 4, col: 6 });
  go("s8", { row: 4, col: 5 });
  // First black lineage. White reaches both sides of the newborn carrier.
  go("s3", { row: 9, col: 8 }, { row: 0, col: 1 });
  const firstCarrier = session.game.reproductionCarrier.black;
  go("s9", { row: 0, col: 0 }, { row: 9, col: 0 });
  go("s10", { row: 0, col: 2 });
  if (session.game.reproductionCarrier.black !== null)
    throw new Error("Expected captured carrier reset");
  // Same parent must leave and re-enter after the reset to begin a second lineage.
  go("s3", { row: 8, col: 8 });
  go("s3", { row: 9, col: 8 }, { row: 0, col: 1 });
  const secondCarrier = session.game.reproductionCarrier.black;
  // Finish the match through the established central sandwich, including white carrier.
  for (const id of session.game.stones
    .filter((x) => x.player === "white")
    .map((x) => x.id))
    go(id, { row: 4, col: 5 });
  return { session, transcript, firstCarrier, secondCarrier };
}
