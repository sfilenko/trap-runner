import { describe, expect, test } from "vitest";
import { createEnemies, moveEnemies, resolveEnemyContacts } from "../../src/core/enemies";
import { createWorld } from "../../src/core/world";
import type { World } from "../../src/core/types";

const lvl = {
  id: "level-98",
  tiles: ["...........", "...........", "S.........G", "###########"],
  enemies: [{ id: "e1", x: 6, y: 2, patrol: [5, 8] as [number, number], speed: 1 }],
  traps: [],
};

function worldWithPlayerAt(x: number, y: number, vy: number): World {
  const w = createWorld(lvl);
  w.player.x = x;
  w.player.y = y;
  w.player.vy = vy;
  return w;
}

describe("enemies", () => {
  test("createEnemies places the enemy on its tile, centered, and sets patrol bounds in px", () => {
    expect(createEnemies(lvl.enemies)).toEqual([{ id: "e1", x: 97, y: 34, w: 14, h: 14, vx: 1, minX: 80, maxX: 130, alive: true }]);
  });

  test("an enemy turns at the end of its patrol", () => {
    const w = createWorld(lvl);
    w.enemies[0].x = 129.5;
    moveEnemies(w);
    expect(w.enemies[0]).toMatchObject({ x: 130, vx: -1 });
    w.enemies[0].x = 80.5;
    moveEnemies(w);
    expect(w.enemies[0]).toMatchObject({ x: 80, vx: 1 });
  });

  test("a dead enemy does not move", () => {
    const w = createWorld(lvl);
    w.enemies[0].alive = false;
    moveEnemies(w);
    expect(w.enemies[0].x).toBe(97);
  });

  test("falling onto the enemy from above kills the enemy and bounces the player", () => {
    const w = worldWithPlayerAt(97, 34 - 14 + 2, 3); // bottom = 36, enemy top = 34
    resolveEnemyContacts(w, 34); // one tick ago the bottom was at the enemy top
    expect(w.enemies[0].alive).toBe(false);
    expect(w.player.vy).toBe(-5);
    expect(w.events).toEqual([{ tick: 0, type: "enemyStomped", id: "e1" }]);
    expect(w.status).toBe("playing");
  });

  test("touching the enemy from the side kills the player", () => {
    const w = worldWithPlayerAt(90, 34, 0);
    resolveEnemyContacts(w, 48);
    expect(w.status).toBe("dead");
    expect(w.events).toEqual([{ tick: 0, type: "died", cause: "enemy" }]);
  });

  test("rising into the enemy from below kills the player", () => {
    const w = worldWithPlayerAt(97, 40, -3);
    resolveEnemyContacts(w, 57);
    expect(w.status).toBe("dead");
  });

  test("a dead enemy is harmless", () => {
    const w = worldWithPlayerAt(97, 34, 0);
    w.enemies[0].alive = false;
    resolveEnemyContacts(w, 48);
    expect(w.status).toBe("playing");
  });
});
