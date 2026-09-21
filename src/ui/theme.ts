export type Theme = "light" | "dark" | "system";
const key = "gonu-theme";
export function getTheme(): Theme {
  try {
    const value = localStorage.getItem(key);
    if (value === "light" || value === "dark") return value;
  } catch {}
  return "system";
}
export function applyTheme() {
  document.documentElement.dataset.theme =
    getTheme() === "system"
      ? matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : getTheme();
}
export function setTheme(value: Theme) {
  try {
    localStorage.setItem(key, value);
  } catch {}
  document.documentElement.dataset.theme =
    value === "system"
      ? matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : value;
}
export function watchTheme() {
  applyTheme();
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (getTheme() === "system") applyTheme();
  });
}
