# Журнал вимірювань контексту

> Один цикл: виміряти → змінити РІВНО ОДНЕ → виміряти → той самий промпт у СВІЖІЙ сесії.

| Дата | Модель | Зміна харнесу (одна) | До: Free space / MCP tools / Skills / Memory | Після: ті самі рядки | Доказ поведінки (ідентичний промпт, свіжа сесія) |
|---|---|---|---|---|---|
| 2026-10-02 | Opus 5.5 (`claude-opus-5-5`), вікно 1m | додано skill `.claude/skills/make-level/` | Free space 933.7k (93.4%) / MCP tools 52 · 638 tokens (loaded on-demand) / Skills 79 · 9.6k tokens / Memory files 4 · 1.5k tokens | Free space 933.7k (93.4%) / MCP tools 52 · 638 tokens (loaded on-demand) / Skills **80 · 9.7k tokens** (+1 skill, +0.1k) / Memory files 4 · 1.5k tokens | Сесія `7011e9a7`: перша дія — `"tool":"Skill"`, `id` `toolu_01BVa9gr7JHWwedz4p4db7jW`, `ts` 2026-10-02T08:09:02.150Z, exit 0; у транскрипті сесії `"input":{"skill":"make-level"}`. «До» (`5b25fa8d`): 0 `Skill`. В обох прогонах PASS з першого `validate:levels` |

Решта рядків `/context` «до» (для звірки, що змінилось лише Skills): System prompt 2.4k, System tools 16.3k, MCP server instructions 717, Custom agents 4 · 862, Messages 1.3k; режим сесії `bypassPermissions`.

Решта рядків `/context` «після»: System prompt 2.4k, System tools **16.2k** (було 16.3k), MCP server instructions 717, Custom agents 4 · 862, Messages 1.3k; усього 33.3k/1m, як і «до». Зміна Skills (+0.1k) менша за крок округлення `/context`, тому Free space не змінився (933.7k). System tools −0.1k — не пояснено: харнес між вимірами не змінювали (лише коміт `4db3375` зі `SKILL.md`), імовірно, округлення.

**Прогін «до»** (сесія `5b25fa8d`, 07:36:01–07:37:35Z, ≈1.5 хв): 12 дій, усі `Bash` (файли рівня писано heredoc, без `Write`), 0 викликів `Skill`. Явний `pnpm validate:levels levels/level-50.json` — 1 раз (за звітом агента; у журналі `cmd` обрізано до 200 символів, тож рядок не видно), ще 1 раз усередині `pnpm check`; обидва PASS з першої спроби. До валідації агент підібрав тіки стрибків власним скриптом-трасувальником у scratchpad: 3 команди, ≈17 прогонів `runReplay`. Конкретні тіки і дизайн рівня тут свідомо не записано: прогін «після» теж прочитає цей файл. Незалежний повтор: `pnpm validate:levels levels/level-50.json` → `PASS level-50.json`, `validate-level: 1 levels, 0 failed`, exit 0.

**Прогін «до» НЕ сліпий.** Друга дія агента (07:36:06Z): `cat docs/plan/stage-1-context.md; cat docs/context-log.md; git diff docs/autonomy-log.md`. Агент прочитав повний текст skill `make-level` з плану і незакомічений рядок #13 журналу автономності (там є слова «прогін без skill `make-level`»). Агент сам повідомив про це у звіті. Наслідок: різниця «до/після» в поведінці може бути меншою за справжню; надійний доказ «після» — лише рядок `"tool":"Skill"`. Умова однакова для обох прогонів: `docs/plan/` доступний і в прогоні «після».

**Прогін «після»** (сесія `7011e9a7`, `bypassPermissions`, 08:09:02–08:10:31Z, ≈1.5 хв): 12 дій (11 `Bash` + 1 `Skill`), усі exit 0. Порядок дій збігається з кроками skill: `session-notes.md` → `docs/design.md` §5–6 (`sed -n 73,128p`) → `level.schema.ts`, `validate-level.ts` → ядро → симулятор у scratchpad → `pnpm validate:levels levels/level-50.json` → `pnpm check`. `docs/plan/stage-1-context.md` і `docs/context-log.md` агент НЕ читав (шлях до плану є в транскрипті лише як частина виводу `session-notes.md`). Симулятор: 2 команди, у журналі видно 1 прогін з 4 тіками стрибків (у «до»: 3 команди, ≈17 прогонів). Явний `validate:levels` — 1 раз + 1 у `pnpm check`, обидва PASS. Незалежний повтор агентом `b0f10438`: `PASS level-50.json`, `validate-level: 1 levels, 0 failed`, exit 0.

**Висновок (третя колонка).** Skill підхоплено: є рядок `"tool":"Skill"` з `make-level`, і це перша дія сесії. Різниця в результаті мала: обидва прогони дали PASS з першої валідації за ≈1.5 хв і 12 дій. Причина — прогін «до» не сліпий: агент прочитав той самий текст skill у `docs/plan/stage-1-context.md`. Видима різниця — джерело процедури (skill замість файлу плану) і менше прогонів симулятора до валідації (≈17 → видно 1). Вимір на одному прогоні кожного боку, тож різниця в кількості прогонів може бути випадковою.

Промпт (дослівно, однаковий для обох прогонів):
```
Create levels/level-50.json and its solution file. The level must pass validation.
```
