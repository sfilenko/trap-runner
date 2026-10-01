import { describe, expect, test } from "vitest";
import { createWorld } from "../../src/core/world";
import { step } from "../../src/core/step";
import type { TrapDef, TrapTrigger } from "../../src/core/types";
import { IDLE, RIGHT, level } from "../helpers";

const FLAT = ["..........", "..........", "S........G", "##########"];
const zoneAtStart: TrapTrigger = { kind: "zone", rect: [0, 0, 2, 4] };
const spikesAt8: TrapDef = { id: "t1", trigger: zoneAtStart, action: { kind: "addSpikes", rect: [8, 2, 1, 1] }, delayTicks: 0 };
const clearAt8: TrapDef = { id: "t2", trigger: zoneAtStart, action: { kind: "removeTiles", rect: [8, 2, 1, 1] }, delayTicks: 0 };

describe("traps", () => {
  test("two traps in one tick run in the order of traps[]", () => {
    const a = step(createWorld(level(FLAT, [spikesAt8, clearAt8])), IDLE);
    expect(a.grid[2][8]).toBe(".");
    const b = step(createWorld(level(FLAT, [clearAt8, spikesAt8])), IDLE);
    expect(b.grid[2][8]).toBe("^");
    expect(a.events.map((e) => e.type)).toEqual(["trapTriggered", "trapTriggered"]);
  });

  test("a delayed action runs delayTicks after the trigger", () => {
    let w = createWorld(level(FLAT, [{ ...spikesAt8, delayTicks: 3 }]));
    w = step(w, IDLE); // tick 0: trigger
    expect(w.grid[2][8]).toBe(".");
    expect(w.pending).toEqual([{ trapIndex: 0, dueTick: 3 }]);
    w = step(w, IDLE); // tick 1
    w = step(w, IDLE); // tick 2
    expect(w.grid[2][8]).toBe(".");
    w = step(w, IDLE); // tick 3: action
    expect(w.grid[2][8]).toBe("^");
    expect(w.pending).toEqual([]);
  });

  test("a trap fires once per attempt", () => {
    let w = createWorld(level(FLAT, [spikesAt8]));
    const fired: number[] = [];
    for (let i = 0; i < 10; i++) {
      w = step(w, IDLE);
      fired.push(w.events.filter((e) => e.type === "trapTriggered").length);
    }
    expect(fired.reduce((a, b) => a + b)).toBe(1);
  });

  test("a coin event triggers a trap in the same tick", () => {
    let w = createWorld(
      level(["..........", "..........", "S..o.....G", "##########"], [
        { id: "bait", trigger: { kind: "event", event: "coinCollected", id: "c3_2" }, action: { kind: "moveGoal", to: [0, 0] }, delayTicks: 0 },
      ]),
    );
    for (let i = 0; i < 18; i++) w = step(w, RIGHT);
    expect(w.events.map((e) => e.type)).toEqual(["coinCollected", "trapTriggered"]);
    expect(w.goal).toEqual({ x: 0, y: 0 });
  });

  test("a new attempt (createWorld) has no pending actions and the original tiles", () => {
    const lvl = level(FLAT, [{ ...spikesAt8, delayTicks: 50 }]);
    let w = createWorld(lvl);
    w = step(w, IDLE);
    expect(w.pending.length).toBe(1);
    const again = createWorld(lvl);
    expect(again.pending).toEqual([]);
    expect(again.triggered).toEqual([]);
    expect(again.grid[2][8]).toBe(".");
  });
});
