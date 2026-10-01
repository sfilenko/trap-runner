## Why

Trap Runner has no game logic yet. `src/` holds only `clock.ts` and `main.ts`. The renderer, the level loop and the level validator all need a pure, deterministic core first. A replay of recorded inputs must give the same result on every machine. This change adds that core, without enemies. Enemies are the contract of stage 3.

## What Changes

- Add a tick model: one call of `step(world, input)` is one tick (1/60 s). `step` returns a new World and keeps the input World unchanged.
- Add player movement: run at 2 px per tick and gravity. A jump starts only on a key press and only on the ground.
- Add collisions with solid tiles: walls, ceiling, the left and right level edges, and no tunneling through a one-tile wall or platform.
- Add coins with the id `c<x>_<y>`, spikes, the pit (a fall below the level), and the goal.
- Add the rule that a death beats the goal in the same tick.
- Add traps: `zone` and `coinCollected` event triggers, the actions `removeTiles`, `addSpikes` and `moveGoal`, `delayTicks`, one fire per attempt, and the order of `traps[]` in one tick.
- Add a replay runner and 13 replay scenarios (`tests/replay/<id>.replay.json`). Each scenario id in the spec is the name of one replay file and of one test.
- Not in this change: enemies (`enemies[]`, stomp, side hit). The level schema and the level validator are in change `add-level-validation`. Rendering, keyboard input, the game loop, the score and the death counter are in later stages.

## Capabilities

### New Capabilities
- `core-gameplay`: the pure, deterministic game core. It covers the tick model, the player movement and collisions, coins, spikes, the pit, the goal and traps. It does not cover enemies.

### Modified Capabilities
None. `openspec/specs/` is empty.

## Impact

- New code in `src/core/`: `types.ts`, `geometry.ts`, `events.ts`, `world.ts`, `physics.ts`, `interactions.ts`, `traps.ts`, `step.ts`, `replay.ts`.
- New tests: `tests/helpers.ts`, `tests/unit/{world,step,replay,physics,traps}.test.ts`, `tests/replay/replay.test.ts` and 13 files `tests/replay/*.replay.json`.
- `PHYS` in `src/core/physics.ts` gets the start values from `docs/plan/stage-2-core.md` Task 2.2. Only the human changes them after that.
- The `src/core` boundary applies to all new files: no `window`, `document`, `Math.random` or `Date`, and no import from `src/render` or `src/input`. `pnpm boundaries` checks it.
- No new dependencies. `pnpm check` runs the new tests.
