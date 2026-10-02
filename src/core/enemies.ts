import { TILE, type Enemy, type EnemyDef, type World } from "./types";
import { overlaps } from "./geometry";
import { die } from "./events";
import { PHYS } from "./physics";

export const ENEMY_W = 14;
export const ENEMY_H = 14;

// Contract C0 (stage 3). The orchestrator owns this file's signatures and createEnemies.
// Worker A implements moveEnemies and resolveEnemyContacts (docs/stage3/brief-a.md).
export function createEnemies(defs: EnemyDef[]): Enemy[] {
  return defs.map((d) => ({
    id: d.id,
    x: d.x * TILE + (TILE - ENEMY_W) / 2,
    y: d.y * TILE + TILE - ENEMY_H,
    w: ENEMY_W,
    h: ENEMY_H,
    vx: d.speed,
    minX: d.patrol[0] * TILE,
    maxX: d.patrol[1] * TILE + TILE - ENEMY_W,
    alive: true,
  }));
}

// Moves each live enemy by vx and turns it at minX / maxX.
export function moveEnemies(w: World): void {
  for (const e of w.enemies) {
    if (!e.alive) continue;
    e.x += e.vx;
    if (e.x >= e.maxX) {
      e.x = e.maxX;
      e.vx = -Math.abs(e.vx);
    } else if (e.x <= e.minX) {
      e.x = e.minX;
      e.vx = Math.abs(e.vx);
    }
  }
}

// Stomp: the player falls now (vy > 0), and one tick ago the player's bottom was at or above the enemy's top.
// A stomp kills the enemy, sets the player's vy to PHYS.stompBounce and emits enemyStomped.
// Any other contact with a live enemy kills the player (cause "enemy"). A stomp beats a side hit in the same tick.
export function resolveEnemyContacts(w: World, prevBottom: number): void {
  const p = w.player;
  const hits = w.enemies.filter((e) => e.alive && overlaps(p, e));
  if (hits.length === 0) return;
  const stomped = p.vy > 0 ? hits.filter((e) => prevBottom <= e.y) : [];
  if (stomped.length === 0) {
    die(w, "enemy");
    return;
  }
  for (const e of stomped) {
    e.alive = false;
    w.events.push({ tick: w.tick, type: "enemyStomped", id: e.id });
  }
  p.vy = PHYS.stompBounce;
}
