import type { GameState, Player, Point, Stone } from "./types";
import { points } from "./geometry";
import { stoneAt } from "./movement";
export const homeRow = (p: Player) => (p === "black" ? 0 : 9);
export const getReproductionPoints = (s: GameState) =>
  points.filter((p) => p.row === homeRow(s.currentPlayer) && !stoneAt(s, p));
export function triggersReproduction(
  s: GameState,
  stone: Stone,
  from: Point,
): boolean {
  const edge = 9 - homeRow(stone.player),
    carrier = s.reproductionCarrier[stone.player];
  return (
    from.row !== edge &&
    stone.row === edge &&
    (carrier === null || carrier === stone.id) &&
    getReproductionPoints(s).length > 0
  );
}
