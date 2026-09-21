import { createGame, cloneState } from "../game/gameState";
import { applyAction } from "../game/rules";
import type { GameAction, GameState } from "../game/types";
export class LocalGameSession {
  game: GameState;
  private snapshots: GameState[] = [];
  constructor(initial = createGame()) {
    this.game = cloneState(initial);
  }
  get canUndo() {
    return this.snapshots.length > 0;
  }
  dispatch(action: GameAction) {
    const before = this.game,
      after = applyAction(before, action);
    if (!before.pending) this.snapshots.push(cloneState(before));
    this.game = after;
    if (after.turn !== before.turn) this.snapshots = [];
    return after;
  }
  undo() {
    const snapshot = this.snapshots.pop();
    if (!snapshot) throw new Error("error.noUndo");
    this.game = cloneState(snapshot);
    return this.game;
  }
  rematch() {
    this.game = createGame();
    this.snapshots = [];
  }
}
