import { openDialog } from "./dialog";
import { openTutorial } from "./tutorial";
import { getTheme, setTheme, type Theme } from "./theme";
export function openSettings() {
  const d = openDialog(
    "SETTINGS",
    '<p>APPEARANCE</p><div class="theme-options">' +
      (["light", "dark", "system"] as const)
        .map(
          (t) =>
            `<button data-theme="${t}" aria-pressed="${getTheme() === t}">${t.toUpperCase()}</button>`,
        )
        .join("") +
      "</div>",
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
}
export function lobby(root: HTMLElement, start: () => void) {
  root.dataset.mode = "lobby";
  root.innerHTML =
    '<div class="home-shell"><h1>Go!nu</h1><p class="tagline">SHARED ROADS. NEW POSSIBILITIES.</p><button id="new-game">NEW GAME</button><div class="secondary"><button id="help">HOW TO PLAY</button><button id="settings">SETTINGS</button></div><p class="note">A game for two, on one board.</p></div>';
  root.querySelector<HTMLButtonElement>("#new-game")!.onclick = () => {
    const d = openDialog(
      "NEW GAME",
      '<button id="local-start" class="wide">LOCAL TWO PLAYER</button><p class="note">Pass the device. Build the way forward.</p>',
    );
    d.querySelector<HTMLButtonElement>("#local-start")!.onclick = () => {
      d.close();
      start();
    };
  };
  root.querySelector<HTMLButtonElement>("#help")!.onclick = openTutorial;
  root.querySelector<HTMLButtonElement>("#settings")!.onclick = openSettings;
}
