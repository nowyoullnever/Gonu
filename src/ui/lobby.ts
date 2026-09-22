import { openDialog } from "./dialog";
import { openTutorial } from "./tutorial";
import { getTheme, setTheme, type Theme } from "./theme";
import { getLanguage, setLanguage, t, type Language } from "../i18n/i18n";
import type { LocalGameOptions, UndoMode } from "../local/localGame";
import { audio } from "./audio";
export function openSettings() {
  const d = openDialog(
    t("general.settings"),
    `<p>${t("general.language")}</p><div class="language-options">` +
      (["en", "ko"] as const)
        .map(
          (language) =>
            `<button data-language="${language}" aria-pressed="${getLanguage() === language}">${t(language === "en" ? "general.english" : "general.korean")}</button>`,
        )
        .join("") +
      `</div><p>${t("general.theme")}</p><div class="theme-options">` +
      (["light", "dark", "system"] as const)
        .map(
          (theme) =>
            `<button data-theme="${theme}" aria-pressed="${getTheme() === theme}">${t(`general.${theme}`)}</button>`,
        )
        .join("") +
      `</div><p>${t("general.sound")}</p><div class="sound-options">${[true, false].map((value) => `<button data-sound="${value}" aria-pressed="${audio.getSoundEnabled() === value}">${t(value ? "general.on" : "general.off")}</button>`).join("")}</div><p>${t("general.bgm")}</p><div class="bgm-options">${[true, false].map((value) => `<button data-bgm="${value}" aria-pressed="${audio.getBgmEnabled() === value}">${t(value ? "general.on" : "general.off")}</button>`).join("")}</div>`,
  );
  d.querySelectorAll<HTMLButtonElement>("[data-theme]").forEach(
    (b) =>
      (b.onclick = () => {
        setTheme(b.dataset.theme as Theme);
        d.querySelectorAll("[data-theme]").forEach((x) =>
          x.setAttribute("aria-pressed", String(x === b)),
        );
      }),
  );
  d.querySelectorAll<HTMLButtonElement>("[data-language]").forEach(
    (button) =>
      (button.onclick = () => {
        setLanguage(button.dataset.language as Language);
        d.close();
        window.dispatchEvent(new Event("gonu-language-change"));
      }),
  );
  for (const [selector, set] of [
    ["[data-sound]", (value: boolean) => audio.setSoundEnabled(value)],
    ["[data-bgm]", (value: boolean) => audio.setBgmEnabled(value)],
  ] as const)
    d.querySelectorAll<HTMLButtonElement>(selector).forEach(
      (button) =>
        (button.onclick = () => {
          const value = button.dataset.sound === "true" || button.dataset.bgm === "true";
          set(value);
          d.querySelectorAll(selector).forEach((option) =>
            option.setAttribute("aria-pressed", String(option === button)),
          );
        }),
    );
}
export function lobby(root: HTMLElement, start: (options: LocalGameOptions) => void) {
  root.dataset.mode = "lobby";
  root.innerHTML = `<div class="home-shell"><h1>Go!nu</h1><p class="tagline">${t("lobby.tagline")}</p><button id="new-game">${t("general.newGame")}</button><div class="secondary"><button id="help">${t("general.howToPlay")}</button><button id="settings">${t("general.settings")}</button></div><p class="note">${t("lobby.note")}</p></div>`;
  root.querySelector<HTMLButtonElement>("#new-game")!.onclick = () => {
    let undoMode: UndoMode = "all";
    let showLegalPoints = true;
    const d = openDialog(
      t("general.newGame"),
      `<h3 class="game-option-title">${t("general.localTwoPlayer")}</h3><p class="option-label">${t("game.undoMode")}</p><div class="undo-options" role="radiogroup" aria-label="${t("game.undoMode")}"><button data-undo-mode="all" role="radio" aria-checked="true">${t("game.fullGame")}</button><button data-undo-mode="turn" role="radio" aria-checked="false">${t("game.currentTurnOnly")}</button></div><p class="option-label">${t("game.showLegalPoints")}</p><div class="undo-options" role="radiogroup" aria-label="${t("game.showLegalPoints")}"><button data-legal-points="true" role="radio" aria-checked="true">○ ${t("general.on")}</button><button data-legal-points="false" role="radio" aria-checked="false">○ ${t("general.off")}</button></div><button id="local-start" class="wide">${t("general.startGame")}</button><p class="note">${t("lobby.newGameNote")}</p>`,
    );
    d.querySelectorAll<HTMLButtonElement>("[data-legal-points]").forEach(
      (button) =>
        (button.onclick = () => {
          showLegalPoints = button.dataset.legalPoints === "true";
          d.querySelectorAll("[data-legal-points]").forEach((option) =>
            option.setAttribute("aria-checked", String(option === button)),
          );
        }),
    );
    d.querySelectorAll<HTMLButtonElement>("[data-undo-mode]").forEach(
      (button) =>
        (button.onclick = () => {
          undoMode = button.dataset.undoMode as UndoMode;
          d.querySelectorAll("[data-undo-mode]").forEach((option) =>
            option.setAttribute("aria-checked", String(option === button)),
          );
        }),
    );
    d.querySelector<HTMLButtonElement>("#local-start")!.onclick = () => {
      d.close();
      start({ undoMode, showLegalPoints });
    };
  };
  root.querySelector<HTMLButtonElement>("#help")!.onclick = openTutorial;
  root.querySelector<HTMLButtonElement>("#settings")!.onclick = openSettings;
}
