import { expect, it } from "vitest";
import { LocalGameSession } from "../src/local/localGame";
it("plays consecutive complete turns without duplicate turn ownership", () => {
  const game = new LocalGameSession(); const players: string[] = [];
  for (let i = 0; i < 12; i++) {
    players.push(game.game.currentPlayer);
    const row = 1 + Math.floor(i / 3) * 2;
    game.dispatch({ type: "build-road", from: { row, col: i % 3 }, to: { row: row + 1, col: i % 3 } });
  }
  expect(players).toEqual(["black", "black", "black", "white", "white", "white", "black", "black", "black", "white", "white", "white"]);
});
