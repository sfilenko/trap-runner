# AGENTS.md — Trap Runner

## Commands
- `pnpm check` is the gate. It runs the typecheck, the `src/core` boundary check and the unit tests.
- Before you say "done", run `pnpm check`. Quote its last lines in your report.
- `pnpm hooks:selftest` checks the hooks without an agent.
- `pnpm agent:log` shows a summary of `.agent-log/actions.jsonl`.
- Later stages add `pnpm validate:levels` and `pnpm e2e`.

## Boundary of src/core
- Code in `src/core/` must be pure and deterministic.
- Do not use `window`, `document`, `Math.random` or `Date` in `src/core/`. This rule applies to comments too.
- Do not import from `src/render/` or `src/input/` in `src/core/`.
- The `guard-core` hook blocks an edit that breaks these rules. `pnpm boundaries` checks all files in `src/core/`.
- The list of bans is in `scripts/check-boundaries.mjs` only.

## Tests first
1. Write a stub with the correct signature.
2. Write a test. The test must fail because of behavior, not because of an import or a syntax error.
3. The human commits the red test.
4. Write the code until the test passes.
5. The human commits the green code.

## Do not change
- Do not change `PHYS` in `src/core/physics.ts`. Only the human changes it. A change breaks the replays and the level solutions.
- Do not edit the control layer:
  - `.claude/settings.json`
  - `.claude/hooks/**`
  - `scripts/check-boundaries.mjs`
  - `scripts/hooks-selftest.mjs`
  - `.githooks/**`
  - `AGENTS.md`
- To change the control layer, write the change as text. The human applies it.

## Trust
- Inside an approved OpenSpec change, you work at level 3. You do the tasks of the change without approval of each step.
- Outside an OpenSpec change, you work at level 1. You propose an action, and the human decides.

## Commits
- Do not commit unless the human tells you to.
- Never run `git push`.

## Levels
- The level format is in `docs/design.md` §5.
- A level has exactly 15 rows of equal length, one `S` and one `G`.
- The id of a coin is `c<x>_<y>`.

## Session
- At the start of a session, read `docs/session-notes.md`.
- At the end of a session, update `docs/session-notes.md`. Write what you did, what does not work, and one next action.

## Language
- Write code, OpenSpec requirements and commit messages in English.
- Write the text in the game in Ukrainian.
- Write the journals in `docs/` in Ukrainian.
