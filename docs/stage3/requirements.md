# Stage 3 — enemies and levels 02–03

## Requirements
- FR-1: An enemy SHALL patrol between patrol[0] and patrol[1] (tiles) at `speed` px per tick and turn at each end.
- FR-2: A stomp SHALL kill the enemy, set the player's vy to -5 and emit enemyStomped. In a stomp, the player falls (vy > 0). One tick earlier, the player's bottom was at or above the enemy's top.
- FR-3: Any other contact with a live enemy SHALL kill the player with cause "enemy".
- FR-4: A trap with trigger {kind: "event", event: "enemyStomped", id} SHALL fire in the tick of that stomp.
- FR-5: levels/level-02.json and levels/level-03.json SHALL each have 2 or more traps, 2 or more coins, a width of 40–80 tiles, and SHALL pass `pnpm validate:levels`.
- NFR-1: src/core SHALL stay deterministic (guard-core + `pnpm boundaries`).
- NFR-2: `pnpm check` SHALL finish in less than 30 s on the developer machine.
- TC-1: The contract C0 signatures (src/core/enemies.ts, src/core/types.ts) SHALL NOT change without the orchestrator.
- TC-2: Workers SHALL NOT add dependencies.
- BC-1: PHYS values belong to the human and SHALL NOT change.

## Slice S1
Enemies in the core (FR-1..4) + two levels without enemies (FR-5). Enemies in levels and in the renderer come after the join.

## Scenarios
- ENEMY-side-01, ENEMY-stomp-01, ENEMY-trap-01 (tests/replay, worker A)
- LEVEL-02-valid, LEVEL-03-valid: `pnpm validate:levels` prints PASS (worker B)
