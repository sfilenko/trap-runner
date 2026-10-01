# Етап 1 · Один цикл вимірювання контексту

**День курсу:** 02. **Рівень довіри:** 1–2. **Бюджет:** ≈0.5 год. Виконується **після етапу 2**: «одна зміна» тут — skill `make-level`, а йому потрібен валідатор рівнів.
**Результат етапу:** `docs/context-log.md` з **трьома** колонками (до / після / доказ поведінки). Курс: без третьої колонки не зараховано.

Чому саме skill, а не MCP: Playwright MCP у власника вже підключено глобально, тож проєктний `.mcp.json` не змінив би вимір.

**Правило циклу:** виміряти → змінити **рівно одне** → виміряти → **той самий промпт у свіжій сесії**.

---

### Task 1.1: Вимір «до» і прогін без skill

**Files:** Create: `docs/context-log.md`.

- [ ] **Step 1: шаблон журналу**

`docs/context-log.md`:
```markdown
# Журнал вимірювань контексту

> Один цикл: виміряти → змінити РІВНО ОДНЕ → виміряти → той самий промпт у СВІЖІЙ сесії.

| Дата | Модель | Зміна харнесу (одна) | До: Free space / MCP tools / Skills / Memory | Після: ті самі рядки | Доказ поведінки (ідентичний промпт, свіжа сесія) |
|---|---|---|---|---|---|
| | | додано skill `.claude/skills/make-level/` | | | |

Промпт (дослівно, однаковий для обох прогонів):
```
Create levels/level-50.json and its solution file. The level must pass validation.
```
```

- [ ] **Step 2 [ЛЮДИНА]: вимір «до».** Свіжа сесія `claude`. Команда `/context`. Перепиши в колонку «До» рядки Free space, MCP tools, Skills, Memory files **і назву моделі**.

- [ ] **Step 3 [ЛЮДИНА]: промпт «до».** У тій самій свіжій сесії дай промпт з журналу дослівно. Не допомагай агенту. Коли закінчить:

  Run: `pnpm agent:log`
  Запиши: скільки дій, чи викликався `validate:levels`, скільки разів, чи пройшла валідація.
  Потім **видали** `levels/level-50.json` і `levels/level-50.solution.json` вручну. Це лише вимір, рівень не потрібен.

---

### Task 1.2: Одна зміна — skill `make-level`

**Files:** Create: `.claude/skills/make-level/SKILL.md`.

- [ ] **Step 1 [РЕВ'Ю]: skill** (Strict STE; лінтер: 0 порушень)

`.claude/skills/make-level/SKILL.md`:
````markdown
---
name: make-level
description: Use when you create or change a Trap Runner level (levels/level-NN.json) and its solution file (levels/level-NN.solution.json). Gives the level format, the physics numbers, and the validation command.
---

# Make a level

## Steps

1. Read docs/design.md, sections 5 and 6.
2. Read one existing file in levels/ as an example, if one exists.
3. Write levels/level-NN.json. Use exactly 15 rows. All rows must have the same length. Use a width from 40 to 80 tiles.
4. Put exactly one S tile and exactly one G tile in the level. Put solid tiles (#) under S.
5. Put at least one coin (o) and at least one trap on the path from S to G.
6. Write levels/level-NN.solution.json in this form: {"inputs": [{"ticks": 30, "right": true}, {"ticks": 1, "right": true, "jump": true}]}.
7. Run this command: pnpm validate:levels levels/level-NN.json
8. If the output shows FAIL, read each error line. Change the level or the solution. Then do step 7 again.
9. Stop when the output shows PASS, or after 5 runs of step 7. Report the last output.

## Numbers

- One tile is 16 px. One tick is 1/60 s.
- The player runs 2 px per tick. A run of 8 ticks moves the player one tile.
- A jump goes up 60 px (3.75 tiles) and lasts about 31 ticks. A jump with "right" held moves the player about 62 px (4 tiles) forward.
- The jump starts only on a press. Release the jump key for at least one tick before the next jump.
- The first tick of an attempt has no ground contact. Do not jump on tick 0.
- A coin id is c<x>_<y>. A trap with an event trigger must name an existing coin id.

## Rules

- Do not change files in src/. If a level needs a change in src/, stop and report it as a blocker.
- Do not copy an existing level.
- Do not edit the validator or the tests to make a level pass.
````

- [ ] **Step 2 [ЛЮДИНА]: коміт** (окремий коміт = «рівно одна зміна»)
```bash
git add .claude/skills/make-level/SKILL.md
git commit -m "feat(harness): make-level skill"
```

---

### Task 1.3: Вимір «після», той самий промпт, третя колонка

- [ ] **Step 1 [ЛЮДИНА]: свіжа сесія, `/context`** → колонка «Після». Очікувано: у Skills з'явився рядок `make-level` (~100 токенів опису); Free space трохи менший.

- [ ] **Step 2 [ЛЮДИНА]: той самий промпт дослівно.**

  Run: `pnpm agent:log`
  Run: `grep '"tool":"Skill"' .agent-log/actions.jsonl | tail -n 2`
  Expected: рядок із `"tool":"Skill"` у цій сесії (агент підхопив процедуру), далі виклики `pnpm validate:levels levels/level-50.json`.

- [ ] **Step 3 [ЛЮДИНА]: третя колонка.** Доказ поведінки — це рядок журналу з `"tool":"Skill"` (його `ts` і `session`), плюс різниця з прогоном «до»: кількість ітерацій валідації, PASS/FAIL. Якщо агент **не** викликав skill, це теж чесний результат. Запиши його і подумай, чи `description` skill'а достатньо конкретний (курс, день 01 §14: description каже, *коли* використовувати).

- [ ] **Step 4 [ЛЮДИНА]: прибрати тестовий рівень, коміт, тег**

  Видали `levels/level-50*.json` (вони не потрібні грі).
```bash
git add docs/context-log.md .agent-log
git commit -m "docs: context measurement - make-level skill before/after"
git tag stage-1
```
