// @vitest-environment jsdom
import { it, expect, beforeEach } from "vitest";
import { localGameView } from "../src/ui/localGameView";
import { fullMatch } from "./matchScenario";
import { LocalGameSession } from "../src/local/localGame";
import { createGame } from "../src/game/gameState";
beforeEach(() => {
  document.body.innerHTML = '<main id="app"></main>';
});
it("plays full initial-position match through rendered buttons and rematches", () => {
  const { transcript, session: expected } = fullMatch();
  const session = localGameView(document.querySelector("main")!, () => {});
  for (const entry of transcript) {
    for (const click of entry.clicks) {
      const button = document.querySelector<HTMLButtonElement>(
        click === "ROAD"
          ? "#road"
          : click === "MOVE"
            ? "#move"
            : `[data-point="${click}"]`,
      )!;
      expect(button.disabled).toBe(false);
      button.click();
    }
  }
  expect(session.game).toEqual(expected.game);
  expect(document.querySelector("#result")!.textContent).toContain(
    "BLACK WINS",
  );
  document.querySelector<HTMLButtonElement>("#rematch")!.click();
  expect(session.game).toEqual(createGame());
  expect(document.querySelector("#result")!.hasAttribute("hidden")).toBe(true);
});
it("capture choices highlight only targets, block modes and undo the whole action", () => {
  const initial = createGame();
  initial.stones = [
    { id: "a", player: "black", row: 3, col: 4 },
    { id: "b", player: "black", row: 4, col: 2 },
    { id: "c", player: "black", row: 6, col: 4 },
    { id: "x", player: "white", row: 4, col: 3 },
    { id: "y", player: "white", row: 5, col: 4 },
  ];
  initial.roads = [{ from: { row: 3, col: 4 }, to: { row: 4, col: 4 } }];
  const session = localGameView(
    document.querySelector("main")!,
    () => {},
    new LocalGameSession(initial),
  );
  for (const selector of ["#move", '[data-point="E4"]', '[data-point="E5"]'])
    document.querySelector<HTMLButtonElement>(selector)!.click();
  expect(session.game.pending?.type).toBe("capture");
  expect(document.querySelectorAll(".capture-target")).toHaveLength(2);
  expect(document.querySelector<HTMLButtonElement>("#road")!.disabled).toBe(
    true,
  );
  document.querySelector<HTMLButtonElement>("#undo")!.click();
  expect(session.game).toEqual(initial);
});
