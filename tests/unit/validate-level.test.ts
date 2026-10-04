import { describe, expect, test } from "vitest";
import { validateLevel } from "../../tools/validate-level";
import { rows15 } from "../helpers";

const trap = { id: "t1", trigger: { kind: "zone", rect: [5, 0, 1, 15] }, action: { kind: "addSpikes", rect: [0, 0, 1, 1] }, delayTicks: 0 };
const valid = { id: "level-90", tiles: rows15(["S..o......G", "###########"]), traps: [trap] };
const solution = { inputs: [{ ticks: 120, right: true }] };
const e1 = { id: "e1", x: 8, y: 0, patrol: [7, 9], speed: 1 };
const has = (text: string) => expect.arrayContaining([expect.stringContaining(text)]);

describe("validateLevel", () => {
  test("a valid level with a working solution has no errors", () => {
    expect(validateLevel(valid, solution)).toEqual([]);
  });

  test("the level must have 15 rows", () => {
    expect(validateLevel({ ...valid, tiles: valid.tiles.slice(1) }, solution)).toEqual(has("schema: tiles"));
  });

  test("all rows must have the same length", () => {
    expect(validateLevel({ ...valid, tiles: rows15(["S..o......G", "##########"]) }, solution)).toEqual(has("row 14 has length 10, expected 11"));
  });

  test("exactly one S", () => {
    expect(validateLevel({ ...valid, tiles: rows15(["S..o.S....G", "###########"]) }, solution)).toEqual(has("expected exactly 1 S, found 2"));
  });

  test("an event trigger must name an existing coin", () => {
    const bad = { ...valid, traps: [{ ...trap, trigger: { kind: "event", event: "coinCollected", id: "c9_9" } }] };
    expect(validateLevel(bad, solution)).toEqual(has("coin c9_9 does not exist"));
  });

  test("an action target must be inside the level", () => {
    const bad = { ...valid, traps: [{ ...trap, action: { kind: "addSpikes", rect: [10, 14, 2, 1] } }] };
    expect(validateLevel(bad, solution)).toEqual(has("action target is outside the level"));
  });

  test("the solution must finish the level", () => {
    const deadly = { ...valid, tiles: rows15(["S..o..^...G", "###########"]) };
    expect(validateLevel(deadly, solution)).toEqual(has('ends with status "dead" at tick 42'));
  });

  test("the solution must trigger at least one trap", () => {
    const noTrap = { ...valid, traps: [{ ...trap, trigger: { kind: "zone", rect: [0, 0, 1, 1] } }] };
    expect(validateLevel(noTrap, solution)).toEqual(has("no trap triggers"));
  });

  test("a missing solution file is an error", () => {
    expect(validateLevel(valid, undefined)).toEqual(has("solution: file not found"));
  });

  test("a level with enemies passes all checks", () => {
    expect(validateLevel({ ...valid, enemies: [e1] }, solution)).toEqual([]);
  });

  test("enemy ids must be unique", () => {
    const bad = { ...valid, enemies: [e1, { id: "e1", x: 2, y: 0, patrol: [1, 3], speed: 1 }] };
    expect(validateLevel(bad, solution)).toEqual(has("enemies: enemy ids must be unique"));
  });

  test("an enemy patrol must be inside the level", () => {
    const bad = { ...valid, enemies: [{ ...e1, x: 9, patrol: [9, 11] }] };
    expect(validateLevel(bad, solution)).toEqual(has("enemy e1: x must be inside patrol, and patrol must be inside the level"));
  });

  test("an enemy x must be inside its patrol", () => {
    const bad = { ...valid, enemies: [{ ...e1, x: 2 }] };
    expect(validateLevel(bad, solution)).toEqual(has("enemy e1: x must be inside patrol, and patrol must be inside the level"));
  });

  test("an enemyStomped trigger must name an existing enemy", () => {
    const bad = { ...valid, enemies: [e1], traps: [{ ...trap, trigger: { kind: "event", event: "enemyStomped", id: "e9" } }] };
    expect(validateLevel(bad, solution)).toEqual(has("trap t1: enemy e9 does not exist"));
  });

  test("an enemy y must be inside the level", () => {
    expect(validateLevel({ ...valid, enemies: [{ ...e1, y: 14 }] }, solution)).toEqual([]);
    expect(validateLevel({ ...valid, enemies: [{ ...e1, y: 15 }] }, solution)).toEqual(["schema: enemies.0.y: Too big: expected number to be <=14"]);
  });

  test("an enemy must not have other keys", () => {
    expect(validateLevel({ ...valid, enemies: [{ ...e1, foo: 1 }] }, solution)).toEqual(['schema: enemies.0: Unrecognized key: "foo"']);
  });
});
