import { TILE, type InputFrame, type Player, type World } from "./types";
import { isSolid, tileSpan } from "./geometry";

// Start values. The human approves them (design §6).
// A change here breaks recorded replays and level solutions.
export const PHYS = {
  gravity: 0.5,
  maxFall: 8,
  runSpeed: 2,
  jumpVelocity: -8,
  stompBounce: -5,
} as const;

export const PLAYER_W = 12;
export const PLAYER_H = 14;

// Max move per sub-step in px. It is smaller than PLAYER_W and TILE, so a move cannot skip a tile.
const MAX_SUBSTEP = 4;

export function stepPlayer(w: World, input: InputFrame): void {
  const p = w.player;
  p.vx = (input.right ? PHYS.runSpeed : 0) - (input.left ? PHYS.runSpeed : 0);
  if (input.jump && !p.jumpHeld && p.onGround) p.vy = PHYS.jumpVelocity;
  p.jumpHeld = input.jump;
  p.vy = Math.min(p.vy + PHYS.gravity, PHYS.maxFall);

  const n = Math.max(1, Math.ceil(Math.max(Math.abs(p.vx), Math.abs(p.vy)) / MAX_SUBSTEP));
  const dx = p.vx / n;
  const dy = p.vy / n;
  p.onGround = false;
  let stopX = false;
  let stopY = false;
  for (let i = 0; i < n; i++) {
    if (!stopX) stopX = moveX(p, dx, w.grid);
    if (!stopY) stopY = moveY(p, dy, w.grid);
  }
  const maxX = w.grid[0].length * TILE - p.w;
  p.x = Math.min(Math.max(p.x, 0), maxX);
}

function moveX(p: Player, dx: number, grid: string[][]): boolean {
  if (dx === 0) return false;
  p.x += dx;
  const s = tileSpan(p);
  if (dx > 0) {
    for (let tx = s.x0; tx <= s.x1; tx++)
      for (let ty = s.y0; ty <= s.y1; ty++)
        if (isSolid(grid, tx, ty)) {
          p.x = tx * TILE - p.w;
          p.vx = 0;
          return true;
        }
  } else {
    for (let tx = s.x1; tx >= s.x0; tx--)
      for (let ty = s.y0; ty <= s.y1; ty++)
        if (isSolid(grid, tx, ty)) {
          p.x = (tx + 1) * TILE;
          p.vx = 0;
          return true;
        }
  }
  return false;
}

function moveY(p: Player, dy: number, grid: string[][]): boolean {
  if (dy === 0) return false;
  p.y += dy;
  const s = tileSpan(p);
  if (dy > 0) {
    for (let ty = s.y0; ty <= s.y1; ty++)
      for (let tx = s.x0; tx <= s.x1; tx++)
        if (isSolid(grid, tx, ty)) {
          p.y = ty * TILE - p.h;
          p.vy = 0;
          p.onGround = true;
          return true;
        }
  } else {
    for (let ty = s.y1; ty >= s.y0; ty--)
      for (let tx = s.x0; tx <= s.x1; tx++)
        if (isSolid(grid, tx, ty)) {
          p.y = (ty + 1) * TILE;
          p.vy = 0;
          return true;
        }
  }
  return false;
}
