## Context

See proposal.md for the motivation. Current state:

- The core of change A is archived (`openspec/specs/core-gameplay/`). `runReplay(level, inputs)` in `src/core/replay.ts` runs one attempt and stops at the first end of the attempt. `createWorld` throws when `S` or `G` is missing.
- `LevelDef` in `src/core/types.ts` has `id`, `tiles` and `traps`. `LEVEL_HEIGHT` is 15.
- The directories `levels/` and `tools/` do not exist. `tsconfig.json` already includes both.
- `pnpm check` runs typecheck, `pnpm boundaries`, Vitest (`Test Files  7 passed (7)`, `Tests  46 passed (46)`) and `pnpm spec:check`.
- `zod` 4 and `tsx` are devDependencies.

Sources of the approach:

- `docs/design.md` §5 (level format, traps) and §7 ("Перевірка рівнів").
- `docs/plan/stage-2-core.md` Task 2.7. The plan holds the exact code and the 9 tests. The expected test counts in tasks.md come from the plan.

## Goals / Non-Goals

**Goals:**
- One function `validateLevel` that the unit tests and the CLI both use.
- A level that passes the validator loads in `createWorld` without a throw, and its solution completes it on the real `step()`.
- A gate in `pnpm check` that the human saw red at least once (design.md §7, "Перевірка перевіряючого").

**Non-Goals:**
- Enemies and the patrol check. The schema rejects `enemies` until stage 3 extends it.
- A check that the level `id` is equal to the file name.
- Level loading in the game. `src/` does not import the schema in this change.
- Difficulty, fairness or other solutions. The proof shows only that the recorded solution works (design.md §7, "Межі перевірки").

## Decisions

### D1. The validator is outside `src/core/`
`levels/level.schema.ts` and `tools/validate-level.ts` import from `src/core/`. `src/core/` does not import from them. The CLI uses `node:fs` and `process`, so it cannot be in `src/core/`.
- Alternative: the schema in `src/core/`. Then the core depends on zod, and the boundary check must also cover the schema file. The game does not need the schema at runtime yet.

### D2. Four stages with an early return
The order is schema → structure → solution file → solution run. A stage with errors stops the validator.
- Reason: a later stage needs an earlier stage without errors. `createWorld` throws on a level without `S`, and a run on a broken level gives noise instead of a clear error.
- Cost: a level with a schema error and a missing solution shows only the schema error. The author corrects the level and runs the validator again.

### D3. Each error is a text line that starts with a known prefix
Each error is a string with the prefix `schema:`, `tiles:`, `traps:`, `trap <id>:` or `solution:`. The tests assert a part of the line (`expect.stringContaining`). The CLI prints the lines as they are.
- Alternative: typed error objects with a code. This adds code, and the only consumers are the tests and a human who reads the CLI output.

### D4. `asLevelDef` is a compile-time link between the schema and `LevelDef`
`asLevelDef(l: z.infer<typeof LevelSchema>): LevelDef => l` has no runtime effect. When `types.ts` and the schema differ, `pnpm typecheck` fails.

### D5. The proof uses `runReplay`
The run uses the same runner as the replay tests. It stops at the first `died` or `levelComplete`. So a solution is one attempt: it cannot die and then complete the level.

### D6. The CLI finds the solution from the level file name
For `levels/level-01.json` the CLI reads `levels/level-01.solution.json`. This is equal to `levels/<id>.solution.json` when the file name is equal to the `id`. The validator does not check that the two are equal (see Non-Goals).

### D7. Traceability through the test title
The project rule says that a scenario id is the name of a replay file. This change has no replay files. The 9 tests of the plan keep their titles word for word. The scenario heading in the spec is `<id> — <test title>`, so a search for the title finds the test. The two CLI scenarios have no test. Tasks 2.2 and 2.3 run them as commands.
- Alternative: add the id to each test title, for example `test("LEVEL-valid-01: a valid level …")`. Then the test output shows the id, but the test file differs from the plan in 9 lines.

### D8. `package.json` is edited by hand
The plan uses `pnpm pkg set "scripts.validate:levels=…"`. pnpm 12.8.1 rejects `:` in the key (`ERR_PNPM_PKG_INVALID_PROPERTY_PATH`, see `docs/session-notes.md`). Task 2.2 edits the two scripts in `package.json` directly.

## Risks / Trade-offs

- [The 9 tests cover 9 rules. These 9 rules have no test:
  - allowed tile characters, the `id` format, other keys,
  - exactly one `G`, unique trap ids,
  - a `zone` rect outside the level, a `moveGoal` target outside the level,
  - "the run collects no coin", the solution schema.]

  → The spec states each rule with its exact error line. The human decides at review: accept the gap, as for change A, or add one scenario and one test for each rule before apply.
- [The CLI runs `main` only when `import.meta.url` is equal to `pathToFileURL(process.argv[1]).href`. If this is false under `tsx` on Windows, the CLI prints nothing and exits 0. Then `pnpm check` is green without a check.] → Task 2.2 requires the line `validate-level: 0 levels, 0 failed`. Task 2.3 requires exit 1 for a bad level. If one of them is missing, the agent stops and reports.
- [The text of a zod message can change with the zod version.] → `LEVEL-rows-01` asserts only `schema: tiles`.
- [`LEVEL-solution-complete-01` expects tick 42. This value depends on `PHYS.runSpeed` = 2.] → `PHYS` belongs to the human. A change of `PHYS` already breaks the replay scenarios of change A.
- [The line for a missing solution has the literal text `levels/<id>.solution.json`. It does not show the real path.] → The plan code keeps it. See Open Questions.

## Migration Plan

Not applicable. The change adds new files and two scripts. To roll back, revert the commits of the change. No level files exist yet.

## Open Questions

- Should the line for a missing solution name the real path, for example `levels/level-90.solution.json`? The test asserts only `solution: file not found`, so a later change can do this without a change to the tests.
