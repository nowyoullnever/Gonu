import { createGame, cloneState } from "../game/gameState";
import { applyAction } from "../game/rules";
import type { GameAction, GameState, Player } from "../game/types";
export type UndoMode = "all" | "turn";
export interface GameSettings {
  undoMode: UndoMode;
  showLegalPoints: boolean;
  firstPlayer: Player;
}
export interface LocalGameOptions {
  undoMode?: UndoMode;
  showLegalPoints?: boolean;
  firstPlayer?: Player;
}
export class LocalGameSession {
  game: GameState;
  private snapshots: GameState[] = [];
  private pendingSnapshot: GameState | null = null;
  readonly undoMode: UndoMode;
  readonly settings: GameSettings;
  constructor(initial?: GameState, options: LocalGameOptions = {}) {
    const firstPlayer = options.firstPlayer ?? initial?.firstPlayer ?? "black";
    initial ??= createGame({ firstPlayer });
    this.game = cloneState(initial);
    this.undoMode = options.undoMode ?? "all";
    this.settings = {
      undoMode: this.undoMode,
      showLegalPoints: options.showLegalPoints ?? true,
      firstPlayer,
    };
  }
  get canUndo() {
    const snapshot = this.snapshots.at(-1);
    return Boolean(
      snapshot &&
      !this.pendingSnapshot &&
      (this.undoMode === "all" ||
        (snapshot.currentPlayer === this.game.currentPlayer &&
          snapshot.turn === this.game.turn)),
    );
  }
  get completedActionCount() {
    return this.snapshots.length;
  }
  get canChangeFirstPlayer() {
    return this.completedActionCount === 0 && !this.pendingSnapshot && !this.game.pending && !this.game.winner;
  }
  changeFirstPlayer() {
    if (!this.canChangeFirstPlayer) throw new Error("error.noFirstPlayerChange");
    const firstPlayer: Player = this.game.firstPlayer === "black" ? "white" : "black";
    this.settings.firstPlayer = firstPlayer;
    this.game.firstPlayer = firstPlayer;
    this.game.currentPlayer = firstPlayer;
    this.game.actionsRemaining = 3;
  }
  dispatch(action: GameAction) {
    const before = this.game,
      after = applyAction(before, action);
    this.game = after;
    if (!before.pending) {
      if (after.pending) this.pendingSnapshot = cloneState(before);
      else this.snapshots.push(cloneState(before));
    } else if (!after.pending && this.pendingSnapshot) {
      this.snapshots.push(this.pendingSnapshot);
      this.pendingSnapshot = null;
    }
    return after;
  }
  undo() {
    if (!this.canUndo) throw new Error("error.noUndo");
    const snapshot = this.snapshots.pop();
    if (!snapshot) throw new Error("error.noUndo");
    this.game = cloneState(snapshot);
    return this.game;
  }
  rematch() {
    this.game = createGame({ firstPlayer: this.settings.firstPlayer });
    this.snapshots = [];
    this.pendingSnapshot = null;
  }
}
