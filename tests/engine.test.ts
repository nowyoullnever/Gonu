import { describe, it, expect } from "vitest";
import { createGame } from "../src/game/gameState";
import { applyAction } from "../src/game/rules";
import { canBuildRoad, hasRoad } from "../src/game/roads";
import { getLegalMoves } from "../src/game/movement";
import { getCaptureCandidates } from "../src/game/capture";
import { LocalGameSession } from "../src/local/localGame";
import type { GameState, Point, Stone, Player } from "../src/game/types";
const p = (row: number, col: number): Point => ({ row, col });
const stone = (
  id: string,
  player: Player,
  row: number,
  col: number,
): Stone => ({ id, player, row, col });
function setup(stones: Stone[]) {
  return { ...createGame(), stones, nextStoneId: 100 };
}
function move(s: GameState, id: string, to: Point) {
  const from = s.stones.find((x) => x.id === id)!;
  s = { ...s, roads: [...s.roads, { from: p(from.row, from.col), to }] };
  return applyAction(s, { type: "move", stoneId: id, to });
}
const spare = stone("spare", "white", 8, 8);
describe("initial state", () => {
  it("has 100-coordinate setup, six each, no roads, black first, three AP, no lineage", () => {
    const s = createGame();
    expect(
      s.stones.filter((x) => x.player === "black").map((x) => p(x.row, x.col)),
    ).toEqual([2, 3, 4, 5, 6, 7].map((c) => p(0, c)));
    expect(
      s.stones.filter((x) => x.player === "white").map((x) => p(x.row, x.col)),
    ).toEqual([2, 3, 4, 5, 6, 7].map((c) => p(9, c)));
    expect(new Set(s.stones.map((x) => x.id)).size).toBe(12);
    expect(s.roads).toEqual([]);
    expect(s.currentPlayer).toBe("black");
    expect(s.actionsRemaining).toBe(3);
    expect(s.reproductionCarrier).toEqual({ black: null, white: null });
  });
});
describe("roads", () => {
  it.each([
    [1, 0],
    [0, 1],
    [1, 1],
    [4, 1],
    [5, 1],
    [7, 4],
    [8, 1],
  ])("accepts (%i,%i)", (r, c) =>
    expect(canBuildRoad(createGame(), p(0, 0), p(r, c))).toBe(true),
  );
  it.each([
    [8, 2],
    [2, 0],
    [2, 2],
    [4, 2],
    [0, 0],
    [10, 0],
    [-1, 0],
    [1.5, 1],
  ])("rejects (%i,%i)", (r, c) =>
    expect(canBuildRoad(createGame(), p(0, 0), p(r, c))).toBe(false),
  );
  it("rejects duplicate/reverse roads, allows crossing without graph junctions", () => {
    let s = applyAction(createGame(), {
      type: "build-road",
      from: p(0, 2),
      to: p(3, 4),
    });
    expect(canBuildRoad(s, p(0, 2), p(3, 4))).toBe(false);
    expect(canBuildRoad(s, p(3, 4), p(0, 2))).toBe(false);
    s = applyAction(s, { type: "build-road", from: p(0, 4), to: p(3, 2) });
    expect(getLegalMoves(s, "s1")).toEqual([p(3, 4)]);
    expect(hasRoad(s, p(0, 2), p(3, 2))).toBe(false);
  });
  it("can build between occupied endpoints without requiring ownership", () =>
    expect(
      applyAction(createGame(), {
        type: "build-road",
        from: p(0, 2),
        to: p(0, 3),
      }).roads,
    ).toHaveLength(1));
});
describe("moves and turns", () => {
  it("rejects nonexistent roads, occupied destinations, wrong owner without mutating input", () => {
    const s = createGame(),
      copy = JSON.stringify(s);
    expect(() =>
      applyAction(s, { type: "move", stoneId: "s1", to: p(1, 2) }),
    ).toThrow();
    s.roads = [{ from: p(0, 2), to: p(0, 3) }];
    expect(() =>
      applyAction(s, { type: "move", stoneId: "s1", to: p(0, 3) }),
    ).toThrow();
    expect(() =>
      applyAction(s, { type: "move", stoneId: "s7", to: p(8, 2) }),
    ).toThrow();
    s.roads = [];
    expect(JSON.stringify(s)).toBe(copy);
  });
  it("new road is immediately usable and costs one action even at √65", () => {
    let s = applyAction(createGame(), {
      type: "build-road",
      from: p(0, 2),
      to: p(8, 3),
    });
    s = applyAction(s, { type: "move", stoneId: "s1", to: p(8, 3) });
    expect(s.actionsRemaining).toBe(1);
    expect(s.stones[0].id).toBe("s1");
  });
  it("same stone moves three times and automatically changes turn", () => {
    let s = createGame();
    s.roads = [
      { from: p(0, 2), to: p(1, 2) },
      { from: p(1, 2), to: p(2, 3) },
      { from: p(2, 3), to: p(3, 3) },
    ];
    for (const to of [p(1, 2), p(2, 3), p(3, 3)])
      s = applyAction(s, { type: "move", stoneId: "s1", to });
    expect(s.currentPlayer).toBe("white");
    expect(s.actionsRemaining).toBe(3);
    expect(s.turn).toBe(2);
  });
  it("white can use black-built roads", () => {
    let s = createGame();
    for (const [from, to] of [
      [p(9, 2), p(8, 2)],
      [p(0, 0), p(1, 0)],
      [p(0, 1), p(1, 1)],
    ])
      s = applyAction(s, { type: "build-road", from, to });
    expect(s.currentPlayer).toBe("white");
    s = applyAction(s, { type: "move", stoneId: "s7", to: p(8, 2) });
    expect(s.actionsRemaining).toBe(2);
  });
});
describe("capture", () => {
  it.each(["horizontal", "vertical"])(
    "%s sandwich captures without capture roads",
    (axis) => {
      const v = axis === "vertical",
        q = (r: number, c: number) => (v ? p(c, r) : p(r, c));
      const a = q(4, 3),
        b = q(4, 4),
        from = q(5, 5),
        to = q(4, 5);
      let s = setup([
        stone("a", "black", a.row, a.col),
        stone("b", "white", b.row, b.col),
        stone("c", "black", from.row, from.col),
        spare,
      ]);
      s = move(s, "c", to);
      expect(s.stones.some((x) => x.id === "b")).toBe(false);
      expect(s.stones).toHaveLength(3);
    },
  );
  it("does not capture diagonals or gaps", () => {
    const s = setup([
      stone("a", "black", 2, 2),
      stone("b", "white", 3, 3),
      stone("c", "black", 4, 4),
      stone("d", "black", 6, 1),
      stone("e", "white", 6, 3),
      stone("f", "black", 6, 4),
    ]);
    expect(getCaptureCandidates(s, "black")).toEqual([]);
  });
  it("suicide is mandatory, takes priority, and resets a captured carrier", () => {
    let s = setup([
      stone("a", "black", 3, 3),
      stone("b", "white", 4, 2),
      stone("c", "white", 4, 4),
      stone("d", "white", 5, 3),
      stone("e", "black", 6, 3),
    ]);
    s.reproductionCarrier.black = "a";
    s = move(s, "a", p(4, 3));
    expect(s.stones.some((x) => x.id === "a")).toBe(false);
    expect(s.stones.some((x) => x.id === "d")).toBe(true);
    expect(s.reproductionCarrier.black).toBeNull();
  });
  it("blocks further actions for multiple targets, selected target only, one AP", () => {
    let s = setup([
      stone("a", "black", 3, 4),
      stone("b", "black", 4, 2),
      stone("c", "black", 6, 4),
      stone("x", "white", 4, 3),
      stone("y", "white", 5, 4),
    ]);
    s = move(s, "a", p(4, 4));
    expect(s.pending).toEqual({ type: "capture", targetIds: ["x", "y"] });
    expect(s.actionsRemaining).toBe(3);
    expect(() =>
      applyAction(s, { type: "build-road", from: p(0, 0), to: p(1, 0) }),
    ).toThrow();
    expect(() => applyAction(s, { type: "capture", stoneId: "b" })).toThrow();
    s = applyAction(s, { type: "capture", stoneId: "y" });
    expect(s.stones.some((x) => x.id === "x")).toBe(true);
    expect(s.stones.some((x) => x.id === "y")).toBe(false);
    expect(s.actionsRemaining).toBe(2);
    s = applyAction(s, { type: "build-road", from: p(0, 0), to: p(1, 0) });
    expect(s.stones.some((x) => x.id === "x")).toBe(true);
  });
  it("last enemy capture and last-own-stone suicide end immediately", () => {
    let s = setup([
      stone("a", "black", 4, 2),
      stone("b", "black", 3, 4),
      stone("x", "white", 4, 3),
    ]);
    s = move(s, "b", p(4, 4));
    expect(s.winner).toBe("black");
    expect(s.actionsRemaining).toBe(0);
    expect(() => applyAction(s, { type: "capture", stoneId: "a" })).toThrow();
    s = setup([
      stone("a", "black", 3, 3),
      stone("b", "white", 4, 2),
      stone("c", "white", 4, 4),
    ]);
    s = move(s, "a", p(4, 3));
    expect(s.winner).toBe("white");
  });
});
describe("reproduction and lineage", () => {
  function arrive() {
    return move(setup([stone("a", "black", 8, 0), spare]), "a", p(9, 0));
  }
  it("arrival waits for free spawn, all ten home points available, stable unique child becomes carrier", () => {
    let s = arrive();
    expect(s.pending?.type).toBe("reproduction");
    expect(s.actionsRemaining).toBe(3);
    expect(() => applyAction(s, { type: "reproduce", at: p(1, 0) })).toThrow();
    s = applyAction(s, { type: "reproduce", at: p(0, 9) });
    expect(s.stones.find((x) => x.id === "s100")).toMatchObject({
      row: 0,
      col: 9,
      player: "black",
    });
    expect(s.reproductionCarrier.black).toBe("s100");
    expect(s.actionsRemaining).toBe(2);
    expect(s.stones.find((x) => x.id === "a")).toMatchObject({
      row: 9,
      col: 0,
    });
    s = move(s, "a", p(8, 0));
    s = move(s, "a", p(9, 0));
    expect(s.pending).toBeNull();
    expect(s.stones).toHaveLength(3);
  });
  it("only carrier produces next child with new unique ID", () => {
    let s = setup([
      stone("a", "black", 8, 2),
      stone("b", "black", 8, 4),
      spare,
    ]);
    s.reproductionCarrier.black = "b";
    s = move(s, "a", p(9, 2));
    expect(s.pending).toBeNull();
    s = move(s, "b", p(9, 4));
    expect(s.pending?.type).toBe("reproduction");
    s = applyAction(s, { type: "reproduce", at: p(0, 0) });
    expect(s.reproductionCarrier.black).toBe("s100");
  });
  it("white reproduces on the opposite home row", () => {
    let s = setup([stone("a", "white", 1, 2), stone("b", "black", 8, 5)]);
    s.currentPlayer = "white";
    s = move(s, "a", p(0, 2));
    s = applyAction(s, { type: "reproduce", at: p(9, 9) });
    expect(s.reproductionCarrier.white).toBe("s100");
  });
  it("full home row skips birth, preserves carrier", () => {
    let s = setup([
      ...Array.from({ length: 10 }, (_, c) => stone(`h${c}`, "black", 0, c)),
      stone("a", "black", 8, 1),
      spare,
    ]);
    s.reproductionCarrier.black = "a";
    s = move(s, "a", p(9, 1));
    expect(s.pending).toBeNull();
    expect(s.reproductionCarrier.black).toBe("a");
    expect(s.actionsRemaining).toBe(2);
  });
  it("capture resets carrier; edge resident must leave the row and reenter", () => {
    let s = setup([
      stone("a", "black", 9, 0),
      stone("carrier", "black", 4, 3),
      stone("b", "white", 4, 2),
      stone("c", "white", 3, 4),
    ]);
    s.reproductionCarrier.black = "carrier";
    s.currentPlayer = "white";
    s.actionsRemaining = 1;
    s = move(s, "c", p(4, 4));
    expect(s.reproductionCarrier.black).toBeNull();
    expect(s.stones).toHaveLength(3);
    expect(s.pending).toBeNull();
    s = move(s, "a", p(9, 1));
    expect(s.pending).toBeNull();
    s = move(s, "a", p(8, 1));
    s = move(s, "a", p(9, 1));
    expect(s.pending?.type).toBe("reproduction");
    s = applyAction(s, { type: "reproduce", at: p(0, 0) });
    expect(s.reproductionCarrier.black).toBe("s100");
    expect(s.currentPlayer).toBe("white");
  });
  it("birth resolves before parent suicide and can prevent elimination", () => {
    let s = setup([
      stone("a", "black", 8, 1),
      stone("b", "white", 9, 0),
      stone("c", "white", 9, 2),
    ]);
    s = move(s, "a", p(9, 1));
    expect(s.pending?.type).toBe("reproduction");
    s = applyAction(s, { type: "reproduce", at: p(0, 0) });
    expect(s.stones.some((x) => x.id === "a")).toBe(false);
    expect(s.winner).toBeNull();
    expect(s.reproductionCarrier.black).toBe("s100");
  });
  it("a newborn endpoint can complete a capture", () => {
    let s = setup([
      stone("a", "black", 8, 8),
      stone("b", "black", 0, 2),
      stone("w", "white", 0, 1),
      spare,
    ]);
    s = move(s, "a", p(9, 8));
    s = applyAction(s, { type: "reproduce", at: p(0, 0) });
    expect(s.stones.some((x) => x.id === "w")).toBe(false);
    expect(s.actionsRemaining).toBe(2);
  });
  it("newborn carrier itself is an enemy target on a subsequent action", () => {
    let s = setup([
      stone("a", "black", 8, 8),
      stone("w1", "white", 0, 0),
      stone("w2", "white", 1, 2),
      spare,
    ]);
    s.actionsRemaining = 1;
    s = move(s, "a", p(9, 8));
    s = applyAction(s, { type: "reproduce", at: p(0, 1) });
    expect(s.currentPlayer).toBe("white");
    s = move(s, "w2", p(0, 2));
    expect(s.pending?.type).toBe("reproduction");
    s = applyAction(s, { type: "reproduce", at: p(9, 0) });
    expect(s.reproductionCarrier.black).toBeNull();
  });
});
describe("local snapshots", () => {
  it("restores road, AP and move exactly; locks previous turn", () => {
    const local = new LocalGameSession(),
      initial = structuredClone(local.game);
    local.dispatch({ type: "build-road", from: p(0, 2), to: p(1, 2) });
    local.undo();
    expect(local.game).toEqual(initial);
    local.dispatch({ type: "build-road", from: p(0, 2), to: p(1, 2) });
    const built = structuredClone(local.game);
    local.dispatch({ type: "move", stoneId: "s1", to: p(1, 2) });
    local.undo();
    expect(local.game).toEqual(built);
    local.dispatch({ type: "move", stoneId: "s1", to: p(1, 2) });
    local.dispatch({ type: "move", stoneId: "s1", to: p(0, 2) });
    expect(local.canUndo).toBe(false);
    expect(() => local.undo()).toThrow();
  });
  it.each(["capture", "suicide"])("undo %s and game-over", (kind) => {
    const s =
      kind === "capture"
        ? setup([
            stone("a", "black", 4, 2),
            stone("b", "black", 3, 4),
            stone("w", "white", 4, 3),
          ])
        : setup([
            stone("b", "black", 3, 4),
            stone("w", "white", 4, 3),
            stone("v", "white", 4, 5),
          ]);
    s.roads = [{ from: p(3, 4), to: p(4, 4) }];
    const local = new LocalGameSession(s);
    local.dispatch({ type: "move", stoneId: "b", to: p(4, 4) });
    expect(local.game.winner).not.toBeNull();
    local.undo();
    expect(local.game).toEqual(s);
  });
  it("undo pending/completed reproduction as one action, restoring lineage and ID counter", () => {
    const s = setup([stone("a", "black", 8, 0), spare]);
    s.roads = [{ from: p(8, 0), to: p(9, 0) }];
    const local = new LocalGameSession(s);
    local.dispatch({ type: "move", stoneId: "a", to: p(9, 0) });
    local.undo();
    expect(local.game).toEqual(s);
    local.dispatch({ type: "move", stoneId: "a", to: p(9, 0) });
    local.dispatch({ type: "reproduce", at: p(0, 9) });
    local.undo();
    expect(local.game).toEqual(s);
  });
  it("invalid commands add no history; rematch resets everything", () => {
    const local = new LocalGameSession();
    expect(() =>
      local.dispatch({ type: "move", stoneId: "s1", to: p(1, 2) }),
    ).toThrow();
    expect(local.canUndo).toBe(false);
    local.dispatch({ type: "build-road", from: p(0, 0), to: p(1, 0) });
    local.rematch();
    expect(local.game).toEqual(createGame());
    expect(local.canUndo).toBe(false);
  });
  it("state and actions replay identically through JSON", () => {
    const action = { type: "build-road" as const, from: p(0, 0), to: p(1, 0) };
    expect(
      applyAction(
        JSON.parse(JSON.stringify(createGame())),
        JSON.parse(JSON.stringify(action)),
      ),
    ).toEqual(applyAction(createGame(), action));
  });
});
