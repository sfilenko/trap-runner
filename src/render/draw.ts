import { TILE, type World } from "../core/types";
import type { Session } from "../core/session";
import { cameraX } from "./camera";

const COLORS = {
  bg: "#1d2433",
  wall: "#7f8c99",
  spikes: "#e04f5f",
  coin: "#f4c542",
  goal: "#4fd18b",
  player: "#5aa9ff",
  enemy: "#c77dff",
  text: "#f0f0f0",
};

export function draw(ctx: CanvasRenderingContext2D, w: World, s: Session): void {
  const { width: vw, height: vh } = ctx.canvas;
  const levelW = w.grid[0].length * TILE;
  const cx = cameraX(w.player.x + w.player.w / 2, vw, levelW);

  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, vw, vh);
  ctx.save();
  ctx.translate(-cx, 0);

  const tx0 = Math.floor(cx / TILE);
  const tx1 = Math.ceil((cx + vw) / TILE);
  for (let ty = 0; ty < w.grid.length; ty++) {
    for (let tx = tx0; tx < tx1; tx++) {
      const c = w.grid[ty][tx];
      const x = tx * TILE;
      const y = ty * TILE;
      if (c === "#") {
        ctx.fillStyle = COLORS.wall;
        ctx.fillRect(x, y, TILE, TILE);
      } else if (c === "^") {
        ctx.fillStyle = COLORS.spikes;
        ctx.beginPath();
        ctx.moveTo(x, y + TILE);
        ctx.lineTo(x + TILE / 2, y + 4);
        ctx.lineTo(x + TILE, y + TILE);
        ctx.fill();
      }
    }
  }
  ctx.fillStyle = COLORS.coin;
  for (const c of w.coins) ctx.fillRect(c.x * TILE + 5, c.y * TILE + 5, 6, 6);
  ctx.fillStyle = COLORS.goal;
  ctx.fillRect(w.goal.x * TILE + 2, w.goal.y * TILE, TILE - 4, TILE);
  ctx.fillStyle = COLORS.player;
  ctx.fillRect(Math.round(w.player.x), Math.round(w.player.y), w.player.w, w.player.h);
  ctx.restore();

  ctx.fillStyle = COLORS.text;
  ctx.font = "8px monospace";
  ctx.fillText(`Рівень ${s.levelIndex + 1}  Монети ${s.score + w.collected.length}  Смерті ${s.deaths}`, 4, 10);
  if (s.finished) {
    ctx.font = "16px monospace";
    ctx.fillText("Перемога!", vw / 2 - 40, vh / 2 - 8);
    ctx.font = "8px monospace";
    ctx.fillText(`Монети: ${s.score}   Смерті: ${s.deaths}`, vw / 2 - 52, vh / 2 + 8);
  }
}
