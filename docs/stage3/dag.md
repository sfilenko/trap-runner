# DAG — stage 3

```text
C0  contract (orchestrator): types, enemies.ts signatures, schema, validator, .gitattributes
 ├─> A  enemies: moveEnemies, resolveEnemyContacts + tests       (worker A, worktree ../trap-runner-a)
 └─> B  levels 02 and 03 + solutions, no enemies                 (worker B, worktree ../trap-runner-b)
A + B ─> J  join on one SHA, pnpm check                          (orchestrator)
J ─> K  game-checker on the J SHA                                (checker, fresh context)
K ─> H  human decision per finding, render enemies, enemy in level-03 (human + orchestrator)
```

Critical path: C0 → A → J → K → H.
A and B are independent. B does not use enemies. A does not touch levels/.
Shared files (`types.ts`, `enemies.ts` signatures, `level.schema.ts`, `validate-level.ts`) belong to the orchestrator.
