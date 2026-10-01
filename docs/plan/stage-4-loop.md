# Етап 4 · Цикл генерації рівнів (loop engineering)

**День курсу:** 05 (харнес, back-pressure, запобіжники). **Рівень довіри:** 3 для циклу; **1 для рішення, чи брати рівень у гру**. **Бюджет:** ≈2 год.
**Результат етапу:** команда циклу, яка **запускається**, і лог одного прогону: скільки ітерацій, на чому зупинився, скільки коштував. Рівні 04 і 05, які людина прийняла або відхилила.

Курс (день 05): в інтерактивному Claude Code стелі витрат немає; `--max-budget-usd` працює лише з `--print`. Тож **примус живе в обгортці навколо `claude -p`**. Ця обгортка і є `scripts/level-loop.mjs`.

---

### Task 4.1: Скрипт циклу

**Рівень:** 2 (людина читає скрипт: він запускає агента без нагляду). **Files:** Create: `scripts/level-loop.mjs`. Modify: `package.json`.

**Interfaces:**
- Consumes: skill `make-level` (Task 1.2), `pnpm validate:levels <file>` (Task 2.7).
- Produces: `pnpm level:loop --level NN [--max-iter 5] [--budget-usd 1]`; лог `.agent-log/loops/<time>-level-NN.jsonl`, один рядок на ітерацію: `{iter, ok, ms, cost_usd, turns, claude_exit, validation[]}`.

- [ ] **Step 1 [РЕВ'Ю]: скрипт** (через Write або редактор)

`scripts/level-loop.mjs`:
```js
#!/usr/bin/env node
// Loop engineering: Claude Code (headless) makes one level, the validator checks it, the errors go back to
// the next iteration. Stops on the first PASS or at --max-iter. One JSON line per iteration goes to
// .agent-log/loops/<time>-level-NN.jsonl.
// Usage: pnpm level:loop --level 04 [--max-iter 5] [--budget-usd 1]
import { spawnSync } from "node:child_process";
import { appendFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";

const { values } = parseArgs({
  options: {
    level: { type: "string" },
    "max-iter": { type: "string", default: "5" },
    "budget-usd": { type: "string", default: "1" },
  },
});
if (!/^\d\d$/.test(values.level ?? "")) {
  console.error("level-loop: Give the level number as two digits, for example: --level 04");
  process.exit(2);
}
const nn = values.level;
const maxIter = Number(values["max-iter"]);
const budget = values["budget-usd"];
const file = `levels/level-${nn}.json`;

const logDir = join(".agent-log", "loops");
mkdirSync(logDir, { recursive: true });
const logFile = join(logDir, `${new Date().toISOString().replace(/[:.]/g, "-")}-level-${nn}.jsonl`);

// On Windows, `claude` and `pnpm` are .cmd shims, so they need a shell, and arguments need quotes.
const isWin = process.platform === "win32";
const quote = (a) => (isWin && /[\s()*,]/.test(a) ? `"${a}"` : a);
const exec = (cmd, args, input) =>
  spawnSync(cmd, isWin ? args.map(quote) : args, { input, encoding: "utf8", shell: isWin, maxBuffer: 1 << 26 });

let feedback = "";
for (let iter = 1; iter <= maxIter; iter++) {
  const prompt = [
    `Use the make-level skill. Create ${file} and levels/level-${nn}.solution.json.`,
    "The level must be different from the other levels in levels/.",
    feedback && `The last validation failed. Output:\n${feedback}\nChange the level or the solution so that the validation passes.`,
  ]
    .filter(Boolean)
    .join("\n");

  const started = Date.now();
  const r = exec(
    "claude",
    ["-p", "--output-format", "json", "--max-budget-usd", budget, "--permission-mode", "acceptEdits",
     "--allowedTools", "Read,Edit,Write,Glob,Grep,Skill,Bash(pnpm validate:levels *)"],
    prompt,
  );
  let result = {};
  try {
    result = JSON.parse(r.stdout);
  } catch {
    /* no JSON: the log keeps claude_exit */
  }

  const v = exec("pnpm", ["validate:levels", file]);
  const ok = v.status === 0;
  feedback = `${v.stdout}${v.stderr}`.trim();

  const entry = {
    iter,
    ok,
    ms: Date.now() - started,
    cost_usd: result.total_cost_usd ?? null,
    turns: result.num_turns ?? null,
    claude_exit: r.status,
    validation: feedback.split("\n").slice(0, 20),
  };
  appendFileSync(logFile, JSON.stringify(entry) + "\n");
  console.log(`iter ${iter}: ${ok ? "PASS" : "FAIL"}  turns=${entry.turns ?? "?"}  cost_usd=${entry.cost_usd ?? "?"}`);
  if (ok) {
    console.log(`level-loop: PASS after ${iter} iteration(s). Log: ${logFile}`);
    process.exit(0);
  }
}
console.log(`level-loop: no PASS after ${maxIter} iterations. Log: ${logFile}`);
process.exit(1);
```

  Запобіжники в скрипті: ліміт ітерацій; `--max-budget-usd` на кожен виклик; `--allowedTools` без загального Bash (лише `pnpm validate:levels`); `acceptEdits` лише для файлів; hooks (`guard-core`, `log-action`) працюють і в `-p`.

- [ ] **Step 2: скрипт у `package.json`**
```bash
pnpm pkg set "scripts.level:loop=node scripts/level-loop.mjs"
```

- [ ] **Step 3: перевірка аргументів без витрат**

  Run: `pnpm level:loop --level x`
  Expected: `level-loop: Give the level number as two digits, for example: --level 04`, exit 2.

- [ ] **Step 4 [ЛЮДИНА]: пробний прогін, 1 ітерація**

  Run: `pnpm level:loop --level 04 --max-iter 1 --budget-usd 0.5`
  Expected: рядок `iter 1: PASS|FAIL  turns=…  cost_usd=…` і файл у `.agent-log/loops/`. Якщо `cost_usd=?`, глянь у лог `claude_exit` і перевір `claude -p --output-format json "hi"` вручну. **Ця частина в плані не перевірена**: прапорці звірено з `claude --help` версії 2.1.287, а сам прогін не запускався.

  Якщо на Windows виклик `claude` чи `pnpm` не знаходиться, перевір `where claude`. Скрипт запускає їх через shell, бо це `.cmd`-обгортки.

- [ ] **Step 5 [ЛЮДИНА]: коміт**
```bash
git add scripts/level-loop.mjs package.json .agent-log
git commit -m "feat(loop): level generation loop with validator feedback and budget cap"
```

---

### Task 4.2: Два справжні прогони і рішення людини

**Рівень:** 3 → 1. **Files:** Create: `levels/level-04*.json`, `levels/level-05*.json` (якщо прийнято), `docs/loop-log.md`.

- [ ] **Step 1 [ЛЮДИНА]: бюджет до прогону.** У `docs/intent.md` («Етап 4»): ≤ 5 ітерацій × ≤ $1 на рівень.

- [ ] **Step 2: прогони**

  Run: `pnpm level:loop --level 04`
  Run: `pnpm level:loop --level 05`
  Expected: для кожного — `level-loop: PASS after N iteration(s)` **або** `no PASS after 5 iterations`. Обидва результати — чесні докази. Цикл, який зупинився без PASS, показує, що запобіжник спрацював.

- [ ] **Step 3 [ЛЮДИНА]: зіграй згенеровані рівні.** Валідатор доводить лише, що рівень *можна* пройти. Чи він цікавий і чесний — вирішуєш ти (design §7, «Межі перевірки»). Прийми або відхили кожен. Відхилений рівень видали, але лог циклу **залиш**.

- [ ] **Step 4: `docs/loop-log.md`**
```markdown
# Цикл генерації рівнів

Команда: `pnpm level:loop --level NN` (scripts/level-loop.mjs)

| Рівень | Ітерацій | Зупинка (PASS / ліміт) | $ разом | Типові помилки валідації | Рішення людини | Чому |
|---|---|---|---|---|---|---|
| 04 | | | | | | |
| 05 | | | | | | |

Лог-файли: .agent-log/loops/…
```
  Заповни з логів `.agent-log/loops/*.jsonl`.

- [ ] **Step 5 [ЛЮДИНА]: autonomy-log.** Рядок «цикл генерації» — рівень 3 (агент сам доходить до PASS). Рядок «прийняття рівнів у гру» — **зниження до 1**: «доказ (PASS валідатора) не може впасти на нецікавому рівні». Це той запис зі зниженням, який рубрика цінує найбільше.

- [ ] **Step 6: коміт, тег**
```bash
git add -A
git commit -m "feat(levels): loop-generated levels reviewed by the human; loop log"
git tag stage-4
```
