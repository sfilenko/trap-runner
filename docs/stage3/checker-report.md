# Звіт game-checker (етап 3)

Сесія `a3668d3a` (режим `default`), чистий worktree `D:/AITools/trap-runner-check` (detached) на `bdef7a5` = SHA join `9af5b43` + коміт рендеру ворогів (лише `src/render/draw.ts`, 2 рядки). Промпт людини: `Use the game-checker subagent on the current commit. Save nothing. Give me its full report.` Звіт збережено дослівно, у тому вигляді, в якому його вставила людина.

````text
Here is the game-checker's full report on bdef7a5. It changed no files, and I saved nothing.

---

Status: findings. The commit has no functional defect. The findings are gaps in the tests and specs that are out of date, plus one note.

Status: findings
Commit: bdef7a54e85da4639fa3ab6bf188724df0a9d41e

Scope of the commit. It changes only src/render/draw.ts, adding 2 lines (52–53) that draw each live enemy. This is step H of docs/stage3/dag.md ("render enemies").

Requirements read

- docs/design.md §5 (level model), §6 (game rules), §7 (verification)
- openspec/specs/core-gameplay/spec.md
- openspec/specs/level-validation/spec.md
- docs/stage3/requirements.md (FR-1..5, NFR-1/2, TC-1/2, BC-1)
- docs/stage3/dag.md (only to place the commit in the plan)
- It did not read docs/plan/ or docs/stage3/brief-*.md.

Expected behaviors

It wrote these from the rules before it read src/.

┌─────┬────────────────────────────────────┬────────────┬──────────────────────────────────────────────────────────┐
│  #  │ Expected behavior (from the rules) │  Verdict   │                         Evidence                         │
├─────┼────────────────────────────────────┼────────────┼──────────────────────────────────────────────────────────┤
│     │ FR-1: a live enemy moves speed px  │            │ src/core/enemies.ts:26-38, bounds at :19-20. Test        │
│ E1  │ each tick. It turns at each end of │ PASS       │ tests/unit/enemies.test.ts:26-34. Enemies start moving   │
│     │  the patrol and stays inside tiles │            │ right (enemies.ts:18). The rules don't say which         │
│     │  patrol[0]..patrol[1].             │            │ direction comes first.                                   │
├─────┼────────────────────────────────────┼────────────┼──────────────────────────────────────────────────────────┤
│     │ FR-2: a stomp sets the enemy to    │            │ enemies.ts:52-56. PHYS.stompBounce: -5 at                │
│ E2  │ dead, sets the player's vy to −5   │ PASS       │ src/core/physics.ts:11. Tests enemies.test.ts:43-50 and  │
│     │ and emits enemyStomped with the    │            │ tests/replay/ENEMY-stomp-01.replay.json                  │
│     │ enemy id in that tick.             │            │                                                          │
├─────┼────────────────────────────────────┼────────────┼──────────────────────────────────────────────────────────┤
│     │ FR-2 edge case: when the previous  │            │ enemies.ts:47 uses prevBottom <= e.y. Test               │
│ E3  │ bottom equals the enemy top, it    │ PASS       │ enemies.test.ts:45 (prevBottom 34 = top 34)              │
│     │ counts as a stomp ("at or above"). │            │                                                          │
├─────┼────────────────────────────────────┼────────────┼──────────────────────────────────────────────────────────┤
│     │ FR-3: side contact with a live     │            │ enemies.ts:48-50. Tests enemies.test.ts:52-57 and        │
│ E4  │ enemy emits died with cause enemy  │ PASS       │ ENEMY-side-01.replay.json                                │
│     │ and sets status dead.              │            │                                                          │
├─────┼────────────────────────────────────┼────────────┼──────────────────────────────────────────────────────────┤
│     │ FR-2/3: if the player is rising    │            │                                                          │
│ E5  │ (vy ≤ 0) when they hit an enemy,   │ PASS       │ enemies.ts:47. Test enemies.test.ts:59-63 (see Test      │
│     │ it's not a stomp, so the player    │            │ quality)                                                 │
│     │ dies.                              │            │                                                          │
├─────┼────────────────────────────────────┼────────────┼──────────────────────────────────────────────────────────┤
│ E6  │ FR-3: a dead enemy doesn't move    │ PASS       │ enemies.ts:28 and :45. Tests enemies.test.ts:36-41 and   │
│     │ and doesn't kill.                  │            │ :65-70                                                   │
├─────┼────────────────────────────────────┼────────────┼──────────────────────────────────────────────────────────┤
│     │ §6 / §7: if a stomp and a side hit │ Code PASS, │ The code is correct: enemies.ts:47-56 doesn't kill the   │
│ E7  │  happen in the same tick, the      │  test NOT  │ player when at least one hit is a stomp. But no test has │
│     │ stomp wins. §7 asks for a unit     │ CHECKED    │  two enemies, or a stomp and a side hit in one tick.     │
│     │ test of this case.                 │ (F1)       │                                                          │
├─────┼────────────────────────────────────┼────────────┼──────────────────────────────────────────────────────────┤
│     │ FR-4: a trap                       │ Code PASS, │ src/core/traps.ts:22 reads the current tick's events.    │
│ E8  │ {event:"enemyStomped", id} fires   │  test weak │ src/core/step.ts:16-17 runs contacts before triggers.    │
│     │ in the same tick as the stomp,     │  (F2)      │ ENEMY-trap-01.replay.json checks only the order, not the │
│     │ after the stomp event.             │            │  tick.                                                   │
├─────┼────────────────────────────────────┼────────────┼──────────────────────────────────────────────────────────┤
│     │ §6 / spec "Death beats the goal":  │ Code PASS, │ src/core/interactions.ts:16-17 returns before the goal   │
│ E9  │ if the player is killed by an      │  test NOT  │ check at :32. No test covers it. Counterexample CX3      │
│     │ enemy and reaches the goal in the  │ CHECKED    │ does.                                                    │
│     │ same tick, only died is emitted.   │            │                                                          │
├─────┼────────────────────────────────────┼────────────┼──────────────────────────────────────────────────────────┤
│     │ §6: a new attempt resets the       │ PASS (code │ src/main.ts:81 calls createWorld, and                    │
│ E10 │ enemies (alive again, at their     │  read      │ src/core/world.ts:40 calls createEnemies. No test covers │
│     │ start positions).                  │ only)      │  the main loop.                                          │
├─────┼────────────────────────────────────┼────────────┼──────────────────────────────────────────────────────────┤
│     │ Commit H: draw only live enemies,  │ Code PASS, │ draw.ts:53 is inside save/translate (:23-24) and restore │
│ E11 │ in world pixels, inside the camera │  run NOT   │  (:54). No unit test covers it, and tests/e2e doesn't    │
│     │  transform.                        │ CHECKED    │ exist. No level has enemies yet, so the game can't show  │
│     │                                    │            │ this code (N1).                                          │
├─────┼────────────────────────────────────┼────────────┼──────────────────────────────────────────────────────────┤
│     │ FR-5: level-02 and level-03 each   │            │ level-02: width 56, 2 traps, 3 coins. level-03: width    │
│ E12 │ have at least 2 traps, at least 2  │ PASS       │ 64, 2 traps, 2 coins. validate:levels prints PASS for    │
│     │ coins and a width of 40–80 tiles,  │            │ both.                                                    │
│     │ and both pass validation.          │            │                                                          │
├─────┼────────────────────────────────────┼────────────┼──────────────────────────────────────────────────────────┤
│     │                                    │            │ Boundaries: 0 violations. pnpm check: 3.06 s real. git   │
│ E13 │ NFR-1, NFR-2, BC-1                 │ PASS       │ log -- src/core/physics.ts shows PHYS unchanged since    │
│     │                                    │            │ 03aba67 (stage 2).                                       │
└─────┴────────────────────────────────────┴────────────┴──────────────────────────────────────────────────────────┘

Counterexamples

These exist only in the report. No files were created. The checker worked out each tick by hand from PHYS (gravity 0.5, run speed 2, stomp bounce −5) and the enemy box (14×14, x = tile·16+1).

CX1: the stomp edge case (bottom = top), and a dead enemy is harmless. If the code used < instead of <=, this case would give died at tick 8. After tick k, y = 2 + 0.25(k+1)(k+2). At tick 8, y = 24.5, so the boxes overlap and prevBottom = 20 + 14 = 34, which equals the enemy top.
{
  "scenario": "ENEMY-stomp-edge-cx",
  "level": {
    "id": "fx-enemy-drop",
    "tiles": ["..S.......", "..........", ".........G", "##########"],
    "enemies": [{"id": "e1", "x": 2, "y": 2, "patrol": [2, 2], "speed": 1}],
    "traps": []
  },
  "inputs": [{"ticks": 40}, {"ticks": 100, "right": true}],
  "expect": [{"type": "enemyStomped", "id": "e1", "tick": 8}, {"type": "levelComplete"}],
  "absent": [{"type": "died"}]
}

CX2: FR-4 in the same tick. This checks the tick, which ENEMY-trap-01 doesn't.
{
  "scenario": "ENEMY-trap-tick-cx",
  "level": {
    "id": "fx-enemy-drop-trap",
    "tiles": ["..S.......", "..........", ".........G", "##########"],
    "enemies": [{"id": "e1", "x": 2, "y": 2, "patrol": [2, 2], "speed": 1}],
    "traps": [{"id": "t1", "trigger": {"kind": "event", "event": "enemyStomped", "id": "e1"}, "action": {"kind": "moveGoal", "to": [0, 0]}, "delayTicks": 0}]
  },
  "inputs": [{"ticks": 40}, {"ticks": 100, "right": true}],
  "expect": [{"type": "enemyStomped", "id": "e1", "tick": 8}, {"type": "trapTriggered", "id": "t1", "tick": 8}],
  "absent": [{"type": "died"}, {"type": "levelComplete"}],
  "final": {"status": "playing", "goal": {"x": 0, "y": 0}}
}

CX3: enemy death and the goal in the same tick. The enemy's x cycles through 146, 145, 144, 145. The player's x after tick k is 2k+4, so at k = 65 the player is at x = 134. That overlaps the goal (134 > 132) and the enemy (146 > 145) in the same tick.
{
  "scenario": "ENEMY-goal-death-cx",
  "level": {
    "id": "fx-enemy-goal",
    "tiles": ["..........", "..........", "S........G", "##########"],
    "enemies": [{"id": "e1", "x": 9, "y": 2, "patrol": [9, 9], "speed": 1}],
    "traps": []
  },
  "inputs": [{"ticks": 100, "right": true}],
  "expect": [{"type": "died", "cause": "enemy", "tick": 65}],
  "absent": [{"type": "levelComplete"}, {"type": "enemyStomped"}]
}

Commands and gate output

- git rev-parse HEAD returned bdef7a54e85da4639fa3ab6bf188724df0a9d41e.
- git show --stat HEAD returned src/render/draw.ts | 2 ++.
- pnpm check (typecheck, boundaries, test, validate:levels and spec:check) ended with:
check-boundaries: 11 files in src/core, 0 violations
 Test Files  10 passed (10)
      Tests  76 passed (76)
PASS level-01.json
PASS level-02.json
PASS level-03.json
validate-level: 3 levels, 0 failed
spec:check ok — specs: 2 · active changes: 0 · archived: 2
real  0m3.058s
- pnpm check already includes boundaries and validate:levels, so it didn't run them separately.
- It didn't run pnpm hooks:selftest, because that writes to a temporary directory (scripts/hooks-selftest.mjs:19, :53, :55). That would break the "save nothing" rule.

Findings

- F1 (test gap, fails §7): design §7 asks for a unit test of "a stomp against a side hit in the same tick". tests/unit/enemies.test.ts has no such test. Reading src/core/enemies.ts:47-56, the code is correct.
- F2 (weak test): tests/replay/ENEMY-trap-01.replay.json only checks that trapTriggered comes after enemyStomped. Because it has no tick field, it doesn't check FR-4's "in the tick of that stomp". A change that fires the trap one tick late would still pass. CX2 closes this gap.
- F3 (specs out of date, not in this commit's diff):
  - openspec/specs/core-gameplay/spec.md:5 still says "It has no enemies".
  - No OpenSpec scenario uses the ids ENEMY-side-01, ENEMY-stomp-01 or ENEMY-trap-01, but design §7 says each replay file name must be an OpenSpec scenario id.
  - spec:check shows 0 active changes, so the stage 3 work has no OpenSpec change. spec:check catches none of this.
- N1 (note, not a defect): no level file has enemies (levels 01–03 have none). So draw.ts:52-53 has no visible effect in the game, and no automated check covers it. If you deleted line 53, all 76 tests would still pass. DAG step H also includes "an enemy in level-03", and that part isn't done yet.
- It found nothing failing in the commit's own diff.

Test quality

- Test: tests/unit/enemies.test.ts:43, "falling onto the enemy from above kills the enemy and bounces the player".
- Mutation: at src/core/enemies.ts:47, change prevBottom <= e.y to prevBottom < e.y.
- Expected failure: the test uses prevBottom = 34 and an enemy top of 34. With <, nothing counts as a stomp, so die(w, "enemy") runs. Then expect(w.enemies[0].alive).toBe(false) at line 46 fails, because the enemy is still alive.
- Cause: the failure comes from the behavior, not from an import error. The mutation doesn't change any signature or import.
- Limit: it didn't actually run this mutation, because file edits weren't allowed. It worked it out from the code.
- Note on E5: the test at :59-63 doesn't test the p.vy > 0 check by itself. With prevBottom = 57, the other condition in the check already fails. The vy > 0 check is redundant in practice, because enemies only move horizontally.

Final verdict

The checker accepts the commit. The render change is correct and the gate passes in 3 s. The enemy code this change relies on follows FR-1..FR-4 and the rule that a stomp wins. Before you count enemies as verified, add:
- the unit test that §7 asks for (F1),
- a tick check for FR-4 (F2),
- OpenSpec scenarios for the ENEMY replays (F3).
````

## Перевірка orchestrator (сесія `08110719`)

- Порядок і межі читання — за `.agent-log/actions.jsonl` worktree checker'а (58 рядків, 19:47:03Z → 19:53:03Z): `docs/design.md`, `docs/stage3/requirements.md`, обидві спеки, `dag.md`, replay-файли `TRAP-*` → `pnpm check` (19:49:45Z) → лише потім `src/` (перший Read 19:50:46Z). `docs/plan/` і `docs/stage3/brief-*.md` не відкривав. У worktree були лише закомічені файли: ні звітів workers, ні `costs.md` — розбіжність «stomp проти удару збоку на двох ворогах» checker'у не підказано.
- `git status` після запуску: змінено лише `.agent-log/actions.jsonl` (журнал hook'ів); файлів не створено.
- Контрприклади прогнано на справжньому `step()` (`runReplay`, скрипт у scratchpad orchestrator, `main` на `bdef7a5`): CX1 — `8:enemyStomped:e1`, `89:levelComplete`, статус `complete`; CX2 — `8:enemyStomped:e1`, `8:trapTriggered:t1`, статус `playing`, ціль `(0, 0)`; CX3 — `65:died:enemy`, статус `dead`, `levelComplete` немає. Усі три збігаються з ручним розрахунком checker'а до тіку. На поточному коді всі три зелені — це прогалини тестів, не дефекти коду.
- E7: checker вивів правило «stomp перемагає» з `design.md` §6 і визнав код worker'а A правильним, не бачивши еталону з плану. Еталон (`docs/plan/stage-3-orchestration.md`, Task 3.3) у випадку «stomp на e1 + удар збоку e2» дає смерть або залежність від порядку `w.enemies` — тобто §6 порушує саме еталон, а не код worker'а.
