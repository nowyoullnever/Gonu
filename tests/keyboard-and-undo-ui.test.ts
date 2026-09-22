// @vitest-environment jsdom
import { beforeEach, expect, it } from "vitest";
import { lobby } from "../src/ui/lobby";
import { localGameView } from "../src/ui/localGameView";
import { openTutorial } from "../src/ui/tutorial";
import { LocalGameSession, type LocalGameOptions } from "../src/local/localGame";
import { createGame } from "../src/game/gameState";
import { setLanguage } from "../src/i18n/i18n";

beforeEach(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  };
  document.body.innerHTML = '<main id="app"></main>';
  setLanguage("en");
});

it("chooses an undo mode before starting a local match", () => {
  let options: LocalGameOptions | undefined;
  const root = document.querySelector("main")!;
  lobby(root, (selected) => (options = selected));
  root.querySelector<HTMLButtonElement>("#new-game")!.click();
  const dialog = document.querySelector("dialog")!;
  expect(dialog.textContent).toContain("UNDO MODE");
  expect(dialog.textContent).toContain("FULL GAME");
  expect(dialog.textContent).toContain("CURRENT TURN ONLY");
  dialog.querySelector<HTMLButtonElement>('[data-undo-mode="turn"]')!.click();
  dialog.querySelector<HTMLButtonElement>("#local-start")!.click();
  expect(options).toEqual({ undoMode: "turn", showLegalPoints: true });
});

it("switches MOVE and ROAD modes with plain Z and X only when gameplay is available", () => {
  const root = document.querySelector("main")!;
  localGameView(root, () => {});
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "z" }));
  expect(root.querySelector("#move")!.getAttribute("aria-pressed")).toBe(
    "true",
  );
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "x" }));
  expect(root.querySelector("#road")!.getAttribute("aria-pressed")).toBe(
    "true",
  );
  document.dispatchEvent(
    new KeyboardEvent("keydown", { key: "z", ctrlKey: true }),
  );
  expect(root.querySelector("#road")!.getAttribute("aria-pressed")).toBe(
    "true",
  );
  const input = document.createElement("input");
  document.body.append(input);
  input.focus();
  input.dispatchEvent(
    new KeyboardEvent("keydown", { key: "z", bubbles: true }),
  );
  expect(root.querySelector("#road")!.getAttribute("aria-pressed")).toBe(
    "true",
  );
  const modal = document.createElement("dialog");
  modal.setAttribute("open", "");
  document.body.append(modal);
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "z" }));
  expect(root.querySelector("#road")!.getAttribute("aria-pressed")).toBe(
    "true",
  );
});

it("shows translated shortcut labels and tutorial arrow navigation", () => {
  const root = document.querySelector("main")!;
  localGameView(root, () => {});
  expect(root.textContent).toContain("MOVE — Z");
  expect(root.textContent).toContain("ROAD — X");
  openTutorial();
  const dialog = document.querySelector("dialog")!;
  expect(dialog.querySelector("#step")!.textContent).toBe("1 / 9");
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft" }));
  expect(dialog.querySelector("#step")!.textContent).toBe("1 / 9");
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
  expect(dialog.querySelector("#step")!.textContent).toBe("2 / 9");
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
  expect(document.querySelector("dialog")).toBeNull();
  setLanguage("ko");
  localGameView(root, () => {});
  expect(root.textContent).toContain("이동 — Z");
  expect(root.textContent).toContain("길 설치 — X");
});

it("does not expose undo while a reproduction decision is pending", () => {
  const initial = createGame();
  initial.stones = [{ id: "a", player: "black", row: 8, col: 0 }];
  initial.roads = [{ from: { row: 8, col: 0 }, to: { row: 9, col: 0 } }];
  const root = document.querySelector("main")!;
  const session = localGameView(root, () => {}, new LocalGameSession(initial));
  root.querySelector<HTMLButtonElement>("#move")!.click();
  root.querySelector<HTMLButtonElement>('[data-point="A9"]')!.click();
  root.querySelector<HTMLButtonElement>('[data-point="A10"]')!.click();
  expect(session.game.pending?.type).toBe("reproduction");
  expect(root.querySelector<HTMLButtonElement>("#undo")!.disabled).toBe(true);
});
