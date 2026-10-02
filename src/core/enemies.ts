import { TILE, type Enemy, type EnemyDef, type World } from "./types";

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
export function moveEnemies(w: World): void {}

// Stomp: the player falls now (vy > 0), and one tick ago the player's bottom was at or above the enemy's top.
// A stomp kills the enemy, sets the player's vy to PHYS.stompBounce and emits enemyStomped.
// Any other contact with a live enemy kills the player (cause "enemy"). A stomp beats a side hit in the same tick.
export function resolveEnemyContacts(w: World, prevBottom: number): void {}
