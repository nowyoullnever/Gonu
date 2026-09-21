import type { GameState, Stone } from "./types";
export function createGame(): GameState {
  const stones: Stone[] = [];
  for (const player of ["black", "white"] as const)
    for (let col = 2; col <= 7; col++)
      stones.push({
        id: `s${stones.length + 1}`,
        player,
        row: player === "black" ? 0 : 9,
        col,
      });
  return {
    stones,
    roads: [],
    currentPlayer: "black",
    actionsRemaining: 3,
    reproductionCarrier: { black: null, white: null },
    winner: null,
    pending: null,
    revision: 0,
    turn: 1,
    nextStoneId: 13,
    events: [],
    lastAction: null,
  };
}
export const cloneState = (s: GameState): GameState => structuredClone(s);
export const isGameOver = (s: GameState) => s.winner !== null;
