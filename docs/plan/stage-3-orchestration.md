# Етап 3 · Оркестрація: контракт → два workers → незалежний checker

**День курсу:** 04. **Рівень довіри:** 4 (паралельні агенти, людина зводить). **Бюджет:** ≈4 год.
**Результат етапу:** вороги в грі (worker A), рівні 02–03 (worker B), контракт закомічений **до** розгалуження, звіт `game-checker` і рішення людини щодо кожної знахідки, таблиця фактичних витрат.

Перед етапом прочитай: `docs/design.md` §5–7; шаблон брифу курсу (`templates/task-brief.md` у базі знань — його поля повторено нижче).

**Що вимагає ДЗ дня 04 і де це тут:**
| Вимога | Де |
|---|---|
| Вимоги FR/NFR/TC/BC → slice → сценарії | Task 3.1 |
| Context packet, DAG, контракт закомічений до fan-out | Task 3.1, 3.2 |
| Два bounded assignments (файли, ліміти, stop condition, форма звіту) | Task 3.3 |
| Незалежний checker (власний oracle, контрприклади, не править код) | Task 3.4 |
| Інтеграція на одному SHA + review | Task 3.5 |
| Таблиця фактичних витрат; review якості тесту | Task 3.5 |

**Ролі:** orchestrator = твоя основна сесія + ти. Worker A і worker B = дві окремі сесії Claude Code у двох git worktree. Checker = субагент `game-checker` у свіжому контексті.

---

### Task 3.1: Вимоги, slice, DAG

**Рівень:** 1 (людина вирішує scope). **Files:** Create: `docs/stage3/requirements.md`, `docs/stage3/dag.md`.

- [ ] **Step 1: `docs/stage3/requirements.md`**

```markdown
# Stage 3 — enemies and levels 02–03

## Requirements
- FR-1: An enemy SHALL patrol between patrol[0] and patrol[1] (tiles) at `speed` px per tick and turn at each end.
- FR-2: When the player falls (vy > 0) and the player's bottom one tick earlier was at or above the enemy's top, the contact SHALL kill the enemy, set the player's vy to -5 and emit enemyStomped.
- FR-3: Any other contact with a live enemy SHALL kill the player with cause "enemy".
- FR-4: A trap with trigger {kind: "event", event: "enemyStomped", id} SHALL fire in the tick of that stomp.
- FR-5: levels/level-02.json and levels/level-03.json SHALL each have 2 or more traps, 2 or more coins, a width of 40–80 tiles, and SHALL pass `pnpm validate:levels`.
- NFR-1: src/core SHALL stay deterministic (guard-core + `pnpm boundaries`).
- NFR-2: `pnpm check` SHALL finish in less than 30 s on the developer machine.
- TC-1: The contract C0 signatures (src/core/enemies.ts, src/core/types.ts) SHALL NOT change without the orchestrator.
- TC-2: Workers SHALL NOT add dependencies.
- BC-1: PHYS values belong to the human and SHALL NOT change.

## Slice S1
Enemies in the core (FR-1..4) + two levels without enemies (FR-5). Enemies in levels and in the renderer come after the join.

## Scenarios
- ENEMY-side-01, ENEMY-stomp-01, ENEMY-trap-01 (tests/replay, worker A)
- LEVEL-02-valid, LEVEL-03-valid: `pnpm validate:levels` prints PASS (worker B)
```

- [ ] **Step 2: `docs/stage3/dag.md`**

```markdown
# DAG — stage 3

C0  contract (orchestrator): types, enemies.ts signatures, schema, validator, .gitattributes
 ├─> A  enemies: moveEnemies, resolveEnemyContacts + tests       (worker A, worktree ../trap-runner-a)
 └─> B  levels 02 and 03 + solutions, no enemies                 (worker B, worktree ../trap-runner-b)
A + B ─> J  join on one SHA, pnpm check                          (orchestrator)
J ─> K  game-checker on the J SHA                                (checker, fresh context)
K ─> H  human decision per finding; render enemies; enemy in level-03 (human + orchestrator)

Critical path: C0 → A → J → K → H.
A and B are independent: B does not use enemies; A does not touch levels/.
Shared files (types.ts, enemies.ts signatures, level.schema.ts, validate-level.ts) belong to the orchestrator.
```

- [ ] **Step 3 [ЛЮДИНА]: коміт**
```bash
git add docs/stage3
git commit -m "docs: stage 3 requirements, slice, DAG"
```

---

### Task 3.2: Контракт C0 (до розгалуження)

**Рівень:** 2 (orchestrator). **Files:** Modify (повна заміна): `src/core/types.ts`, `src/core/world.ts`, `src/core/interactions.ts`, `src/core/step.ts`, `levels/level.schema.ts`, `tools/validate-level.ts`, `.gitattributes`. Create: `src/core/enemies.ts` (контракт).

**Interfaces (фіксовані для workers):**
- `createEnemies(defs: EnemyDef[]): Enemy[]` — реалізує orchestrator;
- `moveEnemies(w: World): void`, `resolveEnemyContacts(w: World, prevBottom: number): void` — порожні, реалізує worker A;
- `ENEMY_W = 14`, `ENEMY_H = 14`; `EnemyDef { id, x, y, patrol: [from, to], speed }`; `Enemy extends Box { id, vx, minX, maxX, alive }`; подія `{ type: "enemyStomped", id }`; тригер `event: "coinCollected" | "enemyStomped"`.

- [ ] **Step 1: типи (фінальна версія)**

`src/core/types.ts`:
```ts
export const TILE = 16;
export const LEVEL_HEIGHT = 15;

export type Rect = [x: number, y: number, w: number, h: number];

export interface InputFrame {
  left: boolean;
  right: boolean;
  jump: boolean;
}

export interface RleInput {
  ticks: number;
  left?: boolean;
  right?: boolean;
  jump?: boolean;
}

export type TrapTrigger =
  | { kind: "zone"; rect: Rect }
  | { kind: "event"; event: "coinCollected" | "enemyStomped"; id: string };

export type TrapAction =
  | { kind: "removeTiles"; rect: Rect }
  | { kind: "addSpikes"; rect: Rect }
  | { kind: "moveGoal"; to: [x: number, y: number] };

export interface TrapDef {
  id: string;
  trigger: TrapTrigger;
  action: TrapAction;
  delayTicks: number;
}

export interface EnemyDef {
  id: string;
  x: number;
  y: number;
  patrol: [from: number, to: number];
  speed: number;
}

export interface LevelDef {
  id: string;
  tiles: string[];
  enemies?: EnemyDef[];
  traps: TrapDef[];
}

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Player extends Box {
  vx: number;
  vy: number;
  onGround: boolean;
  jumpHeld: boolean;
}

export interface Enemy extends Box {
  id: string;
  vx: number;
  minX: number;
  maxX: number;
  alive: boolean;
}

export interface Coin {
  id: string;
  x: number;
  y: number;
}

export interface Pending {
  trapIndex: number;
  dueTick: number;
}

export type DeathCause = "spikes" | "pit" | "enemy";

export type GameEvent =
  | { tick: number; type: "trapTriggered"; id: string }
  | { tick: number; type: "coinCollected"; id: string }
  | { tick: number; type: "enemyStomped"; id: string }
  | { tick: number; type: "died"; cause: DeathCause }
  | { tick: number; type: "levelComplete" };

export interface World {
  level: LevelDef;
  tick: number;
  grid: string[][];
  player: Player;
  enemies: Enemy[];
  coins: Coin[];
  collected: string[];
  goal: { x: number; y: number };
  triggered: string[];
  pending: Pending[];
  events: GameEvent[];
  status: "playing" | "dead" | "complete";
}
```

- [ ] **Step 2: контракт ворогів**

`src/core/enemies.ts`:
```ts
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
```

- [ ] **Step 3: підключити ворогів до світу і кроку**

`src/core/world.ts`:
```ts
import { TILE, type Coin, type LevelDef, type World } from "./types";
import { PLAYER_H, PLAYER_W } from "./physics";
import { createEnemies } from "./enemies";

export function createWorld(level: LevelDef): World {
  const grid = level.tiles.map((row) => row.split(""));
  let start: { x: number; y: number } | undefined;
  let goal: { x: number; y: number } | undefined;
  const coins: Coin[] = [];
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      const c = grid[y][x];
      if (c === "S") {
        start = { x, y };
        grid[y][x] = ".";
      } else if (c === "G") {
        goal = { x, y };
        grid[y][x] = ".";
      } else if (c === "o") {
        coins.push({ id: `c${x}_${y}`, x, y });
        grid[y][x] = ".";
      }
    }
  }
  if (!start || !goal) throw new Error(`Level ${level.id}: the level must have one S tile and one G tile.`);
  return {
    level,
    tick: 0,
    grid,
    player: {
      x: start.x * TILE + (TILE - PLAYER_W) / 2,
      y: start.y * TILE + TILE - PLAYER_H,
      w: PLAYER_W,
      h: PLAYER_H,
      vx: 0,
      vy: 0,
      onGround: false,
      jumpHeld: false,
    },
    enemies: createEnemies(level.enemies ?? []),
    coins,
    collected: [],
    goal,
    triggered: [],
    pending: [],
    events: [],
    status: "playing",
  };
}
```

`src/core/interactions.ts`:
```ts
import { LEVEL_HEIGHT, TILE, type World } from "./types";
import { overlaps, tileAt, tileBox, tileSpan } from "./geometry";
import { die } from "./events";
import { resolveEnemyContacts } from "./enemies";

// Order: coins, enemies, spikes, pit, goal. A death stops the checks, so a death beats the goal.
export function resolveInteractions(w: World, prevBottom: number): void {
  const p = w.player;
  w.coins = w.coins.filter((c) => {
    if (!overlaps(p, tileBox(c.x, c.y))) return true;
    w.collected.push(c.id);
    w.events.push({ tick: w.tick, type: "coinCollected", id: c.id });
    return false;
  });

  resolveEnemyContacts(w, prevBottom);
  if (w.status === "dead") return;

  const s = tileSpan(p);
  for (let ty = s.y0; ty <= s.y1; ty++)
    for (let tx = s.x0; tx <= s.x1; tx++)
      if (tileAt(w.grid, tx, ty) === "^") {
        die(w, "spikes");
        return;
      }

  if (p.y > LEVEL_HEIGHT * TILE) {
    die(w, "pit");
    return;
  }

  if (overlaps(p, tileBox(w.goal.x, w.goal.y))) {
    w.status = "complete";
    w.events.push({ tick: w.tick, type: "levelComplete" });
  }
}
```

`src/core/step.ts`:
```ts
import type { InputFrame, World } from "./types";
import { stepPlayer } from "./physics";
import { moveEnemies } from "./enemies";
import { resolveInteractions } from "./interactions";
import { checkTriggers, fireDueActions } from "./traps";

// One tick = 1/60 s. Returns a new World. The input World stays unchanged.
export function step(prev: World, input: InputFrame): World {
  if (prev.status !== "playing") return prev;
  const w = structuredClone(prev);
  w.events = [];
  fireDueActions(w);
  const prevBottom = w.player.y + w.player.h;
  stepPlayer(w, input);
  moveEnemies(w);
  resolveInteractions(w, prevBottom);
  if (w.status !== "dead") checkTriggers(w);
  w.tick += 1;
  return w;
}
```

- [ ] **Step 4: схема і валідатор з ворогами**

`levels/level.schema.ts`:
```ts
import { z } from "zod";
import type { LevelDef } from "../src/core/types";

const Int = z.number().int();
const Rect = z.tuple([Int.min(0), Int.min(0), Int.positive(), Int.positive()]);

const Trigger = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("zone"), rect: Rect }),
  z.object({ kind: z.literal("event"), event: z.enum(["coinCollected", "enemyStomped"]), id: z.string().min(1) }),
]);

const Action = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("removeTiles"), rect: Rect }),
  z.object({ kind: z.literal("addSpikes"), rect: Rect }),
  z.object({ kind: z.literal("moveGoal"), to: z.tuple([Int.min(0), Int.min(0)]) }),
]);

const Enemy = z.object({
  id: z.string().min(1),
  x: Int.min(0),
  y: Int.min(0),
  patrol: z.tuple([Int.min(0), Int.min(0)]),
  speed: z.number().positive(),
});

export const LevelSchema = z
  .object({
    id: z.string().regex(/^level-\d\d$/),
    tiles: z.array(z.string().regex(/^[.#^oSG]+$/)).length(15),
    enemies: z.array(Enemy).optional(),
    traps: z.array(z.object({ id: z.string().min(1), trigger: Trigger, action: Action, delayTicks: Int.min(0) })),
  })
  .strict();

export const SolutionSchema = z
  .object({
    inputs: z
      .array(
        z
          .object({ ticks: Int.positive(), left: z.boolean().optional(), right: z.boolean().optional(), jump: z.boolean().optional() })
          .strict(),
      )
      .min(1),
  })
  .strict();

// Compile-time check: a parsed level is a LevelDef.
export const asLevelDef = (l: z.infer<typeof LevelSchema>): LevelDef => l;
```

`tools/validate-level.ts`:
```ts
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, join } from "node:path";
import { pathToFileURL } from "node:url";
import { LevelSchema, SolutionSchema, asLevelDef } from "../levels/level.schema";
import { runReplay } from "../src/core/replay";
import { LEVEL_HEIGHT, type Rect } from "../src/core/types";

export function validateLevel(levelJson: unknown, solutionJson: unknown): string[] {
  const parsed = LevelSchema.safeParse(levelJson);
  if (!parsed.success) return parsed.error.issues.map((i) => `schema: ${i.path.join(".")}: ${i.message}`);
  const level = asLevelDef(parsed.data);
  const errors: string[] = [];

  const width = level.tiles[0].length;
  level.tiles.forEach((row, y) => {
    if (row.length !== width) errors.push(`tiles: row ${y} has length ${row.length}, expected ${width}`);
  });
  const count = (ch: string) => level.tiles.join("").split(ch).length - 1;
  if (count("S") !== 1) errors.push(`tiles: expected exactly 1 S, found ${count("S")}`);
  if (count("G") !== 1) errors.push(`tiles: expected exactly 1 G, found ${count("G")}`);

  const coinIds = new Set<string>();
  level.tiles.forEach((row, y) => [...row].forEach((c, x) => c === "o" && coinIds.add(`c${x}_${y}`)));
  const enemies = level.enemies ?? [];
  const enemyIds = new Set(enemies.map((e) => e.id));
  const inside = ([x, y, w, h]: Rect) => x + w <= width && y + h <= LEVEL_HEIGHT;

  const trapIds = level.traps.map((t) => t.id);
  if (new Set(trapIds).size !== trapIds.length) errors.push("traps: trap ids must be unique");
  if (enemyIds.size !== enemies.length) errors.push("enemies: enemy ids must be unique");
  for (const e of enemies) {
    const [from, to] = e.patrol;
    if (!(from <= e.x && e.x <= to && to < width)) errors.push(`enemy ${e.id}: x must be inside patrol, and patrol must be inside the level`);
  }
  for (const t of level.traps) {
    const tr = t.trigger;
    if (tr.kind === "zone" && !inside(tr.rect)) errors.push(`trap ${t.id}: trigger rect is outside the level`);
    if (tr.kind === "event" && tr.event === "coinCollected" && !coinIds.has(tr.id)) errors.push(`trap ${t.id}: coin ${tr.id} does not exist`);
    if (tr.kind === "event" && tr.event === "enemyStomped" && !enemyIds.has(tr.id)) errors.push(`trap ${t.id}: enemy ${tr.id} does not exist`);
    const a = t.action;
    if (a.kind === "moveGoal" ? !inside([a.to[0], a.to[1], 1, 1]) : !inside(a.rect)) errors.push(`trap ${t.id}: action target is outside the level`);
  }
  if (errors.length) return errors;

  if (solutionJson === undefined) return ["solution: file not found (expected levels/<id>.solution.json)"];
  const sol = SolutionSchema.safeParse(solutionJson);
  if (!sol.success) return sol.error.issues.map((i) => `solution: ${i.path.join(".")}: ${i.message}`);
  const { world, events } = runReplay(level, sol.data.inputs);
  const at = `tick ${world.tick}, player x=${world.player.x}, y=${world.player.y}`;
  if (world.status !== "complete") errors.push(`solution: the run ends with status "${world.status}" at ${at}; expected "complete"`);
  if (!events.some((e) => e.type === "trapTriggered")) errors.push("solution: no trap triggers during the run");
  if (!events.some((e) => e.type === "coinCollected")) errors.push("solution: the run collects no coin");
  return errors;
}

function main(args: string[]): number {
  const files = args.length
    ? args
    : readdirSync("levels")
        .filter((f) => /^level-\d\d\.json$/.test(f))
        .sort()
        .map((f) => join("levels", f));
  let failed = 0;
  for (const file of files) {
    const solFile = file.replace(/\.json$/, ".solution.json");
    const level: unknown = JSON.parse(readFileSync(file, "utf8"));
    const solution: unknown = existsSync(solFile) ? JSON.parse(readFileSync(solFile, "utf8")) : undefined;
    const errors = validateLevel(level, solution);
    if (errors.length) {
      failed++;
      console.error(`FAIL ${basename(file)}`);
      for (const e of errors) console.error(`  - ${e}`);
    } else {
      console.log(`PASS ${basename(file)}`);
    }
  }
  console.log(`validate-level: ${files.length} levels, ${failed} failed`);
  return failed ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) process.exit(main(process.argv.slice(2)));
```

- [ ] **Step 5: журнали з двох гілок без конфлікту.** Обидва workers дописують у `.agent-log/*.jsonl`. Допиши в `.gitattributes`:
```gitattributes
.agent-log/*.jsonl merge=union
```

- [ ] **Step 6: усе зелене на контракті**

  Run: `pnpm check`
  Expected: PASS, `Tests  66 passed (66)` (виміряно на коді плану, якщо після етапу 5a не додавалось тестів), `validate-level: 1 levels, 0 failed`.

- [ ] **Step 7 [ЛЮДИНА]: коміт і тег контракту**
```bash
git add -A
git commit -m "feat(core): contract C0 for enemies (types, signatures, schema, validator)"
git tag contract-c0
git rev-parse contract-c0
```
  SHA контракту впиши в обидва брифи (поле «Спільна база»).

---

### Task 3.3: Два bounded assignments

**Рівень:** 4. **Files:** Create: `docs/stage3/brief-a.md`, `docs/stage3/brief-b.md`.

- [ ] **Step 1: бриф A** — `docs/stage3/brief-a.md`

````markdown
# Task brief — Worker A (enemies)

| Field | Value |
|---|---|
| Goal and input | Implement moveEnemies and resolveEnemyContacts in src/core/enemies.ts. Make FR-1..FR-4 of docs/stage3/requirements.md true. |
| Requirements | FR-1, FR-2, FR-3, FR-4, NFR-1, TC-1, TC-2, BC-1 |
| Shared base | base: <SHA of contract-c0>. Read this revision. |
| Contract | src/core/enemies.ts (signatures and comments), src/core/types.ts |
| Acceptance scenario | ENEMY-side-01, ENEMY-stomp-01, ENEMY-trap-01 (files below) and tests/unit/enemies.test.ts are green. Oracle: docs/design.md §6, derived by hand. |
| Allowed files (owned) | src/core/enemies.ts (bodies of moveEnemies and resolveEnemyContacts only), tests/unit/enemies.test.ts, tests/replay/ENEMY-*.replay.json |
| Forbidden | src/core/types.ts, the signatures in enemies.ts, levels/, tools/, PHYS, new dependencies |
| Limits | 60 min, budget $<X>, no new dependencies |
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
````

  Додай до брифу A вміст трьох replay-файлів і тесту, щоб worker не вигадував oracle:

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

  Еталонна реалізація для orchestrator (worker її **не отримує**; вона потрібна, щоб порівняти результат worker'а при join):
```ts
import { TILE, type Enemy, type EnemyDef, type World } from "./types";
import { overlaps } from "./geometry";
import { die } from "./events";
import { PHYS } from "./physics";

export const ENEMY_W = 14;
export const ENEMY_H = 14;

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

// Stomp: the player falls now, and one tick ago the player's bottom was at or above the enemy's top.
// A stomp beats a side hit in the same tick.
export function resolveEnemyContacts(w: World, prevBottom: number): void {
  const p = w.player;
  for (const e of w.enemies) {
    if (!e.alive || !overlaps(p, e)) continue;
    if (p.vy > 0 && prevBottom <= e.y) {
      e.alive = false;
      p.vy = PHYS.stompBounce;
      w.events.push({ tick: w.tick, type: "enemyStomped", id: e.id });
    } else {
      die(w, "enemy");
      return;
    }
  }
}
```

- [ ] **Step 2: бриф B** — `docs/stage3/brief-b.md`

````markdown
# Task brief — Worker B (levels 02 and 03)

| Field | Value |
|---|---|
| Goal and input | Create levels/level-02.json and levels/level-03.json with solution files. Use the make-level skill. |
| Requirements | FR-5, TC-2, BC-1 |
| Shared base | base: <SHA of contract-c0>. Read this revision. |
| Contract | levels/level.schema.ts, docs/design.md §5 |
| Acceptance scenario | `pnpm validate:levels` prints PASS for level-01, level-02, level-03 and "3 levels, 0 failed". |
| Allowed files (owned) | levels/level-02.json, levels/level-02.solution.json, levels/level-03.json, levels/level-03.solution.json |
| Forbidden | src/, tools/, tests/, levels/level-01*, levels/level.schema.ts, enemies in the levels, new dependencies |
| Limits | 60 min, budget $<X> |
| Stop condition | A level needs a change outside the owned files, OR 5 validation runs per level fail, OR the time is over → stop and report. |
| Allowed commands | pnpm validate:levels, pnpm check, git status, git diff, git log, git commit (with the human's approval) |
| Who decides | Difficulty and fun → human. |

## Level rules
- Each level: 2 or more traps, 2 or more coins, width 40–80 tiles.
- Level 02 uses removeTiles and addSpikes. Level 03 uses moveGoal and a coin-event trap (bait coin).
- Different layouts. Do not copy level-01.

## Report form
(the same as brief A)
````

- [ ] **Step 3 [ЛЮДИНА]: worktrees від контракту**
```bash
git worktree add -b stage3/enemies ../trap-runner-a contract-c0
git worktree add -b stage3/levels  ../trap-runner-b contract-c0
git worktree list
```
  У кожному worktree: `pnpm install`.

- [ ] **Step 4 [ЛЮДИНА]: запустити обидва workers до того, як чекати результату.** Два термінали:
```
cd ../trap-runner-a && claude
> Read docs/stage3/brief-a.md and do the task. Report in the form of the brief.

cd ../trap-runner-b && claude
> Read docs/stage3/brief-b.md and do the task. Report in the form of the brief.
```
  Поки вони працюють, у основній сесії запусти Task 3.4, Step 1–2: checker готує очікування і контрприклади з вимог ще до коду (курс, день 04).

- [ ] **Step 5 [ЛЮДИНА]: наприкінці кожної worker-сесії** — `/cost` (або `/usage`). Число і час запиши в `docs/stage3/costs.md`. Звіти worker'ів збережи як `docs/stage3/report-a.md`, `report-b.md`.

---

### Task 3.4: Незалежний checker

**Рівень:** 4. **Files:** Create: `.claude/agents/game-checker.md`, `docs/stage3/checker-report.md`.

- [ ] **Step 1 [РЕВ'Ю]: агент** (Strict STE; лінтер: 0 порушень)

`.claude/agents/game-checker.md`:
````markdown
---
name: game-checker
description: Read-only checker for Trap Runner. Use after the integration of a stage, on one commit. It reads the requirements first, writes its own expected results and counterexamples, then runs the gate and compares. It never edits files.
tools: Read, Grep, Glob, Bash
---

You are the checker. You did not write this code. Do not trust it.

Do these steps in this order:

1. Read docs/design.md, sections 5, 6 and 7. Read the specs in openspec/specs/. Read docs/stage3/requirements.md.
2. Do not read src/ yet. Write 5 to 10 expected behaviors. For each behavior, write the exact result. Get each result from the rules, not from the code.
3. Write at least 3 counterexamples. Each counterexample is a replay case in the format of tests/replay/*.replay.json. Put them only in your report. Do not create files.
4. Run this command: pnpm check. Copy the summary lines into your report.
5. Read src/core/ and tests/. For each expected behavior, give PASS, FAIL or NOT CHECKED. Give the file and the line as evidence.
6. Select one test. Name one change to the code (a mutation) that must make this test fail. Say if the test fails because of the behavior, not because of an import error.

Rules:

- Do not edit, create or delete files.
- Do not run git commands that change the repository.
- If you find no problem, say so. Do not invent findings.

Report format:

```
Status: findings | no findings
Commit: <git rev-parse HEAD>
Expected behaviors: <list, each with PASS / FAIL / NOT CHECKED and evidence>
Counterexamples: <replay JSON blocks>
Gate output: <copied summary lines>
Test quality: <one test, one mutation, the expected failure>
```
````

- [ ] **Step 2: коміт агента в main** (`git commit -m "feat(harness): game-checker subagent"`).

- [ ] **Step 3: запуск — після join (Task 3.5, Step 3), на одному SHA**, у свіжій сесії:
```
Use the game-checker subagent on the current commit. Save nothing. Give me its full report.
```
  Звіт збережи дослівно в `docs/stage3/checker-report.md`.

---

### Task 3.5: Join, рішення людини, витрати

**Рівень:** 4 → 1 на рішеннях. **Files:** Modify: `src/render/draw.ts`, `levels/level-03*.json`. Create: `docs/stage3/decisions.md`, `docs/stage3/costs.md`.

- [ ] **Step 1 [ЛЮДИНА]: join на одному SHA**
```bash
git switch main
git merge --no-ff stage3/enemies
git merge --no-ff stage3/levels
pnpm check
git rev-parse HEAD
```
  Expected: PASS, `validate-level: 3 levels, 0 failed`, `Tests  76 passed (76)` (виміряно для коду плану; worker міг додати тести). Порівняй `src/core/enemies.ts` worker'а з еталоном з Task 3.3: розбіжність — привід для питання checker'у, а не автоматична помилка.

- [ ] **Step 2: вороги в рендері.** У `src/render/draw.ts` перед `ctx.restore();` додай:
```ts
  ctx.fillStyle = COLORS.enemy;
  for (const e of w.enemies) if (e.alive) ctx.fillRect(Math.round(e.x), Math.round(e.y), e.w, e.h);
```
  Коміт: `feat(render): draw enemies`.

- [ ] **Step 3: checker** — Task 3.4, Step 3, на SHA з кроку 1.

- [ ] **Step 4 [ЛЮДИНА]: рішення щодо кожної знахідки** — `docs/stage3/decisions.md`:
```markdown
| # | Знахідка checker'а | Рішення людини (прийняти / відхилити) | Чому | Коміт |
|---|---|---|---|---|
```
  Прийнятий контрприклад стає replay-файлом: спершу червоний коміт, потім фікс. Якщо checker нічого не знайшов, напиши це прямо (рубрика: «рев'ю, яке нічого не знайшло, теж доказ — але скажи це прямо»).

- [ ] **Step 5 [ЛЮДИНА]: ворог у level-03.** Додай одного ворога в `levels/level-03.json` (рішення людини), запиши новий розв'язок через `R` (Task 5a.3, Step 4), `pnpm validate:levels` → PASS. Коміт.

- [ ] **Step 6: таблиця витрат** — `docs/stage3/costs.md`:
```markdown
| Роль | Сесія | Час (хв) | $ / токени | Джерело (/cost, /usage) | Repair-ітерації |
|---|---|---|---|---|---|
| Orchestrator | | | | | |
| Worker A | | | | | |
| Worker B | | | | | |
| Checker | | | | | |
| **Разом** | | | | | |
```
  Курс: паралельність може скоротити очікування і збільшити витрати. Чесно порівняй із бюджетом у `docs/intent.md`.

- [ ] **Step 7 [ЛЮДИНА]: review якості одного тесту.** Візьми тест, який назвав checker (Task 3.4, пункт 6), зроби мутацію (наприклад, у `resolveEnemyContacts` заміни `prevBottom <= e.y` на `prevBottom < e.y`), запусти `pnpm test`, переконайся, що тест падає **через поведінку**, і відкоти мутацію (`git checkout -- src/core/enemies.ts`). Результат допиши в `decisions.md`.

- [ ] **Step 8 [ЛЮДИНА]: прибрати worktrees, тег**
```bash
git worktree remove ../trap-runner-a
git worktree remove ../trap-runner-b
git add -A
git commit -m "docs: stage 3 checker report, decisions, costs"
git tag stage-3
```
  autonomy-log: рядок «етап 3» з рівнем 4 і рядок «рішення щодо знахідок» з рівнем 1.
