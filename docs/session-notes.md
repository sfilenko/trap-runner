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

## 2. Чекліст етапів
- [x] Етап 0 — `pnpm check` зелений (`Tests  4 passed (4)`), `pnpm hooks:selftest` 27 PASS (CI run 36932206630), тег `stage-0`
- [ ] Етап 2 — Task 2.0–2.5 готово: зміна A заархівована (`a3dbda4`, `spec:check ok — specs: 1 · active changes: 0 · archived: 1`, `Tests  46 passed (46)`); далі Task 2.6–2.7 (зміна B `add-level-validation`)

## 3. Команда перевірки
pnpm install && pnpm hooks:selftest && pnpm check

## Що не працює / застереження
- `pnpm agent:log` рахує як «proposed but not executed» також `AskUserQuestion`, `Skill`, `ScheduleWakeup` (у них немає Post-подій) і команду, що ще виконується. Справжні блоки hook — лише в `.agent-log/blocked.jsonl`.
- `session-notes.md` читає кожна свіжа сесія. Не писати сюди підказок, які псують контрольний експеримент.
- `pnpm pkg set` у pnpm 12.8.1 не приймає `:` у ключі (`ERR_PNPM_PKG_INVALID_PROPERTY_PATH`). Скрипти з `:` додавати в `package.json` вручну.
- Сесія Task 2.0 (`31be92fe`) працювала в `bypassPermissions`, тож `ask` з `settings.json` не спрацьовує. Режим сесії перевіряти на старті (`"mode"` в `.agent-log/actions.jsonl`).
- Після `pnpm exec openspec update` обов'язково `pnpm openspec:pin`, інакше `spec:check` червоний.
- План і `tasks.md` не мають зупинки на червоний коміт після нового тесту (3.1, 4.1) і дають `git commit -am`, який не бере новий файл. Червоний тест комітить людина окремо, через `git add <файли>`.
- `/usage` → Session показує лише поточну сесію. Знімати в кожній сесії (propose, apply) перед `/exit`.

## Наступна дія (одна)
Task 2.7: у свіжій сесії `/opsx:apply add-level-validation` і йти за `openspec/changes/add-level-validation/tasks.md`; перед `/exit` зняти `/usage`. На червоному коміті 1.2 додати також `tasks.md`. Рядки `allow` для `validate:levels` (2.2) додає людина.
