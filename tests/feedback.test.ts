// @vitest-environment jsdom
import { beforeEach, expect, it, vi } from "vitest";
import { LocalGameSession } from "../src/local/localGame";
import { localGameView } from "../src/ui/localGameView";
import { AudioManager } from "../src/ui/audio";

beforeEach(() => {
  document.body.innerHTML = "<main></main>";
  localStorage.clear();
});

it("uses legal-point hints only as a visual match setting", () => {
  const root = document.querySelector("main")!;
  const shown = localGameView(root, () => {}, new LocalGameSession(undefined, { showLegalPoints: true }));
  root.querySelector<HTMLButtonElement>("[data-point='A1']")!.click();
  expect(root.querySelectorAll(".point.legal").length).toBeGreaterThan(0);
  const hidden = localGameView(root, () => {}, new LocalGameSession(undefined, { showLegalPoints: false }));
  root.querySelector<HTMLButtonElement>("[data-point='A1']")!.click();
  expect(root.querySelectorAll(".point.legal")).toHaveLength(0);
  root.querySelector<HTMLButtonElement>("[data-point='B1']")!.click();
  expect(hidden.game.roads).toHaveLength(1);
  expect(shown.settings.showLegalPoints).toBe(true);
});

it("rejects an invalid road without consuming an action or clearing its endpoint", () => {
  const root = document.querySelector("main")!;
  const session = localGameView(root, () => {});
  root.querySelector<HTMLButtonElement>("[data-point='A1']")!.click();
  root.querySelector<HTMLButtonElement>("[data-point='A1']")!.click();
  expect(session.game.roads).toHaveLength(0);
  expect(session.game.actionsRemaining).toBe(3);
  expect(root.querySelector(".point.selected")?.getAttribute("data-point")).toBe("A1");
  expect(root.querySelector("#board-host")?.classList.contains("shake")).toBe(true);
});

it("keeps sound effects and BGM preferences independent", () => {
  const play = vi.fn(() => Promise.resolve());
  const pause = vi.fn();
  const makeAudio = vi.fn(() => ({ play, pause, preload: "", loop: false, src: "", currentTime: 0 }) as unknown as HTMLAudioElement);
  const manager = new AudioManager(makeAudio);
  makeAudio.mockClear();
  manager.setSoundEnabled(false);
  manager.playStone();
  expect(makeAudio).not.toHaveBeenCalled();
  manager.setSoundEnabled(true);
  manager.playStone();
  expect(play).toHaveBeenCalledOnce();
  manager.setBgmEnabled(true);
  manager.beginFromInteraction();
  manager.setBgmEnabled(false);
  expect(pause).toHaveBeenCalledOnce();
  expect(localStorage.getItem("gonu-sound-enabled")).toBe("true");
  expect(localStorage.getItem("gonu-bgm-enabled")).toBe("false");
});
