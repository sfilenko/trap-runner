# Task brief — Worker B (levels 02 and 03)

| Field | Value |
|---|---|
| Goal and input | Create levels/level-02.json and levels/level-03.json with solution files. Use the make-level skill. |
| Requirements | FR-5, TC-2, BC-1 |
| Shared base | base: 2aefcdaa13b5c52decdbfca7ca82542c09a11de9 (tag contract-c0). Read this revision. |
| Contract | levels/level.schema.ts, docs/design.md §5 |
| Acceptance scenario | `pnpm validate:levels` prints PASS for level-01, level-02, level-03 and "3 levels, 0 failed". |
| Allowed files (owned) | levels/level-02.json, levels/level-02.solution.json, levels/level-03.json, levels/level-03.solution.json |
| Forbidden | src/, tools/, tests/, levels/level-01*, levels/level.schema.ts, enemies in the levels, new dependencies |
| Limits | 60 min, budget: subscription limit, no $ cap |
| Stop condition | A level needs a change outside the owned files, OR 5 validation runs per level fail, OR the time is over → stop and report. |
| Allowed commands | `pnpm validate:levels`, `pnpm check`, `git status`, `git diff`, `git log`, `git commit` (with the human's approval) |
| Who decides | Difficulty and fun → human. |

## Level rules
- Each level: 2 or more traps, 2 or more coins, width 40–80 tiles.
- Level 02 uses removeTiles and addSpikes. Level 03 uses moveGoal and a coin-event trap (bait coin).
- Different layouts. Do not copy level-01.

## Report form
(the same as brief A)
