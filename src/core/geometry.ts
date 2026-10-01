import { TILE, type Box, type Rect } from "./types";

const EPS = 1e-6;

export function overlaps(a: Box, b: Box): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function tileBox(tx: number, ty: number): Box {
  return { x: tx * TILE, y: ty * TILE, w: TILE, h: TILE };
}

export function rectBox([x, y, w, h]: Rect): Box {
  return { x: x * TILE, y: y * TILE, w: w * TILE, h: h * TILE };
}

export function tileSpan(b: Box): { x0: number; x1: number; y0: number; y1: number } {
  return {
    x0: Math.floor(b.x / TILE),
    x1: Math.floor((b.x + b.w - EPS) / TILE),
    y0: Math.floor(b.y / TILE),
    y1: Math.floor((b.y + b.h - EPS) / TILE),
  };
}

// Above and below the level: empty. Left and right of the level: wall.
export function tileAt(grid: string[][], tx: number, ty: number): string {
  if (ty < 0 || ty >= grid.length) return ".";
  const row = grid[ty];
  if (tx < 0 || tx >= row.length) return "#";
  return row[tx];
}

export function isSolid(grid: string[][], tx: number, ty: number): boolean {
  return tileAt(grid, tx, ty) === "#";
}
