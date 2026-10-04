# Журнал мутацій — перевірка перевіряючого

> Етап 5b, Task 5b.2. Курс: гейт, якого ніхто не бачив червоним, не рахується (день 04 §9, день 06 §12).
> Мутацію вносить один Edit, після неї `pnpm test`, потім відкат. Одна мутація за раз.

- Дата: 2026-10-04. База: `c61a5d7`, до мутацій `Tests  87 passed (87)`.
- Мутації вніс і відкотив агент (сесія `2bf30e4f`, режим `auto`) за дорученням людини («мутації вноси сам»). План дає рівень 1: «людина робить і відкочує». Відхилення записано в `docs/autonomy-log.md`.
- Кожен Edit є в `.agent-log/actions.jsonl` (PreToolUse і PostToolUse з тим самим `id`, поле `path`). `guard-core` жодної мутації не заблокував: заборон `src/core` вони не порушують.
- Не плутати з мутаціями M1–M3 етапу 3 (`docs/stage3/decisions.md`): там перевіряли тести ворогів.

| # | Мутація | Команда | Червоні тести (дослівно) | Причина падіння — поведінка? | Відкат |
|---|---|---|---|---|---|
| M1 | `src/core/physics.ts`, `moveY`, гілка `dy < 0`: `if (isSolid(grid, tx, ty))` → `if (false)` (стеля не зупиняє). Edit `toolu_01YBGykMPpMwiQ2WKuC3Ra6e`, 07:38:51Z | `pnpm test` | `FAIL  tests/unit/physics.test.ts > physics > a jump hits the ceiling and does not pass through it`; `Tests  1 failed \| 86 passed (87)` | так: `AssertionError: expected -10 to be 32 // Object.is equality` — гравець пройшов крізь стелю (y = −10 замість 32 під стелею) | `git checkout -- src/core/physics.ts`, `git diff --quiet` → без змін |
| M2 | `src/core/physics.ts`, `stepPlayer`: прибрано `&& !p.jumpHeld`. Edit `toolu_01LLTKphcE1m7JMRGukiL7Y6`, 07:39:08Z | `pnpm test` | `FAIL  tests/replay/replay.test.ts > replay scenarios > MOVE-no-autojump-01 (MOVE-no-autojump-01.replay.json)`; `FAIL  tests/unit/physics.test.ts > physics > jump only on press: holding the key does not jump again after landing`; `Tests  2 failed \| 85 passed (87)` | так: `AssertionError: expected { x: 2, y: 13, w: 12, h: 14, …(4) } to match object { y: 34, onGround: true }` — з утриманою клавішею гравець після приземлення знову стрибнув | `git checkout -- src/core/physics.ts`, `git diff --quiet` → без змін |
| M3 | `src/core/interactions.ts`, `resolveInteractions`: блок фінішу перенесено перед цикл шипів (після ворогів). Edit `toolu_01EbRsfZ4oBA5jJtjtQEVKsy` і `toolu_01Dg83ct1vMJGCHknwrZa4rT`, 07:39:27Z | `pnpm test` | `FAIL  tests/replay/replay.test.ts > replay scenarios > TRAP-goal-death-01 (TRAP-goal-death-01.replay.json)`; `FAIL  tests/unit/step.test.ts > step > death beats the goal in the same tick`; `Tests  2 failed \| 85 passed (87)` | так: `AssertionError: unexpected {"type":"levelComplete"}: expected true to be false` і `AssertionError: expected [ { tick: 41, …(1) }, …(1) ] to deeply equal [ { tick: 41, type: 'died', …(1) } ]` — у тіку 41 є і `levelComplete`, і `died`. Статус лишається `dead` (`die()` пише його останнім), тож тест лише на `status` мутацію пропустив би: ловить порівняння всього масиву `events` і поле `absent` у replay | `git checkout -- src/core/interactions.ts`, `git diff --quiet src/core` → без змін |

## Висновок

- Усі три мутації дали червоні саме очікувані тести, кожен з `AssertionError`, без помилок import чи синтаксису. Знахідок «слабкий тест» немає, нових тестів не додано.
- `ENEMY-goal-death-01` на M3 зелений, і це правильно: контакт з ворогом перевіряється до обох переставлених блоків.
- Межа: три мутації — вибірка, а не повний mutation testing. Інші місця ядра цей запис не покриває.
