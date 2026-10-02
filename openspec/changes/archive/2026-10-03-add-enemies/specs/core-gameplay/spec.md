## ADDED Requirements

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

## MODIFIED Requirements

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
