# core-gameplay Specification

## Purpose

This capability is the game core of Trap Runner. The core is pure and deterministic. For one level and one sequence of input frames, the core gives the same World and the same events on all machines.

A level can have enemies. An enemy patrols between two tiles. A stomp from above kills the enemy. Any other contact with a live enemy kills the player. A stomp beats a side hit in the same tick (change `add-enemies`).

Conventions for all requirements and scenarios:

- Positions are in pixels. The x axis points right and the y axis points down. A tile is 16 × 16 px. The player box is 12 × 14 px.
- Tile `(x, y)` covers the pixels from `x·16` to `x·16 + 16` and from `y·16` to `y·16 + 16`.
- Two boxes overlap only when they share an area. Boxes that only touch at an edge do not overlap.
- Tile characters: `.` empty, `#` solid, `^` spikes, `o` coin, `S` start, `G` goal.
- An input frame has three keys: `left`, `right`, `jump`. An input such as "30 ticks with `right`" means 30 frames with `right` down and the other keys up.
- Each scenario id is the name of the replay file `tests/replay/<id>.replay.json` and of its test. A scenario lists the events that must occur in that order. Other events can occur between them.
- A scenario of a unit test has no id. Its name is the exact title of the test, and its line **TEST** gives the test file (change `add-enemies`).
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

### Requirement: Enemy patrol
An enemy SHALL patrol on the x axis between the tiles of its `patrol` at `speed` px per tick. It SHALL turn at each end of the patrol.

- A level can have a list `enemies`. An enemy has an `id`, a tile `x` and `y`, a `patrol: [from, to]` in tiles and a `speed` in px per tick.
- The enemy box is 14 × 14 px.
- At the start of an attempt, each enemy SHALL be alive.
- On the x axis, the enemy box is in the middle of the tile `(x, y)`. The bottom edge of the box is on the bottom edge of that tile.
- Example: the tile x = 6, y = 2 gives the box x = 97 and y = 34.
- The patrol bounds are limits for the left edge of the box: `from·16` on the left and `to·16 + 2` on the right. For `patrol` `[5, 8]` the bounds are 80 and 130.
- At the start of an attempt, the speed of an enemy is `+speed` (to the right).
- In each tick, each live enemy SHALL move by its speed after the player moves and before the contact checks.
- When an enemy reaches or passes the right bound, the core SHALL put it on the right bound and set its speed to `−speed`. When an enemy reaches or passes the left bound, the core SHALL put it on the left bound and set its speed to `+speed`.
- A dead enemy MUST NOT move.
- An enemy SHALL move only on the x axis. Tiles do not stop an enemy, and an enemy does not fall.

#### Scenario: createEnemies places the enemy on its tile, centered, and sets patrol bounds in px
- **TEST** `tests/unit/enemies.test.ts`
- **GIVEN** the enemy `e1` with x 6, y 2, `patrol` `[5, 8]` and `speed` 1
- **WHEN** the core creates the enemies for a new attempt
- **THEN** the enemy is `{ id: "e1", x: 97, y: 34, w: 14, h: 14, vx: 1, minX: 80, maxX: 130, alive: true }`

#### Scenario: an enemy turns at the end of its patrol
- **TEST** `tests/unit/enemies.test.ts`
- **GIVEN** the level with the rows `...........`, `...........`, `S.........G`, `###########` and the enemy `e1` with x 6, y 2, `patrol` `[5, 8]` and `speed` 1
- **AND** the enemy is at x = 129.5 with the speed +1
- **WHEN** the enemies move for one tick
- **THEN** the enemy is at x = 130 with the speed −1
- **AND** the test then puts the enemy at x = 80.5. After the enemies move for one more tick, the enemy is at x = 80 with the speed +1

#### Scenario: a dead enemy does not move
- **TEST** `tests/unit/enemies.test.ts`
- **GIVEN** the level with the rows `...........`, `...........`, `S.........G`, `###########` and the enemy `e1` with x 6, y 2, `patrol` `[5, 8]` and `speed` 1
- **AND** the enemy is dead
- **WHEN** the enemies move for one tick
- **THEN** the enemy is at x = 97

### Requirement: Enemy stomp
A stomp SHALL kill the enemy. In a stomp, the core SHALL emit `enemyStomped` with the id of the enemy and set the vertical speed of the player to `PHYS.stompBounce`.

- A stomp is an overlap of the player box with the box of a live enemy when both of these conditions are true:
  1. The player falls in this tick: the vertical speed of the player after the move is more than 0.
  2. At the start of the tick, the bottom edge of the player is at or above the top edge of the enemy. The start of the tick is before the player moves. In numbers: bottom y ≤ top y of the enemy.
- The value of `PHYS.stompBounce` is −5. It belongs to the human.
- A stomp MUST NOT kill the player. The status stays `playing`.
- When the player stomps two or more enemies in one tick, the core SHALL kill each of them. It SHALL emit one `enemyStomped` for each of them, in the order of the enemies in the level.

#### Scenario: ENEMY-stomp-01 — a jump onto the enemy kills it, then the player reaches the goal
- **TEST** `tests/replay/ENEMY-stomp-01.replay.json`
- **GIVEN** the level `fx-enemy-stomp` with the rows `...........`, `...........`, `S.........G`, `###########`, no traps, and the enemy `e1` with x 6, y 2, `patrol` `[6, 6]` and `speed` 1
- **WHEN** the input is 1 tick with no key, then 15 ticks with `right`, then 1 tick with `right` and `jump`, then 100 ticks with `right`
- **THEN** the events contain `enemyStomped` with id `e1`, and after it `levelComplete`
- **AND** the events do not contain `died`

#### Scenario: falling onto the enemy from above kills the enemy and bounces the player
- **TEST** `tests/unit/enemies.test.ts`
- **GIVEN** the level with the rows `...........`, `...........`, `S.........G`, `###########`
- **AND** the enemy `e1` with x 6, y 2, `patrol` `[5, 8]` and `speed` 1 (box at x = 97, y = 34)
- **AND** the player is at x = 97, y = 22 (bottom edge 36) with the vertical speed 3
- **AND** at the start of the tick, the bottom edge of the player was at y = 34. This is the top edge of the enemy
- **WHEN** the core checks the enemy contacts in tick 0
- **THEN** the enemy is dead and the vertical speed of the player is −5
- **AND** the events are exactly `[{ tick: 0, type: "enemyStomped", id: "e1" }]`
- **AND** the status is `playing`

### Requirement: Enemy side hit
When the player box overlaps the box of a live enemy and no contact in this tick is a stomp, the player SHALL die. The core emits `died` with cause `enemy` and sets the status to `dead`.

- A contact from the side and a contact from below are not stomps.
- A dead enemy MUST NOT kill the player.

#### Scenario: ENEMY-side-01 — running into an enemy kills the player
- **TEST** `tests/replay/ENEMY-side-01.replay.json`
- **GIVEN** the level `fx-enemy-side` with the rows `...........`, `...........`, `S.........G`, `###########`, no traps, and the enemy `e1` with x 6, y 2, `patrol` `[5, 8]` and `speed` 1
- **WHEN** the input is 120 ticks with `right`
- **THEN** the events contain `died` with cause `enemy`
- **AND** the events do not contain `enemyStomped`

#### Scenario: touching the enemy from the side kills the player
- **TEST** `tests/unit/enemies.test.ts`
- **GIVEN** the level with the rows `...........`, `...........`, `S.........G`, `###########`
- **AND** the enemy `e1` with x 6, y 2, `patrol` `[5, 8]` and `speed` 1 (box at x = 97, y = 34)
- **AND** the player is at x = 90, y = 34 with the vertical speed 0
- **AND** at the start of the tick the bottom edge of the player was at y = 48
- **WHEN** the core checks the enemy contacts in tick 0
- **THEN** the status is `dead`
- **AND** the events are exactly `[{ tick: 0, type: "died", cause: "enemy" }]`

#### Scenario: rising into the enemy from below kills the player
- **TEST** `tests/unit/enemies.test.ts`
- **GIVEN** the level with the rows `...........`, `...........`, `S.........G`, `###########`
- **AND** the enemy `e1` with x 6, y 2, `patrol` `[5, 8]` and `speed` 1 (box at x = 97, y = 34)
- **AND** the player is at x = 97, y = 40 with the vertical speed −3
- **AND** at the start of the tick the bottom edge of the player was at y = 57
- **WHEN** the core checks the enemy contacts in tick 0
- **THEN** the status is `dead`

#### Scenario: a dead enemy is harmless
- **TEST** `tests/unit/enemies.test.ts`
- **GIVEN** the level with the rows `...........`, `...........`, `S.........G`, `###########`
- **AND** the enemy `e1` with x 6, y 2, `patrol` `[5, 8]` and `speed` 1 (box at x = 97, y = 34)
- **AND** the enemy is dead
- **AND** the player is at x = 97, y = 34 with the vertical speed 0
- **AND** at the start of the tick the bottom edge of the player was at y = 48
- **WHEN** the core checks the enemy contacts in tick 0
- **THEN** the status is `playing`

### Requirement: Stomp beats a side hit
When the player stomps one enemy and touches another live enemy from the side in the same tick, the stomp SHALL win. The player MUST NOT die in that tick because of an enemy.

- The core SHALL kill only the stomped enemies. The other enemy stays alive.
- The result MUST NOT depend on the order of the enemies in the level.

#### Scenario: the stomp wins (stomped enemy first in w.enemies)
- **TEST** `tests/unit/stomp-vs-side.test.ts`
- **GIVEN** the level with the rows `...........`, `...........`, `S.........G`, `###########`
- **AND** the enemy `e1` with x 6, y 2, `patrol` `[6, 6]` and `speed` 1 (box at x = 97, y = 34)
- **AND** the enemy `e2` with x 7, y 2, `patrol` `[7, 7]` and `speed` 1. The test moves `e2` up to y = 30 (box at x = 113, y = 30)
- **AND** the enemy order is `e1`, `e2`
- **AND** the player is at x = 105, y = 22 (bottom edge 36) with the vertical speed 3
- **AND** at the start of the tick, the bottom edge of the player was at y = 34. This is on the top edge of `e1` (a stomp) and below the top edge of `e2` (a side hit)
- **WHEN** the core checks the enemy contacts in tick 0
- **THEN** the status is `playing` and the vertical speed of the player is −5
- **AND** the events are exactly `[{ tick: 0, type: "enemyStomped", id: "e1" }]`
- **AND** `e1` is dead and `e2` is alive

#### Scenario: the stomp wins (side-hit enemy first in w.enemies)
- **TEST** `tests/unit/stomp-vs-side.test.ts`
- **GIVEN** the same level, enemies and player as in the scenario "the stomp wins (stomped enemy first in w.enemies)"
- **AND** the enemy order is `e2`, `e1`
- **WHEN** the core checks the enemy contacts in tick 0
- **THEN** the status is `playing` and the vertical speed of the player is −5
- **AND** the events are exactly `[{ tick: 0, type: "enemyStomped", id: "e1" }]`
- **AND** `e1` is dead and `e2` is alive

### Requirement: Death beats the goal
When a death condition and the goal condition are both true in the same tick, the core SHALL emit only `died` and MUST NOT emit `levelComplete`.

- The core checks the conditions in this order: coins, enemies, spikes, pit, goal. A death stops the checks.
- A death by an enemy (cause `enemy`) is a death. A stomp is not a death, so the checks continue after a stomp.

#### Scenario: TRAP-goal-death-01 — spikes on the goal tile win over the goal
- **GIVEN** the level `fx-goal-death` with the rows `..........`, `..........`, `S.....G...`, `##########`
- **AND** the trap `t1` with trigger `zone` rect `[5, 0, 1, 4]`, action `addSpikes` rect `[6, 2, 1, 1]` and `delayTicks` 0
- **WHEN** the input is 120 ticks with `right`
- **THEN** the events contain `trapTriggered` with id `t1`, and after it `died` with cause `spikes`
- **AND** the events do not contain `levelComplete`

#### Scenario: ENEMY-goal-death-01 — an enemy on the goal tile wins over the goal
- **TEST** `tests/replay/ENEMY-goal-death-01.replay.json`
- **GIVEN** the level `fx-enemy-goal` with the rows `..........`, `..........`, `S........G`, `##########`, no traps, and the enemy `e1` with x 9, y 2, `patrol` `[9, 9]` and `speed` 1
- **WHEN** the input is 100 ticks with `right`
- **THEN** the events contain `died` with cause `enemy` at tick 65
- **AND** the events do not contain `levelComplete` and do not contain `enemyStomped`

### Requirement: Trap triggers
A trap SHALL trigger when its trigger condition is true, and SHALL emit `trapTriggered` with the trap id in that tick.

- A `zone` trigger is true when the player box overlaps its `rect` (in tiles).
- An `event` trigger with `event: "coinCollected"` and an `id` is true in the tick in which the core emits `coinCollected` with that id. The trap triggers in the same tick, after the coin event.
- An `event` trigger with `event: "enemyStomped"` and an `id` is true in the tick in which the core emits `enemyStomped` with that id. The trap triggers in the same tick, after the stomp event.
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

#### Scenario: ENEMY-trap-01 — a stomp is the trigger of a trap
- **TEST** `tests/replay/ENEMY-trap-01.replay.json`
- **GIVEN** the level `fx-enemy-trap` with the rows `...........`, `...........`, `S.........G`, `###########` and the enemy `e1` with x 6, y 2, `patrol` `[6, 6]` and `speed` 1
- **AND** the trap `t1` with trigger `event` `enemyStomped` id `e1`, action `moveGoal` to `[0, 0]` and `delayTicks` 0
- **WHEN** the input is 1 tick with no key, then 15 ticks with `right`, then 1 tick with `right` and `jump`, then 100 ticks with `right`
- **THEN** the events contain `enemyStomped` with id `e1`, and after it `trapTriggered` with id `t1`
- **AND** the events do not contain `levelComplete`

#### Scenario: ENEMY-trap-tick-01 — the trap triggers in the tick of the stomp
- **TEST** `tests/replay/ENEMY-trap-tick-01.replay.json`
- **GIVEN** the level `fx-enemy-drop-trap` with the rows `..S.......`, `..........`, `.........G`, `##########` and the enemy `e1` with x 2, y 2, `patrol` `[2, 2]` and `speed` 1
- **AND** the trap `t1` with trigger `event` `enemyStomped` id `e1`, action `moveGoal` to `[0, 0]` and `delayTicks` 0
- **WHEN** the input is 40 ticks with no key, then 100 ticks with `right`
- **THEN** the events contain `enemyStomped` with id `e1` at tick 8, and after it `trapTriggered` with id `t1` at tick 8
- **AND** the events do not contain `died` and do not contain `levelComplete`
- **AND** the status is `playing` and the goal is at `{ x: 0, y: 0 }`

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
