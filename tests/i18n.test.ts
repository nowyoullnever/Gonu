// @vitest-environment jsdom
import { beforeEach, expect, it } from "vitest";
import { lobby } from "../src/ui/lobby";
import { setLanguage, t } from "../src/i18n/i18n";
beforeEach(() => { document.body.innerHTML = "<main></main>"; HTMLDialogElement.prototype.showModal = function(){ this.setAttribute("open", ""); }; HTMLDialogElement.prototype.close = function(){ this.removeAttribute("open"); this.dispatchEvent(new Event("close")); }; });
it("centralizes the new Korean setup and computer labels", () => {
  setLanguage("ko"); const root = document.querySelector("main")!; lobby(root, () => {});
  expect(root.textContent).toContain("새 게임"); root.querySelector<HTMLButtonElement>("#new-game")!.click();
  expect(document.querySelector("dialog")!.textContent).toContain("컴퓨터 대전");
  expect(t("game.firstPlayer")).toBe("선공"); expect(t("game.yourStone")).toBe("내 돌");
});
it("provides English computer placeholder labels", () => { setLanguage("en"); expect(t("game.vsComputer")).toBe("VS COMPUTER"); expect(t("game.comingSoon")).toBe("COMING SOON"); });
