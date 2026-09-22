import type { Player, Point } from "./types";
export const SIZE = 10;
export const samePoint = (a: Point, b: Point) =>
  a.row === b.row && a.col === b.col;
export const inBounds = (p: Point) =>
  Number.isInteger(p.row) &&
  Number.isInteger(p.col) &&
  p.row >= 0 &&
  p.row < SIZE &&
  p.col >= 0 &&
  p.col < SIZE;
export const distanceSquared = (a: Point, b: Point) =>
  (a.row - b.row) ** 2 + (a.col - b.col) ** 2;
export function gcd(a: number, b: number): number {
  while (b) [a, b] = [b, a % b];
  return a;
}
export const points: Point[] = Array.from({ length: 100 }, (_, i) => ({
  row: Math.floor(i / 10),
  col: i % 10,
}));
export const coordinate = (p: Point) =>
  `${String.fromCharCode(65 + p.col)}${p.row + 1}`;
export type BoardPerspective = Player;
export const toDisplayPoint = (p: Point, perspective: BoardPerspective): Point =>
  perspective === "black" ? { ...p } : { row: 9 - p.row, col: 9 - p.col };
export const fromDisplayPoint = toDisplayPoint;
export function roadLength(a: Point, b: Point) {
  const n = distanceSquared(a, b);
  return Number.isInteger(Math.sqrt(n)) ? `${Math.sqrt(n)}` : `√${n}`;
}
