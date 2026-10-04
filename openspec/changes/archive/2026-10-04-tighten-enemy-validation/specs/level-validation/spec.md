## MODIFIED Requirements

### Requirement: Level schema
The level JSON SHALL match the level schema. When it does not match, the validator SHALL return one line `schema: <path>: <message>` for each schema issue, and MUST NOT do the other checks.

- The level has the keys `id`, `tiles` and `traps`, and can have the key `enemies`. Other keys are errors.
- `id` matches `level-NN`, where N is a digit.
- `tiles` has exactly 15 rows. Each row is not empty and has only the characters `.` `#` `^` `o` `S` `G`.
- `enemies` is a list. Each enemy has exactly the keys `id`, `x`, `y`, `patrol` and `speed`. Other keys of an enemy are errors. `id` is not empty. `x` is an integer 0 or more. `y` is an integer from 0 to 14, a row of the level. `patrol: [from, to]` has integers 0 or more. `speed` is a number more than 0.
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
- **TEST** `tests/unit/validate-level.test.ts`
- **GIVEN** the level `fx-valid` with `enemies` `[e1]`, where `e1` is `{ id: "e1", x: 8, y: 0, patrol: [7, 9], speed: 1 }`
- **AND** the enemy is in row 0, and the player of `sol-right-120` runs in row 13
- **AND** the solution `sol-right-120`
- **WHEN** the validator checks them
- **THEN** the result is the empty list `[]`

#### Scenario: LEVEL-enemy-y-01 — an enemy y must be inside the level
- **TEST** `tests/unit/validate-level.test.ts` (task 1.1 adds this test)
- **GIVEN** the solution `sol-right-120`
- **WHEN** the validator checks the level `fx-valid` with `enemies` `[{ id: "e1", x: 8, y: 14, patrol: [7, 9], speed: 1 }]`
- **THEN** the result is the empty list `[]`, because row 14 is the last row of the level
- **WHEN** the validator checks the level `fx-valid` with `enemies` `[{ id: "e1", x: 8, y: 15, patrol: [7, 9], speed: 1 }]`
- **THEN** the result is exactly one error line: `schema: enemies.0.y: Too big: expected number to be <=14`

#### Scenario: LEVEL-enemy-keys-01 — an enemy must not have other keys
- **TEST** `tests/unit/validate-level.test.ts` (task 1.2 adds this test)
- **GIVEN** the level `fx-valid` with `enemies` `[{ id: "e1", x: 8, y: 0, patrol: [7, 9], speed: 1, foo: 1 }]`
- **AND** the solution `sol-right-120`
- **WHEN** the validator checks them
- **THEN** the result is exactly one error line: `schema: enemies.0: Unrecognized key: "foo"`
