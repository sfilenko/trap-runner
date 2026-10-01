import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import { runReplay } from "../../src/core/replay";
import type { GameEvent, LevelDef, RleInput } from "../../src/core/types";

// One file = one scenario from an OpenSpec spec. The scenario id is in the file name and in the test name.
interface ReplayCase {
  scenario: string;
  level: LevelDef;
  inputs: RleInput[];
  expect?: Record<string, unknown>[]; // these events must occur in this order (other events can occur between them)
  absent?: Record<string, unknown>[]; // these events must not occur
  final?: Record<string, unknown>; // partial match on the World after the run
}

const dir = fileURLToPath(new URL(".", import.meta.url));
const files = readdirSync(dir).filter((f) => f.endsWith(".replay.json")).sort();
const matches = (e: GameEvent, want: Record<string, unknown>) =>
  Object.entries(want).every(([k, v]) => (e as unknown as Record<string, unknown>)[k] === v);

describe("replay scenarios", () => {
  test("at least one replay file exists", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  for (const file of files) {
    const c = JSON.parse(readFileSync(join(dir, file), "utf8")) as ReplayCase;
    test(`${c.scenario} (${file})`, () => {
      const { world, events } = runReplay(c.level, c.inputs);
      let from = 0;
      for (const want of c.expect ?? []) {
        const i = events.findIndex((e, k) => k >= from && matches(e, want));
        expect(i, `missing ${JSON.stringify(want)} after event #${from}. Events: ${JSON.stringify(events)}`).toBeGreaterThanOrEqual(0);
        from = i + 1;
      }
      for (const not of c.absent ?? []) {
        expect(events.some((e) => matches(e, not)), `unexpected ${JSON.stringify(not)}`).toBe(false);
      }
      if (c.final) expect(world).toMatchObject(c.final);
    });
  }
});
