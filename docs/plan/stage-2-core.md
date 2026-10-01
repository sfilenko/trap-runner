# Етап 2 · Ядро гри через OpenSpec

**День курсу:** 03 (SDD, гейт). **Рівень довіри:** усередині зміни OpenSpec — 3, поза нею — 1. **Бюджет:** ≈5 год.
**Результат етапу:** дві архівні зміни OpenSpec (`add-core-gameplay`, `add-level-validation`); `pnpm spec:check` з ненульовими числами; коміти «сценарій → червоний → зелений»; ядро без ворогів (вороги — контракт етапу 3).

Перед етапом прочитай: `docs/design.md` §4–7; цей файл повністю.

**Що вимагає ДЗ дня 03 і де це в етапі:**
| Вимога | Де |
|---|---|
| OpenSpec як devDependency `--save-exact 1.13.0`, `init --tools claude,codex --profile core`, `openspec-pin` + `spec-check`, allow `Bash(pnpm exec openspec *)` | Task 2.0 |
| Бюджет (output і $) у `docs/intent.md` **до apply** | Task 2.1, 2.6 |
| `/opsx:propose` → `/opsx:apply` → `/opsx:archive`; `## Purpose` прочитаний і переписаний людиною | Task 2.1–2.5, 2.6–2.7 |
| Вивід `pnpm spec:check` з ненульовими числами | Task 2.5, 2.7 |
| Коміти **сценарій → червоний тест → зелений** | Task 2.1, 2.3–2.5 |
| Бюджет проти факту і чим виміряно | Task 2.5, 2.7 |
| Вимоги англійською, SHALL/MUST у рядку під заголовком | Task 2.1, 2.6 |

---

### Task 2.0: OpenSpec у репо

**Рівень:** 1 (залежність + генерований контекст). **Files:** `package.json`, `openspec/**`, `.claude/skills/openspec-*`, `.claude/commands/opsx/*`, `scripts/openspec-pin.mjs`, `scripts/spec-check.mjs`, `openspec/config.yaml`, `.claude/settings.json` (людина).

- [ ] **Step 1 [ЛЮДИНА]: встановити й ініціалізувати**

```bash
pnpm add -D --save-exact @fission-ai/openspec@1.13.0
pnpm exec openspec init --tools claude,codex --profile core --no-animation
```

- [ ] **Step 2 [ЛЮДИНА]: скрипти курсу (демо дня 03), pin і гейт**

```bash
git ls-remote https://github.com/koldovsky/2026-agentic-engineering-crash-course-day03 HEAD
B=https://raw.githubusercontent.com/koldovsky/2026-agentic-engineering-crash-course-day03/HEAD
curl -s -o scripts/openspec-pin.mjs $B/scripts/openspec-pin.mjs
curl -s -o scripts/spec-check.mjs  $B/scripts/spec-check.mjs
pnpm pkg set "scripts.openspec:pin=node scripts/openspec-pin.mjs" "scripts.spec:check=node scripts/spec-check.mjs" "scripts.check=pnpm typecheck && pnpm boundaries && pnpm test && pnpm spec:check"
pnpm openspec:pin
```
  SHA — в autonomy-log. Прочитай обидва скрипти: `openspec-pin` переписує голі виклики `openspec` у згенерованих skills на `pnpm exec openspec`.

- [ ] **Step 3 [ЛЮДИНА]: дозволи.** Додай в `allow` у `.claude/settings.json`: `"Bash(pnpm exec openspec *)"`, `"Bash(pnpm spec:check)"`.

- [ ] **Step 4: `openspec/config.yaml`** (замінити згенерований; агент читає його при кожному артефакті)

```yaml
schema: spec-driven

# Shown to the agent whenever it creates an artifact (proposal, specs, design, tasks).
context: |
  Product: Trap Runner, a small browser platformer (capstone of the fwdays Agentic Engineering course).
  Stack: TypeScript strict, Vite, Vitest, zod; pnpm only. Node 22.12 or later.
  The game logic is in src/core. It is pure and deterministic: one call step(world, input) is one tick (1/60 s).
  src/core must not use window, document, Math.random or Date, and must not import from src/render or src/input.
  Design and rules: docs/design.md. The implementation plan with the exact code and tests: docs/plan/stage-2-core.md.
  Physics constants (PHYS in src/core/physics.ts) belong to the human. Do not change them.
  OpenSpec CLI: only as `pnpm exec openspec` (pinned devDependency), never a bare `openspec`.

rules:
  specs:
    - Every scenario names concrete input values and the exact expected output, so a replay test can assert it.
    - Every scenario has an id (for example MOVE-run-right-01). The replay file tests/replay/<id>.replay.json uses the same id.
  tasks:
    - Scenario tests come first. The first task writes the replay files and the stubs, runs pnpm test and quotes the failing lines. Implementation tasks follow.
    - The last task is "Run pnpm check and quote its summary lines".
```

- [ ] **Step 5: гейт на порожньому OpenSpec**

  Run: `pnpm spec:check`
  Expected: `spec:check ok — specs: 0 · active changes: 0 · archived: 0`. Нулі — нормально на старті. Курс: зелене на нічому нічого не доводить, тож справжній доказ буде після першого archive.

  Run: `pnpm check`
  Expected: PASS.

- [ ] **Step 6 [ЛЮДИНА]: коміт**

```bash
git add -A
git commit -m "chore: OpenSpec 1.13.0 pinned, spec gate, project config"
```

---

### Task 2.1: Бюджет і пропозиція зміни A — `add-core-gameplay`

**Рівень:** 1 до кінця propose (людина читає кожен сценарій). **Files:** `docs/intent.md`, `openspec/changes/add-core-gameplay/**`.

- [ ] **Step 1 [ЛЮДИНА]: бюджет до apply.** Допиши в `docs/intent.md`:

```markdown
## Зміна A: add-core-gameplay — бюджет (записано ДО apply)
- час: ≤ 180 хв · output: ≤ <N> токенів · $: ≤ <X>
- як міряємо: `/cost` (або /usage) до і після сесії apply; час — за годинником
```

- [ ] **Step 2 [АГЕНТ]: propose.** У свіжій сесії:

```
/opsx:propose add-core-gameplay — the pure deterministic game core of Trap Runner, without enemies.
Read docs/design.md sections 4-6 and docs/plan/stage-2-core.md before you write anything.
Requirements (English, SHALL/MUST on the line under each heading): tick model (60 ticks per second; step returns a new World and keeps the input World unchanged); movement (run 2 px per tick; gravity; jump only on a key press, only on the ground); collisions (walls, ceiling, level edges, no tunneling); coins (id c<x>_<y>); spikes; pit; goal; death beats the goal in the same tick; traps (zone and coin-event triggers; removeTiles, addSpikes, moveGoal; delayTicks; once per attempt; order of traps[]).
Use exactly the 13 scenarios of Task 2.3 in docs/plan/stage-2-core.md, with the same ids and values.
Make tasks.md follow Tasks 2.3, 2.4, 2.5 of the plan, tests first. Do not write code.
```
  Expected: `openspec/changes/add-core-gameplay/` з `proposal.md`, `tasks.md`, дельтою специфікації. Коду немає.

- [ ] **Step 3 [ЛЮДИНА]: рев'ю пропозиції.** Перевір:
  - 13 сценаріїв з тими самими id, що й файли в Task 2.3;
  - вимоги англійською, `SHALL`/`MUST` у рядку під заголовком;
  - **oracle вручну** для двох чисел (курс, день 04: очікуване виводимо з правила, а не з коду):
    - `MOVE-run-right-01`: старт x = 0·16 + (16−12)/2 = **2**; 30 тіків × 2 px = 60 → **x = 62**;
    - `MOVE-wall-01`: стіна в колонці 6 → лівий край 96; гравець 12 px → **x = 84**.
  - `tasks.md`: перше завдання пише тести і заглушки, останнє — `pnpm check`.

  Run: `pnpm exec openspec validate add-core-gameplay --strict`
  Expected: exit 0.

- [ ] **Step 4 [ЛЮДИНА]: коміт пропозиції (спека раніше за код)**

```bash
git add -A
git commit -m "spec: propose add-core-gameplay (13 scenarios)"
```

---

### Task 2.2: Типи, геометрія, світ

**Рівень:** 3 (усередині зміни; `/opsx:apply` починається тут). **Files:**
- Create: `src/core/types.ts`, `src/core/geometry.ts`, `src/core/events.ts`, `src/core/world.ts`, `tests/helpers.ts`
- Test: `tests/unit/world.test.ts`

**Interfaces:**
- Produces: усі типи з `types.ts`; `overlaps`, `tileBox`, `rectBox`, `tileSpan`, `tileAt`, `isSolid` (geometry); `die(w, cause)` (events); `createWorld(level): World`; у `tests/helpers.ts`: `IDLE`, `RIGHT`, `LEFT`, `JUMP`, `level(tiles, traps)`, `rows15(bottom)`.
- `world.ts` імпортує `PLAYER_W`, `PLAYER_H` з `physics.ts`, тож у цій задачі створюється заглушка `physics.ts` з константами (Step 1).

- [ ] **Step 1 [АГЕНТ]: `/opsx:apply`** у свіжій сесії. Далі агент іде за `tasks.md`, а він повторює Task 2.2–2.5.

- [ ] **Step 2: типи, геометрія, події, заглушки**

`src/core/types.ts` (версія етапу 2, без ворогів):
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
  | { kind: "event"; event: "coinCollected"; id: string };

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

export interface LevelDef {
  id: string;
  tiles: string[];
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
  | { tick: number; type: "died"; cause: DeathCause }
  | { tick: number; type: "levelComplete" };

export interface World {
  level: LevelDef;
  tick: number;
  grid: string[][];
  player: Player;
  coins: Coin[];
  collected: string[];
  goal: { x: number; y: number };
  triggered: string[];
  pending: Pending[];
  events: GameEvent[];
  status: "playing" | "dead" | "complete";
}
```

`src/core/geometry.ts`:
```ts
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
```

`src/core/events.ts`:
```ts
import type { DeathCause, World } from "./types";

export function die(w: World, cause: DeathCause): void {
  w.status = "dead";
  w.events.push({ tick: w.tick, type: "died", cause });
}
```

`src/core/physics.ts` (заглушка: константи справжні, рух ще ні):
```ts
import type { InputFrame, World } from "./types";

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

export function stepPlayer(w: World, input: InputFrame): void {}
```

`src/core/world.ts` (заглушка):
```ts
import type { LevelDef, World } from "./types";

export function createWorld(level: LevelDef): World {
  throw new Error(`createWorld(${level.id}): not implemented`);
}
```

`tests/helpers.ts`:
```ts
import type { InputFrame, LevelDef } from "../src/core/types";

export const IDLE: InputFrame = { left: false, right: false, jump: false };
export const RIGHT: InputFrame = { left: false, right: true, jump: false };
export const LEFT: InputFrame = { left: true, right: false, jump: false };
export const JUMP: InputFrame = { left: false, right: false, jump: true };

export function level(tiles: string[], traps: LevelDef["traps"] = []): LevelDef {
  return { id: "level-99", tiles, traps };
}

// Pads a level to 15 rows: empty rows on top.
export function rows15(bottom: string[]): string[] {
  const width = bottom[0].length;
  return [...Array.from({ length: 15 - bottom.length }, () => ".".repeat(width)), ...bottom];
}
```

`tests/unit/world.test.ts`:
```ts
import { describe, expect, test } from "vitest";
import { createWorld } from "../../src/core/world";
import { level } from "../helpers";

describe("createWorld", () => {
  const lvl = level(["..........", "..o.......", "S........G", "##########"]);

  test("puts the player on the S tile, bottom-aligned and centered", () => {
    const w = createWorld(lvl);
    expect(w.player).toMatchObject({ x: 2, y: 34, w: 12, h: 14, vx: 0, vy: 0 });
  });

  test("reads the goal and the coins, and clears their tiles", () => {
    const w = createWorld(lvl);
    expect(w.goal).toEqual({ x: 9, y: 2 });
    expect(w.coins).toEqual([{ id: "c2_1", x: 2, y: 1 }]);
    expect(w.grid[2].join("")).toBe("..........");
    expect(w.grid[1].join("")).toBe("..........");
  });

  test("starts at tick 0, playing, with no events", () => {
    const w = createWorld(lvl);
    expect(w).toMatchObject({ tick: 0, status: "playing", events: [], collected: [], triggered: [], pending: [] });
  });

  test("does not change the level", () => {
    createWorld(lvl);
    expect(lvl.tiles[2]).toBe("S........G");
  });

  test("throws when S or G is missing", () => {
    expect(() => createWorld(level(["S.........", "##########"]))).toThrow(/one S tile and one G tile/);
  });
});
```

- [ ] **Step 3: червоний**

  Run: `pnpm test tests/unit/world.test.ts`
  Expected: FAIL, `5 failed`, причина `createWorld(level-99): not implemented`.

- [ ] **Step 4: реалізація `createWorld`**

`src/core/world.ts` (версія етапу 2):
```ts
import { TILE, type Coin, type LevelDef, type World } from "./types";
import { PLAYER_H, PLAYER_W } from "./physics";

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

- [ ] **Step 5: зелений**

  Run: `pnpm test tests/unit/world.test.ts`
  Expected: PASS, `5 passed`. Run: `pnpm boundaries`. Expected: `0 violations`.

- [ ] **Step 6 [ЛЮДИНА]: коміти** — червоний і зелений окремо, якщо агент ще не зробив так:
```bash
git commit -m "feat(core): types, geometry, createWorld"
```

---

### Task 2.3: Крок світу + усі 13 сценаріїв (червоні)

**Рівень:** 3. Це **ключовий коміт** для доказу «сценарій → червоний тест». **Files:**
- Create: `src/core/interactions.ts`, `src/core/traps.ts` (заглушка), `src/core/step.ts`, `src/core/replay.ts`
- Test: `tests/unit/step.test.ts`, `tests/unit/replay.test.ts`, `tests/replay/replay.test.ts`, 13 файлів `tests/replay/*.replay.json`

**Interfaces:**
- Consumes: `createWorld`, `stepPlayer` (заглушка), `die`, geometry.
- Produces: `step(prev: World, input: InputFrame): World`; `resolveInteractions(w)`; `fireDueActions(w)`, `checkTriggers(w)`, `applyAction(w, a)` (поки заглушки); `expandInputs(rle)`, `compressInputs(frames)`, `runReplay(level, rle): { world, events }`.

- [ ] **Step 1: взаємодії, крок, replay, заглушка пасток**

`src/core/interactions.ts` (версія етапу 2):
```ts
import { LEVEL_HEIGHT, TILE, type World } from "./types";
import { overlaps, tileAt, tileBox, tileSpan } from "./geometry";
import { die } from "./events";

// Order: coins, spikes, pit, goal. A death stops the checks, so a death beats the goal.
export function resolveInteractions(w: World): void {
  const p = w.player;
  w.coins = w.coins.filter((c) => {
    if (!overlaps(p, tileBox(c.x, c.y))) return true;
    w.collected.push(c.id);
    w.events.push({ tick: w.tick, type: "coinCollected", id: c.id });
    return false;
  });

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

`src/core/traps.ts` (заглушка):
```ts
import type { TrapAction, World } from "./types";

export function fireDueActions(w: World): void {}
export function checkTriggers(w: World): void {}
export function applyAction(w: World, a: TrapAction): void {}
```

`src/core/step.ts` (версія етапу 2):
```ts
import type { InputFrame, World } from "./types";
import { stepPlayer } from "./physics";
import { resolveInteractions } from "./interactions";
import { checkTriggers, fireDueActions } from "./traps";

// One tick = 1/60 s. Returns a new World. The input World stays unchanged.
export function step(prev: World, input: InputFrame): World {
  if (prev.status !== "playing") return prev;
  const w = structuredClone(prev);
  w.events = [];
  fireDueActions(w);
  stepPlayer(w, input);
  resolveInteractions(w);
  if (w.status !== "dead") checkTriggers(w);
  w.tick += 1;
  return w;
}
```

`src/core/replay.ts`:
```ts
import type { GameEvent, InputFrame, LevelDef, RleInput, World } from "./types";
import { createWorld } from "./world";
import { step } from "./step";

export function expandInputs(rle: RleInput[]): InputFrame[] {
  return rle.flatMap((r) =>
    Array.from({ length: r.ticks }, () => ({ left: !!r.left, right: !!r.right, jump: !!r.jump })),
  );
}

export function compressInputs(frames: InputFrame[]): RleInput[] {
  const out: RleInput[] = [];
  for (const f of frames) {
    const last = out[out.length - 1];
    if (last && !!last.left === f.left && !!last.right === f.right && !!last.jump === f.jump) {
      last.ticks++;
    } else {
      out.push({
        ticks: 1,
        ...(f.left ? { left: true } : {}),
        ...(f.right ? { right: true } : {}),
        ...(f.jump ? { jump: true } : {}),
      });
    }
  }
  return out;
}

export function runReplay(level: LevelDef, rle: RleInput[]): { world: World; events: GameEvent[] } {
  let world = createWorld(level);
  const events: GameEvent[] = [];
  for (const input of expandInputs(rle)) {
    if (world.status !== "playing") break;
    world = step(world, input);
    events.push(...world.events);
  }
  return { world, events };
}
```

- [ ] **Step 2: тести кроку і replay-раннер**

`tests/unit/step.test.ts`:
```ts
import { describe, expect, test } from "vitest";
import { createWorld } from "../../src/core/world";
import { step } from "../../src/core/step";
import { IDLE, RIGHT, level } from "../helpers";

describe("step", () => {
  const lvl = level(["..........", "..........", "S..o.....G", "##########"]);

  test("returns a new World and does not change the input World", () => {
    const w0 = createWorld(lvl);
    const snapshot = structuredClone(w0);
    const w1 = step(w0, RIGHT);
    expect(w1).not.toBe(w0);
    expect(w0).toEqual(snapshot);
    expect(w1.tick).toBe(1);
  });

  test("events hold only the events of this tick", () => {
    let w = createWorld(lvl);
    for (let i = 0; i < 18; i++) w = step(w, RIGHT);
    expect(w.events).toEqual([{ tick: 17, type: "coinCollected", id: "c3_2" }]);
    w = step(w, RIGHT);
    expect(w.events).toEqual([]);
    expect(w.collected).toEqual(["c3_2"]);
  });

  test("a finished World does not change", () => {
    const w = { ...createWorld(lvl), status: "dead" as const };
    expect(step(w, RIGHT)).toBe(w);
  });

  test("death beats the goal in the same tick", () => {
    const w0 = createWorld(level(["..........", "..........", "S.....G...", "##########"]));
    w0.grid[2][6] = "^";
    let w = w0;
    for (let i = 0; i < 60 && w.status === "playing"; i++) w = step(w, RIGHT);
    expect(w.status).toBe("dead");
    expect(w.events).toEqual([{ tick: 41, type: "died", cause: "spikes" }]);
  });

  test("falling below the level is a death by pit", () => {
    let w = createWorld(level(["..........", "..........", "S........G", "#####....#"]));
    for (let i = 0; i < 120 && w.status === "playing"; i++) w = step(w, RIGHT);
    expect(w.events).toEqual([{ tick: 71, type: "died", cause: "pit" }]);
  });

  test("standing still for 100 ticks changes nothing but the tick", () => {
    let w = createWorld(lvl);
    w = step(w, IDLE);
    const y = w.player.y;
    for (let i = 0; i < 100; i++) w = step(w, IDLE);
    expect(w.player.y).toBe(y);
    expect(w.status).toBe("playing");
  });
});
```

`tests/unit/replay.test.ts`:
```ts
import { describe, expect, test } from "vitest";
import { compressInputs, expandInputs, runReplay } from "../../src/core/replay";
import { level } from "../helpers";

describe("replay helpers", () => {
  const rle = [{ ticks: 3, right: true }, { ticks: 1, right: true, jump: true }, { ticks: 2 }];

  test("expandInputs gives one frame per tick", () => {
    const frames = expandInputs(rle);
    expect(frames).toHaveLength(6);
    expect(frames[3]).toEqual({ left: false, right: true, jump: true });
    expect(frames[5]).toEqual({ left: false, right: false, jump: false });
  });

  test("compressInputs is the inverse of expandInputs", () => {
    expect(compressInputs(expandInputs(rle))).toEqual(rle);
  });

  test("runReplay stops at the first end of the attempt", () => {
    const { world, events } = runReplay(level(["..........", "..........", "S.....^..G", "##########"]), [{ ticks: 500, right: true }]);
    expect(world.tick).toBe(42);
    expect(events).toEqual([{ tick: 41, type: "died", cause: "spikes" }]);
  });
});
```

`tests/replay/replay.test.ts`:
```ts
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import { runReplay } from "../../src/core/replay";
import type { GameEvent, LevelDef, RleInput } from "../../src/core/types";

// One file = one scenario from an OpenSpec spec. The scenario id is in the file name and in the test name.
interface ReplayCase {
  scenario: string;
  level: LevelDef;
  inputs: RleInput[];
  expect?: Record<string, unknown>[]; // these events must occur in this order (other events can occur between them)
  absent?: Record<string, unknown>[]; // these events must not occur
  final?: Record<string, unknown>; // partial match on the World after the run
}

const dir = fileURLToPath(new URL(".", import.meta.url));
const files = readdirSync(dir).filter((f) => f.endsWith(".replay.json")).sort();
const matches = (e: GameEvent, want: Record<string, unknown>) =>
  Object.entries(want).every(([k, v]) => (e as unknown as Record<string, unknown>)[k] === v);

describe("replay scenarios", () => {
  test("at least one replay file exists", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  for (const file of files) {
    const c = JSON.parse(readFileSync(join(dir, file), "utf8")) as ReplayCase;
    test(`${c.scenario} (${file})`, () => {
      const { world, events } = runReplay(c.level, c.inputs);
      let from = 0;
      for (const want of c.expect ?? []) {
        const i = events.findIndex((e, k) => k >= from && matches(e, want));
        expect(i, `missing ${JSON.stringify(want)} after event #${from}. Events: ${JSON.stringify(events)}`).toBeGreaterThanOrEqual(0);
        from = i + 1;
      }
      for (const not of c.absent ?? []) {
        expect(events.some((e) => matches(e, not)), `unexpected ${JSON.stringify(not)}`).toBe(false);
      }
      if (c.final) expect(world).toMatchObject(c.final);
    });
  }
});
```

- [ ] **Step 3: 13 сценаріїв.** Один файл = один сценарій зі специфікації; id = ім'я файлу = назва тесту.

`tests/replay/COIN-goal-01.replay.json`:
```json
{
  "scenario": "COIN-goal-01",
  "level": {
    "id": "fx-coin",
    "tiles": [
      "...........",
      "...........",
      "S..o......G",
      "###########"
    ],
    "traps": []
  },
  "inputs": [{"ticks": 100, "right": true}],
  "expect": [{"type": "coinCollected", "id": "c3_2"}, {"type": "levelComplete"}],
  "final": {"status": "complete", "collected": ["c3_2"]}
}
```

`tests/replay/MOVE-jump-01.replay.json`:
```json
{
  "scenario": "MOVE-jump-01",
  "level": {
    "id": "fx-flat",
    "tiles": [
      "..........",
      "..........",
      "S........G",
      "##########"
    ],
    "traps": []
  },
  "inputs": [{"ticks": 1}, {"ticks": 1, "jump": true}, {"ticks": 58}],
  "final": {"player": {"y": 34, "onGround": true}}
}
```

`tests/replay/MOVE-left-edge-01.replay.json`:
```json
{
  "scenario": "MOVE-left-edge-01",
  "level": {
    "id": "fx-flat",
    "tiles": [
      "..........",
      "..........",
      "S........G",
      "##########"
    ],
    "traps": []
  },
  "inputs": [{"ticks": 10, "left": true}],
  "final": {"player": {"x": 0}}
}
```

`tests/replay/MOVE-no-autojump-01.replay.json`:
```json
{
  "scenario": "MOVE-no-autojump-01",
  "level": {
    "id": "fx-flat",
    "tiles": [
      "..........",
      "..........",
      "S........G",
      "##########"
    ],
    "traps": []
  },
  "inputs": [{"ticks": 5}, {"ticks": 60, "jump": true}],
  "final": {"player": {"y": 34, "onGround": true}}
}
```

`tests/replay/MOVE-run-right-01.replay.json`:
```json
{
  "scenario": "MOVE-run-right-01",
  "level": {
    "id": "fx-flat",
    "tiles": [
      "..........",
      "..........",
      "S........G",
      "##########"
    ],
    "traps": []
  },
  "inputs": [{"ticks": 30, "right": true}],
  "final": {"status": "playing", "player": {"x": 62, "y": 34}}
}
```

`tests/replay/MOVE-wall-01.replay.json`:
```json
{
  "scenario": "MOVE-wall-01",
  "level": {
    "id": "fx-wall",
    "tiles": [
      "..........",
      "......#...",
      "S.....#..G",
      "##########"
    ],
    "traps": []
  },
  "inputs": [{"ticks": 60, "right": true}],
  "final": {"player": {"x": 84}}
}
```

`tests/replay/PIT-01.replay.json`:
```json
{
  "scenario": "PIT-01",
  "level": {
    "id": "fx-pit",
    "tiles": [
      "..........",
      "..........",
      "S........G",
      "#####....#"
    ],
    "traps": []
  },
  "inputs": [{"ticks": 120, "right": true}],
  "expect": [{"type": "died", "cause": "pit"}]
}
```

`tests/replay/SPIKE-01.replay.json`:
```json
{
  "scenario": "SPIKE-01",
  "level": {
    "id": "fx-spikes",
    "tiles": [
      "..........",
      "..........",
      "S.....^..G",
      "##########"
    ],
    "traps": []
  },
  "inputs": [{"ticks": 60, "right": true}],
  "expect": [{"type": "died", "cause": "spikes"}],
  "absent": [{"type": "levelComplete"}]
}
```

`tests/replay/TRAP-bait-01.replay.json`:
```json
{
  "scenario": "TRAP-bait-01",
  "level": {
    "id": "fx-bait",
    "tiles": [
      "...........",
      "...........",
      "S..o......G",
      "###########"
    ],
    "traps": [{"id": "t1", "trigger": {"kind": "event", "event": "coinCollected", "id": "c3_2"}, "action": {"kind": "removeTiles", "rect": [5, 3, 2, 1]}, "delayTicks": 0}]
  },
  "inputs": [{"ticks": 120, "right": true}],
  "expect": [{"type": "coinCollected", "id": "c3_2"}, {"type": "trapTriggered", "id": "t1"}, {"type": "died", "cause": "pit"}]
}
```

`tests/replay/TRAP-collapse-01.replay.json`:
```json
{
  "scenario": "TRAP-collapse-01",
  "level": {
    "id": "fx-collapse",
    "tiles": [
      "...........",
      "...........",
      "S.........G",
      "###########"
    ],
    "traps": [{"id": "t1", "trigger": {"kind": "zone", "rect": [3, 0, 1, 4]}, "action": {"kind": "removeTiles", "rect": [5, 3, 3, 1]}, "delayTicks": 0}]
  },
  "inputs": [{"ticks": 120, "right": true}],
  "expect": [{"type": "trapTriggered", "id": "t1"}, {"type": "died", "cause": "pit"}]
}
```

`tests/replay/TRAP-goal-01.replay.json`:
```json
{
  "scenario": "TRAP-goal-01",
  "level": {
    "id": "fx-trap-goal",
    "tiles": [
      "..........",
      "..........",
      "S.......G.",
      "##########"
    ],
    "traps": [{"id": "t1", "trigger": {"kind": "zone", "rect": [6, 0, 1, 4]}, "action": {"kind": "moveGoal", "to": [0, 0]}, "delayTicks": 0}]
  },
  "inputs": [{"ticks": 120, "right": true}],
  "expect": [{"type": "trapTriggered", "id": "t1"}],
  "absent": [{"type": "levelComplete"}],
  "final": {"status": "playing", "goal": {"x": 0, "y": 0}}
}
```

`tests/replay/TRAP-goal-death-01.replay.json`:
```json
{
  "scenario": "TRAP-goal-death-01",
  "level": {
    "id": "fx-goal-death",
    "tiles": [
      "..........",
      "..........",
      "S.....G...",
      "##########"
    ],
    "traps": [{"id": "t1", "trigger": {"kind": "zone", "rect": [5, 0, 1, 4]}, "action": {"kind": "addSpikes", "rect": [6, 2, 1, 1]}, "delayTicks": 0}]
  },
  "inputs": [{"ticks": 120, "right": true}],
  "expect": [{"type": "trapTriggered", "id": "t1"}, {"type": "died", "cause": "spikes"}],
  "absent": [{"type": "levelComplete"}]
}
```

`tests/replay/TRAP-spikes-01.replay.json`:
```json
{
  "scenario": "TRAP-spikes-01",
  "level": {
    "id": "fx-trap-spikes",
    "tiles": [
      "...........",
      "...........",
      "S.........G",
      "###########"
    ],
    "traps": [{"id": "t1", "trigger": {"kind": "zone", "rect": [2, 0, 1, 4]}, "action": {"kind": "addSpikes", "rect": [6, 2, 1, 1]}, "delayTicks": 10}]
  },
  "inputs": [{"ticks": 120, "right": true}],
  "expect": [{"type": "trapTriggered", "id": "t1", "tick": 9}, {"type": "died", "cause": "spikes"}]
}
```

- [ ] **Step 4: червоний через поведінку**

  Run: `pnpm test`
  Expected: FAIL, `Tests  17 failed | 15 passed (32)` (виміряно на коді плану). Падають усі 13 replay-сценаріїв (наприклад, `MOVE-run-right-01`: `expected 2 to be 62`; `COIN-goal-01`: `missing {"type":"coinCollected","id":"c3_2"}`), 3 тести `step.test.ts`, яким потрібен рух, і `runReplay stops at the first end…`. Помилок імпорту чи синтаксису **немає**. Збережи підсумковий рядок.

- [ ] **Step 5 [ЛЮДИНА]: коміт червоного стану**

```bash
git add -A
git commit -m "test(core): 13 replay scenarios from add-core-gameplay spec (red)"
```

---

### Task 2.4: Фізика

**Рівень:** 3. **Files:** Modify: `src/core/physics.ts`. Test: `tests/unit/physics.test.ts`.

**Interfaces:** Produces: `stepPlayer(w, input)`; `PHYS`, `PLAYER_W`, `PLAYER_H` (без змін).

- [ ] **Step 1: тест фізики**

`tests/unit/physics.test.ts`:
```ts
import { describe, expect, test } from "vitest";
import { createWorld } from "../../src/core/world";
import { step } from "../../src/core/step";
import type { InputFrame, World } from "../../src/core/types";
import { IDLE, JUMP, LEFT, RIGHT, level } from "../helpers";

function run(w: World, input: InputFrame, ticks: number): World {
  for (let i = 0; i < ticks; i++) w = step(w, input);
  return w;
}

const FLAT = level(["..........", "..........", "S........G", "##########"]);

describe("physics", () => {
  test("the player stands on the floor: y stays 34, onGround is true", () => {
    const w = run(createWorld(FLAT), IDLE, 10);
    expect(w.player).toMatchObject({ y: 34, vy: 0, onGround: true });
  });

  test("run speed is 2 px per tick", () => {
    const w = run(createWorld(FLAT), RIGHT, 30);
    expect(w.player.x).toBe(62);
  });

  test("the left edge of the level stops the player at x = 0", () => {
    const w = run(createWorld(FLAT), LEFT, 10);
    expect(w.player.x).toBe(0);
  });

  test("a wall stops the player: x = wall left edge - player width", () => {
    const w = run(createWorld(level(["..........", "......#...", "S.....#..G", "##########"])), RIGHT, 60);
    expect(w.player.x).toBe(6 * 16 - 12);
  });

  test("a jump rises 60 px and lands again", () => {
    let w = run(createWorld(FLAT), IDLE, 1);
    let minY = w.player.y;
    w = step(w, JUMP);
    for (let i = 0; i < 40; i++) {
      w = step(w, IDLE);
      minY = Math.min(minY, w.player.y);
    }
    expect(minY).toBe(34 - 60);
    expect(w.player).toMatchObject({ y: 34, onGround: true });
  });

  test("a jump hits the ceiling and does not pass through it", () => {
    let w = run(createWorld(level(["..........", "##########", "..........", "S........G", "##########"])), IDLE, 1);
    let minY = w.player.y;
    w = step(w, JUMP);
    for (let i = 0; i < 20; i++) {
      w = step(w, IDLE);
      minY = Math.min(minY, w.player.y);
    }
    expect(minY).toBe(32);
  });

  test("a fall at max speed lands on a one-tile platform (no tunneling)", () => {
    const tall = level(["S........G", ...Array.from({ length: 9 }, () => ".........."), "#........."]);
    const w = run(createWorld(tall), IDLE, 80);
    expect(w.player).toMatchObject({ y: 10 * 16 - 14, onGround: true });
  });

  test("jump only on press: holding the key does not jump again after landing", () => {
    let w = run(createWorld(FLAT), IDLE, 5);
    w = run(w, JUMP, 60);
    expect(w.player).toMatchObject({ y: 34, onGround: true });
  });

  test("a new press after landing jumps again (control for the test above)", () => {
    let w = run(createWorld(FLAT), IDLE, 5);
    w = run(w, JUMP, 1);
    w = run(w, IDLE, 40);
    w = run(w, JUMP, 1);
    w = run(w, IDLE, 5);
    expect(w.player.onGround).toBe(false);
  });
});
```

  Run: `pnpm test tests/unit/physics.test.ts`
  Expected: FAIL, `8 failed | 1 passed`. Заглушка не рухає гравця, напр. `expected 2 to be 62`. Проходить лише контрольний тест «a new press after landing…»: він очікує `onGround: false`, а заглушка ніколи не ставить `true`. Тому він і контрольний: сам по собі він нічого не доводить.

- [ ] **Step 2: реалізація**

`src/core/physics.ts`:
```ts
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
```

- [ ] **Step 3: перевірка**

  Run: `pnpm test`
  Expected: `physics.test.ts`, `step.test.ts`, `world.test.ts`, `replay.test.ts` (unit) зелені; сценарії `MOVE-*`, `COIN-goal-01`, `SPIKE-01`, `PIT-01` зелені; **`TRAP-*` ще червоні** (5 шт.), бо пастки — заглушка. Підсумок: `Tests  5 failed | 36 passed (41)`.

- [ ] **Step 4 [ЛЮДИНА]: коміт**
```bash
git commit -am "feat(core): player physics with sub-steps and edge-triggered jump"
```

---

### Task 2.5: Пастки, архів зміни A

**Рівень:** 3 (archive — рішення людини). **Files:** Modify: `src/core/traps.ts`. Test: `tests/unit/traps.test.ts`.

- [ ] **Step 1: тест пасток**

`tests/unit/traps.test.ts`:
```ts
import { describe, expect, test } from "vitest";
import { createWorld } from "../../src/core/world";
import { step } from "../../src/core/step";
import type { TrapDef, TrapTrigger } from "../../src/core/types";
import { IDLE, RIGHT, level } from "../helpers";

const FLAT = ["..........", "..........", "S........G", "##########"];
const zoneAtStart: TrapTrigger = { kind: "zone", rect: [0, 0, 2, 4] };
const spikesAt8: TrapDef = { id: "t1", trigger: zoneAtStart, action: { kind: "addSpikes", rect: [8, 2, 1, 1] }, delayTicks: 0 };
const clearAt8: TrapDef = { id: "t2", trigger: zoneAtStart, action: { kind: "removeTiles", rect: [8, 2, 1, 1] }, delayTicks: 0 };

describe("traps", () => {
  test("two traps in one tick run in the order of traps[]", () => {
    const a = step(createWorld(level(FLAT, [spikesAt8, clearAt8])), IDLE);
    expect(a.grid[2][8]).toBe(".");
    const b = step(createWorld(level(FLAT, [clearAt8, spikesAt8])), IDLE);
    expect(b.grid[2][8]).toBe("^");
    expect(a.events.map((e) => e.type)).toEqual(["trapTriggered", "trapTriggered"]);
  });

  test("a delayed action runs delayTicks after the trigger", () => {
    let w = createWorld(level(FLAT, [{ ...spikesAt8, delayTicks: 3 }]));
    w = step(w, IDLE); // tick 0: trigger
    expect(w.grid[2][8]).toBe(".");
    expect(w.pending).toEqual([{ trapIndex: 0, dueTick: 3 }]);
    w = step(w, IDLE); // tick 1
    w = step(w, IDLE); // tick 2
    expect(w.grid[2][8]).toBe(".");
    w = step(w, IDLE); // tick 3: action
    expect(w.grid[2][8]).toBe("^");
    expect(w.pending).toEqual([]);
  });

  test("a trap fires once per attempt", () => {
    let w = createWorld(level(FLAT, [spikesAt8]));
    const fired: number[] = [];
    for (let i = 0; i < 10; i++) {
      w = step(w, IDLE);
      fired.push(w.events.filter((e) => e.type === "trapTriggered").length);
    }
    expect(fired.reduce((a, b) => a + b)).toBe(1);
  });

  test("a coin event triggers a trap in the same tick", () => {
    let w = createWorld(
      level(["..........", "..........", "S..o.....G", "##########"], [
        { id: "bait", trigger: { kind: "event", event: "coinCollected", id: "c3_2" }, action: { kind: "moveGoal", to: [0, 0] }, delayTicks: 0 },
      ]),
    );
    for (let i = 0; i < 18; i++) w = step(w, RIGHT);
    expect(w.events.map((e) => e.type)).toEqual(["coinCollected", "trapTriggered"]);
    expect(w.goal).toEqual({ x: 0, y: 0 });
  });

  test("a new attempt (createWorld) has no pending actions and the original tiles", () => {
    const lvl = level(FLAT, [{ ...spikesAt8, delayTicks: 50 }]);
    let w = createWorld(lvl);
    w = step(w, IDLE);
    expect(w.pending.length).toBe(1);
    const again = createWorld(lvl);
    expect(again.pending).toEqual([]);
    expect(again.triggered).toEqual([]);
    expect(again.grid[2][8]).toBe(".");
  });
});
```

  Run: `pnpm test tests/unit/traps.test.ts`
  Expected: FAIL, `5 failed`.

- [ ] **Step 2: реалізація**

`src/core/traps.ts`:
```ts
import type { TrapAction, TrapTrigger, World } from "./types";
import { overlaps, rectBox } from "./geometry";

export function fireDueActions(w: World): void {
  const due = w.pending.filter((p) => p.dueTick <= w.tick).sort((a, b) => a.trapIndex - b.trapIndex);
  w.pending = w.pending.filter((p) => p.dueTick > w.tick);
  for (const d of due) applyAction(w, w.level.traps[d.trapIndex].action);
}

export function checkTriggers(w: World): void {
  w.level.traps.forEach((t, i) => {
    if (w.triggered.includes(t.id) || !isTriggered(w, t.trigger)) return;
    w.triggered.push(t.id);
    w.events.push({ tick: w.tick, type: "trapTriggered", id: t.id });
    if (t.delayTicks === 0) applyAction(w, t.action);
    else w.pending.push({ trapIndex: i, dueTick: w.tick + t.delayTicks });
  });
}

function isTriggered(w: World, tr: TrapTrigger): boolean {
  if (tr.kind === "zone") return overlaps(w.player, rectBox(tr.rect));
  return w.events.some((e) => e.type === tr.event && "id" in e && e.id === tr.id);
}

export function applyAction(w: World, a: TrapAction): void {
  if (a.kind === "moveGoal") {
    w.goal = { x: a.to[0], y: a.to[1] };
    return;
  }
  const ch = a.kind === "removeTiles" ? "." : "^";
  const [x, y, wd, h] = a.rect;
  for (let ty = y; ty < y + h; ty++)
    for (let tx = x; tx < x + wd; tx++)
      if (ty >= 0 && ty < w.grid.length && tx >= 0 && tx < w.grid[ty].length) w.grid[ty][tx] = ch;
}
```

- [ ] **Step 3: усе зелене**

  Run: `pnpm check`
  Expected: PASS. `Test Files  7 passed (7)`, `Tests  46 passed (46)` (виміряно на коді плану; більше — якщо ти додав тести, головне — 0 failed), `spec:check ok — specs: 0 · active changes: 1 · archived: 0`.

- [ ] **Step 4 [ЛЮДИНА]: коміт**
```bash
git commit -am "feat(core): traps - zone and coin triggers, delays, array order"
```

- [ ] **Step 5: якщо реальність не збіглася зі спекою.** Якщо під час apply сценарій виявився неправильним (наприклад, `MOVE-jump-01` мав інший кадр старту), **спершу зміни спеку** окремим комітом `spec: <що і чому>`, потім тест. Цей коміт — доказ рубрики SDD «місце, де специфікацію змінили, бо реальність не збіглася».

- [ ] **Step 6 [ЛЮДИНА]: archive і Purpose**

```
/opsx:archive
```
  На питання OpenSpec відповідає людина (sync, `design.md`). Після архіву **прочитай `## Purpose`** у `openspec/specs/*/spec.md` і перепиши своїми словами, якщо там `TBD` або загальник.

  Run: `pnpm spec:check`
  Expected: `spec:check ok — specs: <≥1> · active changes: 0 · archived: 1`. Ненульові числа — вимога ДЗ.

- [ ] **Step 7 [ЛЮДИНА]: факт проти бюджету, коміт**
  У `docs/intent.md` під «Зміна A» допиши таблицю план/факт (час, output, $) і **чим виміряно**.
```bash
git add -A
git commit -m "spec: archive add-core-gameplay"
```

---

### Task 2.6: Бюджет і пропозиція зміни B — `add-level-validation`

**Рівень:** 1 до кінця propose.

- [ ] **Step 1 [ЛЮДИНА]: бюджет у `docs/intent.md`** (розділ «Зміна B», ≤ 60 хв, output, $) — **до apply**.

- [ ] **Step 2 [АГЕНТ]: propose**
```
/opsx:propose add-level-validation — a level schema and a validator CLI for Trap Runner levels.
Read docs/design.md sections 5 and 7 and Task 2.7 of docs/plan/stage-2-core.md.
Requirements (English, SHALL/MUST): 15 rows of equal length; allowed tiles . # ^ o S G; exactly one S and one G; unique trap ids; a coin event names an existing coin; trigger and action targets inside the level; a solution file levels/<id>.solution.json exists; the solution run ends with levelComplete, triggers at least one trap and collects at least one coin.
Scenarios = the tests of tests/unit/validate-level.test.ts in Task 2.7, with the exact error texts. Tasks follow Task 2.7, tests first. Do not write code.
```

- [ ] **Step 3 [ЛЮДИНА]: рев'ю, `openspec validate add-level-validation --strict`, коміт**
```bash
git add -A
git commit -m "spec: propose add-level-validation"
```

---

### Task 2.7: Схема рівня і валідатор

**Рівень:** 3. **Files:**
- Create: `levels/level.schema.ts`, `tools/validate-level.ts`
- Test: `tests/unit/validate-level.test.ts`

**Interfaces:**
- Produces: `LevelSchema`, `SolutionSchema`, `asLevelDef(parsed): LevelDef`; `validateLevel(levelJson: unknown, solutionJson: unknown): string[]`; CLI `pnpm validate:levels [file...]` (без аргументів — усі `levels/level-NN.json`).

- [ ] **Step 1 [АГЕНТ]: `/opsx:apply`**

- [ ] **Step 2: заглушка валідатора і тест**

`levels/level.schema.ts` (версія етапу 2):
```ts
import { z } from "zod";
import type { LevelDef } from "../src/core/types";

const Int = z.number().int();
const Rect = z.tuple([Int.min(0), Int.min(0), Int.positive(), Int.positive()]);

const Trigger = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("zone"), rect: Rect }),
  z.object({ kind: z.literal("event"), event: z.enum(["coinCollected"]), id: z.string().min(1) }),
]);

const Action = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("removeTiles"), rect: Rect }),
  z.object({ kind: z.literal("addSpikes"), rect: Rect }),
  z.object({ kind: z.literal("moveGoal"), to: z.tuple([Int.min(0), Int.min(0)]) }),
]);

export const LevelSchema = z
  .object({
    id: z.string().regex(/^level-\d\d$/),
    tiles: z.array(z.string().regex(/^[.#^oSG]+$/)).length(15),
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

`tools/validate-level.ts` (заглушка):
```ts
export function validateLevel(levelJson: unknown, solutionJson: unknown): string[] {
  return [];
}
```

`tests/unit/validate-level.test.ts`:
```ts
import { describe, expect, test } from "vitest";
import { validateLevel } from "../../tools/validate-level";
import { rows15 } from "../helpers";

const trap = { id: "t1", trigger: { kind: "zone", rect: [5, 0, 1, 15] }, action: { kind: "addSpikes", rect: [0, 0, 1, 1] }, delayTicks: 0 };
const valid = { id: "level-90", tiles: rows15(["S..o......G", "###########"]), traps: [trap] };
const solution = { inputs: [{ ticks: 120, right: true }] };
const has = (text: string) => expect.arrayContaining([expect.stringContaining(text)]);

describe("validateLevel", () => {
  test("a valid level with a working solution has no errors", () => {
    expect(validateLevel(valid, solution)).toEqual([]);
  });

  test("the level must have 15 rows", () => {
    expect(validateLevel({ ...valid, tiles: valid.tiles.slice(1) }, solution)).toEqual(has("schema: tiles"));
  });

  test("all rows must have the same length", () => {
    expect(validateLevel({ ...valid, tiles: rows15(["S..o......G", "##########"]) }, solution)).toEqual(has("row 14 has length 10, expected 11"));
  });

  test("exactly one S", () => {
    expect(validateLevel({ ...valid, tiles: rows15(["S..o.S....G", "###########"]) }, solution)).toEqual(has("expected exactly 1 S, found 2"));
  });

  test("an event trigger must name an existing coin", () => {
    const bad = { ...valid, traps: [{ ...trap, trigger: { kind: "event", event: "coinCollected", id: "c9_9" } }] };
    expect(validateLevel(bad, solution)).toEqual(has("coin c9_9 does not exist"));
  });

  test("an action target must be inside the level", () => {
    const bad = { ...valid, traps: [{ ...trap, action: { kind: "addSpikes", rect: [10, 14, 2, 1] } }] };
    expect(validateLevel(bad, solution)).toEqual(has("action target is outside the level"));
  });

  test("the solution must finish the level", () => {
    const deadly = { ...valid, tiles: rows15(["S..o..^...G", "###########"]) };
    expect(validateLevel(deadly, solution)).toEqual(has('ends with status "dead" at tick 42'));
  });

  test("the solution must trigger at least one trap", () => {
    const noTrap = { ...valid, traps: [{ ...trap, trigger: { kind: "zone", rect: [0, 0, 1, 1] } }] };
    expect(validateLevel(noTrap, solution)).toEqual(has("no trap triggers"));
  });

  test("a missing solution file is an error", () => {
    expect(validateLevel(valid, undefined)).toEqual(has("solution: file not found"));
  });
});
```

  Run: `pnpm test tests/unit/validate-level.test.ts`
  Expected: FAIL, `8 failed | 1 passed` (проходить лише «a valid level…»).

- [ ] **Step 3: реалізація**

`tools/validate-level.ts` (версія етапу 2):
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
  const inside = ([x, y, w, h]: Rect) => x + w <= width && y + h <= LEVEL_HEIGHT;

  const trapIds = level.traps.map((t) => t.id);
  if (new Set(trapIds).size !== trapIds.length) errors.push("traps: trap ids must be unique");
  for (const t of level.traps) {
    const tr = t.trigger;
    if (tr.kind === "zone" && !inside(tr.rect)) errors.push(`trap ${t.id}: trigger rect is outside the level`);
    if (tr.kind === "event" && !coinIds.has(tr.id)) errors.push(`trap ${t.id}: coin ${tr.id} does not exist`);
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

```bash
pnpm pkg set "scripts.validate:levels=tsx tools/validate-level.ts" "scripts.check=pnpm typecheck && pnpm boundaries && pnpm test && pnpm validate:levels && pnpm spec:check"
```
  [ЛЮДИНА] додай `"Bash(pnpm validate:levels *)"` і `"Bash(pnpm validate:levels)"` в `allow`.

- [ ] **Step 4: зелений**

  Run: `pnpm check`
  Expected: PASS; `validate-level: 0 levels, 0 failed` (рівнів ще немає: перший з'явиться в Task 5a.3); `Tests  0 failed`.

- [ ] **Step 5 [ЛЮДИНА]: archive, Purpose, факт проти бюджету, тег**
```
/opsx:archive
```
  Run: `pnpm spec:check`. Expected: `archived: 2`.
```bash
git add -A
git commit -m "feat(levels): level schema and validator; spec: archive add-level-validation"
git tag stage-2
```
  autonomy-log: рядки для зміни A і B (рівень 3 → факт). Чесно запиши, де агент виходив за межі зміни або пропонував неправильне. Онови `docs/session-notes.md`.
