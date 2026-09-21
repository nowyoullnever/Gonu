import "./style.css";
import { lobby } from "./ui/lobby";
import { localGameView } from "./ui/localGameView";
import { watchTheme } from "./ui/theme";
watchTheme();
const root = document.querySelector<HTMLElement>("#app")!;
const home = () => lobby(root, () => localGameView(root, home));
home();
