# Етап 3 — рішення людини щодо знахідок checker'а

Звіт: `docs/stage3/checker-report.md` (сесія `a3668d3a`, коміт `bdef7a5`). Рівень довіри для рішень — 1: вирішує людина.
Колонка «Рекомендація orchestrator» — пропозиція агента; рішення і причину пише людина.

| # | Знахідка checker'а | Рекомендація orchestrator | Рішення людини (прийняти / відхилити) | Чому | Коміт |
|---|---|---|---|---|---|
| 1 | F1: немає тесту «stomp і удар збоку в одному тіку» (`design.md` §7 вимагає). Код worker'а A правильний (E7) | прийняти: unit-тест з двома ворогами (stomp на `e1`, удар збоку `e2` в одному тіку → гравець живий, `e1` мертвий, `enemyStomped`). На поточному коді тест зелений одразу; що він ловить поведінку — довести мутацією (еталонний цикл з плану → тест червоний) | прийняти | згода з рекомендацією orchestrator (людина: «усе як рекомендуєш», 2026-10-02) | `60e679f` |
| 2 | Розбіжність код worker'а A ↔ еталон плану (знахідка orchestrator, checker її не бачив): еталон для «stomp на `e1` + удар збоку `e2`» вбиває гравця або залежить від порядку `w.enemies` | прийняти код worker'а: він виконує `design.md` §6 «перемагає стрибок зверху» без залежності від порядку; еталон плану в цьому випадку §6 порушує. Закріплює рішення тест з #1 | прийняти | згода з рекомендацією orchestrator (людина: «усе як рекомендуєш», 2026-10-02) | `60e679f` |
| 3 | F2: `ENEMY-trap-01` не перевіряє тік, FR-4 «in the tick of that stomp» не покрито (CX2) | прийняти: CX2 як новий `tests/replay/ENEMY-trap-tick-01.replay.json`; закомічений `ENEMY-trap-01` не змінювати | прийняти | згода з рекомендацією orchestrator (людина: «усе як рекомендуєш», 2026-10-02) | `60e679f` |
| 4 | E9 / CX3: смерть від ворога і фініш в одному тіку — тесту немає | прийняти: CX3 як `tests/replay/ENEMY-goal-death-01.replay.json` (Review Focus #4, варіант з ворогом) | прийняти | згода з рекомендацією orchestrator (людина: «усе як рекомендуєш», 2026-10-02) | `60e679f` |
| 5 | CX1: stomp на межі (нижній край = верх ворога) через справжній `step()` | відхилити: межу вже ловить `enemies.test.ts:45` (мутація `<=` → `<` з тесту якості); дубль | відхилити | згода з рекомендацією orchestrator (людина: «усе як рекомендуєш», 2026-10-02) | |
| 6 | F3: спека відстала — `openspec/specs/core-gameplay/spec.md:5` «It has no enemies»; ENEMY-* без сценаріїв OpenSpec; етап 3 без OpenSpec-зміни | прийняти, окремою задачею після тегу `stage-3`: OpenSpec-зміна для ворогів (спека за реальністю). Це чесний кандидат на відкритий доказ SDD «спеку змінили, бо реальність не збіглася» (`session-notes.md`) | прийняти | згода з рекомендацією orchestrator (людина: «усе як рекомендуєш», 2026-10-02) | |
| 7 | N1: у рівнях немає ворогів, `draw.ts:52–53` не видно в грі й не перевірено | прийняти: це вже Task 3.5 Step 5 (ворог у level-03, рішення і розв'язок — людина) | прийняти | згода з рекомендацією orchestrator (людина: «усе як рекомендуєш», 2026-10-02) | `290bfca` (ворог `e1` x 14, патруль 10–18; розв'язок записала людина клавішею `R`: `enemyStomped:e1` на тіку 209, `levelComplete` на тіку 2841) |
| 8 | E5 (примітка): у тесті «rising into the enemy from below» `p.vy > 0` окремо не перевіряється; перевірка зайва, бо вороги рухаються лише горизонтально | без дії: не дефект | без дії | згода з рекомендацією orchestrator (людина: «усе як рекомендуєш», 2026-10-02) | |

## Нові тести за рішеннями #1, #3, #4 — доказ, що вони ловлять поведінку

Нові файли (агент-orchestrator, за рішенням людини): `tests/unit/stomp-vs-side.test.ts` (2 тести: stomp перемагає за обох порядків `w.enemies`), `tests/replay/ENEMY-trap-tick-01.replay.json` (CX2), `tests/replay/ENEMY-goal-death-01.replay.json` (CX3). На коді `bdef7a5` усі 4 зелені одразу: `Tests  80 passed (80)`. Червоного коміту немає — код уже правильний, тести закривають прогалини. Тому доказ — мутації (Edit агента, після кожної `git checkout -- <файл>`; після всіх трьох `git diff --quiet src/core`, `pnpm check` exit 0, `Tests  80 passed (80)`):

| Мутація | Де | Результат `pnpm test` | Що доводить |
|---|---|---|---|
| M1: тіло `resolveEnemyContacts` = еталонний цикл з плану (Task 3.3) | `src/core/enemies.ts` | `Tests  2 failed \| 78 passed (80)`: лише 2 тести `stomp-vs-side`, `AssertionError: expected 'dead' to be 'playing'` | рішення #1–#2: без нового тесту еталон, що порушує §6, проходив усі 76 тестів |
| M2 (штучна): `trapTriggered` з `tick: w.tick + 1` | `src/core/traps.ts:14` | `Tests  2 failed \| 78 passed (80)`: `ENEMY-trap-tick-01` і `TRAP-spikes-01`; `ENEMY-trap-01` зелений | рішення #3: FR-4 «в тому ж тіку» для `enemyStomped` тепер перевірено; раніше тік пастки перевіряли лише для zone-тригера (`TRAP-spikes-01`) |
| M3: без `if (w.status === "dead") return;` після `resolveEnemyContacts` | `src/core/interactions.ts:17` | `Tests  1 failed \| 79 passed (80)`: лише `ENEMY-goal-death-01`, `unexpected {"type":"levelComplete"}` | рішення #4: «смерть перемагає фініш» для ворога ловить лише новий replay |

## Review якості тесту (Task 3.5 Step 7)

Тест, який назвав checker: `tests/unit/enemies.test.ts:43` «falling onto the enemy from above kills the enemy and bounces the player». Мутацію зробив агент-orchestrator за дорученням людини («зроби мутацію сам»; у плані крок позначено [ЛЮДИНА]).

- Мутація: `src/core/enemies.ts:47` `prevBottom <= e.y` → `prevBottom < e.y` (Edit, `guard-core` пропустив).
- `pnpm test`: `Test Files  3 failed | 8 passed (11)`, `Tests  4 failed | 76 passed (80)`:
  - `enemies.test.ts` «falling onto the enemy from above…» — `AssertionError: expected true to be false` (ворог лишився живим) — **прогноз checker'а справдився**;
  - `stomp-vs-side.test.ts`, обидва тести — `AssertionError: expected 'dead' to be 'playing'`;
  - `ENEMY-trap-tick-01` — `missing {"type":"enemyStomped","id":"e1","tick":8}`, замість нього `{"tick":8,"type":"died","cause":"enemy"}`.
- Усі 4 падіння — через поведінку (`AssertionError`), без помилок import чи синтаксису.
- `ENEMY-stomp-01` і `ENEMY-trap-01` з брифу A на цій мутації **зелені**: їхній stomp не на точній межі. Межу через справжній `step()` тепер ловить `ENEMY-trap-tick-01` (рішення #3), тому відхилений CX1 (рішення #5) справді дубль.
- Відкат: `git checkout -- src/core/enemies.ts`; `git diff --quiet src/core` → чисто; `pnpm test` → `Tests  80 passed (80)`.
