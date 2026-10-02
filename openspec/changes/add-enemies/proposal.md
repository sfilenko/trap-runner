## Why

Stage 3 added enemies to the code, but the specs did not change. `core-gameplay` has no enemy requirement, and the `ENEMY-*` replay files have no scenario. `level-validation` says that the key `enemies` is a schema error, but the code accepts it. This change makes the two specs describe the code that exists now (stage 3 decision #6, `docs/stage3/decisions.md`).

## What Changes

This change does not change the behavior of the code. It changes the specs and adds 5 validator tests.

- `core-gameplay`, ADDED requirements:
  - **Enemy patrol**: the start position of an enemy, its box, its patrol bounds and its turn at each end.
  - **Enemy stomp**: the stomp condition, the dead enemy, the event `enemyStomped` and the bounce.
  - **Enemy side hit**: each other contact with a live enemy kills the player with cause `enemy`.
  - **Stomp beats a side hit**: in one tick, a stomp on one enemy wins over a side hit by another enemy.
- `core-gameplay`, MODIFIED requirements:
  - **Death beats the goal**: the check order is now coins, enemies, spikes, pit, goal. A death by an enemy also beats the goal.
  - **Trap triggers**: an `event` trigger can also name `enemyStomped`.
- `level-validation`, MODIFIED requirements:
  - **Level schema**: the key `enemies` is optional and is not an error. The delta adds the schema of an enemy. An `event` trigger can name `enemyStomped`.
  - **Trap references**: an `enemyStomped` trigger must name an enemy of the level.
- `level-validation`, ADDED **Enemies in a level**: unique enemy ids, an enemy x inside its patrol, and a patrol inside the level.
- New tests: 5 tests in `tests/unit/validate-level.test.ts`. The code exists, so each new test passes at once. A named mutation in `tasks.md` shows that each test can fail.

### Scenario sources

Each scenario names a replay file or a test. Each of them exists now, except the tests of the last 5 rows. Tasks 1.1–1.5 add these tests with the titles of their scenarios. The scenario comes before its test (design D4).

| Requirement | Scenario | File |
|---|---|---|
| Enemy patrol | `createEnemies places the enemy on its tile, centered, and sets patrol bounds in px` | `tests/unit/enemies.test.ts` |
| Enemy patrol | `an enemy turns at the end of its patrol` | `tests/unit/enemies.test.ts` |
| Enemy patrol | `a dead enemy does not move` | `tests/unit/enemies.test.ts` |
| Enemy stomp | `ENEMY-stomp-01` | `tests/replay/ENEMY-stomp-01.replay.json` |
| Enemy stomp | `falling onto the enemy from above kills the enemy and bounces the player` | `tests/unit/enemies.test.ts` |
| Enemy side hit | `ENEMY-side-01` | `tests/replay/ENEMY-side-01.replay.json` |
| Enemy side hit | `touching the enemy from the side kills the player` | `tests/unit/enemies.test.ts` |
| Enemy side hit | `rising into the enemy from below kills the player` | `tests/unit/enemies.test.ts` |
| Enemy side hit | `a dead enemy is harmless` | `tests/unit/enemies.test.ts` |
| Stomp beats a side hit | `the stomp wins (stomped enemy first in w.enemies)` | `tests/unit/stomp-vs-side.test.ts` |
| Stomp beats a side hit | `the stomp wins (side-hit enemy first in w.enemies)` | `tests/unit/stomp-vs-side.test.ts` |
| Trap triggers | `ENEMY-trap-01` | `tests/replay/ENEMY-trap-01.replay.json` |
| Trap triggers | `ENEMY-trap-tick-01` | `tests/replay/ENEMY-trap-tick-01.replay.json` |
| Death beats the goal | `ENEMY-goal-death-01` | `tests/replay/ENEMY-goal-death-01.replay.json` |
| Enemies in a level | `LEVEL-03-valid` (CLI, no test file) | `levels/level-03.json`, command `pnpm validate:levels levels/level-03.json` |
| Level schema | `LEVEL-enemies-valid-01` | `tests/unit/validate-level.test.ts`, test `a level with enemies passes all checks` (task 1.1) |
| Enemies in a level | `LEVEL-enemy-unique-01` | `tests/unit/validate-level.test.ts`, test `enemy ids must be unique` (task 1.2) |
| Enemies in a level | `LEVEL-enemy-patrol-01` | `tests/unit/validate-level.test.ts`, test `an enemy patrol must be inside the level` (task 1.3) |
| Enemies in a level | `LEVEL-enemy-x-01` | `tests/unit/validate-level.test.ts`, test `an enemy x must be inside its patrol` (task 1.4) |
| Trap references | `LEVEL-enemy-ref-01` | `tests/unit/validate-level.test.ts`, test `an enemyStomped trigger must name an existing enemy` (task 1.5) |

The scenarios that the MODIFIED requirements already had (`TRAP-collapse-01`, `TRAP-bait-01`, `TRAP-goal-death-01`, `LEVEL-rows-01`, `LEVEL-coin-ref-01`) stay without a change.

`LEVEL-03-valid` is the scenario id from `docs/stage3/requirements.md`. It has no test file. It is a CLI scenario, as `LEVEL-cli-empty-01` and `LEVEL-cli-fail-01` are. `pnpm check` runs it through `pnpm validate:levels`.

### Rules without a test

These rules are in the delta, but no test checks them now. This change does not invent a result for them. The first 5 rules have a scenario now and get a test in apply.

| Rule | Requirement | Plan |
|---|---|---|
| An `enemies` key passes the schema | Level schema | scenario `LEVEL-enemies-valid-01`, test in task 1.1. Now only `LEVEL-03-valid` (CLI) shows it |
| Enemy ids are unique | Enemies in a level | scenario `LEVEL-enemy-unique-01`, test in task 1.2 |
| The patrol is inside the level | Enemies in a level | scenario `LEVEL-enemy-patrol-01`, test in task 1.3 |
| The x of an enemy is inside its patrol | Enemies in a level | scenario `LEVEL-enemy-x-01`, test in task 1.4 |
| An `enemyStomped` trigger names an enemy of the level | Trap references | scenario `LEVEL-enemy-ref-01`, test in task 1.5 |
| An enemy moves after the player and before the contact checks | Enemy patrol | no test. The replays use this order, but no test isolates it |
| The schema of an enemy (`id` not empty, `x`, `y` and `patrol` integers 0 or more, `speed` more than 0, other keys ignored) | Level schema | no test |
| An enemy moves only on the x axis, and tiles do not stop it | Enemy patrol | no test. See design.md, Open questions |
| Two or more stomps in one tick: each enemy dies and gets its own `enemyStomped` | Enemy stomp | no test. `design.md` §6 does not give this case. See design.md, Open questions |

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `core-gameplay`: add the enemy requirements (patrol, stomp, side hit, stomp beats a side hit). Change "Death beats the goal" (new check order with enemies) and "Trap triggers" (the `enemyStomped` event).
- `level-validation`: change "Level schema" (the schema accepts the key `enemies`) and "Trap references" (the `enemyStomped` reference). Add "Enemies in a level".

## Impact

- Code: no change in `src/`, `levels/` or `tools/`. Differences between `docs/design.md` and the code go to design.md, Open questions. The human decides about each.
- Tests: `tests/unit/validate-level.test.ts` gets 5 tests. The test count goes from 80 to 85.
- Specs after the archive: the Purpose of `core-gameplay` still says "It has no enemies". Its conventions say that each scenario id is a replay file name. The Purpose of `level-validation` lists the structure checks as "rows, `S` and `G`, traps". This change does not touch Purpose sections. The human rewrites them after the archive.
- `PHYS` does not change. The bounce value `PHYS.stompBounce` (−5) is in the spec only as a reference.
