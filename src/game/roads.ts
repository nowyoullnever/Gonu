import type { GameState, Point } from "./types";
import { distanceSquared, gcd, inBounds, points, samePoint } from "./geometry";
export function hasRoad(s: GameState, a: Point, b: Point) {
  return s.roads.some(
    (r) =>
      (samePoint(r.from, a) && samePoint(r.to, b)) ||
      (samePoint(r.from, b) && samePoint(r.to, a)),
  );
}
export function roadError(s: GameState, a: Point, b: Point): string | null {
  if (!inBounds(a) || !inBounds(b)) return "Endpoints must be on the board.";
  if (samePoint(a, b)) return "Choose two different points.";
  if (hasRoad(s, a, b)) return "This road already exists.";
  if (distanceSquared(a, b) > 65) return "Too long: maximum length is √65.";
  if (gcd(Math.abs(a.row - b.row), Math.abs(a.col - b.col)) !== 1)
    return "A road cannot pass through another board point.";
  return null;
}
export const canBuildRoad = (s: GameState, a: Point, b: Point) =>
  roadError(s, a, b) === null;
export const getLegalRoadTargets = (s: GameState, a: Point) =>
  points.filter((b) => canBuildRoad(s, a, b));
