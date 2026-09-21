import { LocalGameSession } from "../local/localGame";
import type { GameAction, GameEvent, Point } from "../game/types";
import { coordinate, roadLength, samePoint } from "../game/geometry";
import { getLegalMoves, stoneAt } from "../game/movement";
import { getLegalRoadTargets, roadError } from "../game/roads";
import { getReproductionPoints } from "../game/reproduction";
import { playerName, playerTurn, playerWins, t } from "../i18n/i18n";
import { BoardView } from "./boardView";
import { openTutorial } from "./tutorial";
import { openSettings } from "./lobby";
import { openDialog } from "./dialog";

function eventText(event: GameEvent) {
  if (event.type === "road")
    return `${t("action.road")} ${coordinate(event.from)}–${coordinate(event.to)}`;
  if (event.type === "move")
    return `${playerName(event.player)} ${coordinate(event.from)} → ${coordinate(event.to)}`;
  if (event.type === "capture") {
    if (event.selfCapture)
      return t(
        event.captured === "black"
          ? "capture.blackSelfCaptured"
          : "capture.whiteSelfCaptured",
      );
    return t(
      event.captured === "white"
        ? "capture.blackCapturedWhite"
        : "capture.whiteCapturedBlack",
    );
  }
  if (event.type === "reproduction")
    return t(
      event.player === "black"
        ? "reproduction.blackReproduced"
        : "reproduction.whiteReproduced",
    );
  if (event.type === "lineage-reset")
    return t(
      event.player === "black"
        ? "reproduction.blackLineageReset"
        : "reproduction.whiteLineageReset",
    );
  return playerWins(event.player);
}

export function localGameView(
  root: HTMLElement,
  back: () => void,
  session = new LocalGameSession(),
) {
  let mode: "move" | "road" = "road",
    selected: Point | null = null;
  root.dataset.mode = "local";
  root.innerHTML = `<header><h1>Go!nu</h1><span>${t("general.localTwoPlayer")}</span></header><section class="game-hud"><h2 id="turn"></h2><div id="actions"></div><div id="counts"></div></section><div class="modes"><button id="move">${t("action.move")}</button><button id="road">${t("action.road")}</button></div><p id="instruction" role="status" aria-live="polite"></p><div id="board-host"></div><p id="preview-info">&nbsp;</p><p id="events" role="log" aria-live="polite"></p><section id="result" aria-live="assertive" hidden></section><footer><button id="undo">${t("action.undo")}</button><button id="clear">${t("general.cancel")}</button><button id="back">${t("general.back")}</button><button id="help">${t("general.howToPlay")}</button><button id="settings">${t("general.settings")}</button></footer>`;
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
      ? playerWins(s.winner)
      : playerTurn(s.currentPlayer);
    el("actions").textContent =
      `${t("game.actions")}  ${"● ".repeat(s.actionsRemaining)}${"○ ".repeat(3 - s.actionsRemaining)}`;
    el("actions").setAttribute(
      "aria-label",
      t("game.actionsRemaining", { count: s.actionsRemaining }),
    );
    el("counts").innerHTML =
      `<span><i class="small-stone black"></i> ${playerName("black")} ${s.stones.filter((x) => x.player === "black").length}</span><span><i class="small-stone white"></i> ${playerName("white")} ${s.stones.filter((x) => x.player === "white").length}</span>`;
    el("instruction").textContent = s.winner
      ? t("game.matchComplete")
      : s.pending?.type === "reproduction"
        ? t(
            s.currentPlayer === "black"
              ? "reproduction.placeBlack"
              : "reproduction.placeWhite",
          )
        : s.pending?.type === "capture"
          ? t("capture.choose")
          : mode === "road"
            ? selected
              ? t("action.roadFrom", { point: coordinate(selected) })
              : t("action.buildRoad")
            : selected
              ? t("action.moveDestination")
              : t("action.moveSelect");
    for (const m of ["move", "road"]) {
      const button = el(m) as HTMLButtonElement;
      button.setAttribute("aria-pressed", String(m === mode));
      button.disabled = Boolean(s.pending || s.winner);
    }
    (el("undo") as HTMLButtonElement).disabled = !session.canUndo;
    (el("clear") as HTMLButtonElement).disabled = !selected;
    el("events").textContent = s.events.map(eventText).join(" ");
    el("preview-info").textContent = "\u00a0";
    board.update(
      s,
      selected,
      legalPoints(),
      mode === "road" ? "a11y.legalRoad" : "a11y.legalDestination",
    );
    el("result").hidden = !s.winner;
    if (s.winner) {
      el("result").innerHTML =
        `<h2>${playerWins(s.winner)}</h2><button id="rematch">${t("game.rematch")}</button><button id="return">${t("game.backToLobby")}</button>`;
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
    } catch (error) {
      el("instruction").textContent = t((error as Error).message);
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
        el("instruction").textContent = t("action.noDestination");
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
      ? `${t(error ? "action.illegal" : "action.legal")} · ${t("action.length", { length: roadLength(selected, p) })}${error ? " · " + t(error) : ""}`
      : "\u00a0";
  }
  for (const m of ["move", "road"] as const)
    el(m).onclick = () => {
      mode = m;
      selected = null;
      render();
    };
  el("undo").onclick = () => {
    try {
      session.undo();
      selected = null;
      render();
    } catch (error) {
      el("instruction").textContent = t((error as Error).message);
    }
  };
  el("clear").onclick = () => {
    selected = null;
    render();
  };
  el("back").onclick = () => {
    const dialog = openDialog(
      t("game.leaveGame"),
      `<p>${t("game.leaveGameNote")}</p><button id="leave">${t("game.backToLobby")}</button>`,
    );
    dialog.querySelector<HTMLButtonElement>("#leave")!.onclick = () => {
      dialog.close();
      back();
    };
  };
  el("help").onclick = openTutorial;
  el("settings").onclick = openSettings;
  render();
  return session;
}
