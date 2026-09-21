import type { GameState, Point } from "./types";
import { samePoint } from "./geometry";
export const stoneAt = (s: GameState, p: Point) =>
  s.stones.find((x) => samePoint(x, p));
export function getLegalMoves(s: GameState, id: string): Point[] {
  const stone = s.stones.find((x) => x.id === id);
  if (!stone || stone.player !== s.currentPlayer || s.pending || s.winner)
    return [];
  return s.roads
    .flatMap((r) =>
      samePoint(r.from, stone)
        ? [r.to]
        : samePoint(r.to, stone)
          ? [r.from]
          : [],
    )
    .filter((p) => !stoneAt(s, p));
}
