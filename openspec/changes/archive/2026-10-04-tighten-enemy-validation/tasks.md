Do not change `src/`, `tools/` or `levels/*.json`. Do not change `PHYS`. Do not change a test that exists. Do not commit. Stop after group 1 and after group 2 for the human commit. The human commits with `git add <files>`, not with `git commit -am`.

Each new test goes into `tests/unit/validate-level.test.ts`, at the end of `describe("validateLevel")`. Use the test title word for word. It is the text after the id in the heading of its scenario in `specs/level-validation/spec.md`. Use the enemy `e1` that the file declares. Do not declare it again.

The function `validateLevel` exists, so this change has no stub. If a new test passes before group 2, or fails with an import error or a syntax error, stop and report. Do not change the test or the code to make it agree.

## 1. Red tests (scenarios `LEVEL-enemy-y-01`, `LEVEL-enemy-keys-01`)

- [x] 1.1 Add the test `an enemy y must be inside the level` (scenario `LEVEL-enemy-y-01`, design D6):
  ```ts
  test("an enemy y must be inside the level", () => {
    expect(validateLevel({ ...valid, enemies: [{ ...e1, y: 14 }] }, solution)).toEqual([]);
    expect(validateLevel({ ...valid, enemies: [{ ...e1, y: 15 }] }, solution)).toEqual(["schema: enemies.0.y: Too big: expected number to be <=14"]);
  });
  ```
  Check: `grep -n "an enemy y must be inside the level" tests/unit/validate-level.test.ts` prints 1 line.
- [x] 1.2 Add the test `an enemy must not have other keys` (scenario `LEVEL-enemy-keys-01`) after the test of 1.1:
  ```ts
  test("an enemy must not have other keys", () => {
    expect(validateLevel({ ...valid, enemies: [{ ...e1, foo: 1 }] }, solution)).toEqual(['schema: enemies.0: Unrecognized key: "foo"']);
  });
  ```
  Check: `grep -n "an enemy must not have other keys" tests/unit/validate-level.test.ts` prints 1 line.
- [x] 1.3 Run `pnpm test tests/unit/validate-level.test.ts`. Expected: `Tests  2 failed | 14 passed (16)`. The 2 failed tests are the tests of 1.1 and 1.2. Each fails with an `AssertionError` (received `[]`), not with an import error or a syntax error. Quote the `Tests` line, the name of each failed test and its `AssertionError` line. Then run `pnpm typecheck` (expected: exit 0) and `pnpm test` (expected: `Tests  2 failed | 85 passed (87)`). Quote the `Tests` line.
- [x] 1.4 Run `git status --short`. Expected: changes only in `tests/unit/validate-level.test.ts` and `.agent-log/`. Stop. The human commits the red tests: `git add tests/unit/validate-level.test.ts`, then `git commit`.

## 2. Green code (design D1, D4)

- [x] 2.1 In `levels/level.schema.ts`, change only these lines:
  - `import type { LevelDef } from "../src/core/types";` → `import { LEVEL_HEIGHT, type LevelDef } from "../src/core/types";`
  - in `Enemy`: `y: Int.min(0),` → `y: Int.min(0).max(LEVEL_HEIGHT - 1),`
  - the `Enemy` object ends with `.strict()`: `const Enemy = z.object({ … }).strict();`

  Check: `pnpm test tests/unit/validate-level.test.ts` → `Tests  16 passed (16)`. Quote the `Tests` line.
- [x] 2.2 Run `pnpm validate:levels`. Expected: `PASS level-01.json`, `PASS level-02.json`, `PASS level-03.json`, the last line `validate-level: 3 levels, 0 failed`, exit code 0 (design D3). Quote the 4 lines.
- [x] 2.3 Run `pnpm test` (expected: `Tests  87 passed (87)`) and `git diff --quiet src tools tests levels/*.json` (expected: exit code 0). Run `git status --short`. Expected: changes only in `levels/level.schema.ts` and `.agent-log/`. Stop. The human commits the green code: `git add levels/level.schema.ts`, then `git commit`.

## 3. Spec check

- [x] 3.1 Run `pnpm exec openspec validate tighten-enemy-validation --strict`. Expected: the change is valid. Run `pnpm spec:check`. Expected: `spec:check ok — specs: 2 · active changes: 1 · archived: 3`. Quote both outputs.
- [x] 3.2 For each new scenario, run `grep -n "<title>" tests/unit/validate-level.test.ts` with the test title of the scenario. Quote one line for each scenario.
- [x] 3.3 Run pnpm check and quote its summary lines. Expected: exit 0, `Tests  87 passed (87)`, `validate-level: 3 levels, 0 failed` and `spec:check ok — specs: 2 · active changes: 1 · archived: 3`.
