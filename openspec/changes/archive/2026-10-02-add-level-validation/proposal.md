## Why

The core (`core-gameplay`) accepts any `LevelDef` and does not check it. A level with 14 rows, two `S` tiles or a trap that names a missing coin loads without an error and fails later in the game. Stage 5 adds the real levels. Before that, each level needs an automatic gate: a level schema, structural checks, and a proof that a recorded solution completes the level.

## What Changes

- Add a zod level schema in `levels/level.schema.ts`: `LevelSchema`, `SolutionSchema` and `asLevelDef`. The schema accepts only 15 rows, only the tiles `.` `#` `^` `o` `S` `G`, and an id of the form `level-NN`.
- Add the function `validateLevel(levelJson, solutionJson): string[]` in `tools/validate-level.ts`. An empty array means that the level is valid. Each error is one line of text with a fixed prefix.
- The structural checks:
  - rows of equal length,
  - exactly one `S` and one `G`,
  - unique trap ids,
  - a coin event that names an existing coin,
  - trigger and action targets inside the level.
- The solution checks: the solution exists, and its run on the real `step()` does these 3 things:
  - it ends with `levelComplete`,
  - it triggers at least one trap,
  - it collects at least one coin.
- Add the CLI `pnpm validate:levels [file...]`. Without arguments, it checks all `levels/level-NN.json` files. It reads the solution from `levels/level-NN.solution.json` next to each level. It exits 1 if a level fails.
- Add `pnpm validate:levels` to `pnpm check`.
- Not in this change: enemies (`enemies[]`, patrol inside the level) are stage 3. The schema rejects the key `enemies` until then. The real levels and their solutions are stage 5. The `R` key that records a solution is a later stage.

## Capabilities

### New Capabilities
- `level-validation`: the level schema, the structural checks and the solution proof on the real core. It also covers the CLI that runs them on the files in `levels/`.

### Modified Capabilities
None. `core-gameplay` does not change. Its Purpose already says that the level validator checks the level height.

## Impact

- New code: `levels/level.schema.ts`, `tools/validate-level.ts`. Both are outside `src/core/`. `tools/validate-level.ts` uses `node:fs`. It imports `runReplay` and `LEVEL_HEIGHT` from `src/core/`. `src/core/` does not import from `tools/` or `levels/`.
- New test: `tests/unit/validate-level.test.ts` with 9 tests.
- `package.json`: a new script `validate:levels` (`tsx tools/validate-level.ts`) and a longer `check` script.
- `.claude/settings.json` needs 2 new `allow` lines for `pnpm validate:levels`. This file is the control layer, so the human adds them.
- No new dependencies. `zod` and `tsx` are already devDependencies.
