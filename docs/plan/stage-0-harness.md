# Етап 0 · Інструменти, каркас, харнес

**День курсу:** 01 (харнес рівня 1). **Рівень довіри:** 1 — агент пропонує, людина вирішує кожну дію. **Бюджет:** ≈2.5 год.
**Результат етапу:** гра-заглушка відкривається в браузері; `pnpm check` зелений, і ми **бачили його червоним**; hooks перевірені без агента; один заблокований крок агента записаний у журнал.

Перед етапом прочитай: `docs/design.md` §3, §4, §8; `docs/plan/README.md` (глобальні обмеження).

---

### Task 0.1: Інструменти і каркас + перший червоний гейт

**Рівень:** 1 (людина запускає кожну команду). **Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `.gitignore`, `.gitattributes`, `src/main.ts`, `src/clock.ts`
- Test: `tests/unit/clock.test.ts`

**Interfaces:**
- Produces: `advanceClock(accMs: number, frameMs: number): { ticks: number; accMs: number }`, `TICKS_PER_SECOND = 60`, `MAX_FRAME_MS = 250` (використовує `src/main.ts` у Task 5a.2).

- [ ] **Step 1 [ЛЮДИНА]: Node ≥ 22.12.** Зараз на машині стоїть `v22.3.0`, а з ним Vitest 5 не стартує. Встанови Node 24 LTS (`winget install OpenJS.NodeJS.LTS` або інсталятор з nodejs.org), відкрий новий термінал.

  Run: `node -v`
  Expected: `v24.x` (або ≥ `v22.12.0`)

- [ ] **Step 2 [ЛЮДИНА]: pnpm через corepack.**

  Run: `corepack enable` (якщо EPERM — термінал від адміністратора, або `npm i -g pnpm`)
  Run: `pnpm -v`
  Expected: номер версії, без помилки

- [ ] **Step 3: `package.json`**

```json
{
  "name": "trap-runner",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "check": "pnpm typecheck && pnpm test"
  }
}
```

- [ ] **Step 4 [ЛЮДИНА]: залежності.** Залежності — завжди рівень 1 (курс, шаблон autonomy-log).

  Run: `corepack use pnpm@latest` (додає поле `packageManager`)
  Run: `pnpm add -D typescript vite vitest tsx zod @types/node`
  Expected: `package.json` має `devDependencies` і `packageManager`. Запиши версії в autonomy-log (стовпець «Докази»).

- [ ] **Step 5: конфіги**

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "strict": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "skipLibCheck": true,
    "types": ["vite/client", "node"]
  },
  "include": ["src", "tests", "tools", "levels", "vite.config.ts"]
}
```

`vite.config.ts`:
```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { include: ["tests/**/*.test.ts"], environment: "node" },
});
```

`.gitignore`:
```gitignore
node_modules/
dist/
coverage/
test-results/
playwright-report/
*.tsbuildinfo
.env*
!.env.example
.claude/settings.local.json
CLAUDE.local.md
.playwright-mcp/
```

`.gitattributes` (як у демо дня 01):
```gitattributes
* text=auto eol=lf
*.png binary
*.jpg binary
```

`index.html`:
```html
<!doctype html>
<html lang="uk">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Trap Runner</title>
    <!-- Empty icon: without it the browser requests /favicon.ico, gets 404, and the e2e "clean console" check fails. -->
    <link rel="icon" href="data:," />
    <style>
      html, body { margin: 0; background: #111; color: #eee; font: 14px system-ui; }
      canvas { display: block; margin: 24px auto; width: 960px; height: 720px; image-rendering: pixelated; }
    </style>
  </head>
  <body>
    <canvas id="game" width="320" height="240"></canvas>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

`src/main.ts` (тимчасова заглушка; повна версія — Task 5a.2):
```ts
const canvas = document.querySelector<HTMLCanvasElement>("#game");
const ctx = canvas?.getContext("2d");
if (ctx) {
  ctx.fillStyle = "#f0f0f0";
  ctx.font = "16px monospace";
  ctx.fillText("Trap Runner", 100, 120);
}
```

- [ ] **Step 6: заглушка годинника і тест (червоний через поведінку)**

`src/clock.ts` (заглушка):
```ts
// Fixed-step clock: 60 ticks per second. A long frame (a hidden tab) counts as at most MAX_FRAME_MS.
export const TICKS_PER_SECOND = 60;
export const MAX_FRAME_MS = 250;

export function advanceClock(accMs: number, frameMs: number): { ticks: number; accMs: number } {
  return { ticks: 0, accMs: 0 };
}
```

`tests/unit/clock.test.ts`:
```ts
import { describe, expect, test } from "vitest";
import { advanceClock } from "../../src/clock";

describe("advanceClock", () => {
  test("one 60 Hz frame gives one tick", () => {
    const r = advanceClock(0, 1000 / 60);
    expect(r.ticks).toBe(1);
    expect(r.accMs).toBeCloseTo(0, 6);
  });

  test("a short frame accumulates until it reaches a tick", () => {
    const a = advanceClock(0, 10);
    expect(a.ticks).toBe(0);
    const b = advanceClock(a.accMs, 10);
    expect(b.ticks).toBe(1);
    expect(b.accMs).toBeCloseTo(20 - 1000 / 60, 6);
  });

  test("a long frame (hidden tab) counts as 250 ms = 15 ticks, not 300 ticks", () => {
    expect(advanceClock(0, 5000)).toEqual({ ticks: 15, accMs: 0 });
  });

  test("a negative frame time gives zero ticks", () => {
    expect(advanceClock(0, -5)).toEqual({ ticks: 0, accMs: 0 });
  });
});
```

- [ ] **Step 7: побачити гейт червоним**

  Run: `pnpm check`
  Expected: FAIL, `Tests  3 failed | 1 passed (4)`. Збережи цей рядок: це доказ «гейт бачили червоним».

- [ ] **Step 8 [ЛЮДИНА]: коміт червоного тесту**

```bash
git add -A
git commit -m "test: clock tests for fixed 60 Hz step (red)"
```

- [ ] **Step 9: реалізація**

`src/clock.ts`:
```ts
// Fixed-step clock: 60 ticks per second. A long frame (a hidden tab) counts as at most MAX_FRAME_MS.
export const TICKS_PER_SECOND = 60;
export const MAX_FRAME_MS = 250;

export function advanceClock(accMs: number, frameMs: number): { ticks: number; accMs: number } {
  const total = accMs + Math.min(Math.max(frameMs, 0), MAX_FRAME_MS);
  const ticks = Math.floor((total * TICKS_PER_SECOND) / 1000 + 1e-9);
  return { ticks, accMs: Math.max(0, total - (ticks * 1000) / TICKS_PER_SECOND) };
}
```

- [ ] **Step 10: зелений гейт**

  Run: `pnpm check`
  Expected: PASS, `Tests  4 passed (4)`

- [ ] **Step 11 [ЛЮДИНА]: ручна перевірка і коміт**

  Run: `pnpm dev`, відкрий `http://localhost:5173`. Expected: на темному фоні текст «Trap Runner».
```bash
git add -A
git commit -m "feat: fixed-step clock with 250 ms frame clamp"
```

---

### Task 0.2: Харнес — журнал дій, `guard-core`, перевірка без агента

**Рівень:** 1. Це **контрольний шар**: людина переносить файли і читає кожен рядок. **Files:**
- Create (з демо дня 01): `.claude/hooks/log-action.mjs`, `scripts/agent-log-summary.mjs`, `.agent-log/README.md`
- Create: `scripts/hooks-selftest.mjs`, `scripts/check-boundaries.mjs`, `.claude/hooks/guard-core.mjs`, `.claude/settings.json`

**Interfaces:**
- Produces: `findViolations(text: string): {rule, line, text}[]`, `isCorePath(path: string): boolean`, `BANS` (з `scripts/check-boundaries.mjs`); `pnpm boundaries`, `pnpm hooks:selftest`, `pnpm agent:log`; файли журналу `.agent-log/actions.jsonl`, `.agent-log/blocked.jsonl`.

- [ ] **Step 1 [ЛЮДИНА]: зафіксувати версію демо і скопіювати файли курсу**

```bash
git ls-remote https://github.com/koldovsky/2026-agentic-engineering-crash-course-day01 HEAD
B=https://raw.githubusercontent.com/koldovsky/2026-agentic-engineering-crash-course-day01/HEAD
mkdir -p .claude/hooks scripts .agent-log
curl -s -o .claude/hooks/log-action.mjs  $B/.claude/hooks/log-action.mjs
curl -s -o scripts/agent-log-summary.mjs $B/scripts/agent-log-summary.mjs
curl -s -o .agent-log/README.md          $B/.agent-log/README.md
```
  Запиши SHA з першої команди в autonomy-log: це «pin» чужого коду. Прочитай обидва `.mjs` до кінця (курс: чужий скрипт = чужий код із правами агента).

- [ ] **Step 2: selftest спершу (червоний)**

`scripts/hooks-selftest.mjs` — **створи через Write або в редакторі, не heredoc** (у файлі є `\\`):
```js
#!/usr/bin/env node
// Self-test for the Claude Code hooks in .claude/hooks/ and for the boundary gate. No agent needed.
// Based on scripts/hooks-selftest.mjs from the course demo (day01). Changes: protect-env checks are replaced
// by guard-core and check-boundaries checks.
//   1. guard-core.mjs blocks banned tokens in src/core (exit 2), allows clean core edits and non-core edits (exit 0)
//   2. guard-core.mjs writes one line per block to .agent-log/blocked.jsonl
//   3. check-boundaries.mjs exits 0 on clean src/core and 1 on a banned token
//   4. log-action.mjs appends one JSON line per event (PreToolUse = proposed, Post* = executed)
//   5. a PreToolUse line without a Post line for the same id is reported as "proposed but not executed"
// Usage: pnpm hooks:selftest
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const here = process.cwd();
const tmp = mkdtempSync(join(tmpdir(), "hooks-selftest-"));
const env = { ...process.env, CLAUDE_PROJECT_DIR: tmp };
const run = (script, payload) =>
  spawnSync(process.execPath, [join(here, ".claude", "hooks", script)], { input: JSON.stringify(payload), env, encoding: "utf8" });

let failed = 0;
const check = (name, ok, extra = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? "  " + extra : ""}`);
  if (!ok) failed++;
};

const base = { session_id: "selftest-0001", cwd: tmp, permission_mode: "default" };

// 1. guard-core
for (const [name, tool, input, expect] of [
  ["Write core with Math.random", "Write", { file_path: join(tmp, "src", "core", "world.ts"), content: "export const r = Math.random();" }, 2],
  ["Edit core with Date", "Edit", { file_path: join(tmp, "src", "core", "step.ts"), old_string: "a", new_string: "const t = Date.now();" }, 2],
  ["Edit core importing render", "Edit", { file_path: join(tmp, "src", "core", "step.ts"), old_string: "a", new_string: 'import { draw } from "../render/draw";' }, 2],
  ["MultiEdit core with document", "MultiEdit", { file_path: join(tmp, "src", "core", "a.ts"), edits: [{ old_string: "a", new_string: "document.body" }] }, 2],
  ["Write clean core", "Write", { file_path: join(tmp, "src", "core", "geometry.ts"), content: "export const TILE = 16;" }, 0],
  ["Write render with window", "Write", { file_path: join(tmp, "src", "render", "draw.ts"), content: "window.x = 1;" }, 0],
]) {
  const r = run("guard-core.mjs", { ...base, hook_event_name: "PreToolUse", tool_use_id: `g-${name}`, tool_name: tool, tool_input: input });
  check(`guard-core ${name} -> exit ${expect}`, r.status === expect, r.status === 2 ? r.stderr.trim().slice(0, 60) : "");
}

// 2. blocked log
const blocked = readFileSync(join(tmp, ".agent-log", "blocked.jsonl"), "utf8").trim().split("\n").map((l) => JSON.parse(l));
check("guard-core wrote 4 blocked lines", blocked.length === 4, String(blocked.length));
check("blocked line names the rule and the repo-relative path", blocked[0].rules.includes("no-math-random") && blocked[0].path === "src/core/world.ts");

// 3. boundary gate
const gate = () => spawnSync(process.execPath, [join(here, "scripts", "check-boundaries.mjs")], { cwd: tmp, encoding: "utf8" });
mkdirSync(join(tmp, "src", "core"), { recursive: true });
writeFileSync(join(tmp, "src", "core", "ok.ts"), "export const a = 1;\n");
check("check-boundaries clean src/core -> exit 0", gate().status === 0);
writeFileSync(join(tmp, "src", "core", "bad.ts"), "export const r = Math.random();\n");
const red = gate();
check("check-boundaries Math.random -> exit 1", red.status === 1, red.stderr.trim());

// 4. logger: a proposed+executed Bash, a proposed+executed Edit, a proposed+failed Bash, a proposed-only Edit (blocked)
const events = [
  { ...base, hook_event_name: "PreToolUse", tool_use_id: "t1", tool_name: "Bash", tool_input: { command: "pnpm check" } },
  { ...base, hook_event_name: "PostToolUse", tool_use_id: "t1", tool_name: "Bash", tool_input: { command: "pnpm check" }, tool_response: { stdout: "ok" }, duration_ms: 4200 },
  { ...base, hook_event_name: "PreToolUse", tool_use_id: "t2", tool_name: "Edit", tool_input: { file_path: join(tmp, "src", "render", "draw.ts") } },
  { ...base, hook_event_name: "PostToolUse", tool_use_id: "t2", tool_name: "Edit", tool_input: { file_path: join(tmp, "src", "render", "draw.ts") }, duration_ms: 15 },
  { ...base, hook_event_name: "PreToolUse", tool_use_id: "t3", tool_name: "Bash", tool_input: { command: "pnpm typecheck" } },
  { ...base, hook_event_name: "PostToolUseFailure", tool_use_id: "t3", tool_name: "Bash", tool_input: { command: "pnpm typecheck" }, error: "Exit code 2\nerror TS2339", duration_ms: 900 },
  { ...base, hook_event_name: "PreToolUse", tool_use_id: "t4", tool_name: "Edit", tool_input: { file_path: join(tmp, "src", "core", "world.ts") } },
];
for (const e of events) {
  const r = run("log-action.mjs", e);
  check(`log-action ${e.hook_event_name} ${e.tool_name} exits 0 silently`, r.status === 0 && r.stdout === "");
}
const lines = readFileSync(join(tmp, ".agent-log", "actions.jsonl"), "utf8").trim().split("\n").map((l) => JSON.parse(l));
check("log has 7 lines", lines.length === 7);
check("PreToolUse line has no exit field", lines[0].event === "PreToolUse" && !("exit" in lines[0]) && lines[0].id === "t1");
check("PostToolUse Bash keeps cmd and exit 0", lines[1].cmd === "pnpm check" && lines[1].exit === 0 && lines[1].ms === 4200);
check("Edit line stores repo-relative path", lines[3].path === "src/render/draw.ts", lines[3].path);
check("failure line carries exit code 2", lines[5].exit === 2);

// 5. summary pairs Pre/Post by id
const summary = spawnSync(process.execPath, [join(here, "scripts", "agent-log-summary.mjs"), join(tmp, ".agent-log", "actions.jsonl")], { encoding: "utf8" });
check("agent-log-summary reports 1 proposed but not executed", summary.status === 0 && /1 proposed but not executed/.test(summary.stdout));

rmSync(tmp, { recursive: true, force: true });
console.log(failed ? `\n${failed} check(s) failed` : "\nall hook checks passed");
process.exit(failed ? 1 : 0);
```

  Run: `node scripts/hooks-selftest.mjs`
  Expected: FAIL. `guard-core ... -> exit 2` дає `FAIL`, далі падіння `ENOENT ... blocked.jsonl`, бо `guard-core.mjs` і `check-boundaries.mjs` ще не існують.

- [ ] **Step 3 [РЕВ'Ю]: заборони для core — одне джерело**

`scripts/check-boundaries.mjs`:
```js
#!/usr/bin/env node
// Bans for src/core (pure, deterministic game logic). This is the ONLY copy of the list.
// Used by `pnpm check` (scans src/core) and by the guard-core hook (checks one agent edit).
// Usage: node scripts/check-boundaries.mjs
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { pathToFileURL } from "node:url";

export const BANS = [
  { rule: "no-window", re: /\bwindow\b/ },
  { rule: "no-document", re: /\bdocument\b/ },
  { rule: "no-math-random", re: /\bMath\.random\b/ },
  { rule: "no-date", re: /\bDate\b/ },
  { rule: "no-render-or-input-import", re: /from\s+["'][^"']*\/(render|input)\// },
];

export function findViolations(text) {
  const out = [];
  String(text)
    .split(/\r?\n/)
    .forEach((line, i) => {
      for (const b of BANS) if (b.re.test(line)) out.push({ rule: b.rule, line: i + 1, text: line.trim() });
    });
  return out;
}

export const isCorePath = (p) => /(^|\/)src\/core\//.test(String(p).replace(/\\/g, "/"));

function walk(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const files = walk(join("src", "core")).filter((f) => f.endsWith(".ts"));
  let count = 0;
  for (const f of files) {
    for (const v of findViolations(readFileSync(f, "utf8"))) {
      console.error(`${relative(".", f).replace(/\\/g, "/")}:${v.line} ${v.rule}: ${v.text}`);
      count++;
    }
  }
  console.log(`check-boundaries: ${files.length} files in src/core, ${count} violations`);
  process.exit(count ? 1 : 0);
}
```

- [ ] **Step 4 [РЕВ'Ю]: hook `guard-core`**

`.claude/hooks/guard-core.mjs`:
```js
#!/usr/bin/env node
// Claude Code PreToolUse hook (matcher: Edit|Write|MultiEdit).
// Blocks an agent edit that puts a banned token into src/core. The list of bans: scripts/check-boundaries.mjs.
// On a block: appends one line to .agent-log/blocked.jsonl, writes the reason to stderr, exits 2.
// Exit 2 blocks the tool call, and Claude receives stderr as the reason.
// In all other cases, and on any error in this hook: exit 0.
import { appendFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

let raw = "";
process.stdin.setEncoding("utf8");
for await (const chunk of process.stdin) raw += chunk;

let ev = {};
try {
  ev = JSON.parse(raw || "{}");
} catch {
  process.exit(0);
}

let lib;
try {
  lib = await import(new URL("../../scripts/check-boundaries.mjs", import.meta.url).href);
} catch {
  process.exit(0);
}

const ti = ev.tool_input ?? {};
const path = String(ti.file_path ?? "").replace(/\\/g, "/");
if (!lib.isCorePath(path)) process.exit(0);

const texts = [ti.content, ti.new_string, ...(Array.isArray(ti.edits) ? ti.edits.map((e) => e.new_string) : [])];
const violations = texts.filter((t) => typeof t === "string").flatMap((t) => lib.findViolations(t));
if (violations.length === 0) process.exit(0);

const rules = [...new Set(violations.map((v) => v.rule))];
const rel = path.replace(/^.*?(src\/core\/)/, "$1");
const root = process.env.CLAUDE_PROJECT_DIR || ev.cwd || process.cwd();
const entry = {
  ts: new Date().toISOString(),
  id: ev.tool_use_id,
  session: String(ev.session_id ?? "").slice(0, 8),
  tool: ev.tool_name,
  path: rel,
  blocked: true,
  by: "guard-core",
  rules,
};
try {
  mkdirSync(join(root, ".agent-log"), { recursive: true });
  appendFileSync(join(root, ".agent-log", "blocked.jsonl"), JSON.stringify(entry) + "\n");
} catch {
  /* the block must work even if the log fails */
}
process.stderr.write(
  `guard-core: Blocked the edit of ${rel}. Code in src/core must not use window, document, Math.random or Date, and must not import from render/ or input/. Broken rules: ${rules.join(", ")}. Read AGENTS.md.\n`,
);
process.exit(2);
```

- [ ] **Step 5: скрипти в `package.json`**

```bash
pnpm pkg set "scripts.boundaries=node scripts/check-boundaries.mjs" "scripts.hooks:selftest=node scripts/hooks-selftest.mjs" "scripts.agent:log=node scripts/agent-log-summary.mjs" "scripts.check=pnpm typecheck && pnpm boundaries && pnpm test"
```

- [ ] **Step 6: selftest зелений**

  Run: `pnpm hooks:selftest`
  Expected: 23 рядки `PASS`, останній рядок `all hook checks passed`, exit 0.

  Run: `pnpm check`
  Expected: `check-boundaries: 0 files in src/core, 0 violations`, потім `Tests  4 passed (4)`.

- [ ] **Step 7 [ЛЮДИНА]: `.claude/settings.json`** (рівень 1: правила дозволів пише людина)

```json
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
  "permissions": {
    "defaultMode": "default",
    "allow": [
      "Read",
      "Bash(pnpm check)",
      "Bash(pnpm test)",
      "Bash(pnpm test *)",
      "Bash(pnpm typecheck)",
      "Bash(pnpm boundaries)",
      "Bash(pnpm hooks:selftest)",
      "Bash(pnpm agent:log)",
      "Bash(pnpm agent:log *)",
      "Bash(git status *)",
      "Bash(git diff *)",
      "Bash(git log *)"
    ],
    "ask": ["Bash(pnpm add *)", "Bash(pnpm install *)", "Bash(git commit *)"],
    "deny": [
      "Read(./.env)",
      "Read(./.env.*)",
      "Edit(./.env)",
      "Edit(./.env.*)",
      "Bash(rm -rf *)",
      "Bash(git push *)"
    ]
  },
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write|MultiEdit",
        "hooks": [{ "type": "command", "command": "node", "args": ["${CLAUDE_PROJECT_DIR}/.claude/hooks/guard-core.mjs"], "timeout": 10 }]
      },
      {
        "matcher": "*",
        "hooks": [{ "type": "command", "command": "node", "args": ["${CLAUDE_PROJECT_DIR}/.claude/hooks/log-action.mjs"], "timeout": 10 }]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "*",
        "hooks": [{ "type": "command", "command": "node", "args": ["${CLAUDE_PROJECT_DIR}/.claude/hooks/log-action.mjs"], "timeout": 10 }]
      }
    ],
    "PostToolUseFailure": [
      {
        "matcher": "*",
        "hooks": [{ "type": "command", "command": "node", "args": ["${CLAUDE_PROJECT_DIR}/.claude/hooks/log-action.mjs"], "timeout": 10 }]
      }
    ]
  }
}
```

- [ ] **Step 8 [ЛЮДИНА]: коміт**

```bash
git add -A
git commit -m "chore: harness - action log, guard-core hook, boundary gate, hook selftest"
```

---

### Task 0.3: AGENTS.md, CLAUDE.md, журнали, pre-commit, CI

**Рівень:** 1. **`AGENTS.md` пише людина, а не агент.** Курс (s.45): це єдиний файл, який не можна генерувати агентом. Агент може лише перевірити чернетку людини на суперечності з цим планом. **Files:**
- Create: `AGENTS.md`, `CLAUDE.md`, `docs/autonomy-log.md`, `docs/intent.md`, `docs/session-notes.md`, `.githooks/pre-commit`, `.github/workflows/check.yml`

- [ ] **Step 1 [ЛЮДИНА]: `AGENTS.md` (до 60 своїх рядків, англійською).** Тест на кожен рядок: «якщо прибрати — агент помилятиметься?». Що має бути (своїми словами):
  - **Commands:** `pnpm check` — гейт; перед словом «done» запусти й процитуй підсумкові рядки. Також `pnpm hooks:selftest`, `pnpm agent:log`; пізніше `pnpm validate:levels`, `pnpm e2e`.
  - **Boundary:** `src/core` чистий і детермінований: заборони і де вони перевіряються (`guard-core` + `pnpm boundaries`).
  - **Tests first:** спершу заглушка + тест, червоний через поведінку; коміт червоного, потім зеленого.
  - **Не змінювати** `PHYS` у `src/core/physics.ts` без людини.
  - **Контрольний шар не редагувати** (список із «Глобальних обмежень»).
  - **Межа довіри:** всередині зміни OpenSpec — рівень 3; поза нею — рівень 1 (курс, день 03).
  - **Коміти:** лише з підтвердженням людини; ніколи `git push`.
  - **Сесія:** почати з `docs/session-notes.md`, закінчити його оновленням.
  - **Мови:** код, специфікації, коміти англійською; текст у грі українською.
  - **Чого не писати:** огляд архітектури, карту тек, «будь уважним» (курс, день 01 §12).

- [ ] **Step 2 [ЛЮДИНА]: `CLAUDE.md`**

```markdown
@AGENTS.md

## Claude Code
- Skills: .claude/skills/. Subagents: .claude/agents/.
- After /compact, read docs/session-notes.md and the current stage file in docs/plan/ again.
```

- [ ] **Step 3: `docs/autonomy-log.md`** (шаблон курсу; рядки 1–4 заповнюються під час етапу 0)

```markdown
# Журнал автономності — Trap Runner

> Один рядок = одна задача. **Рівень пишемо ДО роботи, факт — ПІСЛЯ.** Доказ — обов'язкове поле.
> Рівні: 1 Асистент · 2 Асистент→агент · 3 Агент (в межах зміни) · 4 Агенти (паралельно) · 5 Автономні.
> `settings.json`, `.mcp.json`, hooks, залежності — завжди рівень 1.

| # | Дата | Робота | Рівень (план → факт) | Хто вирішував | Докази | Чому саме цей рівень (3 питання) |
|---|---|---|---|---|---|---|
| 1 | | Task 0.1 каркас, Node, pnpm, залежності | 1 → | людина | | помітимо: … · відкотимо: … · переконає: … |
| 2 | | Task 0.2 харнес (hooks, гейт) | 1 → | людина | | |
| 3 | | Task 0.3 AGENTS.md, CI | 1 → | людина | | |
| 4 | | Task 0.4 негативний контроль guard-core | 1 → | людина | | |

## Зниження рівня (обов'язково фіксувати)
| Дата | Задача | Було → стало | Причина |
|---|---|---|---|

## Впевнені помилки агента
| Дата | Що агент запропонував | Як помітили (рядок `.agent-log/actions.jsonl`, тест, typecheck) | Що змінили в харнесі після цього |
|---|---|---|---|
```

- [ ] **Step 4 [ЛЮДИНА]: `docs/intent.md`** (бюджет **до** будь-якого apply; числа — рішення людини)

```markdown
# Intent: Trap Runner (capstone)

## Навіщо
Особистий платформер; capstone курсу, де кожну практику видно в репо.

## Що вважаємо готовим (вимірювано)
1. Гра проходиться від level-01 до останнього рівня в браузері.
2. `pnpm check` exit 0, `pnpm e2e` exit 0, CI зелений.
3. Відео 1–2 хв і PR у форку capstone.

## Чого НЕ робимо
Звук, спрайти, power-up'и, кілька типів ворогів, збереження, мобільне керування.

## Бюджет проєкту (записано ДО apply)
- час: ≤ 25 год (план 19.5)
- $ / токени: <впиши: ліміт підписки або $-стеля>
- як міряємо: `/cost` (або /usage) наприкінці кожної сесії; `total_cost_usd` у логах циклу

## План проти факту (заповнюється після кожного етапу)
| Етап | бюджет год | факт год | $ / токени факт | джерело |
|---|---|---|---|---|
| 0 | 2.5 | | | |
| 2 | 5 | | | |
| 1 | 0.5 | | | |
| 5a | 2.5 | | | |
| 3 | 4 | | | |
| 4 | 2 | | | |
| 5b | 1.5 | | | |
| 6 | 1.5 | | | |
```

- [ ] **Step 5: `docs/session-notes.md`**

```markdown
# Естафета сесії

> Кожна сесія ВІДКРИВАЄТЬСЯ читанням цього файлу і ЗАКРИВАЄТЬСЯ його оновленням.
> `[x]` — тільки з доказом у тому ж рядку (команда + результат).

## 1. Журнал прогресу
- YYYY-MM-DD — …

## 2. Чекліст етапів
- [ ] Етап 0 — `pnpm check` зелений, `pnpm hooks:selftest` 23 PASS, тег `stage-0`
- [ ] Етап 2 — …

## 3. Команда перевірки
pnpm install && pnpm hooks:selftest && pnpm check

## Наступна дія (одна)
…
```

- [ ] **Step 6: pre-commit (швидкий гейт без тестів)**

`.githooks/pre-commit`:
```sh
#!/bin/sh
# Fast gate before each commit: types and the src/core boundary.
# Tests are not here on purpose: the course asks for a commit with a red test before the green one.
pnpm typecheck && pnpm boundaries
```
```bash
git config core.hooksPath .githooks
git update-index --add --chmod=+x .githooks/pre-commit
```

- [ ] **Step 7: CI**

`.github/workflows/check.yml`:
```yaml
name: check

# The same gate the agent must run before it says "done".
on:
  push:
    branches: [main]
  pull_request:

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm hooks:selftest
      - run: pnpm check
```

- [ ] **Step 8 [ЛЮДИНА]: коміт, репо на GitHub, перший прогін CI**

```bash
git add -A
git commit -m "docs: AGENTS.md, journals, pre-commit, CI"
```
  Створи порожній репо `trap-runner` на GitHub, додай remote і зроби push сам. Expected: зелений прогін `check` в Actions. Посилання на прогін — у autonomy-log.

---

### Task 0.4: Негативний контроль — агент упирається в `guard-core`

**Рівень:** 1. Це головний доказ контекст-інженерії: правило **спрацювало**, а не просто написане.

- [ ] **Step 1 [ЛЮДИНА]: свіжа сесія `claude` у корені репо.** Дай промпт дослівно:
  ```
  Create src/core/spawn.ts with a function randomSpawnOffset() that returns Math.random() * 4.
  ```
  Expected: Write заблоковано; агент отримує текст `guard-core: Blocked the edit of src/core/spawn.ts ... Broken rules: no-math-random`.

- [ ] **Step 2: зібрати докази**

  Run: `pnpm agent:log`
  Expected: рядок `... 1 proposed but not executed ...` і `Write  src/core/spawn.ts` у списку заблокованих.

  Run: `tail -n 1 .agent-log/blocked.jsonl`
  Expected: `{"...","tool":"Write","path":"src/core/spawn.ts","blocked":true,"by":"guard-core","rules":["no-math-random"]}`, і `id` збігається з PreToolUse-рядком в `actions.jsonl`.

- [ ] **Step 3 [ЛЮДИНА]: запис і тег**
  - autonomy-log, рядок 4: доказ — обидва рядки журналу (`id`).
  - Якщо агент **після блоку** спробував обійти заборону (інший файл, `Date` замість `Math.random`, Bash), це «впевнена помилка агента». Запиши її.
```bash
git add -A
git commit -m "chore: agent log with a blocked core edit (negative control)"
git tag stage-0
```
  План проти факту для етапу 0 — у `docs/intent.md`. Онови `docs/session-notes.md`.
