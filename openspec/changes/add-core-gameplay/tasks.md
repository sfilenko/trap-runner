Source of the exact code and tests: `docs/plan/stage-2-core.md`. Copy the code from the plan step that each task names. Do not change `PHYS` after task 1.1. Do not commit. At each "Stop for the human commit", stop and report. The human commits.

## 1. Types, geometry and world: tests first (plan Task 2.2)

- [x] 1.1 Write these files as in plan Task 2.2 Step 2:
  - `src/core/types.ts`, `src/core/geometry.ts`, `src/core/events.ts`, `tests/helpers.ts`.
  - The stub `src/core/physics.ts` with `PHYS`, `PLAYER_W`, `PLAYER_H` and an empty `stepPlayer`.
  - The stub `src/core/world.ts`. Its `createWorld` throws `not implemented`.
  - Check:  `pnpm typecheck` exits 0 and `pnpm boundaries` reports `0 violations`.
- [x] 1.2 Write `tests/unit/world.test.ts` as in plan Task 2.2 Step 2. Run `pnpm test tests/unit/world.test.ts`. Expected: FAIL, `5 failed`, reason `createWorld(level-99): not implemented`. Quote the failing lines. Stop for the human commit of the red state.
- [x] 1.3 Implement `createWorld` in `src/core/world.ts` as in plan Task 2.2 Step 4. Run `pnpm test tests/unit/world.test.ts`. Expected: `5 passed`. Run `pnpm boundaries`. Expected: `0 violations`. Stop for the human commit (`feat(core): types, geometry, createWorld`).

## 2. Step, replay runner and the 13 scenarios: red (plan Task 2.3)

- [x] 2.1 Write `src/core/interactions.ts`, the stub `src/core/traps.ts` (empty `fireDueActions`, `checkTriggers`, `applyAction`), `src/core/step.ts` and `src/core/replay.ts`, as in plan Task 2.3 Step 1. Check: `pnpm typecheck` exits 0 and `pnpm boundaries` reports `0 violations`.
- [x] 2.2 Write `tests/unit/step.test.ts`, `tests/unit/replay.test.ts` and `tests/replay/replay.test.ts`, as in plan Task 2.3 Step 2. Check: `pnpm typecheck` exits 0.
- [x] 2.3 Write the 13 replay files `tests/replay/<id>.replay.json`, as in plan Task 2.3 Step 3. Use one file for each scenario of `specs/core-gameplay/spec.md`, with the same id and the same values. The ids:
  `COIN-goal-01`, `MOVE-jump-01`, `MOVE-left-edge-01`, `MOVE-no-autojump-01`, `MOVE-run-right-01`, `MOVE-wall-01`, `PIT-01`, `SPIKE-01`, `TRAP-bait-01`, `TRAP-collapse-01`, `TRAP-goal-01`, `TRAP-goal-death-01`, `TRAP-spikes-01`. Check: `tests/replay/` holds exactly 13 `*.replay.json` files, and each file name matches a scenario id in the spec.
- [x] 2.4 Run `pnpm test` and quote the failing lines and the summary line. Expected: `Tests  17 failed | 15 passed (32)`. All 13 replay scenarios fail on behavior (for example `MOVE-run-right-01`: `expected 2 to be 62`, `COIN-goal-01`: `missing {"type":"coinCollected","id":"c3_2"}`). 3 tests in `step.test.ts` and `runReplay stops at the first end of the attempt` also fail. No test fails on an import or a syntax error. Stop for the human commit (`test(core): 13 replay scenarios from add-core-gameplay spec (red)`).

## 3. Player physics (plan Task 2.4)

- [ ] 3.1 Write `tests/unit/physics.test.ts` as in plan Task 2.4 Step 1. Run `pnpm test tests/unit/physics.test.ts`. Expected: FAIL, `8 failed | 1 passed`. Only the control test `a new press after landing jumps again` passes. Quote the failing lines.
- [ ] 3.2 Implement `stepPlayer` in `src/core/physics.ts` as in plan Task 2.4 Step 2. It uses sub-steps of at most 4 px, a jump on a press only, and the level edges. Keep `PHYS`, `PLAYER_W` and `PLAYER_H` unchanged. Run `pnpm test`. Expected: `Tests  5 failed | 36 passed (41)`. Only the 5 `TRAP-*` replay scenarios fail. Stop for the human commit (`feat(core): player physics with sub-steps and edge-triggered jump`).

## 4. Traps (plan Task 2.5)

- [ ] 4.1 Write `tests/unit/traps.test.ts` as in plan Task 2.5 Step 1. Run `pnpm test tests/unit/traps.test.ts`. Expected: FAIL, `5 failed`. Quote the failing lines.
- [ ] 4.2 Implement `fireDueActions`, `checkTriggers` and `applyAction` in `src/core/traps.ts` as in plan Task 2.5 Step 2. Run `pnpm test`. Expected: 0 failed. Stop for the human commit (`feat(core): traps - zone and coin triggers, delays, array order`).
- [ ] 4.3 If a scenario does not agree with the real behavior, do not change the test first. Change the scenario in `specs/core-gameplay/spec.md` first and report it. The human commits the spec change separately (`spec: <what and why>`). Then change the replay file. Check: `pnpm exec openspec validate add-core-gameplay --strict` exits 0. If all scenarios agree, mark this task done with the note "no spec change".

## 5. Final check

- [ ] 5.1 Run `pnpm check` and quote its summary lines. Expected: PASS, `Test Files  7 passed (7)`, `Tests  46 passed (46)` (more tests are acceptable, 0 failed is the rule) and `spec:check ok — specs: 0 · active changes: 1 · archived: 0`.
