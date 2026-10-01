import { describe, expect, test } from "vitest";
import { createWorld } from "../../src/core/world";
import { step } from "../../src/core/step";
import { IDLE, RIGHT, level } from "../helpers";

describe("step", () => {
  const lvl = level(["..........", "..........", "S..o.....G", "##########"]);

  test("returns a new World and does not change the input World", () => {
    const w0 = createWorld(lvl);
    const snapshot = structuredClone(w0);
    const w1 = step(w0, RIGHT);
    expect(w1).not.toBe(w0);
    expect(w0).toEqual(snapshot);
    expect(w1.tick).toBe(1);
  });

  test("events hold only the events of this tick", () => {
    let w = createWorld(lvl);
    for (let i = 0; i < 18; i++) w = step(w, RIGHT);
    expect(w.events).toEqual([{ tick: 17, type: "coinCollected", id: "c3_2" }]);
    w = step(w, RIGHT);
    expect(w.events).toEqual([]);
    expect(w.collected).toEqual(["c3_2"]);
  });

  test("a finished World does not change", () => {
    const w = { ...createWorld(lvl), status: "dead" as const };
    expect(step(w, RIGHT)).toBe(w);
  });

  test("death beats the goal in the same tick", () => {
    const w0 = createWorld(level(["..........", "..........", "S.....G...", "##########"]));
    w0.grid[2][6] = "^";
    let w = w0;
    for (let i = 0; i < 60 && w.status === "playing"; i++) w = step(w, RIGHT);
    expect(w.status).toBe("dead");
    expect(w.events).toEqual([{ tick: 41, type: "died", cause: "spikes" }]);
  });

  test("falling below the level is a death by pit", () => {
    let w = createWorld(level(["..........", "..........", "S........G", "#####....#"]));
    for (let i = 0; i < 120 && w.status === "playing"; i++) w = step(w, RIGHT);
    expect(w.events).toEqual([{ tick: 71, type: "died", cause: "pit" }]);
  });

  test("standing still for 100 ticks changes nothing but the tick", () => {
    let w = createWorld(lvl);
    w = step(w, IDLE);
    const y = w.player.y;
    for (let i = 0; i < 100; i++) w = step(w, IDLE);
    expect(w.player.y).toBe(y);
    expect(w.status).toBe("playing");
  });
});
