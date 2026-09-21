import type { GameAction, GameState, MoveContext } from "./types";
import { cloneState } from "./gameState";
import { samePoint } from "./geometry";
import { getLegalMoves } from "./movement";
import { roadError } from "./roads";
import { getCaptureCandidates, isSandwiched, opponent } from "./capture";
import { getReproductionPoints, triggersReproduction } from "./reproduction";

function removeStone(s: GameState, id: string, selfCapture = false) {
  const stone = s.stones.find((x) => x.id === id)!;
  s.stones = s.stones.filter((x) => x.id !== id);
  s.events.push({ type: "capture", captured: stone.player, selfCapture });
  if (s.reproductionCarrier[stone.player] === id) {
    s.reproductionCarrier[stone.player] = null;
    s.events.push({ type: "lineage-reset", player: stone.player });
  }
}
function finish(s: GameState) {
  s.pending = null;
  for (const p of ["black", "white"] as const)
    if (!s.stones.some((x) => x.player === p)) s.winner = opponent(p);
  s.actionsRemaining--;
  if (s.winner) {
    s.actionsRemaining = 0;
    s.events.push({ type: "win", player: s.winner });
  } else if (s.actionsRemaining === 0) {
    s.currentPlayer = opponent(s.currentPlayer);
    s.actionsRemaining = 3;
    s.turn++;
  }
}
function resolve(s: GameState, context: MoveContext) {
  s.pending = null;
  const moved = s.stones.find((x) => x.id === context.movedId)!;
  // Mandatory suicide takes the action's single capture slot.
  if (isSandwiched(s, moved)) {
    removeStone(s, moved.id, true);
    finish(s);
    return;
  }
  const targets = getCaptureCandidates(s, s.currentPlayer, context.affected);
  if (targets.length > 1) {
    s.pending = { type: "capture", targetIds: targets.map((x) => x.id) };
    return;
  }
  if (targets.length === 1) removeStone(s, targets[0].id);
  finish(s);
}
/** Pure reducer. Invalid commands throw without changing the input. */
export function applyAction(state: GameState, action: GameAction): GameState {
  if (state.winner) throw new Error("error.gameEnded");
  const s = cloneState(state);
  s.revision++;
  if (s.pending) {
    if (s.pending.type === "reproduction" && action.type === "reproduce") {
      if (!getReproductionPoints(s).some((p) => samePoint(p, action.at)))
        throw new Error("error.chooseHome");
      const context = s.pending.context;
      const child = {
        ...action.at,
        id: `s${s.nextStoneId++}`,
        player: s.currentPlayer,
      };
      s.stones.push(child);
      s.reproductionCarrier[s.currentPlayer] = child.id;
      s.events.push({ type: "reproduction", player: s.currentPlayer });
      context.affected.push({ ...action.at });
      resolve(s, context);
    } else if (s.pending.type === "capture" && action.type === "capture") {
      if (!s.pending.targetIds.includes(action.stoneId))
        throw new Error("error.chooseCapture");
      removeStone(s, action.stoneId);
      finish(s);
    } else throw new Error("error.completePending");
    return s;
  }
  s.events = [];
  if (action.type === "build-road") {
    const error = roadError(s, action.from, action.to);
    if (error) throw new Error(error);
    s.roads.push({ from: { ...action.from }, to: { ...action.to } });
    s.lastAction = {
      type: "build-road",
      from: { ...action.from },
      to: { ...action.to },
    };
    s.events.push({ type: "road", from: action.from, to: action.to });
    finish(s);
  } else if (action.type === "move") {
    if (!getLegalMoves(s, action.stoneId).some((p) => samePoint(p, action.to)))
      throw new Error("error.invalidMove");
    const stone = s.stones.find((x) => x.id === action.stoneId)!;
    const from = { row: stone.row, col: stone.col };
    Object.assign(stone, action.to);
    s.lastAction = { type: "move", from, to: { ...action.to } };
    s.events.push({
      type: "move",
      player: s.currentPlayer,
      from,
      to: { ...stone },
    });
    const context = { movedId: stone.id, affected: [{ ...action.to }] };
    if (triggersReproduction(s, stone, from))
      s.pending = { type: "reproduction", context };
    else resolve(s, context);
  } else throw new Error("error.completePending");
  return s;
}
