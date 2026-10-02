---
name: make-level
description: Use when you create or change a Trap Runner level (levels/level-NN.json) and its solution file (levels/level-NN.solution.json). Gives the level format, the physics numbers, and the validation command.
---

# Make a level

## Steps

1. Read docs/design.md, sections 5 and 6.
2. Read one existing file in levels/ as an example, if one exists.
3. Write levels/level-NN.json. Use exactly 15 rows. All rows must have the same length. Use a width from 40 to 80 tiles.
4. Put exactly one S tile and exactly one G tile in the level. Put solid tiles (#) under S.
5. Put at least one coin (o) and at least one trap on the path from S to G.
6. Write levels/level-NN.solution.json in this form: {"inputs": [{"ticks": 30, "right": true}, {"ticks": 1, "right": true, "jump": true}]}.
7. Run this command: pnpm validate:levels levels/level-NN.json
8. If the output shows FAIL, read each error line. Change the level or the solution. Then do step 7 again.
9. Stop when the output shows PASS, or after 5 runs of step 7. Report the last output.

## Numbers

- One tile is 16 px. One tick is 1/60 s.
- The player runs 2 px per tick. A run of 8 ticks moves the player one tile.
- A jump goes up 60 px (3.75 tiles) and lasts about 31 ticks. A jump with "right" held moves the player about 62 px (4 tiles) forward.
- The jump starts only on a press. Release the jump key for at least one tick before the next jump.
- The first tick of an attempt has no ground contact. Do not jump on tick 0.
- A coin id is c<x>_<y>. A trap with an event trigger must name an existing coin id.

## Rules

- Do not change files in src/. If a level needs a change in src/, stop and report it as a blocker.
- Do not copy an existing level.
- Do not edit the validator or the tests to make a level pass.
