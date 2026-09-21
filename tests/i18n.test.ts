// @vitest-environment jsdom
import { beforeEach, expect, it } from "vitest";
import { getLanguage, setLanguage, tutorialSteps } from "../src/i18n/i18n";
import { lobby, openSettings } from "../src/ui/lobby";
import { localGameView } from "../src/ui/localGameView";
import { LocalGameSession } from "../src/local/localGame";
import { createGame } from "../src/game/gameState";

beforeEach(() => {
  HTMLDialogElement.prototype.showModal ??= function () {};
  HTMLDialogElement.prototype.close ??= function () {};
  localStorage.clear();
  document.body.innerHTML = '<main id="app"></main>';
  setLanguage("en");
});

it("defaults to English and persists Korean language selection", () => {
  expect(getLanguage()).toBe("en");
  setLanguage("ko");
  expect(getLanguage()).toBe("ko");
  expect(localStorage.getItem("gonu-language")).toBe("ko");
  expect(document.documentElement.lang).toBe("ko");
});

it("renders the Korean lobby and settings labels from centralized resources", () => {
  setLanguage("ko");
  const root = document.querySelector("main")!;
  lobby(root, () => {});
  expect(root.textContent).toContain("새 게임");
  expect(root.textContent).toContain("게임 방법");
  root.querySelector<HTMLButtonElement>("#settings")!.click();
  expect(document.querySelector("dialog")!.textContent).toContain("언어");
  expect(document.querySelector("dialog")!.textContent).toContain("테마");
  expect(document.querySelector("dialog")!.textContent).toContain("라이트");
  expect(document.querySelector("dialog")!.textContent).toContain("다크");
});

it("renders Korean game controls, status, accessibility text and preserves session state", () => {
  setLanguage("ko");
  const root = document.querySelector("main")!;
  const session = new LocalGameSession();
  localGameView(root, () => {}, session);
  expect(root.textContent).toContain("흑의 차례");
  expect(root.textContent).toContain("남은 행동");
  expect(root.textContent).toContain("이동");
  expect(root.textContent).toContain("길 설치");
  expect(root.textContent).toContain("되돌리기");
  expect(
    root.querySelector('[data-point="C1"]')!.getAttribute("aria-label"),
  ).toContain("흑 돌");
  session.dispatch({
    type: "build-road",
    from: { row: 0, col: 2 },
    to: { row: 1, col: 2 },
  });
  localGameView(root, () => {}, session);
  expect(root.textContent).toContain("길 설치 C1–C2");
  expect(session.game.roads).toHaveLength(1);
});

it("uses all requested Korean tutorial stages", () => {
  setLanguage("ko");
  const copy = JSON.stringify(tutorialSteps());
  for (const title of [
    "3개의 행동",
    "길 설치",
    "이동",
    "포획",
    "자폭",
    "증식",
    "증식 계보",
    "증식 계보 초기화",
    "승리",
  ]) {
    expect(copy).toContain(title);
  }
  expect(createGame().events).toEqual([]);
});
