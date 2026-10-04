## Context

See proposal.md, "Why". Current state at `9d03d38`:

- `levels/level.schema.ts`: the `Enemy` object has `y: Int.min(0)` and no `.strict()`. The level object and the solution schema use `.strict()`. `levels/level.schema.ts` did not change after the tag `contract-c0` (`git diff --stat contract-c0 HEAD -- levels/level.schema.ts` prints nothing).
- `tools/validate-level.ts`: `validateLevel` exists. It maps each schema issue to the line `schema: <path>: <message>` and returns only these lines when the schema fails. It checks the enemy ids and the patrol. It does not check `y`.
- `src/core/types.ts`: `LEVEL_HEIGHT = 15`. `EnemyDef` has exactly the keys `id`, `x`, `y`, `patrol` and `speed`.
- `tests/unit/validate-level.test.ts`: 14 tests. It declares `valid` (`fx-valid`), `solution` (`sol-right-120`), `e1 = { id: "e1", x: 8, y: 0, patrol: [7, 9], speed: 1 }` and the helper `has`.
- At the start of this session: `pnpm test` → `Tests  85 passed (85)`. `pnpm test tests/unit/validate-level.test.ts` → `Tests  14 passed (14)`. zod is `4.6.5`.

## Goals / Non-Goals

**Goals:**
- The validator rejects an enemy with `y` 15 or more (open question 3 of change `add-enemies`).
- The validator rejects an enemy object with a key that the enemy schema does not name (open question 9).
- Each rule has a test. The test fails before the code change and passes after it.

**Non-Goals:**
- Other keys of a trap, a trigger or an action. A trap object also accepts other keys (open question 9 of change `add-enemies`). The human decided only about the enemy object.
- Tile rules for an enemy (an empty patrol path, a floor under the patrol). Open question 5 of change `add-enemies` stays as `docs/design.md` §5 gives it.
- A change of `tools/validate-level.ts`, `src/`, `levels/*.json` or `PHYS`.

## Decisions

### D1. Both checks go into the schema (`levels/level.schema.ts`)

**The `y` range.** Change `y: Int.min(0)` to `y: Int.min(0).max(LEVEL_HEIGHT - 1)`. Import `LEVEL_HEIGHT` from `../src/core/types` (the file already imports the type `LevelDef` from there).
- Reason: the bound depends only on the fixed level height. It does not compare two fields and does not need the level width. The schema already has the lower bound `y ≥ 0` and the row count `.length(15)`. With this change, one line has the full range of `y`.
- Alternative: a check in `tools/validate-level.ts` with a new line such as `enemy e1: y must be inside the level`. Rejected: the range of one value is then in two files. `tools/validate-level.ts` is for rules that compare two values, such as the patrol and the level width.
- Alternative: `.max(14)`. Rejected: a second copy of the height. The schema line `.length(15)` is an existing copy, and this change does not touch it.
- Cost: an enemy with `y` 15 is a schema error, so the validator does not do the structure checks for that level. The spec says this for each schema error ("Level schema").

**Other keys of an enemy.** Add `.strict()` to the `Enemy` object.
- Reason: only the schema sees the unknown key. `z.object` without `.strict()` removes unknown keys when it parses. `tools/validate-level.ts` gets the parsed data, so it cannot see `foo`. The level object and the solution schema already use `.strict()`.
- Alternative: a check in `tools/validate-level.ts` on the raw JSON. Rejected: a second read of the input, outside the schema.

### D2. The error lines come from a probe, not from a guess

A probe script in the scratchpad (`probe-d.ts`, not a test) builds the proposed schema: `LevelSchema.extend({ enemies: z.array(Enemy).optional() })`, where `Enemy` has `y: Int.min(0).max(LEVEL_HEIGHT - 1)` and `.strict()`. It formats each issue as `validateLevel` does. Output of this session:

```
== current validateLevel ==
y14 []
y15 []
foo []
== proposed schema, lines as validateLevel formats them ==
y14 OK
y15 ["schema: enemies.0.y: Too big: expected number to be <=14"]
foo ["schema: enemies.0: Unrecognized key: \"foo\""]
strict kept: true
== real levels, proposed schema ==
level-01 OK
level-02 OK
level-03 OK
```

- "current validateLevel" shows that each case returns `[]` now. So a test that expects an error line fails with an `AssertionError` before the code change. `y14 []` also shows that the full validator, with the solution run, accepts an enemy in row 14.
- The scenarios `LEVEL-enemy-y-01` and `LEVEL-enemy-keys-01` use these exact lines.

### D3. The levels agree with the new rules

Only `levels/level-03.json` has enemies: `[{"id":"e1","x":14,"y":13,"patrol":[10,18],"speed":1}]`. `y` 13 is less than 15, and the enemy has no other keys. The probe (D2) parses the 3 levels with the proposed schema: `OK` for each. `pnpm validate:levels` in this session, before the change:

```
PASS level-01.json
PASS level-02.json
PASS level-03.json
validate-level: 3 levels, 0 failed
```

Exit code 0. Task 2.2 runs it again after the change.

### D4. Contract C0: the human permits the change of `levels/level.schema.ts`

`levels/level.schema.ts` is part of contract C0 (tag `contract-c0`, commit `2aefcda`). The human permits a change of this file in this change. The permission covers only the `Enemy` object (D1) and the import of `LEVEL_HEIGHT`. The level object, the trap objects and `SolutionSchema` do not change. `src/core/types.ts` (also in contract C0) does not change: `EnemyDef` already has exactly the 5 keys, and the type does not hold the range of `y`. The compile check `asLevelDef` stays valid.

### D5. New text for `docs/design.md` §7

After this change, the text of `docs/design.md` §7, "Перевірка рівнів", item 1, is old. It says that the validator does not check the `y` of an enemy and other keys of an enemy. This change does not edit `docs/`. The human (or the reviewer session) replaces item 1 with this text:

> 1. **Валідатор:** схема zod і семантика. Рядки однакової довжини, рівно один `S` і один `G`, висота 15, унікальні id, посилання тригерів існують, `rect` у межах рівня. Ворог: патруль у межах рівня, `x` всередині патруля, `y` у межах рівня (`0 ≤ y ≤ 14`). Об'єкт ворога має лише ключі `id`, `x`, `y`, `patrol`, `speed`, інший ключ — помилка.

`docs/design.md` §5 needs no change. It does not list the validator rules for `y` and for the keys.

### D6. Test shape

- Each new test goes at the end of `describe("validateLevel")` and uses the declared `e1`.
- Each test compares the full result with `toEqual([...])`, not with `has(...)`. A schema error stops the validator, so the result has exactly one line. The full compare also catches a wrong path, for example `enemies.0` in place of `enemies.0.y`.
- `an enemy y must be inside the level` first checks `y: 14` (expected `[]`), then `y: 15`. The `y: 14` check passes now. It guards the bound after the change: `.max(13)` would make it fail. The `y: 15` check fails before the change, so the test fails with an `AssertionError`.

## Risks / Trade-offs

- [A zod update changes the text of a message, and the 2 tests fail] → The lines are from zod `4.6.5`. A red test after an update shows the change. Then the spec and the tests change in a new change.
- [`.strict()` breaks a level file with an extra enemy key] → D3: no level file has one.
- [A level author writes a key for a later feature, such as `dir`] → It is now an error. The author adds the key to the schema in the same change as the feature.
- [The red commit has a failing `pnpm check`] → The pre-commit hook runs only `pnpm typecheck && pnpm boundaries` (`docs/design.md` §7). Task 1.3 runs `pnpm typecheck` before the stop.
