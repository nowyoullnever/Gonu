import { createGame, cloneState } from "../game/gameState";
import { applyAction } from "../game/rules";
import type { GameAction, GameState } from "../game/types";
export type UndoMode = "all" | "turn";
export interface GameSettings {
  undoMode: UndoMode;
  showLegalPoints: boolean;
}
export interface LocalGameOptions {
  undoMode?: UndoMode;
  showLegalPoints?: boolean;
}
export class LocalGameSession {
  game: GameState;
  private snapshots: GameState[] = [];
  private pendingSnapshot: GameState | null = null;
  readonly undoMode: UndoMode;
  readonly settings: GameSettings;
  constructor(initial = createGame(), options: LocalGameOptions = {}) {
    this.game = cloneState(initial);
    this.undoMode = options.undoMode ?? "all";
    this.settings = {
      undoMode: this.undoMode,
      showLegalPoints: options.showLegalPoints ?? true,
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
    this.game = createGame();
    this.snapshots = [];
    this.pendingSnapshot = null;
  }
}
