Do not change `src/`, `levels/` or `tools/`, except for the mutation in a task. Restore each mutation in the same task. Do not change `PHYS`. Do not change a test that exists. Do not commit. Stop after each group for the human commit. The human commits with `git add <files>`, because `git commit -am` does not add new files.

Each new test goes into `tests/unit/validate-level.test.ts`, at the end of `describe("validateLevel")`. Use the test title word for word. It is the text after the id in the heading of its scenario in `specs/level-validation/spec.md`. The scenario exists before the test (design D4). Each new test uses this enemy (design D5). Declare it once, after the line `const solution = …`: `const e1 = { id: "e1", x: 8, y: 0, patrol: [7, 9], speed: 1 };`

Each task in group 1 has the same steps:

1. Add the test. Run `pnpm test tests/unit/validate-level.test.ts`. Expected: the new test passes. Quote the `Tests` line.
2. Make the mutation that the task names. Run the same command. Expected: the new test fails with an `AssertionError`, not with an import error or a syntax error. Other new enemy tests can also fail. Quote the `Tests` line and the name of each failed test.
3. Restore the file with `git checkout -- <file>`. Run `git diff --quiet src levels tools` and check that the exit code is 0. Run the test file again and check that all its tests pass.

If the new test fails before the mutation, or passes on the mutation, stop and report. Do not change the test or the code to make it agree.

## 1. Validator tests for enemies (green at once, proof by mutation)

- [x] 1.1 Test `a level with enemies passes all checks`: `validateLevel({ ...valid, enemies: [e1] }, solution)` equals `[]`. Mutation: in `levels/level.schema.ts`, delete the line `enemies: z.array(Enemy).optional(),`.
- [x] 1.2 Test `enemy ids must be unique`: the level has the enemies `e1` and `{ id: "e1", x: 2, y: 0, patrol: [1, 3], speed: 1 }`. The errors contain `enemies: enemy ids must be unique`. Mutation: in `tools/validate-level.ts`, delete the line `if (enemyIds.size !== enemies.length) errors.push("enemies: enemy ids must be unique");`.
- [x] 1.3 Test `an enemy patrol must be inside the level`: the level has the enemy `{ ...e1, x: 9, patrol: [9, 11] }` (11 is not less than the width 11). The errors contain `enemy e1: x must be inside patrol, and patrol must be inside the level`. Mutation: in `tools/validate-level.ts`, change `to < width` to `to <= width`.
- [x] 1.4 Test `an enemy x must be inside its patrol`: the level has the enemy `{ ...e1, x: 2 }` (2 is less than the patrol start 7). The errors contain `enemy e1: x must be inside patrol, and patrol must be inside the level`. Mutation: in `tools/validate-level.ts`, delete `from <= e.x && ` from the patrol condition.
- [x] 1.5 Test `an enemyStomped trigger must name an existing enemy`: the level has the enemy `e1`, and the trigger of `t1` is `{ kind: "event", event: "enemyStomped", id: "e9" }`. The errors contain `trap t1: enemy e9 does not exist`. Mutation: in `tools/validate-level.ts`, delete the line that pushes `trap ${t.id}: enemy ${tr.id} does not exist`.
- [x] 1.6 Run `pnpm test`. Expected: `Tests  85 passed (85)`. Run `git status --short`. Expected: changes only in `tests/unit/validate-level.test.ts` and `.agent-log/`. Stop for the human commit of the tests.

## 2. Spec check

- [ ] 2.1 Run `pnpm exec openspec validate add-enemies --strict`. Expected: the change is valid. Quote the output.
- [ ] 2.2 Run `pnpm spec:check`. Expected: `spec:check ok — specs: 2 · active changes: 1 · archived: 2`. Quote the output.
- [ ] 2.3 For each scenario in the delta, check that its replay file or its test title exists. Use `ls tests/replay/<id>.replay.json` for a replay id. Use `grep -n "<title>" <file>` for a test title. For `the stomp wins (…)`, grep the template `the stomp wins (${` in `tests/unit/stomp-vs-side.test.ts`. Quote one line for each scenario.

## 3. Final check

- [ ] 3.1 Run `pnpm check` and quote its summary lines. Expected: exit 0, `Tests  85 passed (85)`, `validate-level: 3 levels, 0 failed` and `spec:check ok — specs: 2 · active changes: 1 · archived: 2`.
