# core-gameplay Specification

## Purpose

The pure, deterministic game core of Trap Runner without enemies. It turns a level and a sequence of input frames into the same World and the same events on every machine.

Conventions for all requirements and scenarios:

- Positions are in pixels. The x axis points right and the y axis points down. A tile is 16 × 16 px. The player box is 12 × 14 px.
- Tile `(x, y)` covers the pixels from `x·16` to `x·16 + 16` and from `y·16` to `y·16 + 16`.
- Two boxes overlap only when they share an area. Boxes that only touch at an edge do not overlap.
- Tile characters: `.` empty, `#` solid, `^` spikes, `o` coin, `S` start, `G` goal.
- An input frame has three keys: `left`, `right`, `jump`. An input such as "30 ticks with `right`" means 30 frames with `right` down and the other keys up.
- Each scenario id is the name of the replay file `tests/replay/<id>.replay.json` and of its test. A scenario lists the events that must occur in that order. Other events can occur between them.
- The fixture levels in the scenarios have 4 rows. The core does not check the level height. The level validator checks it (change `add-level-validation`).

## Requirements

### Requirement: Tick model
The core SHALL advance the game by exactly one tick (1/60 s, 60 ticks per second) for each call of `step(world, input)`. `step` SHALL return a new World and MUST keep the input World unchanged.

- The first call of `step` on a new World is tick 0. Each event carries the number of the tick in which it occurs.
- The `events` of a returned World SHALL hold only the events of that tick.
- An attempt starts from the level. The player starts on the `S` tile, centered horizontally and with the bottom edge on the bottom edge of the tile. For `S` at `(0, 2)` the start is x = 2, y = 34.
- The start of an attempt SHALL reset all coins, all tiles, the goal and all traps to the level definition.
- When the attempt ends (status `dead` or `complete`), `step` SHALL return the same World without a change.

#### Scenario: MOVE-run-right-01 — 30 ticks give 30 moves from the start position
- **GIVEN** the level `fx-flat` with the rows `..........`, `..........`, `S........G`, `##########` and no traps
- **WHEN** the input is 30 ticks with `right`
- **THEN** the player is at x = 62 and y = 34
- **AND** x = 62 is the start x = 0·16 + (16 − 12)/2 = 2, plus 30 × 2 px
- **AND** the status is `playing`

### Requirement: Movement
The player SHALL run at 2 px per tick while `right` or `left` is down, and SHALL fall under gravity.

- The jump SHALL start only on a press of `jump` and only when the player stands on the ground. A press means that the key is up in the previous tick and down in this tick.
- A held `jump` key MUST NOT start a new jump after the player lands.
- A jump rises 60 px and the player lands again. The values of gravity, jump speed and maximum fall speed are in `PHYS` and belong to the human.

#### Scenario: MOVE-jump-01 — one jump, then the player lands
- **GIVEN** the level `fx-flat` with the rows `..........`, `..........`, `S........G`, `##########` and no traps
- **WHEN** the input is 1 tick with no key, then 1 tick with `jump`, then 58 ticks with no key
- **THEN** the player is at y = 34 and stands on the ground (`onGround` is true)

#### Scenario: MOVE-no-autojump-01 — a held jump key does not jump again
- **GIVEN** the level `fx-flat` with the rows `..........`, `..........`, `S........G`, `##########` and no traps
- **WHEN** the input is 5 ticks with no key, then 60 ticks with `jump` held down
- **THEN** the player is at y = 34 and stands on the ground (`onGround` is true)

### Requirement: Collisions
The player MUST NOT enter a solid tile. A solid tile SHALL stop the player at its edge from each side: as a wall, as a floor and as a ceiling.

- The area to the left and to the right of the level SHALL act as a wall. The player x SHALL stay between 0 and `level width in px − 12`.
- The area above and below the level SHALL be empty.
- The player MUST NOT pass through a solid tile that is one tile wide or one tile high (no tunneling). This applies also at the maximum fall speed.
- A jump into a ceiling SHALL stop at the bottom edge of the ceiling tile.

#### Scenario: MOVE-wall-01 — a wall stops the player
- **GIVEN** the level `fx-wall` with the rows `..........`, `......#...`, `S.....#..G`, `##########` and no traps
- **WHEN** the input is 60 ticks with `right`
- **THEN** the player is at x = 84 (the left edge of column 6 is 96, and 96 − 12 = 84)

#### Scenario: MOVE-left-edge-01 — the left edge of the level stops the player
- **GIVEN** the level `fx-flat` with the rows `..........`, `..........`, `S........G`, `##########` and no traps
- **WHEN** the input is 10 ticks with `left`
- **THEN** the player is at x = 0

### Requirement: Coins and goal
When the player box overlaps a coin tile, the core SHALL collect the coin, add its id to `collected` and emit `coinCollected` with the id `c<x>_<y>`.

- The id of a coin comes from its tile position. A coin at `(3, 2)` has the id `c3_2`.
- A coin SHALL be collected at most once per attempt.
- When the player box overlaps the goal tile, the core SHALL emit `levelComplete` and set the status to `complete`.

#### Scenario: COIN-goal-01 — collect a coin, then reach the goal
- **GIVEN** the level `fx-coin` with the rows `...........`, `...........`, `S..o......G`, `###########` and no traps
- **WHEN** the input is 100 ticks with `right`
- **THEN** the events contain `coinCollected` with id `c3_2`, and after it `levelComplete`
- **AND** the status is `complete` and `collected` is `["c3_2"]`

### Requirement: Spikes
When the player box overlaps a spike tile, the player SHALL die. The core emits `died` with cause `spikes` and sets the status to `dead`.

#### Scenario: SPIKE-01 — running into spikes kills the player
- **GIVEN** the level `fx-spikes` with the rows `..........`, `..........`, `S.....^..G`, `##########` and no traps
- **WHEN** the input is 60 ticks with `right`
- **THEN** the events contain `died` with cause `spikes`
- **AND** the events do not contain `levelComplete`

### Requirement: Pit
When the top edge of the player is below 240 px (15 rows × 16 px), the player SHALL die. The core emits `died` with cause `pit` and sets the status to `dead`.

#### Scenario: PIT-01 — a fall through a gap in the floor kills the player
- **GIVEN** the level `fx-pit` with the rows `..........`, `..........`, `S........G`, `#####....#` and no traps
- **WHEN** the input is 120 ticks with `right`
- **THEN** the events contain `died` with cause `pit`

### Requirement: Death beats the goal
When a death condition and the goal condition are both true in the same tick, the core SHALL emit only `died` and MUST NOT emit `levelComplete`.

- The core checks the conditions in this order: coins, spikes, pit, goal. A death stops the checks.

#### Scenario: TRAP-goal-death-01 — spikes on the goal tile win over the goal
- **GIVEN** the level `fx-goal-death` with the rows `..........`, `..........`, `S.....G...`, `##########`
- **AND** the trap `t1` with trigger `zone` rect `[5, 0, 1, 4]`, action `addSpikes` rect `[6, 2, 1, 1]` and `delayTicks` 0
- **WHEN** the input is 120 ticks with `right`
- **THEN** the events contain `trapTriggered` with id `t1`, and after it `died` with cause `spikes`
- **AND** the events do not contain `levelComplete`

### Requirement: Trap triggers
A trap SHALL trigger when its trigger condition is true, and SHALL emit `trapTriggered` with the trap id in that tick.

- A `zone` trigger is true when the player box overlaps its `rect` (in tiles).
- An `event` trigger with `event: "coinCollected"` and an `id` is true in the tick in which the core emits `coinCollected` with that id. The trap triggers in the same tick, after the coin event.
- A trap SHALL trigger at most once per attempt.
- When two or more traps trigger in the same tick, the core SHALL process them in the order of `traps[]`.
- A trap MUST NOT trigger in a tick in which the player dies.

#### Scenario: TRAP-collapse-01 — a zone trigger removes the floor
- **GIVEN** the level `fx-collapse` with the rows `...........`, `...........`, `S.........G`, `###########`
- **AND** the trap `t1` with trigger `zone` rect `[3, 0, 1, 4]`, action `removeTiles` rect `[5, 3, 3, 1]` and `delayTicks` 0
- **WHEN** the input is 120 ticks with `right`
- **THEN** the events contain `trapTriggered` with id `t1`, and after it `died` with cause `pit`

#### Scenario: TRAP-bait-01 — a coin is the trigger of a trap
- **GIVEN** the level `fx-bait` with the rows `...........`, `...........`, `S..o......G`, `###########`
- **AND** the trap `t1` with trigger `event` `coinCollected` id `c3_2`, action `removeTiles` rect `[5, 3, 2, 1]` and `delayTicks` 0
- **WHEN** the input is 120 ticks with `right`
- **THEN** the events contain `coinCollected` with id `c3_2`, then `trapTriggered` with id `t1`, then `died` with cause `pit`

### Requirement: Trap actions
A trap action SHALL change the World of the current attempt as follows. All `rect` and `to` values are in tiles.

- `removeTiles` SHALL make each tile in `rect` empty (`.`).
- `addSpikes` SHALL put spikes (`^`) on each tile in `rect`.
- `moveGoal` SHALL move the goal to the tile `to: [x, y]`.
- Tiles of `rect` outside the level SHALL be ignored.

#### Scenario: TRAP-goal-01 — the goal moves away before the player reaches it
- **GIVEN** the level `fx-trap-goal` with the rows `..........`, `..........`, `S.......G.`, `##########`
- **AND** the trap `t1` with trigger `zone` rect `[6, 0, 1, 4]`, action `moveGoal` to `[0, 0]` and `delayTicks` 0
- **WHEN** the input is 120 ticks with `right`
- **THEN** the events contain `trapTriggered` with id `t1`
- **AND** the events do not contain `levelComplete`
- **AND** the status is `playing` and the goal is at `{ x: 0, y: 0 }`

### Requirement: Trap delay
The action of a trap SHALL run `delayTicks` ticks after the tick of its trigger.

- With `delayTicks` 0 the action runs in the same tick as the trigger, after the trigger.
- With `delayTicks` N > 0 the action runs at the start of tick `trigger tick + N`, before the player moves.
- A new attempt SHALL start with no pending actions.

#### Scenario: TRAP-spikes-01 — delayed spikes appear in front of the player
- **GIVEN** the level `fx-trap-spikes` with the rows `...........`, `...........`, `S.........G`, `###########`
- **AND** the trap `t1` with trigger `zone` rect `[2, 0, 1, 4]`, action `addSpikes` rect `[6, 2, 1, 1]` and `delayTicks` 10
- **WHEN** the input is 120 ticks with `right`
- **THEN** the events contain `trapTriggered` with id `t1` at tick 9, and after it `died` with cause `spikes`
