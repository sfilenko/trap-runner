# Етап 5a · Ігрова оболонка і перший рівень

**Рівень довіри:** 2 (агент править файли сам, команди з дозволу). **Бюджет:** ≈2.5 год.
**Результат етапу:** гра в браузері: рух, камера, HUD, перезапуск після смерті, перехід між рівнями, екран перемоги. `levels/level-01.json` спроєктувала людина і записала розв'язок клавішею `R`. Агент бачить гру через Playwright MCP (динамічний контекст).

Перед етапом прочитай: `docs/design.md` §4, §6.

---

### Task 5a.1: Клавіатура, камера, сесія

**Files:**
- Create: `src/input/keyboard.ts`, `src/render/camera.ts`, `src/core/session.ts`
- Test: `tests/unit/shell.test.ts`

**Interfaces:**
- Produces: `toInput(held: ReadonlySet<string>): InputFrame`; `attachKeyboard(target: EventTarget): { read(): InputFrame; dispose(): void }`; `cameraX(playerCenterX, viewW, levelW): number`; `Session`, `newSession()`, `applyOutcome(s, w, levelCount): Session`.

- [ ] **Step 1: тест**

`tests/unit/shell.test.ts`:
```ts
import { describe, expect, test } from "vitest";
import { attachKeyboard, toInput } from "../../src/input/keyboard";
import { cameraX } from "../../src/render/camera";
import { applyOutcome, newSession } from "../../src/core/session";
import { createWorld } from "../../src/core/world";
import { level } from "../helpers";

const key = (type: string, code: string) => Object.assign(new Event(type, { cancelable: true }), { code });

describe("keyboard", () => {
  test("maps arrows, WASD and Space to the input frame", () => {
    expect(toInput(new Set(["KeyA", "Space"]))).toEqual({ left: true, right: false, jump: true });
    expect(toInput(new Set(["ArrowRight", "KeyX"]))).toEqual({ left: false, right: true, jump: false });
  });

  test("a key stays held until keyup", () => {
    const t = new EventTarget();
    const kb = attachKeyboard(t);
    t.dispatchEvent(key("keydown", "ArrowRight"));
    expect(kb.read().right).toBe(true);
    t.dispatchEvent(key("keyup", "ArrowRight"));
    expect(kb.read().right).toBe(false);
  });

  test("losing focus (blur) releases all keys", () => {
    const t = new EventTarget();
    const kb = attachKeyboard(t);
    t.dispatchEvent(key("keydown", "ArrowRight"));
    t.dispatchEvent(new Event("blur"));
    expect(kb.read()).toEqual({ left: false, right: false, jump: false });
  });
});

describe("cameraX", () => {
  test("stays at 0 near the start", () => expect(cameraX(8, 320, 1600)).toBe(0));
  test("centers the player in the middle of the level", () => expect(cameraX(800, 320, 1600)).toBe(640));
  test("stops at the right edge of the level", () => expect(cameraX(1590, 320, 1600)).toBe(1280));
  test("a level narrower than the view stays at 0", () => expect(cameraX(100, 320, 200)).toBe(0));
});

describe("session", () => {
  const lvl = level(["..........", "..o.......", "S........G", "##########"]);

  test("a death adds 1 death and keeps the level", () => {
    const s = applyOutcome(newSession(), { ...createWorld(lvl), status: "dead" }, 3);
    expect(s).toEqual({ levelIndex: 0, deaths: 1, score: 0, finished: false });
  });

  test("a completed level adds its coins and goes to the next level", () => {
    const w = { ...createWorld(lvl), status: "complete" as const, collected: ["c2_1"] };
    expect(applyOutcome(newSession(), w, 3)).toEqual({ levelIndex: 1, deaths: 0, score: 1, finished: false });
  });

  test("completing the last level finishes the session", () => {
    const w = { ...createWorld(lvl), status: "complete" as const };
    const s = applyOutcome({ levelIndex: 2, deaths: 4, score: 5, finished: false }, w, 3);
    expect(s).toEqual({ levelIndex: 2, deaths: 4, score: 5, finished: true });
  });

  test("a World that still plays changes nothing", () => {
    const s = newSession();
    expect(applyOutcome(s, createWorld(lvl), 3)).toBe(s);
  });
});
```

- [ ] **Step 2: заглушки з правильними сигнатурами → червоний**

```ts
// src/input/keyboard.ts (stub)
import type { InputFrame } from "../core/types";
export function toInput(held: ReadonlySet<string>): InputFrame {
  return { left: false, right: false, jump: false };
}
export function attachKeyboard(target: EventTarget): { read(): InputFrame; dispose(): void } {
  return { read: () => ({ left: false, right: false, jump: false }), dispose: () => {} };
}
```
```ts
// src/render/camera.ts (stub)
export function cameraX(playerCenterX: number, viewW: number, levelW: number): number {
  return 0;
}
```
```ts
// src/core/session.ts (stub)
import type { World } from "./types";
export interface Session { levelIndex: number; deaths: number; score: number; finished: boolean }
export function newSession(): Session {
  return { levelIndex: 0, deaths: 0, score: 0, finished: false };
}
export function applyOutcome(s: Session, w: World, levelCount: number): Session {
  return s;
}
```
  Run: `pnpm test tests/unit/shell.test.ts`
  Expected: FAIL (через значення, не через import). Коміт червоного стану.

- [ ] **Step 3: реалізація**

`src/input/keyboard.ts`:
```ts
import type { InputFrame } from "../core/types";

const KEYMAP: Record<string, keyof InputFrame> = {
  ArrowLeft: "left",
  KeyA: "left",
  ArrowRight: "right",
  KeyD: "right",
  ArrowUp: "jump",
  KeyW: "jump",
  Space: "jump",
};

export function toInput(held: ReadonlySet<string>): InputFrame {
  const f: InputFrame = { left: false, right: false, jump: false };
  for (const code of held) {
    const k = KEYMAP[code];
    if (k) f[k] = true;
  }
  return f;
}

// When the window loses focus, all keys count as released. Without this, a key stays "held" forever.
export function attachKeyboard(target: EventTarget): { read(): InputFrame; dispose(): void } {
  const held = new Set<string>();
  const onDown = (e: Event) => {
    const code = (e as KeyboardEvent).code;
    if (KEYMAP[code]) e.preventDefault();
    held.add(code);
  };
  const onUp = (e: Event) => held.delete((e as KeyboardEvent).code);
  const onBlur = () => held.clear();
  target.addEventListener("keydown", onDown);
  target.addEventListener("keyup", onUp);
  target.addEventListener("blur", onBlur);
  return {
    read: () => toInput(held),
    dispose: () => {
      target.removeEventListener("keydown", onDown);
      target.removeEventListener("keyup", onUp);
      target.removeEventListener("blur", onBlur);
    },
  };
}
```

`src/render/camera.ts`:
```ts
// Left edge of the view in px. The view follows the player and stays inside the level.
export function cameraX(playerCenterX: number, viewW: number, levelW: number): number {
  if (levelW <= viewW) return 0;
  return Math.round(Math.min(Math.max(playerCenterX - viewW / 2, 0), levelW - viewW));
}
```

`src/core/session.ts`:
```ts
import type { World } from "./types";

export interface Session {
  levelIndex: number;
  deaths: number;
  score: number;
  finished: boolean;
}

export function newSession(): Session {
  return { levelIndex: 0, deaths: 0, score: 0, finished: false };
}

// Death: +1 death, same level. Complete: add the level's coins to the score, go to the next level.
export function applyOutcome(s: Session, w: World, levelCount: number): Session {
  if (w.status === "dead") return { ...s, deaths: s.deaths + 1 };
  if (w.status !== "complete") return s;
  const next = s.levelIndex + 1;
  return {
    levelIndex: Math.min(next, levelCount - 1),
    deaths: s.deaths,
    score: s.score + w.collected.length,
    finished: next >= levelCount,
  };
}
```

- [ ] **Step 4: зелений, коміт**

  Run: `pnpm check`. Expected: PASS, 0 failed.
```bash
git commit -am "feat: keyboard with blur release, camera, session"
```

---

### Task 5a.2: Рендер і ігровий цикл

**Files:** Create: `src/render/draw.ts`. Modify (повна заміна): `src/main.ts`.

**Interfaces:**
- Consumes: `createWorld`, `step`, `applyOutcome`, `compressInputs`, `advanceClock`, `attachKeyboard`, `cameraX`.
- Produces: `draw(ctx, world, session)`; у dev — `window.__game` з `world`, `session`, `recording` (лише читання; для e2e і MCP); клавіша `R` у dev — запис розв'язку.

- [ ] **Step 1: `src/render/draw.ts`**
```ts
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
```

- [ ] **Step 2: `src/main.ts`**
```ts
import { createWorld } from "./core/world";
import { step } from "./core/step";
import { applyOutcome, newSession, type Session } from "./core/session";
import { compressInputs } from "./core/replay";
import type { InputFrame, LevelDef, World } from "./core/types";
import { advanceClock } from "./clock";
import { attachKeyboard } from "./input/keyboard";
import { draw } from "./render/draw";

const modules = import.meta.glob<LevelDef>("../levels/level-*.json", { eager: true, import: "default" });
const levels = Object.entries(modules)
  .filter(([path]) => /level-\d\d\.json$/.test(path))
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([, level]) => level);
if (levels.length === 0) throw new Error("No levels found. Add levels/level-01.json.");

const canvas = document.querySelector<HTMLCanvasElement>("#game");
const ctx = canvas?.getContext("2d");
if (!canvas || !ctx) throw new Error("Canvas #game not found.");

const keyboard = attachKeyboard(window);
let session: Session = newSession();
let world: World = createWorld(levels[0]);
let recording: InputFrame[] | null = null;
let acc = 0;
let last = performance.now();

function download(name: string, data: unknown): void {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2) + "\n"], { type: "application/json" }));
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

const solutionName = (index: number) => `level-${String(index + 1).padStart(2, "0")}.solution.json`;

// Dev only: R starts a recording from a fresh attempt. The level end saves the solution file.
if (import.meta.env.DEV) {
  window.addEventListener("keydown", (e) => {
    if (e.code !== "KeyR" || session.finished) return;
    recording = [];
    world = createWorld(levels[session.levelIndex]);
    console.info(`[rec] recording ${solutionName(session.levelIndex)}`);
  });
  Object.defineProperty(window, "__game", {
    value: {
      get world() {
        return world;
      },
      get session() {
        return session;
      },
      get recording() {
        return recording !== null;
      },
    },
  });
}

function frame(now: number): void {
  const clock = advanceClock(acc, now - last);
  acc = clock.accMs;
  last = now;
  for (let i = 0; i < clock.ticks && !session.finished; i++) {
    const input = keyboard.read();
    recording?.push(input);
    world = step(world, input);
    if (world.status === "playing") continue;
    const finishedIndex = session.levelIndex;
    const outcome = world.status;
    session = applyOutcome(session, world, levels.length);
    if (recording) {
      if (outcome === "complete") {
        download(solutionName(finishedIndex), { inputs: compressInputs(recording) });
        recording = null;
      } else {
        recording = [];
      }
    }
    if (!session.finished) world = createWorld(levels[session.levelIndex]);
  }
  draw(ctx!, world, session);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
```

  Run: `pnpm typecheck && pnpm boundaries`
  Expected: обидва без помилок. `main.ts` і `draw.ts` лежать поза `src/core`, тому `window` і `document` там дозволені.

- [ ] **Step 3: коміт**
```bash
git add -A
git commit -m "feat: canvas renderer, fixed-step game loop, dev recorder and window.__game"
```

---

### Task 5a.3: Перший рівень і «відчуття» керування — рішення людини

**Рівень:** 1 (людина). Записати в autonomy-log як **зниження рівня**: «відчуття» і складність тест не ловить. **Files:** Create: `levels/level-01.json`, `levels/level-01.solution.json`.

- [ ] **Step 1 [ЛЮДИНА]: спроєктуй `level-01.json`** за §5 дизайну: 15 рядків, ширина 40–60, щонайменше 1 монета, 1–2 пастки. **Праворуч від `S` залиш щонайменше 6 вільних тайлів підлоги**: e2e-тест (Task 5b.1) тримає «вправо» 0.5 с і чекає, що гравець зрушить і не загине.

- [ ] **Step 2 [ЛЮДИНА]: зіграй.** `pnpm dev`. Без файлу розв'язку гра працює, а валідатор поки скаже FAIL.

- [ ] **Step 3 [ЛЮДИНА]: «відчуття» стрибка (≤ 1 год).** Якщо `PHYS` треба змінити, це **твоє рішення**. Після зміни запусти `pnpm test`: червоні replay і unit-тести з точними числами (x = 62, тік 41 тощо) — очікувані. Перерахуй oracle вручну для двох чисел, виправ тести окремим комітом `test: re-derive numbers after PHYS change` і запиши причину в autonomy-log.

- [ ] **Step 4 [ЛЮДИНА]: запис розв'язку.** У грі натисни `R` (почнеться нова спроба із записом) і пройди рівень. Браузер збереже `level-01.solution.json`. Перенеси його в `levels/`.

  Run: `pnpm validate:levels`
  Expected: `PASS level-01.json`, `validate-level: 1 levels, 0 failed`.

- [ ] **Step 5 [ЛЮДИНА]: коміт**
```bash
git add levels/
git commit -m "feat(levels): level-01 designed and solved by the human"
```

---

### Task 5a.4: Playwright MCP — агент бачить гру

**Рівень:** 1 для `.mcp.json` (конфіг), 2 для використання. **Files:** Create: `.mcp.json`. Modify: `.claude/settings.json` (людина).

- [ ] **Step 1 [ЛЮДИНА]: версія і конфіг.**

  Run: `npm view @playwright/mcp version` → впиши цю версію замість `<VERSION>` (pin).

`.mcp.json`:
```json
{
  "mcpServers": {
    "playwright": {
      "command": "cmd",
      "args": ["/c", "npx", "-y", "@playwright/mcp@<VERSION>"]
    }
  }
}
```
  У `.claude/settings.json` додай `"enabledMcpjsonServers": ["playwright"]`. Секретів тут немає. Якщо колись з'являться — лише `${VAR}` (курс, день 01 §15).

- [ ] **Step 2 [ЛЮДИНА]: доказ, що MCP справді використано** (курс: три перевірки).
  1. `/mcp` у сесії показує `playwright` (проєктний).
  2. Запусти `pnpm dev` в окремому терміналі. Промпт агенту:
     ```
     Open http://localhost:5173 with the Playwright MCP tools. Read window.__game.world.player and window.__game.session. Take one screenshot. Report the player x and y and the level number.
     ```
     Відповідь має містити числа, які знає лише запущена гра (x = 2, y = 210 на старті рівня 01, якщо `S` стоїть у рядку 13).
  3. Run: `grep '"tool":"mcp__playwright' .agent-log/actions.jsonl | tail -n 3`. Expected: рядки виклику MCP. Це доказ **динамічного контексту** для PR.

- [ ] **Step 3 [ЛЮДИНА]: коміт, тег**
```bash
git add .mcp.json .claude/settings.json .agent-log
git commit -m "chore: project Playwright MCP (pinned) for live game state"
git tag stage-5a
```
