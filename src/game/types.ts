export type Player = "black" | "white";
export interface Point {
  row: number;
  col: number;
}
export interface Stone extends Point {
  id: string;
  player: Player;
}
export interface Road {
  from: Point;
  to: Point;
}
export interface MoveContext {
  movedId: string;
  affected: Point[];
}
export type GameEvent =
  | { type: "road"; from: Point; to: Point }
  | { type: "move"; player: Player; from: Point; to: Point }
  | { type: "capture"; captured: Player; selfCapture: boolean }
  | { type: "reproduction"; player: Player }
  | { type: "lineage-reset"; player: Player }
  | { type: "win"; player: Player };
export type Pending =
  | { type: "reproduction"; context: MoveContext }
  | { type: "capture"; targetIds: string[] };
export interface GameState {
  stones: Stone[];
  roads: Road[];
  currentPlayer: Player;
  actionsRemaining: number;
  reproductionCarrier: Record<Player, string | null>;
  winner: Player | null;
  pending: Pending | null;
  revision: number;
  turn: number;
  nextStoneId: number;
  events: GameEvent[];
  lastAction: { type: "move" | "build-road"; from: Point; to: Point } | null;
}
/** Choices are commands too: intermediate states can be serialized and replayed. */
export type GameAction =
  | { type: "move"; stoneId: string; to: Point }
  | { type: "build-road"; from: Point; to: Point }
  | { type: "reproduce"; at: Point }
  | { type: "capture"; stoneId: string };
