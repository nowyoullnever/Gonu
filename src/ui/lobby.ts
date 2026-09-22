import { openDialog } from "./dialog";
import { openTutorial } from "./tutorial";
import { getTheme, setTheme, type Theme } from "./theme";
import { getLanguage, setLanguage, t, type Language } from "../i18n/i18n";
import type { LocalGameOptions, UndoMode } from "../local/localGame";
import { audio } from "./audio";

const choice = (name: string, value: string, label: string, checked: boolean) =>
  `<label><input type="radio" name="${name}" value="${value}" ${checked ? "checked" : ""}><span>${label}</span></label>`;
const playerChoice = (name: string, title: string) =>
  `<section class="game-settings-section"><p>${title}</p><div class="choice-options">${choice(name, "black", t("game.black"), true)}${choice(name, "white", t("game.white"), false)}</div></section>`;
function form(computer = false) {
  return `<form class="game-settings-form">${computer ? playerChoice("your-stone", t("game.yourStone")) : ""}${playerChoice("first-player", t("game.firstPlayer"))}<section class="game-settings-section"><p>${t("game.undoMode")}</p><div class="choice-options">${choice("undo-mode", "all", t("game.fullGame"), true)}${choice("undo-mode", "turn", t("game.currentTurnOnly"), false)}</div></section><section class="game-settings-section"><p>${t("game.showLegalPoints")}</p><div class="choice-options">${choice("legal-points", "true", t("general.on"), true)}${choice("legal-points", "false", t("general.off"), false)}</div></section>${computer ? `<button disabled>${t("general.startGame")}</button><p class="note">${t("game.comingSoon")} · ${t("game.computerUnavailable")}</p>` : `<button id="local-start" class="wide" type="button">${t("general.startGame")}</button>`}</form>`;
}
function setting(name: string, title: string, values: [string, string][], current: string) {
  return `<section class="settings-group"><p class="settings-label">${title}</p><div class="settings-options">${values.map(([value, label]) => `<button data-setting="${name}:${value}" aria-pressed="${value === current}">${label}</button>`).join("")}</div></section>`;
}
export function openSettings() {
  const d = openDialog(t("general.settings"), `<div class="settings-content">${setting("language", t("general.language"), [["ko", t("general.korean")], ["en", t("general.english")]], getLanguage())}${setting("theme", t("general.appearance"), [["light", t("general.light")], ["dark", t("general.dark")]], getTheme() === "dark" ? "dark" : "light")}${setting("sound", t("general.sound"), [["true", t("general.on")], ["false", t("general.off")]], String(audio.getSoundEnabled()))}${setting("bgm", t("general.bgm"), [["true", t("general.on")], ["false", t("general.off")]], String(audio.getBgmEnabled()))}</div>`);
  d.classList.add("settings");
  d.querySelectorAll<HTMLButtonElement>("[data-setting]").forEach((button) => button.onclick = () => {
    const [kind, value] = button.dataset.setting!.split(":");
    if (kind === "language") { setLanguage(value as Language); d.close(); window.dispatchEvent(new Event("gonu-language-change")); return; }
    if (kind === "theme") setTheme(value as Theme);
    if (kind === "sound") audio.setSoundEnabled(value === "true");
    if (kind === "bgm") audio.setBgmEnabled(value === "true");
    d.querySelectorAll(`[data-setting^="${kind}:"]`).forEach(x => x.setAttribute("aria-pressed", String(x === button)));
  });
}
export function lobby(root: HTMLElement, start: (options: LocalGameOptions) => void) {
  root.dataset.mode = "lobby";
  root.innerHTML = `<div class="home-shell"><h1>Go!nu</h1><section class="lobby"><button id="new-game">${t("general.newGame")}</button><div class="lobby-secondary-actions"><button class="how-to-play">${t("general.howToPlay")}</button><button class="settings-launch">${t("general.settings")}</button></div></section></div>`;
  root.querySelector<HTMLButtonElement>("#new-game")!.onclick = () => {
    const d = openDialog(t("general.newGame"), `<div class="new-game-options"><button id="local-option">${t("general.localTwoPlayer")}</button><button id="computer-option">${t("game.vsComputer")}</button></div>`);
    d.classList.add("new-game-dialog");
    d.querySelector<HTMLButtonElement>("#local-option")!.onclick = () => showLocal(d, start);
    d.querySelector<HTMLButtonElement>("#computer-option")!.onclick = () => showComputer(d);
  };
  root.querySelector<HTMLButtonElement>(".how-to-play")!.onclick = openTutorial;
  root.querySelector<HTMLButtonElement>(".settings-launch")!.onclick = openSettings;
}
function resetDialog(d: HTMLDialogElement, title: string, body: string) {
  d.innerHTML = `<button class="close" aria-label="${t("general.close")}">×</button><h2>${title}</h2>${body}`;
  d.querySelector<HTMLButtonElement>(".close")!.onclick = () => d.close();
}
function showLocal(d: HTMLDialogElement, start: (options: LocalGameOptions) => void) {
  resetDialog(d, t("general.localTwoPlayer"), form());
  d.querySelector<HTMLButtonElement>("#local-start")!.onclick = () => {
    const get = (name: string) => d.querySelector<HTMLInputElement>(`input[name="${name}"]:checked`)!.value;
    d.close(); start({ firstPlayer: get("first-player") as "black" | "white", undoMode: get("undo-mode") as UndoMode, showLegalPoints: get("legal-points") === "true" });
  };
}
function showComputer(d: HTMLDialogElement) { resetDialog(d, t("game.vsComputer"), form(true)); }
