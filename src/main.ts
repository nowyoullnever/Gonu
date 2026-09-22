import "./style.css";
import { lobby } from "./ui/lobby";
import { localGameView } from "./ui/localGameView";
import { watchTheme } from "./ui/theme";
import { initializeLanguage } from "./i18n/i18n";
import { LocalGameSession, type LocalGameOptions } from "./local/localGame";
watchTheme();
initializeLanguage();
const root = document.querySelector<HTMLElement>("#app")!;
let activeSession: LocalGameSession | undefined;
const start = (options?: LocalGameOptions) => {
  activeSession = localGameView(
    root,
    home,
    activeSession ?? new LocalGameSession(undefined, options),
  );
};
const home = () => {
  activeSession = undefined;
  lobby(root, start);
};
home();
window.addEventListener("gonu-language-change", () => {
  if (root.dataset.mode === "lobby") home();
  else activeSession = localGameView(root, home, activeSession);
});
