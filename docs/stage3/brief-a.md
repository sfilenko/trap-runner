# Task brief — Worker A (enemies)

| Field | Value |
|---|---|
| Goal and input | Implement moveEnemies and resolveEnemyContacts in src/core/enemies.ts. Make FR-1..FR-4 of docs/stage3/requirements.md true. |
| Requirements | FR-1, FR-2, FR-3, FR-4, NFR-1, TC-1, TC-2, BC-1 |
| Shared base | base: 2aefcdaa13b5c52decdbfca7ca82542c09a11de9 (tag contract-c0). Read this revision. |
| Contract | src/core/enemies.ts (signatures and comments), src/core/types.ts |
| Acceptance scenario | ENEMY-side-01, ENEMY-stomp-01, ENEMY-trap-01 (files below) and tests/unit/enemies.test.ts are green. Oracle: docs/design.md §6, derived by hand. |
| Allowed files (owned) | src/core/enemies.ts (bodies of moveEnemies and resolveEnemyContacts only), tests/unit/enemies.test.ts, tests/replay/ENEMY-*.replay.json |
| Forbidden | src/core/types.ts, the signatures in enemies.ts, levels/, tools/, PHYS, new dependencies |
| Limits | 60 min, budget: subscription limit, no $ cap, no new dependencies |
| Stop condition | A change of the contract is necessary, OR the time is over → stop. Report the blocker and a proposal. |
| Allowed commands | pnpm test, pnpm check, pnpm boundaries, git status, git diff, git log, git commit (with the human's approval) |
| Who decides | Contract change → orchestrator. PHYS or game rules → human. |

## Order
1. Write the tests and the replay files below. Run pnpm test. Copy the failing lines (expected: 7 failed, all AssertionError).
2. Commit the red state.
3. Implement. Run pnpm check. Commit the green state.

## Report form
```
Status: complete | partial | blocked
Base / result revision:
Changed files:
Scenarios and commands:
Actual exit/result:
Known gaps / interface requests:
Next action:
```

## Files to create (exact content)

Use these files without changes. They are the oracle.

`tests/unit/enemies.test.ts`:
```ts
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
```

`tests/replay/ENEMY-side-01.replay.json`:
```json
{
  "scenario": "ENEMY-side-01",
  "level": {
    "id": "fx-enemy-side",
    "tiles": [
      "...........",
      "...........",
      "S.........G",
      "###########"
    ],
    "enemies": [{"id": "e1", "x": 6, "y": 2, "patrol": [5, 8], "speed": 1}],
    "traps": []
  },
  "inputs": [{"ticks": 120, "right": true}],
  "expect": [{"type": "died", "cause": "enemy"}],
  "absent": [{"type": "enemyStomped"}]
}
```

`tests/replay/ENEMY-stomp-01.replay.json`:
```json
{
  "scenario": "ENEMY-stomp-01",
  "level": {
    "id": "fx-enemy-stomp",
    "tiles": [
      "...........",
      "...........",
      "S.........G",
      "###########"
    ],
    "enemies": [{"id": "e1", "x": 6, "y": 2, "patrol": [6, 6], "speed": 1}],
    "traps": []
  },
  "inputs": [{"ticks": 1}, {"ticks": 15, "right": true}, {"ticks": 1, "right": true, "jump": true}, {"ticks": 100, "right": true}],
  "expect": [{"type": "enemyStomped", "id": "e1"}, {"type": "levelComplete"}],
  "absent": [{"type": "died"}]
}
```

`tests/replay/ENEMY-trap-01.replay.json`:
```json
{
  "scenario": "ENEMY-trap-01",
  "level": {
    "id": "fx-enemy-trap",
    "tiles": [
      "...........",
      "...........",
      "S.........G",
      "###########"
    ],
    "enemies": [{"id": "e1", "x": 6, "y": 2, "patrol": [6, 6], "speed": 1}],
    "traps": [{"id": "t1", "trigger": {"kind": "event", "event": "enemyStomped", "id": "e1"}, "action": {"kind": "moveGoal", "to": [0, 0]}, "delayTicks": 0}]
  },
  "inputs": [{"ticks": 1}, {"ticks": 15, "right": true}, {"ticks": 1, "right": true, "jump": true}, {"ticks": 100, "right": true}],
  "expect": [{"type": "enemyStomped", "id": "e1"}, {"type": "trapTriggered", "id": "t1"}],
  "absent": [{"type": "levelComplete"}]
}
```
