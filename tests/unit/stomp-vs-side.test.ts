import { describe, expect, test } from "vitest";
import { resolveEnemyContacts } from "../../src/core/enemies";
import { createWorld } from "../../src/core/world";
import type { World } from "../../src/core/types";

// design.md §6 and §7: a stomp and a side hit in the same tick → the stomp wins.
// Stage 3 decision #1 and #2 (docs/stage3/decisions.md): the order of w.enemies does not matter.
const lvl = {
  id: "level-97",
  tiles: ["...........", "...........", "S.........G", "###########"],
  enemies: [
    { id: "e1", x: 6, y: 2, patrol: [6, 6] as [number, number], speed: 1 },
    { id: "e2", x: 7, y: 2, patrol: [7, 7] as [number, number], speed: 1 },
  ],
  traps: [],
};

// The player box (x 105..117, y 22..36) touches e1 (x 97..111, top 34) and e2 (x 113..127).
// prevBottom 34 is at e1's top, so e1 is a stomp. e2 is moved up to top 30, so e2 is a side hit.
function stompOnE1SideHitOnE2(reverse: boolean): World {
  const w = createWorld(lvl);
  w.enemies[1].y = 30;
  if (reverse) w.enemies.reverse();
  w.player.x = 105;
  w.player.y = 22;
  w.player.vy = 3;
  resolveEnemyContacts(w, 34);
  return w;
}

describe("stomp against a side hit in one tick", () => {
  for (const reverse of [false, true]) {
    test(`the stomp wins (${reverse ? "side-hit enemy first" : "stomped enemy first"} in w.enemies)`, () => {
      const w = stompOnE1SideHitOnE2(reverse);
      expect(w.status).toBe("playing");
      expect(w.player.vy).toBe(-5);
      expect(w.events).toEqual([{ tick: 0, type: "enemyStomped", id: "e1" }]);
      expect(Object.fromEntries(w.enemies.map((e) => [e.id, e.alive]))).toEqual({ e1: false, e2: true });
    });
  }
});
