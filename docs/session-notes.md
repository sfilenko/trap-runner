# Естафета сесії

> Кожна сесія ВІДКРИВАЄТЬСЯ читанням цього файлу і ЗАКРИВАЄТЬСЯ його оновленням.
> `[x]` — тільки з доказом у тому ж рядку (команда + результат).

## 1. Журнал прогресу
- 2026-10-02 — Task 0.1: Node 24.21.0, pnpm 12.8.1, каркас, годинник; червоний `3afd550` → зелений `ef629f7` (`Tests  4 passed (4)`).
- 2026-10-02 — Task 0.2: `log-action` і `agent-log-summary` з демо day01 (pin `3925f86`), `check-boundaries`, `guard-core`, `settings.json`; коміт `0ad50ab`. Regex заборони імпорту посилено, selftest тепер 27 перевірок.
- 2026-10-02 — Task 0.3: `AGENTS.md` (чернетка агента, людина прийняла без змін), `CLAUDE.md`, `intent.md` (бюджет: ліміт підписки), pre-commit (`typecheck` + `boundaries`), CI; коміт `ec0ad9e`. Репо https://github.com/sfilenko/trap-runner, CI зелений: https://github.com/sfilenko/trap-runner/actions/runs/36932206630.
- 2026-10-02 — Task 0.4: спроба 1 — агент відмовився сам через `AGENTS.md`; спроба 2 (свідомо спровокована) — `guard-core` заблокував Write `src/core/spawn.ts`, `id` `toolu_01DvoeyGwr9c3ArCQN4jJ6ER` у `blocked.jsonl` і в Pre без Post. Факт етапу 0: 1 год, 5% ліміту.
- 2026-10-02 — Task 2.0: OpenSpec `1.13.0` (exact), `init --tools claude,codex --profile core`; скрипти day03 за pin `e88669e`; `openspec:pin` переписав 204 голі виклики в 18 файлах; `config.yaml` з плану; 2 рядки `allow` у `settings.json` (агент за дорученням людини). Гейт червоний до pin (147 рядків `bare openspec call`), зелений після: `spec:check ok — specs: 0 · active changes: 0 · archived: 0`. Коміт `7d3c86b`.
- 2026-10-02 — Task 2.1: бюджет зміни A в `intent.md` (коміт `1e0072d`) до propose. Propose у свіжій сесії: 10 вимог, 13 сценаріїв з id плану, `tasks.md` з Task 2.2 по 2.5, тести першими; `validate --strict` → valid; `spec:check ok — specs: 0 · active changes: 1 · archived: 0`. Людина прийняла 4 відхилення, зокрема нове правило «пастка не спрацьовує в тіку смерті» (autonomy-log, «Відхилення»). Коміт пропозиції `c4485f7`.
- 2026-10-02 — Task 2.2 (`/opsx:apply`, група 1 `tasks.md`, рівень 3): типи, геометрія, `createWorld` дослівно з плану; червоний `5ad9a65` (`Tests  5 failed (5)`, `not implemented`) → зелений `5402549` (`Tests  9 passed (9)`). Виправлено таблицю autonomy-log (`01adbd3`): рядок #6 розрізав рядок #5.
- 2026-10-02 — Task 2.3 (група 2): `step`, `replay`, `interactions`, заглушка `traps`, 3 тестові файли і 13 `*.replay.json` дослівно з плану; червоний коміт `f4dd72e` — `Tests  17 failed | 15 passed (32)`, без помилок імпорту.
- 2026-10-02 — Task 2.4 (група 3): `physics.test.ts` червоний `6791fd3` (`8 failed | 1 passed`) → `stepPlayer` зелений `03aba67` (`Tests  5 failed | 36 passed (41)`, червоні лише 5 `TRAP-*`); `PHYS` не змінено. Прогалина плану: 3.1 і 4.1 без зупинки на червоний коміт, а зелений коміт через `-am` не бере новий файл тесту — комітимо червоне окремо і через `git add`.
- 2026-10-02 — Task 2.5 (група 4): `traps.test.ts` червоний `b95123e` (`5 failed`) → `traps.ts` зелений `cf81fdc` (`Tests  46 passed (46)`). Усі 13 сценаріїв збіглися з поведінкою: коміту `spec: …` (доказ SDD) у зміні A немає — шукати чесний випадок у зміні B або на етапі 3.
- 2026-10-02 — Зміна A закрита: 4.3 «no spec change», 5.1 `pnpm check` зелений (`72dc0b4`); archive `a3dbda4` → `spec:check ok — specs: 1 · active changes: 0 · archived: 1`; Purpose переписала людина (`e6465e8`). Факт: 53 хв з 180 (`intent.md`); витрати сесій propose і apply не зняті.
- 2026-10-02 — Task 2.6: бюджет зміни B (`2bc57c5`, ≤ 60 хв) до propose. Propose у свіжій сесії: 9 вимог, 11 сценаріїв (9 тестів плану Task 2.7 + 2 CLI), `tasks.md` з 3 груп; `validate --strict` → valid. Людина прийняла 6 відхилень, зокрема 9 правил без тесту.
- 2026-10-02 — Task 2.7 (`/opsx:apply`, рівень 3): схема, заглушка і 9 тестів дослівно з плану; червоний `cdc93f7` (`Tests  8 failed | 47 passed (55)`, усі `AssertionError`) → валідатор і CLI зелений `49896cd` (`Tests  55 passed (55)`). Усі сценарії, зокрема тік 42, збіглися з поведінкою: коміту `spec: …` знову немає. CLI під `tsx` на Windows працює: `validate-level: 0 levels, 0 failed`, exit 0; рівень без розв'язку → `FAIL level-90.json`, exit 1. Перша спроба 2.3 (одна команда з `mktemp` і `rm -rf "$TMP"`) відхилена дозволами — розбито на кроки, тимчасовий файл у scratchpad. 3.1: `pnpm check` exit 0, `spec:check ok — specs: 1 · active changes: 1 · archived: 1`; 6/6 задач.
- 2026-10-02 — Зміна B закрита: archive `d086e49` → `spec:check ok — specs: 2 · active changes: 0 · archived: 2`; Purpose `level-validation` переписав агент за вибором людини (`912676b`, позначено в коміті). Факт: 34 хв з 60, $2.86 (propose + apply). Етап 2: ≈1.7 год з 5 (`intent.md`).
- 2026-10-02 — Етап 1 (Task 1.1–1.3): «до» (сесія `5b25fa8d`) — 0 `Skill`, PASS з першого `validate:levels`, але прогін не сліпий: агент прочитав текст skill у `docs/plan/stage-1-context.md` і незакомічені журнали. Skill `make-level` дослівно з плану, лінтер STE 0 порушень, окремий коміт `4db3375`. «Після» (сесія `7011e9a7`) — перша дія `Skill` `make-level` (`toolu_01BVa9gr7JHWwedz4p4db7jW`), PASS з першої спроби. `/context`: Skills 79 · 9.6k → 80 · 9.7k, Free space без змін. Третя колонка — `docs/context-log.md`.
- 2026-10-02 — Task 5a.1 (рівень 2 — рішення людини, хоча `AGENTS.md` поза OpenSpec дає 1): `keyboard.ts`, `camera.ts`, `core/session.ts`, `shell.test.ts` дослівно з плану; червоний `a55dac2` (`Tests  7 failed | 4 passed (11)`, усі `AssertionError`) → зелений `82b1065` (`Tests  66 passed (66)`). Тест blur проходив на заглушці — мутація `held.clear()` → `{}` зробила його червоним (`1 failed | 10 passed`), файл повернуто.
- 2026-10-02 — Task 5a.2 (рівень 2): `draw.ts` і повна заміна `main.ts` дослівно з плану; коміт `4c57bf1`, `pnpm check` exit 0 (`Tests  66 passed (66)`). У браузері не перевірено: без `levels/level-01.json` гра кидає `No levels found`.
- 2026-10-02 — Task 5a.3 (рівень 1, зниження з 2): `level-01.json` 48×15 — чернетка агента (skill `make-level`) за дорученням людини, прийнята без змін; розв'язок записала людина клавішею `R`; `PHYS` не змінено. Коміт `c004dd6`: `PASS level-01.json`, обидві пастки і 2 монети в розв'язку; `pnpm check` exit 0.
- 2026-10-02 — Task 5a.4 (рівень 1 конфіг / 2 використання): `.mcp.json` з `@playwright/mcp@0.0.83` і `enabledMcpjsonServers` вніс агент за дорученням людини, коміт `1b66c29`. Свіжа сесія `95e4dcae` прочитала `window.__game`: `x = 2, y = 210`, рівень 1; 3 виклики `mcp__playwright__*` з Post. Глобальний `playwright` (`@latest`) має ті самі назви інструментів, тому проєктне джерело доведено списком процесів: у `claude.exe` сесії `95e4dcae` лише дочірній `@playwright/mcp@0.0.83`.

## 2. Чекліст етапів
- [x] Етап 0 — `pnpm check` зелений (`Tests  4 passed (4)`), `pnpm hooks:selftest` 27 PASS (CI run 36932206630), тег `stage-0`
- [x] Етап 2 — `pnpm check` exit 0: `Tests  55 passed (55)`, `validate-level: 0 levels, 0 failed`, `spec:check ok — specs: 2 · active changes: 0 · archived: 2`; архіви `a3dbda4`, `d086e49`; тег `stage-2` (`50c6fb7`); CI зелений на Linux: https://github.com/sfilenko/trap-runner/actions/runs/36977314363
- [x] Етап 1 — `docs/context-log.md` з трьома колонками; доказ «після» — рядок `"tool":"Skill"` (`toolu_01BVa9gr7JHWwedz4p4db7jW`, 08:09:02Z); тег `stage-1`
- [x] Етап 5a — `pnpm check` exit 0: `Tests  66 passed (66)`, `PASS level-01.json`, `validate-level: 1 levels, 0 failed`; коміти `a55dac2` → `82b1065`, `4c57bf1`, `c004dd6`, `1b66c29`; MCP-доказ — сесія `95e4dcae`, `toolu_01LdUGgfM1etz5QbqY7RpULY`; тег `stage-5a`; CI зелений на Linux: https://github.com/sfilenko/trap-runner/actions/runs/37041148310
- Відкрите після етапу 2: (1) коміту `spec: <що і чому>` (доказ SDD «спеку змінили, бо реальність не збіглася») ще немає — обидві зміни збіглися з кодом плану; (2) правило `openspec/config.yaml` «id сценарію = replay-файл» не підходить до `level-validation` — звузити окремим комітом, якщо людина погодиться

## 3. Команда перевірки
pnpm install && pnpm hooks:selftest && pnpm check

## Що не працює / застереження
- HUD нечитабельний: `draw.ts` пише `8px monospace` на канвасі 320×240, а CSS розтягує його до 960×720 з `image-rendering: pixelated` — кирилиця розмазана (знахідка агента сесії `95e4dcae` за скріншотом). Читабельність автоматично не перевіряється (`design.md` §7), рішення — за людиною.
- `pnpm agent:log` рахує як «proposed but not executed» також `AskUserQuestion`, `Skill`, `ScheduleWakeup` (у них немає Post-подій) і команду, що ще виконується. Справжні блоки hook — лише в `.agent-log/blocked.jsonl`.
- `session-notes.md` читає кожна свіжа сесія. Не писати сюди підказок, які псують контрольний експеримент.
- `pnpm pkg set` у pnpm 12.8.1 не приймає `:` у ключі (`ERR_PNPM_PKG_INVALID_PROPERTY_PATH`). Скрипти з `:` додавати в `package.json` вручну.
- Сесія Task 2.0 (`31be92fe`) працювала в `bypassPermissions`, тож `ask` з `settings.json` не спрацьовує. Режим сесії перевіряти на старті (`"mode"` в `.agent-log/actions.jsonl`).
- Після `pnpm exec openspec update` обов'язково `pnpm openspec:pin`, інакше `spec:check` червоний.
- План і `tasks.md` не мають зупинки на червоний коміт після нового тесту (3.1, 4.1) і дають `git commit -am`, який не бере новий файл. Червоний тест комітить людина окремо, через `git add <файли>`.
- Свіжа сесія читає все в робочій копії: план (`docs/plan/`), незакомічені журнали, `git diff`. Для чистого контрольного прогону ховати не лише `session-notes.md`.
- `.agent-log/actions.jsonl` не пише назву skill у рядку `Skill` і обрізає `cmd` до 200 символів. Назву skill брати з транскрипту сесії (`~/.claude/projects/<проєкт>/<session>.jsonl`).
- `/usage` → Session показує лише поточну сесію. Знімати в кожній сесії (propose, apply) перед `/exit`.

## Наступна дія (одна)
Етап 3 (порядок 5 у `docs/plan/README.md`): прочитати `docs/plan/stage-3-orchestration.md` і почати з першої задачі.
