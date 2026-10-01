## Context

See proposal.md for the motivation. Current state: `src/` holds only `clock.ts` and `main.ts`. `src/core/` does not exist yet. `tests/unit/clock.test.ts` is the only test file. `pnpm check` runs typecheck, `pnpm boundaries`, Vitest and `pnpm spec:check`.

Sources of the approach:

- `docs/design.md` §4 (architecture), §5 (level format, traps) and §6 (game rules).
- `docs/plan/stage-2-core.md` Tasks 2.2–2.5. The plan holds the exact code and tests, and the expected test counts measured on that code.

Constraints:

- `src/core/` is pure and deterministic. It has no `window`, `document`, `Math.random` or `Date`, and no import from `src/render` or `src/input`. The `guard-core` hook and `pnpm boundaries` enforce this.
- `PHYS` belongs to the human. This change creates `physics.ts` with the start values from the plan (`gravity 0.5`, `maxFall 8`, `runSpeed 2`, `jumpVelocity -8`, `stompBounce -5`). The agent does not change these values after that.

## Goals / Non-Goals

**Goals:**
- A `step(world, input)` function that is the only way to advance the game.
- A replay format and runner, so that each spec scenario is one JSON file and one test.
- Unit tests for the rules that the 13 replay scenarios do not assert:
  - the input World stays unchanged,
  - the ceiling and tunneling,
  - two traps in one tick, one fire per attempt, pending actions.

**Non-Goals:**
- Enemies. `DeathCause` already has the value `enemy` so that stage 3 does not change the type, but nothing in this change emits it.
- Level validation (15 rows, one `S`, one `G`, unique ids, `rect` inside the level). That is change `add-level-validation`. `createWorld` only throws when `S` or `G` is missing.
- The restart after a death, the death counter and the score. They belong to the game loop outside `src/core/`.

## Decisions

### D1. `step` clones the World with `structuredClone`
`step` clones `prev`, mutates the clone and returns it. Helpers such as `stepPlayer`, `resolveInteractions` and `applyAction` mutate the clone in place.
- Alternative: immutable updates with spread copies in each helper. This is more code and more chances to share a nested array (`grid`, `coins`) by mistake.
- Cost: one deep copy per tick. A World is small (15 rows × level width), so 60 copies per second is acceptable.
- `step` returns a finished World (`status` is not `playing`) as is, without a clone.

### D2. Fixed order inside one tick
1. `fireDueActions`: delayed trap actions that are due at this tick, in the order of `traps[]`.
2. `stepPlayer`: input, gravity, movement and collisions.
3. `resolveInteractions`: coins, spikes, pit, goal. A death stops the checks. This order makes "death beats the goal" true by construction.
4. `checkTriggers`, but only if the player is not dead. Coin events of step 3 are already in `events`, so a coin trigger fires in the same tick.
5. `tick += 1`. Events carry the tick number before the increment, so the first tick is tick 0.

An action with `delayTicks` 0 runs inside step 4. Spikes that it adds can kill the player only in the next tick.

### D3. Movement in sub-steps
The move of one tick is split into `n = ceil(max(|vx|, |vy|) / 4)` equal sub-steps. Each sub-step moves x, resolves x collisions, then moves y and resolves y collisions. A sub-step is at most 4 px, which is less than the player width (12) and the tile size (16). So the player cannot skip a tile at the maximum fall speed of 8 px per tick.
- Alternative: swept AABB. It is exact but has more code and more edge cases for an agent to get wrong.

### D4. Level edges in `tileAt`
`tileAt` returns `#` for a column outside the level and `.` for a row outside the level. The left and right edges are walls. The player can fall out of the bottom (pit) and jump above the top. A final clamp keeps x in `[0, width·16 − 12]`.

### D5. Jump on a press only
`Player.jumpHeld` stores the `jump` key of the previous tick. A jump starts only when `jump` is down, `jumpHeld` is false and `onGround` is true. `createWorld` sets `onGround` to false, so the player must touch the floor for one tick before the first jump. This is why `MOVE-jump-01` starts with 1 tick with no key.

### D6. Traps
- `triggered` holds the ids of the traps that fired in this attempt. It gives one fire per attempt.
- `pending` holds `{ trapIndex, dueTick }`. `fireDueActions` sorts due actions by `trapIndex`, so they also run in the order of `traps[]`.
- `createWorld` builds a fresh World from the level, so a new attempt has empty `triggered` and `pending` and the original tiles.

### D7. Replay format and runner
A replay file has `scenario`, `level` (inline `LevelDef`), `inputs` (RLE), and optional `expect`, `absent` and `final`.
- `expect`: events that must occur in this order. Other events can occur between them. Each entry matches the event fields it names.
- `absent`: events that must not occur.
- `final`: a partial match on the World after the run.
- `runReplay` stops at the first tick in which the status is not `playing`.

`tests/replay/replay.test.ts` reads all `*.replay.json` files, so a new scenario needs no new test code. The test name starts with the scenario id.

### D8. One capability, `core-gameplay`
One spec holds all rules of the core without enemies. Stage 3 adds the enemy rules as a delta to the same capability.
- Alternative: one capability per topic (movement, traps). The 13 scenarios are too few to justify five specs.

### D9. The task list includes plan Task 2.2
`tasks.md` follows plan Tasks 2.3, 2.4 and 2.5. Task 2.3 needs the types, geometry, `die`, a `physics.ts` stub and a working `createWorld` from plan Task 2.2. Without them the replay tests fail on an import or on a "not implemented" error, not on behavior. So task group 1 does plan Task 2.2 first, in the same test-first order. Plan Task 2.2 Step 1 also says that `tasks.md` repeats Tasks 2.2–2.5.

## Risks / Trade-offs

- [A scenario value is wrong, for example in `MOVE-jump-01`] → Change the spec first in a separate commit (`spec: <what and why>`). Then change the test. See plan Task 2.5 Step 5.
- [Exact float positions] → All `PHYS` values are multiples of 0.5, and the sub-step split divides them exactly in the tested cases. The scenarios assert whole pixel values that the plan code produced.
- [The test counts drift from the plan when the agent adds a test] → The counts in `tasks.md` are the counts of the plan code. More tests are acceptable. The rule is 0 failed at the end.
- [`structuredClone` cost] → Accepted (D1). If a profile shows a problem later, change it without a change to the spec.
- [The fixture levels have 4 rows, but a real level has 15] → Only the pit line depends on the level height. It is a constant 240 px. A player who falls out of a 4-row fixture still reaches the pit line.
