# Журнал вимірювань контексту

> Один цикл: виміряти → змінити РІВНО ОДНЕ → виміряти → той самий промпт у СВІЖІЙ сесії.

| Дата | Модель | Зміна харнесу (одна) | До: Free space / MCP tools / Skills / Memory | Після: ті самі рядки | Доказ поведінки (ідентичний промпт, свіжа сесія) |
|---|---|---|---|---|---|
| 2026-10-02 | Opus 5.5 (`claude-opus-5-5`), вікно 1m | додано skill `.claude/skills/make-level/` | Free space 933.7k (93.4%) / MCP tools 52 · 638 tokens (loaded on-demand) / Skills 79 · 9.6k tokens / Memory files 4 · 1.5k tokens | | |

Решта рядків `/context` «до» (для звірки, що змінилось лише Skills): System prompt 2.4k, System tools 16.3k, MCP server instructions 717, Custom agents 4 · 862, Messages 1.3k; режим сесії `bypassPermissions`.

**Прогін «до»** (сесія `5b25fa8d`, 07:36:01–07:37:35Z, ≈1.5 хв): 12 дій, усі `Bash` (файли рівня писано heredoc, без `Write`), 0 викликів `Skill`. Явний `pnpm validate:levels levels/level-50.json` — 1 раз (за звітом агента; у журналі `cmd` обрізано до 200 символів, тож рядок не видно), ще 1 раз усередині `pnpm check`; обидва PASS з першої спроби. До валідації агент підібрав тіки стрибків власним скриптом-трасувальником у scratchpad: 3 команди, ≈17 прогонів `runReplay`. Конкретні тіки і дизайн рівня тут свідомо не записано: прогін «після» теж прочитає цей файл. Незалежний повтор: `pnpm validate:levels levels/level-50.json` → `PASS level-50.json`, `validate-level: 1 levels, 0 failed`, exit 0.

**Прогін «до» НЕ сліпий.** Друга дія агента (07:36:06Z): `cat docs/plan/stage-1-context.md; cat docs/context-log.md; git diff docs/autonomy-log.md`. Агент прочитав повний текст skill `make-level` з плану і незакомічений рядок #13 журналу автономності (там є слова «прогін без skill `make-level`»). Агент сам повідомив про це у звіті. Наслідок: різниця «до/після» в поведінці може бути меншою за справжню; надійний доказ «після» — лише рядок `"tool":"Skill"`. Умова однакова для обох прогонів: `docs/plan/` доступний і в прогоні «після».

Промпт (дослівно, однаковий для обох прогонів):
```
Create levels/level-50.json and its solution file. The level must pass validation.
```
