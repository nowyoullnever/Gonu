import type { GameState, Point } from "../game/types";
import { coordinate, points, samePoint } from "../game/geometry";
import { stoneAt } from "../game/movement";
import { playerName, t } from "../i18n/i18n";
const ns = "http://www.w3.org/2000/svg";
const position = (p: Point) => ({ x: 50 + p.col * 50, y: 50 + p.row * 50 });
export interface BoardInteraction {
  selected: Point | null;
  targets: Point[];
  click: (p: Point) => void;
  hover: (p: Point | null, pointer?: boolean) => void;
}
export class BoardView {
  readonly element = document.createElement("div");
  private roads = document.createElementNS(ns, "svg");
  private preview = document.createElementNS(ns, "line");
  private pieces = document.createElement("div");
  private targets = document.createElement("div");
  private buttons: HTMLButtonElement[] = [];
  private pieceNodes = new Map<string, HTMLElement>();
  private animatedRevision = -1;
  constructor(private interaction: BoardInteraction) {
    this.element.className = "board";
    this.element.setAttribute("aria-label", t("a11y.board"));
    this.roads.setAttribute("viewBox", "0 0 550 550");
    this.roads.setAttribute("aria-hidden", "true");
    this.pieces.className = "pieces";
    this.targets.className = "points";
    this.element.append(this.roads, this.pieces, this.targets);
    for (const p of points) {
      const button = document.createElement("button");
      button.className = "point";
      button.dataset.point = coordinate(p);
      const pos = position(p);
      button.style.left = `${pos.x / 5.5}%`;
      button.style.top = `${pos.y / 5.5}%`;
      button.onclick = () => this.interaction.click(p);
      button.onpointerenter = () => this.interaction.hover(p, true);
      button.onfocus = () => this.interaction.hover(p);
      button.onkeydown = (e) => {
        const deltas: Record<string, number> = {
          ArrowLeft: -1,
          ArrowRight: 1,
          ArrowUp: -10,
          ArrowDown: 10,
        };
        const delta = deltas[e.key];
        if (delta !== undefined) {
          e.preventDefault();
          const i = p.row * 10 + p.col;
          this.buttons[Math.max(0, Math.min(99, i + delta))].focus();
        }
      };
      this.buttons.push(button);
      this.targets.append(button);
    }
    this.element.onpointerleave = () => this.interaction.hover(null);
    for (let i = 0; i < 10; i++)
      for (const side of ["top", "bottom", "left", "right"]) {
        const label = document.createElement("span");
        label.className = `coordinate ${side}`;
        label.textContent =
          side === "top" || side === "bottom"
            ? String.fromCharCode(65 + i)
            : `${i + 1}`;
        if (side === "top" || side === "bottom")
          label.style.left = `${(50 + i * 50) / 5.5}%`;
        else label.style.top = `${(50 + i * 50) / 5.5}%`;
        this.element.append(label);
      }
  }
  update(
    s: GameState,
    selected: Point | null,
    legal: Point[],
    targetLabel = "a11y.legalDestination",
  ) {
    this.roads.replaceChildren();
    for (const road of s.roads) {
      const line = document.createElementNS(ns, "line"),
        a = position(road.from),
        b = position(road.to);
      for (const [k, v] of Object.entries({
        x1: a.x,
        y1: a.y,
        x2: b.x,
        y2: b.y,
      }))
        line.setAttribute(k, String(v));
      line.classList.add("road");
      if (
        s.lastAction?.type === "build-road" &&
        samePoint(s.lastAction.from, road.from) &&
        samePoint(s.lastAction.to, road.to) &&
        this.animatedRevision !== s.revision
      )
        line.classList.add("drawing");
      this.roads.append(line);
    }
    this.animatedRevision = s.revision;
    this.roads.append(this.preview);
    this.preview.style.display = "none";
    for (const [id, node] of this.pieceNodes)
      if (!s.stones.some((x) => x.id === id)) {
        node.classList.add("captured");
        this.pieceNodes.delete(id);
        setTimeout(() => node.remove(), 160);
      }
    for (const stone of s.stones) {
      let node = this.pieceNodes.get(stone.id);
      if (!node) {
        node = document.createElement("span");
        this.pieceNodes.set(stone.id, node);
        this.pieces.append(node);
      }
      node.className = `stone ${stone.player}${s.reproductionCarrier[stone.player] === stone.id ? " carrier" : ""}`;
      const p = position(stone);
      node.style.left = `${p.x / 5.5}%`;
      node.style.top = `${p.y / 5.5}%`;
    }
    this.buttons.forEach((button, i) => {
      const p = points[i],
        stone = stoneAt(s, p),
        target = legal.some((x) => samePoint(x, p));
      button.className = `point${stone ? " occupied" : ""}${selected && samePoint(selected, p) ? " selected" : ""}${target ? " legal" : ""}${s.pending?.type === "capture" && target ? " capture-target" : ""}`;
      button.disabled = Boolean(s.winner);
      const labels = [
        coordinate(p),
        stone
          ? `${playerName(stone.player)} ${t("a11y.stone")}`
          : t("a11y.empty"),
      ];
      if (stone && s.reproductionCarrier[stone.player] === stone.id)
        labels.push(t("reproduction.carrier"));
      if (selected && samePoint(selected, p)) labels.push(t("a11y.selected"));
      if (target)
        labels.push(
          t(s.pending?.type === "capture" ? "a11y.captureTarget" : targetLabel),
        );
      button.setAttribute("aria-label", labels.join(", "));
      button.setAttribute(
        "aria-pressed",
        String(Boolean(selected && samePoint(selected, p))),
      );
    });
  }
  showPreview(from: Point | null, to: Point | null, valid: boolean) {
    this.preview.style.display = from && to ? "" : "none";
    if (!from || !to) return;
    const a = position(from),
      b = position(to);
    for (const [k, v] of Object.entries({ x1: a.x, y1: a.y, x2: b.x, y2: b.y }))
      this.preview.setAttribute(k, String(v));
    this.preview.setAttribute(
      "class",
      `preview ${valid ? "valid" : "invalid"}`,
    );
  }
}
