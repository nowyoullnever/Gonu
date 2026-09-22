import { LocalGameSession } from "../local/localGame";
import type { GameAction, GameEvent, Point } from "../game/types";
import { coordinate, roadLength, samePoint } from "../game/geometry";
import { getLegalMoves, stoneAt } from "../game/movement";
import { getLegalRoadTargets, roadError } from "../game/roads";
import { getReproductionPoints } from "../game/reproduction";
import { playerName, playerTurn, playerWins, t } from "../i18n/i18n";
import { BoardView } from "./boardView";
import { openDialog } from "./dialog";
import { audio } from "./audio";

let removeGameplayShortcuts = () => {};

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
  removeGameplayShortcuts();
  root.innerHTML = `<h1>Go!nu</h1><p class="local-title">${t("general.localTwoPlayer")}</p><section class="game-status-area"><h2 id="turn" class="turn-status"></h2><p id="actions" class="action-status"></p><p id="instruction" class="game-notice" role="status" aria-live="polite"></p></section><div class="mode-controls"><button id="move">${t("action.moveShortcut")}</button><button id="road">${t("action.roadShortcut")}</button></div><div class="board-wrap"><div id="board-host"></div></div><p id="preview-info">&nbsp;</p><p id="counts" class="local-count"></p><p id="events" role="log" aria-live="polite"></p><section id="result" aria-live="assertive" hidden></section><div class="game-controls"><button id="undo">${t("action.undo")}</button><button id="first-player">${t("game.changeFirstPlayer")}</button><button id="back">${t("general.back")}</button></div>`;
  const el = (id: string) => root.querySelector<HTMLElement>(`#${id}`)!;
  const board = new BoardView({ perspective: "black", selected: null, targets: [], click, hover });
  el("board-host").append(board.element);
  function legalPoints() {
    const s = session.game;
    if (s.pending?.type === "reproduction") return getReproductionPoints(s);
    if (s.pending?.type === "capture")
      return s.stones.filter(
        (x) =>
          s.pending?.type === "capture" && s.pending.targetIds.includes(x.id),
      );
    if (!selected || !session.settings.showLegalPoints) return [];
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
    el("counts").textContent = `${playerName("black")} ${s.stones.filter((x) => x.player === "black").length} · ${playerName("white")} ${s.stones.filter((x) => x.player === "white").length}`;
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
    (el("first-player") as HTMLButtonElement).hidden = !session.canChangeFirstPlayer;
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
      audio.beginFromInteraction();
      if (action.type === "build-road") audio.playRoadDraw();
      if (action.type === "move" || action.type === "reproduce") audio.playStone();
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
    if (mode === "road") {
      if (!selected) {
        selected = p;
        render();
      } else {
        const error = roadError(s, selected, p);
        if (error) {
          el("instruction").textContent = `${t("action.invalidRoad")} · ${t(error)}`;
          el("board-host").classList.remove("shake");
          void el("board-host").offsetWidth;
          el("board-host").classList.add("shake");
          return;
        }
        dispatch({ type: "build-road", from: selected, to: p });
      }
    } else if (selected && samePoint(selected, p)) {
      selected = null;
      render();
      return;
    } else if (stone?.player === s.currentPlayer) {
      selected = p;
      render();
      if (!legalPoints().length)
        el("instruction").textContent = t("action.noDestination");
    } else if (selected)
      dispatch({ type: "move", stoneId: stoneAt(s, selected)!.id, to: p });
  }
  function hover(p: Point | null, pointer = false) {
    if (pointer && mode === "road" && !session.game.pending && !session.game.winner)
      audio.playRoadHover();
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
  const shortcutHandler = (event: KeyboardEvent) => {
    const key = event.key.toLowerCase();
    const target = event.target;
    const isEditable =
      target instanceof HTMLElement &&
      target.matches("input, textarea, select, [contenteditable='true']");
    if (
      (key !== "z" && key !== "x") ||
      event.ctrlKey ||
      event.altKey ||
      event.metaKey ||
      session.game.pending ||
      session.game.winner ||
      root.dataset.mode !== "local" ||
      document.querySelector("dialog[open]") ||
      isEditable
    )
      return;
    event.preventDefault();
    mode = key === "z" ? "move" : "road";
    selected = null;
    render();
  };
  document.addEventListener("keydown", shortcutHandler);
  removeGameplayShortcuts = () =>
    document.removeEventListener("keydown", shortcutHandler);
  el("undo").onclick = () => {
    try {
      session.undo();
      selected = null;
      render();
    } catch (error) {
      el("instruction").textContent = t((error as Error).message);
    }
  };
  el("first-player").onclick = () => { session.changeFirstPlayer(); selected = null; render(); };
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
  render();
  return session;
}
