import { describe, expect, test } from "vitest";
import { createWorld } from "../../src/core/world";
import { level } from "../helpers";

describe("createWorld", () => {
  const lvl = level(["..........", "..o.......", "S........G", "##########"]);

  test("puts the player on the S tile, bottom-aligned and centered", () => {
    const w = createWorld(lvl);
    expect(w.player).toMatchObject({ x: 2, y: 34, w: 12, h: 14, vx: 0, vy: 0 });
  });

  test("reads the goal and the coins, and clears their tiles", () => {
    const w = createWorld(lvl);
    expect(w.goal).toEqual({ x: 9, y: 2 });
    expect(w.coins).toEqual([{ id: "c2_1", x: 2, y: 1 }]);
    expect(w.grid[2].join("")).toBe("..........");
    expect(w.grid[1].join("")).toBe("..........");
  });

  test("starts at tick 0, playing, with no events", () => {
    const w = createWorld(lvl);
    expect(w).toMatchObject({ tick: 0, status: "playing", events: [], collected: [], triggered: [], pending: [] });
  });

  test("does not change the level", () => {
    createWorld(lvl);
    expect(lvl.tiles[2]).toBe("S........G");
  });

  test("throws when S or G is missing", () => {
    expect(() => createWorld(level(["S.........", "##########"]))).toThrow(/one S tile and one G tile/);
  });
});
