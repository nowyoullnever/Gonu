import { en } from "./en";
import { ko } from "./ko";

export type Language = "en" | "ko";
export const LANGUAGE_KEY = "gonu-language";
const resources = { en, ko };
type Translation = typeof en;
export function getLanguage(): Language {
  try {
    return localStorage.getItem(LANGUAGE_KEY) === "ko" ? "ko" : "en";
  } catch {
    return "en";
  }
}
export function setLanguage(language: Language) {
  try {
    localStorage.setItem(LANGUAGE_KEY, language);
  } catch {}
  document.documentElement.lang = language === "ko" ? "ko" : "en";
}
export function initializeLanguage() {
  setLanguage(getLanguage());
}
function valueAt(key: string): string {
  return key
    .split(".")
    .reduce<unknown>(
      (value, part) => (value as Record<string, unknown>)[part],
      resources[getLanguage()],
    ) as string;
}
export function t(key: string, values: Record<string, string | number> = {}) {
  return valueAt(key).replace(/\{(\w+)\}/g, (_, name) =>
    String(values[name] ?? ""),
  );
}
export function playerName(player: "black" | "white") {
  return t(`game.${player}`);
}
export function playerTurn(player: "black" | "white") {
  return t(`game.${player}Turn`);
}
export function playerWins(player: "black" | "white") {
  return t(`game.${player}Wins`);
}
export function tutorialSteps(): readonly (typeof en.tutorial.steps)[number][] {
  return resources[getLanguage()].tutorial
    .steps as unknown as readonly (typeof en.tutorial.steps)[number][];
}
export type { Translation };
