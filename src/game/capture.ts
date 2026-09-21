import type { GameState, Player, Point, Stone } from "./types";
import { stoneAt } from "./movement";
import { samePoint } from "./geometry";
export const opponent = (p: Player): Player =>
  p === "black" ? "white" : "black";
const axes = [
  [0, 1],
  [1, 0],
];
export function isSandwiched(s: GameState, stone: Stone): boolean {
  return axes.some(([dr, dc]) =>
    [-1, 1].every(
      (sign) =>
        stoneAt(s, { row: stone.row + dr * sign, col: stone.col + dc * sign })
          ?.player === opponent(stone.player),
    ),
  );
}
/** Only sandwiches completed by an arriving/created friendly endpoint qualify. */
export function getCaptureCandidates(
  s: GameState,
  actor: Player,
  affected?: Point[],
): Stone[] {
  return s.stones.filter(
    (stone) =>
      stone.player !== actor &&
      axes.some(([dr, dc]) => {
        const ends = [-1, 1].map((sign) => ({
          row: stone.row + dr * sign,
          col: stone.col + dc * sign,
        }));
        return (
          ends.every((p) => stoneAt(s, p)?.player === actor) &&
          (!affected || ends.some((p) => affected.some((a) => samePoint(p, a))))
        );
      }),
  );
}
