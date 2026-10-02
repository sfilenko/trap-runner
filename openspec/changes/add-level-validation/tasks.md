Source of the exact code and tests: `docs/plan/stage-2-core.md` Task 2.7. Copy the code from the plan step that each task names. Do not change `PHYS`. Do not change `src/core/`. Do not commit. At each "Stop for the human commit", stop and report. The human commits with `git add <files>`, because `git commit -am` does not add new files.

## 1. Schema, stub and the 9 tests: red (plan Task 2.7 Step 2)

- [ ] 1.1 Write `levels/level.schema.ts` and the stub `tools/validate-level.ts` (it returns `[]`), as in plan Task 2.7 Step 2. Check: `pnpm typecheck` exits 0 and `pnpm boundaries` reports `0 violations`.
- [ ] 1.2 Write `tests/unit/validate-level.test.ts` as in plan Task 2.7 Step 2. Keep the 9 test titles word for word (design D7). Each title must be equal to the text after the id in one scenario heading of `specs/level-validation/spec.md`. Run `pnpm test tests/unit/validate-level.test.ts`. Expected: FAIL, `8 failed | 1 passed`. Only `a valid level with a working solution has no errors` passes. Each failure is an `AssertionError`, not an import error or a syntax error. Quote the failing lines. Then run `pnpm test`. Expected: `Tests  8 failed | 47 passed (55)`. Stop for the human commit of the red state (`git add levels/level.schema.ts tools/validate-level.ts tests/unit/validate-level.test.ts`).

## 2. Validator and CLI (plan Task 2.7 Step 3)

- [ ] 2.1 Replace the stub in `tools/validate-level.ts` with `validateLevel` and `main` from plan Task 2.7 Step 3. Do not change the test file. Run `pnpm test`. Expected: `Test Files  8 passed (8)` and `Tests  55 passed (55)`. If a scenario does not agree with the real behavior (for example the tick 42 of `LEVEL-solution-complete-01`), do not change the test first. Change the scenario in `specs/level-validation/spec.md`, then stop and report. The human commits the spec change separately (`spec: <what and why>`).
- [ ] 2.2 Edit `package.json` by hand. Do not use `pnpm pkg set`, because pnpm 12.8.1 rejects `:` in the key (design D8).
  - Add the script `"validate:levels": "tsx tools/validate-level.ts"`.
  - Set the script `"check"` to `pnpm typecheck && pnpm boundaries && pnpm test && pnpm validate:levels && pnpm spec:check`.
  - Run `pnpm validate:levels` (scenario `LEVEL-cli-empty-01`). Expected: the last line is `validate-level: 0 levels, 0 failed` and the exit code is 0. If the line is missing, the CLI did not run `main`. Stop and report (design, Risks).
  - Write the 2 `allow` lines for `.claude/settings.json` as text: `"Bash(pnpm validate:levels *)"` and `"Bash(pnpm validate:levels)"`. Do not edit the file. The human adds the lines.
- [ ] 2.3 Show the CLI gate red (scenario `LEVEL-cli-fail-01`). Make a new temporary directory outside the repository. Write the file `level-90.json` into it with the level `fx-valid` of the spec, and no solution file. Run `pnpm validate:levels <that directory>/level-90.json`. Expected: the line `FAIL level-90.json`, then the line `  - solution: file not found (expected levels/<id>.solution.json)`, then the last line `validate-level: 1 levels, 1 failed`, and exit code 1. Quote the output and the exit code. Delete the temporary directory. Check: `git status` shows no new file outside `levels/`, `tools/`, `tests/unit/`, `package.json` and this change. Stop for the human commit of the green state.

## 3. Final check

- [ ] 3.1 Run `pnpm check` and quote its summary lines. Expected: exit 0, `Test Files  8 passed (8)`, `Tests  55 passed (55)` (more tests are acceptable, 0 failed is the rule), `validate-level: 0 levels, 0 failed` and `spec:check ok — specs: 1 · active changes: 1 · archived: 1`.
