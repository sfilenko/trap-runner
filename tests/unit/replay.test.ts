import { describe, expect, test } from "vitest";
import { compressInputs, expandInputs, runReplay } from "../../src/core/replay";
import { level } from "../helpers";

describe("replay helpers", () => {
  const rle = [{ ticks: 3, right: true }, { ticks: 1, right: true, jump: true }, { ticks: 2 }];

  test("expandInputs gives one frame per tick", () => {
    const frames = expandInputs(rle);
    expect(frames).toHaveLength(6);
    expect(frames[3]).toEqual({ left: false, right: true, jump: true });
    expect(frames[5]).toEqual({ left: false, right: false, jump: false });
  });

  test("compressInputs is the inverse of expandInputs", () => {
    expect(compressInputs(expandInputs(rle))).toEqual(rle);
  });

  test("runReplay stops at the first end of the attempt", () => {
    const { world, events } = runReplay(level(["..........", "..........", "S.....^..G", "##########"]), [{ ticks: 500, right: true }]);
    expect(world.tick).toBe(42);
    expect(events).toEqual([{ tick: 41, type: "died", cause: "spikes" }]);
  });
});
