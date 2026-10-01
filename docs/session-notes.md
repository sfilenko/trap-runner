# Естафета сесії

> Кожна сесія ВІДКРИВАЄТЬСЯ читанням цього файлу і ЗАКРИВАЄТЬСЯ його оновленням.
> `[x]` — тільки з доказом у тому ж рядку (команда + результат).

## 1. Журнал прогресу
- 2026-10-02 — Task 0.1: Node 24.21.0, pnpm 12.8.1, каркас, годинник; червоний `3afd550` → зелений `ef629f7` (`Tests  4 passed (4)`).
- 2026-10-02 — Task 0.2: `log-action` і `agent-log-summary` з демо day01 (pin `3925f86`), `check-boundaries`, `guard-core`, `settings.json`; коміт `0ad50ab`. Regex заборони імпорту посилено, selftest тепер 27 перевірок.
- 2026-10-02 — Task 0.3: `AGENTS.md` (чернетка агента, людина прийняла без змін), `CLAUDE.md`, `intent.md` (бюджет: ліміт підписки), pre-commit (`typecheck` + `boundaries`), CI; коміт `ec0ad9e`. Репо https://github.com/sfilenko/trap-runner, CI зелений: https://github.com/sfilenko/trap-runner/actions/runs/36932206630.
- 2026-10-02 — Task 0.4: спроба 1 — агент відмовився сам через `AGENTS.md`; спроба 2 (свідомо спровокована) — `guard-core` заблокував Write `src/core/spawn.ts`, `id` `toolu_01DvoeyGwr9c3ArCQN4jJ6ER` у `blocked.jsonl` і в Pre без Post. Факт етапу 0: 1 год, 5% ліміту.
- 2026-10-02 — Task 2.0: OpenSpec `1.13.0` (exact), `init --tools claude,codex --profile core`; скрипти day03 за pin `e88669e`; `openspec:pin` переписав 204 голі виклики в 18 файлах; `config.yaml` з плану; 2 рядки `allow` у `settings.json` (агент за дорученням людини). Гейт червоний до pin (147 рядків `bare openspec call`), зелений після: `spec:check ok — specs: 0 · active changes: 0 · archived: 0`. Коміт `7d3c86b`.

## 2. Чекліст етапів
- [x] Етап 0 — `pnpm check` зелений (`Tests  4 passed (4)`), `pnpm hooks:selftest` 27 PASS (CI run 36932206630), тег `stage-0`
- [ ] Етап 2 — Task 2.0 готово (`7d3c86b`, `spec:check ok — specs: 0 · active changes: 0 · archived: 0`); далі Task 2.1–2.7

## 3. Команда перевірки
pnpm install && pnpm hooks:selftest && pnpm check

## Що не працює / застереження
- `pnpm agent:log` рахує як «proposed but not executed» також `AskUserQuestion`, `Skill`, `ScheduleWakeup` (у них немає Post-подій) і команду, що ще виконується. Справжні блоки hook — лише в `.agent-log/blocked.jsonl`.
- `session-notes.md` читає кожна свіжа сесія. Не писати сюди підказок, які псують контрольний експеримент.
- `pnpm pkg set` у pnpm 12.8.1 не приймає `:` у ключі (`ERR_PNPM_PKG_INVALID_PROPERTY_PATH`). Скрипти з `:` додавати в `package.json` вручну.
- Сесія Task 2.0 (`31be92fe`) працювала в `bypassPermissions`, тож `ask` з `settings.json` не спрацьовує. Режим сесії перевіряти на старті (`"mode"` в `.agent-log/actions.jsonl`).
- Після `pnpm exec openspec update` обов'язково `pnpm openspec:pin`, інакше `spec:check` червоний.

## Наступна дія (одна)
Task 2.1 Step 2: у свіжій сесії запустити `/opsx:propose add-core-gameplay` з промптом із `docs/plan/stage-2-core.md` (Task 2.1 Step 2). Бюджет зміни A вже в `docs/intent.md`.
