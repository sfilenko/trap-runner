# Trap Runner — план реалізації

> **Для агента, який виконує план:** працюй задача за задачею через `superpowers:executing-plans`. Етапи 2 і 3 мають власний процес курсу (OpenSpec propose → apply → archive; worktrees і task brief). Де процес курсу і skill розходяться, **процес курсу має пріоритет**. Кроки позначено `- [ ]`.

**Мета:** браузерний платформер (пастки Level Devil + скролінг, вороги, монети Маріо), побудований агентно так, щоб кожна практика курсу мала доказ, який можна відкрити.

**Архітектура:** чисте детерміноване ядро `step(world, input) → world` у `src/core/` (без DOM, `Math.random`, `Date`). Навколо нього тонкі адаптери: клавіатура, Canvas-рендер, ігровий цикл з фіксованим кроком 60 тіків/с. Перевірка через replay-сценарії на справжньому `step()` і валідатор рівнів із записаним розв'язком.

**Стек:** TypeScript (strict), Vite 8, Vitest 5, Playwright, zod 4, tsx, OpenSpec 1.13.0, pnpm, Node ≥ 22.12.

**Спека:** [`docs/design.md`](../design.md) (v3). План спирається на неї, тож **читай обидва файли**.

---

## Як почати новий чат

1. Відкрий Claude Code у `D:\AITools\trap-runner`.
2. Перше повідомлення:
   ```
   Прочитай docs/plan/README.md, docs/design.md і docs/plan/<файл поточного етапу>.
   Якщо є docs/session-notes.md — прочитай його першим.
   Виконуємо <Етап N, Task N.M>. Перед кожною задачею назви рівень довіри з таблиці.
   Не переходь до наступної задачі без мого «так».
   ```
3. Читай **лише файл поточного етапу**. Решта етапів — не в контексті (ДЗ дня 02: вікно, яке ти не міряєш, керує тобою).
4. Наприкінці сесії онови `docs/session-notes.md`: що зроблено, що не працює, одна наступна дія.

## Порядок етапів і файли

| Порядок | Етап | Файл | День курсу | Рівень довіри | Год |
|---|---|---|---|---|---|
| 1 | 0 · Інструменти, каркас, харнес | [stage-0-harness.md](stage-0-harness.md) | 01 | 1 | 2.5 |
| 2 | 2 · Ядро через OpenSpec (рух, монети, пастки, валідатор) | [stage-2-core.md](stage-2-core.md) | 03 | 2–3 | 5 |
| 3 | 1 · Вимір контексту (одна зміна = skill `make-level`) | [stage-1-context.md](stage-1-context.md) | 02 | 1–2 | 0.5 |
| 4 | 5a · Ігрова оболонка (цикл, клавіатура, рендер, рівень 01) | [stage-5a-shell.md](stage-5a-shell.md) | — | 2 | 2.5 |
| 5 | 3 · Оркестрація: контракт → 2 workers → checker | [stage-3-orchestration.md](stage-3-orchestration.md) | 04 | 4 | 4 |
| 6 | 4 · Цикл генерації рівнів | [stage-4-loop.md](stage-4-loop.md) | 05 | 3 | 2 |
| 7 | 5b · E2E, CI, перевірка перевіряючого | [stage-5b-verify.md](stage-5b-verify.md) | 04/06 | 2 | 1.5 |
| 8 | 6 · Відео і PR | [stage-6-submit.md](stage-6-submit.md) | — | людина | 1.5 |
| ★ | Project Factory (лише за наявності часу) | [stage-F-factory.md](stage-F-factory.md) | 05 | — | — |

Разом ≈19.5 год із бюджету 10–25. Здати можна вже після порядку 5 (етап 3), а всі практики є після порядку 6 (етап 4).

## Глобальні обмеження

Кожна задача неявно включає цей розділ.

- **Node ≥ 22.12** (вимога Vite 8 і Vitest 5). Перевірено: на Node 22.3 Vitest не стартує («Cannot find native binding» від rolldown). Рекомендовано Node 24 LTS, і в CI теж 24.
- **pnpm через corepack**, поле `packageManager` у `package.json`. Скрипти курсу (`openspec-pin`, `spec-check`, `hooks-selftest`) розраховані на pnpm.
- **OpenSpec `1.13.0`**, `--save-exact`; виклик лише як `pnpm exec openspec`.
- **Константи ядра:** `TILE = 16` px, `LEVEL_HEIGHT = 15` тайлів, 60 тіків/с. `PHYS = { gravity: 0.5, maxFall: 8, runSpeed: 2, jumpVelocity: -8, stompBounce: -5 }`, гравець 12×14 px, ворог 14×14 px. Змінювати `PHYS` дозволено **лише людині**: зміна ламає replay і розв'язки рівнів.
- **Заборони для `src/core/**`:** `window`, `document`, `Math.random`, `Date`, імпорт з `render/` чи `input/`. Список живе лише в `scripts/check-boundaries.mjs` (гейт і hook `guard-core`). Ці слова не можна писати навіть у коментарях `src/core`.
- **Формат рівня:** `docs/design.md` §5. Id монети `c<x>_<y>`. Рівно 15 рядків однакової довжини, один `S`, один `G`.
- **Мови:** код, вимоги OpenSpec (SHALL/MUST у рядку під заголовком), коміти — англійською. Текст у грі — українською. Журнали в `docs/` — українською.
- **Коміти:** `git commit` стоїть в `ask` у `settings.json`, тож людина підтверджує кожен коміт. `git push` робить лише людина.
- **Контрольний шар не правиться агентом** (курс: «шар, який контролює агента, не генерують агентом»): `.claude/settings.json`, `.claude/hooks/**`, `scripts/check-boundaries.mjs`, `scripts/hooks-selftest.mjs`, `.githooks/**`, `AGENTS.md`. Агент може **запропонувати** зміну текстом, а вносить її людина.
- **Файли з `\\` у коді** (hooks, scripts) створюй інструментом Write або в редакторі, **не heredoc у Git Bash**. Перевірено: heredoc перетворює `/\\/g` на `/\/g`, і скрипт падає з SyntaxError.
- **Тест має падати через поведінку, а не через import чи синтаксис** (курс, день 04, mutation). Тому в кожній TDD-задачі спершу йде заглушка з правильною сигнатурою, потім червоний тест, потім реалізація.

## Протокол доказів (для кожної задачі)

1. **До початку:** рядок у `docs/autonomy-log.md`: задача, рівень (план), хто вирішує, три питання (як швидко помітимо помилку, як відкотимо, що переконає).
2. **Під час роботи:** коміти в порядку «сценарій/тест (червоний) → код (зелений)». Вивід команд копіюй у звіт дослівно.
3. **Після:** рівень (факт), докази (SHA, рядок виводу, рядок журналу). Якщо агент **впевнено помилився**, додай запис у розділ «Впевнені помилки агента». Не знайти жодної помилки підозріліше, ніж знайти десять.
4. **Кінець етапу:** `git tag stage-<N>`, план проти факту в `docs/intent.md`, оновлений `docs/session-notes.md`.

Позначки ролей у кроках: **[ЛЮДИНА]** — робить людина; **[АГЕНТ]** — агент, людина підтверджує дозволи; **[РЕВ'Ю]** — людина читає результат рядок за рядком.

## Review Focus

П'ять вхідних ситуацій, які легко пропустити. Для кожної вже є тест у задачі-власнику.

1. **Довгий кадр** (вкладка у фоні, потім повернення): логіка робить не більше 15 тіків, без «спіралі смерті». Тест: `clock.test.ts`, «a long frame…» (Task 0.1).
2. **Утримання стрибка:** після приземлення повторного стрибка немає. Тести: `physics.test.ts`, «jump only on press…», і `MOVE-no-autojump-01` (Task 2.3, 2.5).
3. **Втрата фокусу з натиснутою клавішею:** усі клавіші відпускаються. Тест: `shell.test.ts`, «losing focus (blur)…» (Task 5a.1).
4. **Смерть і фініш в одному тіку:** перемагає смерть, рівень не зараховано. Тести: `step.test.ts`, «death beats the goal…», і `TRAP-goal-death-01` (Task 2.4, 2.8).
5. **Перезапуск після смерті посеред затримки пастки:** у новій спробі немає `pending`, і тайли початкові. Тест: `traps.test.ts`, «a new attempt…» (Task 2.7).

## Карта файлів (кінцевий стан)

```
.claude/settings.json            дозволи + hooks                         Task 0.2 (людина)
.claude/hooks/log-action.mjs      з демо дня 01                           Task 0.2
.claude/hooks/guard-core.mjs      блокує заборони в src/core              Task 0.2 (людина рев'ю)
.claude/skills/make-level/        skill рівня                             Task 1.2
.claude/agents/game-checker.md    незалежний checker                      Task 3.4
.githooks/pre-commit              typecheck + boundaries                  Task 0.3
.github/workflows/check.yml       CI                                      Task 0.3, 5b.1
.mcp.json                         Playwright MCP                          Task 5a.4
AGENTS.md, CLAUDE.md              пише людина                             Task 0.3
docs/design.md                    спека                                   є
docs/plan/                        цей план                                є
docs/intent.md                    бюджет до apply, план проти факту       Task 0.3, 2.1, 2.6
docs/autonomy-log.md              журнал довіри                           Task 0.3
docs/session-notes.md             естафета                                Task 0.3
docs/context-log.md               вимір контексту                         Task 1.1
docs/stage3/                      вимоги, DAG, брифи, звіти               Task 3.1–3.5
openspec/                         config, specs, changes, archive         Task 2.0+
scripts/check-boundaries.mjs      заборони core (одне джерело)            Task 0.2
scripts/hooks-selftest.mjs        перевірка hooks без агента              Task 0.2
scripts/agent-log-summary.mjs     з демо дня 01                           Task 0.2
scripts/openspec-pin.mjs, spec-check.mjs   з демо дня 03                  Task 2.0
scripts/level-loop.mjs            цикл генерації рівнів                   Task 4.1
src/clock.ts                      фіксований крок                         Task 0.1
src/core/types.ts geometry.ts events.ts physics.ts world.ts
         interactions.ts traps.ts step.ts replay.ts session.ts enemies.ts Task 2.2–2.8, 3.x, 5a.1
src/input/keyboard.ts  src/render/camera.ts draw.ts  src/main.ts          Task 5a.1–5a.3
levels/level.schema.ts  levels/level-NN.json  level-NN.solution.json      Task 2.8, 5a.3, 3.3, 4.2
tools/validate-level.ts                                                   Task 2.8
tests/helpers.ts  tests/unit/*.test.ts  tests/replay/*.replay.json  replay.test.ts
e2e/smoke.spec.ts  playwright.config.ts                                   Task 5b.1
```

## Що вже перевірено під час написання плану

Код ядра, тести, валідатор, `check-boundaries`, `guard-core` і `hooks-selftest` з цього плану я прогнав у чернетці (2026-10-01):
- фінальна версія: `tsc --noEmit` (strict) чисто, **Vitest 76/76** у 10 файлах (Node 24.21);
- версія етапу 2 (без ворогів): `tsc` чисто, **Vitest 66/66**, результати сценаріїв ті самі, що у фінальної версії;
- `hooks-selftest`: **23/23 PASS** (у Task 0.2 додано 4 перевірки форм імпорту, тепер очікується 27);
- `level-loop.mjs`: лише `node --check` і перевірка аргументів. **Справжній прогін `claude -p` не робився**, бо він коштує грошей. Його перевірка — Task 4.1;
- `main.ts`, `draw.ts`: запущено у браузері через Playwright MCP (Vite dev, тестовий рівень). Старт `x = 2, y = 210`; 0.5 с «вправо» → `x = 62` (30 тіків); смерть на шипах → перезапуск, `deaths` росте; HUD і рендер видно. Знахідка: без `<link rel="icon">` браузер дає 404 на `favicon.ico`, і це рядок `error` у консолі. Тому в `index.html` (Task 0.1) є порожня іконка;
- `e2e/smoke.spec.ts`, `playwright.config.ts`: лише typecheck. Сам Playwright-тест, CI і команди OpenSpec **не запускались**.

Числа тіків у тестах (наприклад, смерть на тіку 41) виміряні на цьому коді, а не виведені вручну. Якщо людина змінить `PHYS`, ці числа зміняться.
