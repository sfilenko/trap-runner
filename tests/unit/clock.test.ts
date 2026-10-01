import { describe, expect, test } from "vitest";
import { advanceClock } from "../../src/clock";

describe("advanceClock", () => {
  test("one 60 Hz frame gives one tick", () => {
    const r = advanceClock(0, 1000 / 60);
    expect(r.ticks).toBe(1);
    expect(r.accMs).toBeCloseTo(0, 6);
  });

  test("a short frame accumulates until it reaches a tick", () => {
    const a = advanceClock(0, 10);
    expect(a.ticks).toBe(0);
    const b = advanceClock(a.accMs, 10);
    expect(b.ticks).toBe(1);
    expect(b.accMs).toBeCloseTo(20 - 1000 / 60, 6);
  });

  test("a long frame (hidden tab) counts as 250 ms = 15 ticks, not 300 ticks", () => {
    expect(advanceClock(0, 5000)).toEqual({ ticks: 15, accMs: 0 });
  });

  test("a negative frame time gives zero ticks", () => {
    expect(advanceClock(0, -5)).toEqual({ ticks: 0, accMs: 0 });
  });
});
