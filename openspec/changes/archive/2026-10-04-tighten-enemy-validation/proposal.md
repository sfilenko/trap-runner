## Why

The validator accepts two bad enemies (open questions 3 and 9 of change `add-enemies`). An enemy with `y` 15 or more is below the level. An enemy can also have an unknown key, such as `foo: 1`, that the game does not use. A probe in this session shows that `validateLevel` returns `[]` for both. The human decided that the validator must reject both cases.

## What Changes

- The level schema rejects an enemy with `y` 15 or more. The valid range of `y` is 0 to 14, the rows of a level. The schema already rejects `y` less than 0.
- The level schema rejects an enemy object with a key that the enemy schema does not name. The enemy keys are `id`, `x`, `y`, `patrol` and `speed`.
- **BREAKING** for level files: a level file with such an enemy now fails `pnpm validate:levels`. `levels/level-01.json`, `levels/level-02.json` and `levels/level-03.json` agree with the new rules (design D3).
- New tests: 2 tests in `tests/unit/validate-level.test.ts`. The code for the two rules does not exist, so each new test fails before the code change, with an `AssertionError`. The human commits the red tests, and then the green code.

### Scenario sources

| Requirement | Scenario | File |
|---|---|---|
| Level schema | `LEVEL-enemy-y-01` | `tests/unit/validate-level.test.ts`, test `an enemy y must be inside the level` (task 1.1) |
| Level schema | `LEVEL-enemy-keys-01` | `tests/unit/validate-level.test.ts`, test `an enemy must not have other keys` (task 1.2) |

The scenarios that "Level schema" already has (`LEVEL-rows-01`, `LEVEL-enemies-valid-01`) stay. The scenario comes before its test (decision D4 of change `add-enemies`).

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `level-validation`: change "Level schema". The `y` of an enemy is an integer from 0 to 14. Other keys of an enemy are errors.

## Impact

- Code: `levels/level.schema.ts` only. This file is part of contract C0 (tag `contract-c0`). The human permits this change (design D4). `tools/validate-level.ts` and `src/` do not change.
- Levels: no change. The 3 level files pass the new schema.
- Tests: `tests/unit/validate-level.test.ts` gets 2 tests. The test count goes from 85 to 87.
- Docs: the text of `docs/design.md` §7 ("Ще не перевіряються …") becomes old. The new text is in design.md of this change (D5). This change does not edit `docs/`.
- `PHYS` does not change. `## Purpose` of `level-validation` does not change.
