## Purpose

This capability is the gate for Trap Runner levels. It checks the level file and the structure of the level. It also runs the recorded solution on the real core and proves that the solution completes the level.

Conventions for all requirements and scenarios:

- The validator takes two inputs: the parsed level JSON and the parsed solution JSON. A missing solution file is the value `undefined`.
- The validator returns a list of error lines. An empty list means that the level is valid. The order of the checks is fixed:
  1. the schema,
  2. the structure (rows, `S` and `G`, traps),
  3. the solution file,
  4. the solution run.
  When a stage gives an error, the validator returns the errors of that stage and does not do the later stages.
- Coordinates and `rect: [x, y, w, h]` are in tiles. Row 0 is the top row.
- A scenario id is the name of the scenario. The test in `tests/unit/validate-level.test.ts` has the title that follows the id in the scenario heading. The CLI scenarios have no test file. The tasks run them as commands.
- "The errors contain T" means that at least one error line contains the text T.
- The fixture `fx-valid` is the level with the id `level-90` and these 15 rows:
  - rows 0–12: `...........` (11 tiles),
  - row 13: `S..o......G`,
  - row 14: `###########`.
  
  It has one trap `t1`: trigger `{ kind: "zone", rect: [5, 0, 1, 15] }`, action `{ kind: "addSpikes", rect: [0, 0, 1, 1] }`, `delayTicks` 0. The coin at `(3, 13)` has the id `c3_13`.
- The solution `sol-right-120` is `{ "inputs": [{ "ticks": 120, "right": true }] }`.

## ADDED Requirements

### Requirement: Valid level
The validator SHALL return an empty list for a level that passes all checks and has a solution that passes all solution checks.

#### Scenario: LEVEL-valid-01 — a valid level with a working solution has no errors
- **GIVEN** the level `fx-valid` and the solution `sol-right-120`
- **WHEN** the validator checks them
- **THEN** the result is the empty list `[]`

### Requirement: Level schema
The level JSON SHALL match the level schema. When it does not match, the validator SHALL return one line `schema: <path>: <message>` for each schema issue, and MUST NOT do the other checks.

- The level has exactly the keys `id`, `tiles` and `traps`. Other keys are errors. This includes `enemies` until stage 3.
- `id` matches `level-NN`, where N is a digit.
- `tiles` has exactly 15 rows. Each row is not empty and has only the characters `.` `#` `^` `o` `S` `G`.
- Each trap has `id` (not empty), `trigger`, `action` and `delayTicks` (an integer 0 or more).
- A trigger is `{ kind: "zone", rect }` or `{ kind: "event", event: "coinCollected", id }`.
- An action is `{ kind: "removeTiles", rect }`, `{ kind: "addSpikes", rect }` or `{ kind: "moveGoal", to: [x, y] }`.
- In a `rect`, x and y are integers 0 or more, and w and h are integers 1 or more. In `to`, x and y are integers 0 or more.
- `<path>` is the path of the bad value with `.` between the parts. `<message>` is the message of the schema library.

#### Scenario: LEVEL-rows-01 — the level must have 15 rows
- **GIVEN** the level `fx-valid` without row 0 (14 rows), and the solution `sol-right-120`
- **WHEN** the validator checks them
- **THEN** the errors contain `schema: tiles`

### Requirement: Equal row length
All rows of a level SHALL have the length of row 0. The validator SHALL return the line `tiles: row <y> has length <n>, expected <width>` for each row with a different length.

#### Scenario: LEVEL-row-length-01 — all rows must have the same length
- **GIVEN** the level `fx-valid` with row 14 changed to `##########` (10 tiles), and the solution `sol-right-120`
- **WHEN** the validator checks them
- **THEN** the errors contain `row 14 has length 10, expected 11`

### Requirement: One start and one goal
A level MUST have exactly one `S` tile and exactly one `G` tile. The validator SHALL return the line `tiles: expected exactly 1 S, found <n>` when the count of `S` is not 1. It SHALL return the line `tiles: expected exactly 1 G, found <n>` when the count of `G` is not 1.

#### Scenario: LEVEL-one-start-01 — exactly one S
- **GIVEN** the level `fx-valid` with row 13 changed to `S..o.S....G`, and the solution `sol-right-120`
- **WHEN** the validator checks them
- **THEN** the errors contain `expected exactly 1 S, found 2`

### Requirement: Trap references
The trap ids of a level MUST be unique, and a coin event MUST name a coin of the level. The id of a coin is `c<x>_<y>` from its tile position.

- When two traps have the same id, the validator SHALL return the line `traps: trap ids must be unique`.
- A trap can have the trigger `event` with an id that is not the id of a coin tile. For this trap, the validator SHALL return the line `trap <trap id>: coin <id> does not exist`.

#### Scenario: LEVEL-coin-ref-01 — an event trigger must name an existing coin
- **GIVEN** the level `fx-valid` with the trigger of `t1` changed to `{ kind: "event", event: "coinCollected", id: "c9_9" }`, and the solution `sol-right-120`
- **WHEN** the validator checks them
- **THEN** the errors contain `coin c9_9 does not exist`

### Requirement: Targets inside the level
A trigger rect and an action target MUST be inside the level. A rect `[x, y, w, h]` is inside when `x + w` is not more than the level width and `y + h` is not more than 15. The target of `moveGoal` is the rect `[x, y, 1, 1]` of its `to`.

- For a `zone` trigger with a rect outside the level, the validator SHALL return the line `trap <trap id>: trigger rect is outside the level`.
- For an action with a target outside the level, the validator SHALL return the line `trap <trap id>: action target is outside the level`.

#### Scenario: LEVEL-target-inside-01 — an action target must be inside the level
- **GIVEN** the level `fx-valid` with the action of `t1` changed to `{ kind: "addSpikes", rect: [10, 14, 2, 1] }` (10 + 2 = 12 is more than the width 11), and the solution `sol-right-120`
- **WHEN** the validator checks them
- **THEN** the errors contain `action target is outside the level`

### Requirement: Solution file
Each level SHALL have a solution file `levels/<id>.solution.json`. When the level passes the schema and the structure checks and the solution is missing, the validator SHALL return only the line `solution: file not found (expected levels/<id>.solution.json)`.

- The solution JSON SHALL match the solution schema: exactly the key `inputs`, a list of 1 or more input runs. An input run has exactly the keys `ticks` (an integer 1 or more) and the optional booleans `left`, `right` and `jump`.
- When the solution does not match, the validator SHALL return one line `solution: <path>: <message>` for each schema issue.

#### Scenario: LEVEL-solution-file-01 — a missing solution file is an error
- **GIVEN** the level `fx-valid` and no solution (`undefined`)
- **WHEN** the validator checks them
- **THEN** the errors contain `solution: file not found`

### Requirement: Solution run proof
The validator SHALL run the solution on the real core from the start of the level. The run SHALL stop at the end of the inputs or at the end of the attempt. The run MUST end with `levelComplete`, MUST trigger at least one trap and MUST collect at least one coin.

- When the final status is not `complete`, the validator SHALL return the line `solution: the run ends with status "<status>" at tick <t>, player x=<x>, y=<y>; expected "complete"`. `<t>` is the tick count of the World after the run, which is the number of ticks that ran.
- When no `trapTriggered` event occurs, the validator SHALL return the line `solution: no trap triggers during the run`.
- When no `coinCollected` event occurs, the validator SHALL return the line `solution: the run collects no coin`.
- The validator SHALL return all of these lines that apply.

#### Scenario: LEVEL-solution-complete-01 — the solution must finish the level
- **GIVEN** the level `fx-valid` with row 13 changed to `S..o..^...G` (spikes at `(6, 13)`), and the solution `sol-right-120`
- **WHEN** the validator checks them
- **THEN** the errors contain `ends with status "dead" at tick 42`
- **AND** tick 42 is the count of ticks that ran. After n ticks the player x is 2 + 2n. The player box first overlaps the spike tile (x > 96 − 12 = 84) at n = 42

#### Scenario: LEVEL-solution-trap-01 — the solution must trigger at least one trap
- **GIVEN** the level `fx-valid` with the trigger of `t1` changed to `{ kind: "zone", rect: [0, 0, 1, 1] }`, and the solution `sol-right-120`
- **WHEN** the validator checks them
- **THEN** the errors contain `no trap triggers`

### Requirement: Validator CLI
The command `pnpm validate:levels [file...]` SHALL check each level file that it gets as an argument. Without arguments, it SHALL check each file `levels/level-NN.json` in name order.

- For a level file `<dir>/<name>.json`, the CLI SHALL read the solution from `<dir>/<name>.solution.json`. When that file does not exist, the solution is missing.
- For each level, the CLI SHALL print `PASS <file name>`, or `FAIL <file name>` and then one line `  - <error>` for each error.
- The last line SHALL be `validate-level: <count> levels, <failed> failed`.
- The exit code SHALL be 1 when at least one level fails, and 0 when no level fails.
- `pnpm check` SHALL run `pnpm validate:levels`.

#### Scenario: LEVEL-cli-empty-01 — no level files
- **GIVEN** the directory `levels/` has no file `level-NN.json`
- **WHEN** `pnpm validate:levels` runs without arguments
- **THEN** the last line is `validate-level: 0 levels, 0 failed`
- **AND** the exit code is 0

#### Scenario: LEVEL-cli-fail-01 — a level without a solution fails
- **GIVEN** a temporary directory outside the repository with the file `level-90.json`, which holds the level `fx-valid`, and no solution file
- **WHEN** `pnpm validate:levels <that directory>/level-90.json` runs
- **THEN** the output has the line `FAIL level-90.json`, then the line `  - solution: file not found (expected levels/<id>.solution.json)`
- **AND** the last line is `validate-level: 1 levels, 1 failed`
- **AND** the exit code is 1
