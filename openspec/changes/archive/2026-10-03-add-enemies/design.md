## Context

See proposal.md, "Why". Current state at `231e580`:

- Enemy code: `src/core/enemies.ts` (`createEnemies`, `moveEnemies`, `resolveEnemyContacts`). `src/core/step.ts` runs one tick in this order: due trap actions, player move, enemy move, interactions, trap triggers. `src/core/interactions.ts` checks coins, enemies, spikes, pit, goal.
- Validator: `levels/level.schema.ts` accepts an optional `enemies` list. `tools/validate-level.ts` checks unique enemy ids, the patrol and the `enemyStomped` references.
- Tests: `tests/unit/enemies.test.ts` (7 tests), `tests/unit/stomp-vs-side.test.ts` (2 tests), 5 replay files `tests/replay/ENEMY-*.replay.json`. `tests/unit/validate-level.test.ts` has 9 tests, and none of them has an enemy.
- `pnpm check` at the start of this session: exit 0, `Test Files  11 passed (11)`, `Tests  80 passed (80)`, `validate-level: 3 levels, 0 failed`, `spec:check ok — specs: 2 · active changes: 0 · archived: 2`.
- Sources of the rules: `docs/design.md` §5, §6 and §7, `docs/stage3/requirements.md`, `docs/stage3/decisions.md`. This change does not use `docs/plan/`. Its reference code for `resolveEnemyContacts` breaks `design.md` §6 (stage 3 decision #2).

## Goals / Non-Goals

**Goals:**
- The specs describe the enemy behavior of the code at `231e580`. Each scenario names a replay file or a test. Each of them exists now, except the 5 tests that tasks 1.1–1.5 add.
- Each enemy rule of the validator has a test, and a mutation shows that the test can fail.
- Design.md of this change lists each difference between `docs/design.md` and the code for the human.

**Non-Goals:**
- A change of the code in `src/`, `levels/` or `tools/`. The human decides about each open question. A code change is a separate change.
- A change of a Purpose section. The human writes them after the archive.
- New tests for core enemy rules. Each core enemy rule in the user list already has a test.

## Decisions

### D1. The specs follow the code
Where `docs/design.md` and the code do not agree, the delta describes the code. The difference goes to "Open questions".
- Reason: this change makes the specs agree with the code that exists. A spec that describes the design text would fail its own tests.
- Alternative: change the code to agree with `design.md`. Rejected: the human did not decide yet.

### D2. A unit-test scenario has the exact test title as its name
Replay scenarios keep the replay id (`ENEMY-stomp-01 — …`). A unit-test scenario has the exact test title as its name, and its first line `**TEST**` names the file.
- Reason: the scenario must use an id or a test name that exists.
- Alternative: new ids such as `ENEMY-patrol-turn-01`. Rejected: no file has these ids. The `core-gameplay` convention says that an id is the name of a replay file, so a new id looks like a missing replay file.
- Cost: the `core-gameplay` Purpose conventions and the `openspec/config.yaml` rule "replay file uses the same id" do not cover unit-test scenarios. The human can update both after the archive.

### D3. New tests are green at once. A mutation is the proof
The code exists, so the 5 new validator tests pass when they are written. There is no red commit. Each task names one mutation of the code. The test must fail on the mutation with an `AssertionError`. Then the task restores the file.
- Reason: a test that nobody saw red is not proof (`design.md` §7, "Перевірка перевіряючого"). Stage 3 used the same method (`docs/stage3/decisions.md`, M1–M3).
- Conflict: the `openspec/config.yaml` tasks rule ("the first task writes the replay files and the stubs") and the `AGENTS.md` red commit do not fit code that exists. The user request for this change sets the mutation method.

### D4. The scenarios of the new tests are in the delta before the tests
The delta has the 5 scenarios of tasks 1.1–1.5 now: `LEVEL-enemies-valid-01`, `LEVEL-enemy-unique-01`, `LEVEL-enemy-patrol-01`, `LEVEL-enemy-x-01` and `LEVEL-enemy-ref-01`. The test of each scenario does not exist until apply. Each task adds the test with the title of its scenario.
- Reason: a scenario comes before its test, as in change A. Change A had scenarios for replay files that did not exist yet. The human decided this after the review of the proposal.
- Alternative: each task adds its scenario after the test passes and the mutation fails. The human rejected it, because then the test sets the spec.

### D5. The fixture of the new validator tests
The new tests use `fx-valid` (the `valid` object in the test file) with the enemy `{ id: "e1", x: 8, y: 0, patrol: [7, 9], speed: 1 }`. The enemy is in row 0. The player of `sol-right-120` runs in row 13, so the enemy is not in its path and the solution run still passes.
- Check in this session (a probe script in the scratchpad, not a test): `validateLevel` returns `[]` for this level. The 4 bad variants return exactly these lines:
  - two enemies `e1`: `enemies: enemy ids must be unique`,
  - `x: 9, patrol: [9, 11]`: `enemy e1: x must be inside patrol, and patrol must be inside the level`,
  - `x: 2, patrol: [7, 9]`: the same line,
  - trigger `enemyStomped` id `e9`: `trap t1: enemy e9 does not exist`.

### D6. `LEVEL-03-valid` is a CLI scenario
The requirement "Enemies in a level" needs a scenario that exists now. `levels/level-03.json` (commit `290bfca`) has the enemy `e1` and passes. In this session, `pnpm validate:levels levels/level-03.json` printed `PASS level-03.json` and `validate-level: 1 levels, 0 failed`, exit code 0.

## Risks / Trade-offs

- [The human changes `levels/level-03.json`, and the enemy values in `LEVEL-03-valid` become wrong] → The scenario checks only `PASS` and the exit code. The values are from `290bfca`.
- [A mutation stays in the code after a task] → Each task restores the file with `git checkout -- <file>` and runs `git diff --quiet src levels tools`.
- [The human answers an open question and changes the code] → The scenario of that rule changes in the same later change. The tests in the scenarios show which rule changed.
- [The spec fixes behavior that `design.md` does not give, such as two stomps in one tick] → The proposal lists these rules as "no test". The open questions below ask the human about each.

## Open Questions

Each item compares one enemy rule of `docs/design.md` §5, §6 or §7 with the code. The code does not change in this change. The human decides.

### Differences

1. **Stomp at the edge (§6).**
   - `design.md` §6: one tick earlier, the player bottom "був вище за верхній край ворога" (strictly above the enemy top).
   - Code `src/core/enemies.ts:47`: `prevBottom <= e.y`. A bottom edge exactly on the top edge is also a stomp.
   - `docs/stage3/requirements.md` FR-2 says "at or above", as the code does.
   - These tests need the equal case: `falling onto the enemy from above kills the enemy and bounces the player`, both `stomp-vs-side` tests and `ENEMY-trap-tick-01`.
   - The mutation `<=` → `<` gives `Tests  4 failed | 76 passed (80)` (`docs/stage3/decisions.md`).
   - Options: change the text of §6 to "at or above", or change the code and these 4 tests.
2. **The x of an enemy inside its patrol (§7).** `design.md` §7 asks only for "патруль у межах рівня" (the patrol inside the level). Code `tools/validate-level.ts:33` also requires `from ≤ x ≤ to`. One error line covers both causes. Options: add the rule to §7, or remove it from the code. Also: split the error line into two lines?
3. **The y of an enemy is not checked (§5, §7).** `design.md` §5 gives a level height of 15 tiles. §7 asks for targets inside the level. The validator does not check the `y` of an enemy. A probe in this session: `fx-valid` with the enemy `y: 20` returns `[]`. The enemy is then below the level. Options: add the check `y < 15` (and a test), or accept.

### Gaps: `design.md` does not give the rule

4. **The meaning of `y` (§5).** `design.md` §5: "Ворог має `x` і `y` (тайл, на якому він стоїть)". The words can mean the floor tile under the enemy. The code puts the enemy box in the tile `(x, y)`, with its bottom edge on the bottom edge of that tile, as for `S`. The example in §5 (`y: 2`, floor in row 3) agrees with the code. Option: make the words of §5 exact.
5. **Enemies and tiles.** An enemy moves only on the x axis. Tiles do not stop it, and it does not fall over a gap. The validator does not check that the tiles of the patrol are empty or that a floor is under them. No test. Options: accept and write it in §5, or add tile rules (a code change).
6. **Two or more stomps in one tick.** The code kills each stomped enemy and emits one `enemyStomped` for each, in the order of `enemies`. The bounce is the same as for one stomp. No test. Options: accept and add a test, or give a different rule.
7. **A stomp and a death in the same tick.** The code checks enemies before spikes and the pit. A stomp, then spikes in the same tick, gives `enemyStomped` and then `died`. A trap with the trigger `enemyStomped` does not trigger in that tick, because the player died ("Trap triggers"). No test. Option: accept, or give a different order.
8. **Size and first direction of an enemy.** The enemy box is 14 × 14 px. The player box is 12 × 14 px. An enemy starts to move to the right. `design.md` does not give these values. Option: write them in §5, or accept the code values.
9. **Other keys of an enemy.** The level object rejects other keys (`.strict()`), but an enemy object does not. A probe in this session: an enemy with the key `foo: 1` returns `[]`. A trap object also accepts other keys. Option: make the enemy object strict (a code change), or accept.

### Checked, no difference

- §5: the `enemies` format, `speed` in px per tick, the trigger `event: enemyStomped` with `id`. The code agrees.
- §6: a contact that is not from above kills the player (`ENEMY-side-01`, `rising into the enemy from below kills the player`). A stomp kills the enemy, emits `enemyStomped` and gives a bounce. A stomp beats a side hit (`stomp-vs-side`). A death beats the goal, also for an enemy (`ENEMY-goal-death-01`). After a death the shell calls `createWorld` again (`src/main.ts:43`, `:81`), so the enemies reset, as §6 asks. The bounce is `PHYS.stompBounce`, so the human owns it, as §6 asks.
- §7: the unit test "стрибок зверху проти удару збоку в одному тіку" exists (`tests/unit/stomp-vs-side.test.ts`). The validator checks unique ids and enemy references in triggers.
