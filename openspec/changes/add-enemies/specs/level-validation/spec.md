## ADDED Requirements

### Requirement: Enemies in a level
The enemy ids of a level MUST be unique. The x of each enemy MUST be inside its patrol, and the patrol MUST be inside the level. The validator does these checks in the structure stage, together with the trap checks.

- When two enemies have the same id, the validator SHALL return the line `enemies: enemy ids must be unique`.
- For an enemy with `patrol: [from, to]`, the check is `from ≤ x ≤ to` and `to < level width`. When the check fails, the validator SHALL return the line `enemy <enemy id>: x must be inside patrol, and patrol must be inside the level`.
- A level without the key `enemies` has no enemies. It passes these checks.

#### Scenario: LEVEL-03-valid — a real level with an enemy passes the validator
- **COMMAND** `pnpm validate:levels levels/level-03.json` (CLI scenario from `docs/stage3/requirements.md`, no test file)
- **GIVEN** the file `levels/level-03.json` with a width of 64 tiles and one enemy `e1` with x 14, y 13, `patrol` `[10, 18]` and `speed` 1, and the file `levels/level-03.solution.json`
- **WHEN** the command runs
- **THEN** the output has the line `PASS level-03.json`
- **AND** the last line is `validate-level: 1 levels, 0 failed`
- **AND** the exit code is 0

#### Scenario: LEVEL-enemy-unique-01 — enemy ids must be unique
- **TEST** `tests/unit/validate-level.test.ts` (task 1.2 adds this test)
- **GIVEN** the level `fx-valid` with `enemies` `[e1, e1b]`, where `e1` is `{ id: "e1", x: 8, y: 0, patrol: [7, 9], speed: 1 }`
- **AND** `e1b` is `{ id: "e1", x: 2, y: 0, patrol: [1, 3], speed: 1 }`
- **AND** the solution `sol-right-120`
- **WHEN** the validator checks them
- **THEN** the errors contain `enemies: enemy ids must be unique`

#### Scenario: LEVEL-enemy-patrol-01 — an enemy patrol must be inside the level
- **TEST** `tests/unit/validate-level.test.ts` (task 1.3 adds this test)
- **GIVEN** the level `fx-valid` with `enemies` `[{ id: "e1", x: 9, y: 0, patrol: [9, 11], speed: 1 }]`
- **AND** the patrol end 11 is not less than the level width 11
- **AND** the solution `sol-right-120`
- **WHEN** the validator checks them
- **THEN** the errors contain `enemy e1: x must be inside patrol, and patrol must be inside the level`

#### Scenario: LEVEL-enemy-x-01 — an enemy x must be inside its patrol
- **TEST** `tests/unit/validate-level.test.ts` (task 1.4 adds this test)
- **GIVEN** the level `fx-valid` with `enemies` `[{ id: "e1", x: 2, y: 0, patrol: [7, 9], speed: 1 }]`
- **AND** x 2 is less than the patrol start 7
- **AND** the solution `sol-right-120`
- **WHEN** the validator checks them
- **THEN** the errors contain `enemy e1: x must be inside patrol, and patrol must be inside the level`

## MODIFIED Requirements

### Requirement: Level schema
The level JSON SHALL match the level schema. When it does not match, the validator SHALL return one line `schema: <path>: <message>` for each schema issue, and MUST NOT do the other checks.

- The level has the keys `id`, `tiles` and `traps`, and can have the key `enemies`. Other keys are errors.
- `id` matches `level-NN`, where N is a digit.
- `tiles` has exactly 15 rows. Each row is not empty and has only the characters `.` `#` `^` `o` `S` `G`.
- `enemies` is a list. Each enemy has `id` (not empty), `x` and `y` (integers 0 or more), `patrol: [from, to]` (integers 0 or more) and `speed` (a number more than 0). Other keys of an enemy are not errors. The validator ignores them.
- Each trap has `id` (not empty), `trigger`, `action` and `delayTicks` (an integer 0 or more).
- A trigger is `{ kind: "zone", rect }`, `{ kind: "event", event: "coinCollected", id }` or `{ kind: "event", event: "enemyStomped", id }`. The `id` of an `event` trigger is not empty.
- An action is `{ kind: "removeTiles", rect }`, `{ kind: "addSpikes", rect }` or `{ kind: "moveGoal", to: [x, y] }`.
- In a `rect`, x and y are integers 0 or more, and w and h are integers 1 or more. In `to`, x and y are integers 0 or more.
- `<path>` is the path of the bad value with `.` between the parts. `<message>` is the message of the schema library.

#### Scenario: LEVEL-rows-01 — the level must have 15 rows
- **GIVEN** the level `fx-valid` without row 0 (14 rows), and the solution `sol-right-120`
- **WHEN** the validator checks them
- **THEN** the errors contain `schema: tiles`

#### Scenario: LEVEL-enemies-valid-01 — a level with enemies passes all checks
- **TEST** `tests/unit/validate-level.test.ts` (task 1.1 adds this test)
- **GIVEN** the level `fx-valid` with `enemies` `[e1]`, where `e1` is `{ id: "e1", x: 8, y: 0, patrol: [7, 9], speed: 1 }`
- **AND** the enemy is in row 0, and the player of `sol-right-120` runs in row 13
- **AND** the solution `sol-right-120`
- **WHEN** the validator checks them
- **THEN** the result is the empty list `[]`

### Requirement: Trap references
The trap ids of a level MUST be unique, and an event trigger MUST name a coin or an enemy of the level. The id of a coin is `c<x>_<y>` from its tile position. The id of an enemy is the `id` in `enemies`.

- When two traps have the same id, the validator SHALL return the line `traps: trap ids must be unique`.
- A trap can have the trigger `event` `coinCollected` with an id that is not the id of a coin tile. For this trap, the validator SHALL return the line `trap <trap id>: coin <id> does not exist`.
- A trap can have the trigger `event` `enemyStomped` with an id that is not the id of an enemy of the level. For this trap, the validator SHALL return the line `trap <trap id>: enemy <id> does not exist`.

#### Scenario: LEVEL-coin-ref-01 — an event trigger must name an existing coin
- **GIVEN** the level `fx-valid` with the trigger of `t1` changed to `{ kind: "event", event: "coinCollected", id: "c9_9" }`, and the solution `sol-right-120`
- **WHEN** the validator checks them
- **THEN** the errors contain `coin c9_9 does not exist`

#### Scenario: LEVEL-enemy-ref-01 — an enemyStomped trigger must name an existing enemy
- **TEST** `tests/unit/validate-level.test.ts` (task 1.5 adds this test)
- **GIVEN** the level `fx-valid` with `enemies` `[e1]`, where `e1` is `{ id: "e1", x: 8, y: 0, patrol: [7, 9], speed: 1 }`
- **AND** the trigger of `t1` changed to `{ kind: "event", event: "enemyStomped", id: "e9" }`
- **AND** the solution `sol-right-120`
- **WHEN** the validator checks them
- **THEN** the errors contain `trap t1: enemy e9 does not exist`
