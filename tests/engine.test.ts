import { describe, expect, it } from "vitest";
import { createGame } from "../src/game/gameState";
import { applyAction } from "../src/game/rules";
import { homeRow, opponentRow } from "../src/game/reproduction";
import { canBuildRoad } from "../src/game/roads";
import { fromDisplayPoint, toDisplayPoint } from "../src/game/geometry";
import { LocalGameSession } from "../src/local/localGame";
import type { GameState, Player, Point } from "../src/game/types";
const p = (row: number, col: number): Point => ({ row, col });
const road = (state: GameState, from: Point, to: Point) => applyAction(state, { type: "build-road", from, to });

describe("canonical orientation and first player", () => {
  it("places white at the canonical top and black at the canonical bottom", () => {
    const s = createGame();
    expect(s.stones.filter(x => x.player === "white").every(x => x.row === 0)).toBe(true);
    expect(s.stones.filter(x => x.player === "black").every(x => x.row === 9)).toBe(true);
    expect(s.stones.filter(x => x.player === "black").map(x => x.col)).toEqual([2, 3, 4, 5, 6, 7]);
    expect(homeRow("white")).toBe(0); expect(homeRow("black")).toBe(9);
    expect(opponentRow("white")).toBe(9); expect(opponentRow("black")).toBe(0);
  });
  it("defaults to black first and initializes white first in the engine", () => {
    expect(createGame()).toMatchObject({ firstPlayer: "black", currentPlayer: "black", actionsRemaining: 3 });
    expect(createGame({ firstPlayer: "white" })).toMatchObject({ firstPlayer: "white", currentPlayer: "white", actionsRemaining: 3 });
  });
});

function threeRoads(state: GameState) {
  for (let i = 0; i < 3; i++) {
    const index = state.roads.length;
    state = road(state, p(1 + Math.floor(index / 9), index % 9), p(2 + Math.floor(index / 9), index % 9));
  }
  return state;
}
describe("turn advancement", () => {
  it.each(["black", "white"] as Player[])("gives exactly three actions to consecutive %s-first turns", firstPlayer => {
    let s = createGame({ firstPlayer }); const sequence: Player[] = [];
    for (let turn = 0; turn < 6; turn++) {
      sequence.push(s.currentPlayer); s = threeRoads(s);
      expect(s.actionsRemaining).toBe(3);
    }
    expect(sequence).toEqual([firstPlayer, firstPlayer === "black" ? "white" : "black", firstPlayer, firstPlayer === "black" ? "white" : "black", firstPlayer, firstPlayer === "black" ? "white" : "black"]);
  });
  it("waits for a third-action reproduction choice before changing turn", () => {
    let s = createGame();
    s.stones = [{ id: "b", player: "black", row: 1, col: 0 }, { id: "w", player: "white", row: 0, col: 5 }];
    s.roads = [{ from: p(1,0), to: p(0,0) }]; s.actionsRemaining = 1;
    s = applyAction(s, { type: "move", stoneId: "b", to: p(0,0) });
    expect(s).toMatchObject({ currentPlayer: "black", actionsRemaining: 1, pending: { type: "reproduction" } });
    s = applyAction(s, { type: "reproduce", at: p(9,0) });
    expect(s).toMatchObject({ currentPlayer: "white", actionsRemaining: 3, pending: null });
  });
});
describe("roads and perspective", () => {
  it.each([[1,0],[1,1],[2,1],[3,1]])("allows legal displacement (%i,%i)", (r,c) => expect(canBuildRoad(createGame(), p(4,4), p(4+r,4+c))).toBe(true));
  it.each([[2,0],[2,2],[3,2]])("rejects invalid displacement (%i,%i)", (r,c) => expect(canBuildRoad(createGame(), p(4,4), p(4+r,4+c))).toBe(false));
  it("transforms coordinates without mutating canonical points", () => {
    expect(toDisplayPoint(p(9,2), "black")).toEqual(p(9,2));
    expect(toDisplayPoint(p(0,7), "white")).toEqual(p(9,2));
    expect(fromDisplayPoint(p(9,2), "white")).toEqual(p(0,7));
  });
});
describe("local session", () => {
  it("preserves match options across rematch and changes first player only before actions", () => {
    const local = new LocalGameSession(undefined, { firstPlayer: "white", undoMode: "all", showLegalPoints: false });
    const stones = structuredClone(local.game.stones);
    local.changeFirstPlayer();
    expect(local.game).toMatchObject({ firstPlayer: "black", currentPlayer: "black", actionsRemaining: 3 });
    expect(local.game.stones).toEqual(stones);
    local.dispatch({ type: "build-road", from: p(4,0), to: p(5,0) });
    expect(local.canChangeFirstPlayer).toBe(false);
    local.undo(); expect(local.canChangeFirstPlayer).toBe(true);
    local.rematch(); expect(local.game.firstPlayer).toBe("black"); expect(local.settings.showLegalPoints).toBe(false);
  });
});
