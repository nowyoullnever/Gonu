import { LocalGameSession } from "../local/localGame";
import type { GameAction, Point } from "../game/types";
import { coordinate, roadLength, samePoint } from "../game/geometry";
import { getLegalMoves, stoneAt } from "../game/movement";
import { getLegalRoadTargets, roadError } from "../game/roads";
import { getReproductionPoints } from "../game/reproduction";
import { BoardView } from "./boardView";
import { openTutorial } from "./tutorial";
import { openSettings } from "./lobby";
import { openDialog } from "./dialog";
export function localGameView(
  root: HTMLElement,
  back: () => void,
  session = new LocalGameSession(),
) {
  let mode: "move" | "road" = "road",
    selected: Point | null = null;
  root.dataset.mode = "local";
  root.innerHTML =
    '<header><h1>Go!nu</h1><span>LOCAL TWO PLAYER</span></header><section class="game-hud"><h2 id="turn"></h2><div id="actions"></div><div id="counts"></div></section><div class="modes"><button id="move">MOVE</button><button id="road">ROAD</button></div><p id="instruction" role="status" aria-live="polite"></p><div id="board-host"></div><p id="preview-info">&nbsp;</p><p id="events" role="log" aria-live="polite"></p><section id="result" aria-live="assertive" hidden></section><footer><button id="undo">UNDO</button><button id="clear">CANCEL SELECTION</button><button id="back">BACK</button><button id="help">HOW TO PLAY</button><button id="settings">SETTINGS</button></footer>';
  const el = (id: string) => root.querySelector<HTMLElement>(`#${id}`)!;
  const board = new BoardView({ selected: null, targets: [], click, hover });
  el("board-host").append(board.element);
  function legalPoints() {
    const s = session.game;
    if (s.pending?.type === "reproduction") return getReproductionPoints(s);
    if (s.pending?.type === "capture")
      return s.stones.filter(
        (x) =>
          s.pending?.type === "capture" && s.pending.targetIds.includes(x.id),
      );
    if (!selected) return [];
    return mode === "road"
      ? getLegalRoadTargets(s, selected)
      : getLegalMoves(s, stoneAt(s, selected)?.id ?? "");
  }
  function render() {
    const s = session.game;
    el("turn").textContent = s.winner
      ? `${s.winner.toUpperCase()} WINS`
      : `${s.currentPlayer.toUpperCase()}'S TURN`;
    el("actions").textContent =
      `ACTIONS  ${"● ".repeat(s.actionsRemaining)}${"○ ".repeat(3 - s.actionsRemaining)}`;
    el("actions").setAttribute(
      "aria-label",
      `${s.actionsRemaining} actions remaining`,
    );
    el("counts").innerHTML =
      `<span><i class="small-stone black"></i> BLACK ${s.stones.filter((x) => x.player === "black").length}</span><span><i class="small-stone white"></i> WHITE ${s.stones.filter((x) => x.player === "white").length}</span>`;
    el("instruction").textContent = s.winner
      ? "The match is complete."
      : s.pending?.type === "reproduction"
        ? `PLACE NEW ${s.currentPlayer.toUpperCase()} STONE — choose your home row`
        : s.pending?.type === "capture"
          ? "CHOOSE A STONE TO CAPTURE — select one × target"
          : mode === "road"
            ? selected
              ? `ROAD FROM ${coordinate(selected)} — choose a ringed point`
              : "BUILD A ROAD — select any first endpoint"
            : selected
              ? "MOVE — choose a ringed destination"
              : "MOVE — select one of your stones";
    for (const m of ["move", "road"]) {
      const b = el(m) as HTMLButtonElement;
      b.setAttribute("aria-pressed", String(m === mode));
      b.disabled = Boolean(s.pending || s.winner);
    }
    (el("undo") as HTMLButtonElement).disabled = !session.canUndo;
    (el("clear") as HTMLButtonElement).disabled = !selected;
    el("events").textContent = s.events.join(" ");
    el("preview-info").textContent = "\u00a0";
    board.update(s, selected, legalPoints());
    el("result").hidden = !s.winner;
    if (s.winner) {
      el("result").innerHTML =
        `<h2>${s.winner.toUpperCase()} WINS</h2><button id="rematch">REMATCH</button><button id="return">BACK TO LOBBY</button>`;
      el("rematch").onclick = () => {
        session.rematch();
        selected = null;
        mode = "road";
        render();
      };
      el("return").onclick = back;
      el("result").scrollIntoView?.({ block: "nearest" });
    }
  }
  function dispatch(action: GameAction) {
    try {
      session.dispatch(action);
      selected = null;
      render();
    } catch (e) {
      el("instruction").textContent = (e as Error).message;
    }
  }
  function click(p: Point) {
    const s = session.game,
      stone = stoneAt(s, p);
    if (s.winner) return;
    if (s.pending?.type === "reproduction") {
      dispatch({ type: "reproduce", at: p });
      return;
    }
    if (s.pending?.type === "capture") {
      if (stone) dispatch({ type: "capture", stoneId: stone.id });
      return;
    }
    if (selected && samePoint(selected, p)) {
      selected = null;
      render();
      return;
    }
    if (mode === "road") {
      if (!selected) {
        selected = p;
        render();
      } else dispatch({ type: "build-road", from: selected, to: p });
    } else if (stone?.player === s.currentPlayer) {
      selected = p;
      render();
      if (!legalPoints().length)
        el("instruction").textContent =
          "No empty destination along a road. Select another stone or build a road.";
    } else if (selected)
      dispatch({ type: "move", stoneId: stoneAt(s, selected)!.id, to: p });
  }
  function hover(p: Point | null) {
    if (
      mode !== "road" ||
      !selected ||
      session.game.pending ||
      session.game.winner
    )
      return;
    const error = p ? roadError(session.game, selected, p) : null;
    board.showPreview(selected, p, !error);
    el("preview-info").textContent = p
      ? `${error ? "ILLEGAL" : "LEGAL"} · length ${roadLength(selected, p)}${error ? " · " + error : ""}`
      : "\u00a0";
  }
  for (const m of ["move", "road"] as const)
    el(m).onclick = () => {
      mode = m;
      selected = null;
      render();
    };
  el("undo").onclick = () => {
    session.undo();
    selected = null;
    render();
  };
  el("clear").onclick = () => {
    selected = null;
    render();
  };
  el("back").onclick = () => {
    const d = openDialog(
      "LEAVE THIS GAME?",
      '<p>Your local match will be discarded.</p><button id="leave">BACK TO LOBBY</button>',
    );
    d.querySelector<HTMLButtonElement>("#leave")!.onclick = () => {
      d.close();
      back();
    };
  };
  el("help").onclick = openTutorial;
  el("settings").onclick = openSettings;
  render();
  return session;
}
