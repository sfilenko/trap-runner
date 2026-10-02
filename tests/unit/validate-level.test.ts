import { describe, expect, test } from "vitest";
import { validateLevel } from "../../tools/validate-level";
import { rows15 } from "../helpers";

const trap = { id: "t1", trigger: { kind: "zone", rect: [5, 0, 1, 15] }, action: { kind: "addSpikes", rect: [0, 0, 1, 1] }, delayTicks: 0 };
const valid = { id: "level-90", tiles: rows15(["S..o......G", "###########"]), traps: [trap] };
const solution = { inputs: [{ ticks: 120, right: true }] };
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
});
