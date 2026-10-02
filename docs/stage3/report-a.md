# Звіт worker A (enemies)

Сесія `b729724d`, worktree `D:/AITools/trap-runner-a`, гілка `stage3/enemies`. Звіт у формі брифу збережено дослівно (вставила людина 2026-10-02).

## Звіт worker'а (дослівно)

```
Status: complete
Base / result revision: base 2aefcda (contract-c0); red 1c22360; green is not committed yet (the change is in the working tree, waiting for you)
Changed files: src/core/enemies.ts (bodies of moveEnemies and resolveEnemyContacts, plus 3 imports: overlaps, die, PHYS)
               tests/unit/enemies.test.ts, tests/replay/ENEMY-{side,stomp,trap}-01.replay.json (in 1c22360, copied exactly from the brief)
Scenarios and commands: ENEMY-side-01, ENEMY-stomp-01, ENEMY-trap-01, tests/unit/enemies.test.ts; pnpm test (red), pnpm check (green)
Actual exit/result:
  red  (pnpm test):  Tests  7 failed | 69 passed (76), all AssertionError
  green (pnpm check, exit 0):
    check-boundaries: 11 files in src/core, 0 violations
     Test Files  10 passed (10)
          Tests  76 passed (76)
    PASS level-01.json
    validate-level: 1 levels, 0 failed
    spec:check ok — specs: 2 · active changes: 0 · archived: 2
Known gaps / interface requests: no contract change was needed. types.ts, PHYS, the signatures and the tests have not changed since 1c22360. No new dependencies.
  - If one tick has a stomp on enemy A and a side hit on enemy B, the stomp wins and the player lives. This follows the "a stomp beats a side hit" comment, but no test covers two enemies in one tick.
  - The 3 new imports are outside "bodies only". They are needed and do not change any signature.
Next action: the human commits green; after that, the orchestrator joins worker A with worker B.

To commit green (it leaves out .agent-log/actions.jsonl):
! git add src/core/enemies.ts && git commit -m "feat(core): enemy patrol and contacts (FR-1..FR-4)"

I did not update docs/session-notes.md, because the brief does not list it as a file I may change. The orchestrator can record this result there.
```

Проміжне повідомлення worker'а перед червоним комітом (скорочено): червоні файли не закомічені, worker чекає коміту людини; `Tests  7 failed | 69 passed (76)`, усі `AssertionError`; план зеленого — stomp на будь-якому ворогові перемагає удар збоку.

## Перевірка orchestrator (сесія `08110719`)

- Червоний стан: 4 файли тестів = блоки брифу байт у байт; перепрогін `pnpm test` у worktree A — `Tests  7 failed | 69 passed (76)`, 7 `AssertionError`, без помилок import. Червоний коміт `1c22360` (людина).
- Зелений стан: `git diff --stat 1c22360` — лише `src/core/enemies.ts` (+ журнал hook'ів, не в коміті); `src/core/types.ts` = `contract-c0`; `tests/` = `1c22360`; `src/core/physics.ts` без змін; експорти `ENEMY_W`, `ENEMY_H`, `createEnemies`, `moveEnemies`, `resolveEnemyContacts` — сигнатури контракту. `pnpm check` у worktree A — exit 0, `Tests  76 passed (76)`. Зелений коміт `d31c5e5` (людина).
- Порівняння з еталоном плану (Task 3.3): `moveEnemies` — однаковий. `resolveEnemyContacts` — інший: worker збирає всі дотики, і stomp на будь-якому ворогові рятує гравця від удару збоку іншого ворога. В еталоні цикл іде за порядком `w.enemies`, і перший удар збоку вбиває гравця. Тести брифу цей випадок не покривають. Рішення — людина, `decisions.md`.
- Відхилення від брифу: 3 нові `import` поза «bodies only» — worker назвав сам; сигнатури не змінено.
