import { existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, join } from "node:path";
import { pathToFileURL } from "node:url";
import { LevelSchema, SolutionSchema, asLevelDef } from "../levels/level.schema";
import { runReplay } from "../src/core/replay";
import { LEVEL_HEIGHT, type Rect } from "../src/core/types";

export function validateLevel(levelJson: unknown, solutionJson: unknown): string[] {
  const parsed = LevelSchema.safeParse(levelJson);
  if (!parsed.success) return parsed.error.issues.map((i) => `schema: ${i.path.join(".")}: ${i.message}`);
  const level = asLevelDef(parsed.data);
  const errors: string[] = [];

  const width = level.tiles[0].length;
  level.tiles.forEach((row, y) => {
    if (row.length !== width) errors.push(`tiles: row ${y} has length ${row.length}, expected ${width}`);
  });
  const count = (ch: string) => level.tiles.join("").split(ch).length - 1;
  if (count("S") !== 1) errors.push(`tiles: expected exactly 1 S, found ${count("S")}`);
  if (count("G") !== 1) errors.push(`tiles: expected exactly 1 G, found ${count("G")}`);

  const coinIds = new Set<string>();
  level.tiles.forEach((row, y) => [...row].forEach((c, x) => c === "o" && coinIds.add(`c${x}_${y}`)));
  const inside = ([x, y, w, h]: Rect) => x + w <= width && y + h <= LEVEL_HEIGHT;

  const trapIds = level.traps.map((t) => t.id);
  if (new Set(trapIds).size !== trapIds.length) errors.push("traps: trap ids must be unique");
  for (const t of level.traps) {
    const tr = t.trigger;
    if (tr.kind === "zone" && !inside(tr.rect)) errors.push(`trap ${t.id}: trigger rect is outside the level`);
    if (tr.kind === "event" && !coinIds.has(tr.id)) errors.push(`trap ${t.id}: coin ${tr.id} does not exist`);
    const a = t.action;
    if (a.kind === "moveGoal" ? !inside([a.to[0], a.to[1], 1, 1]) : !inside(a.rect)) errors.push(`trap ${t.id}: action target is outside the level`);
  }
  if (errors.length) return errors;

  if (solutionJson === undefined) return ["solution: file not found (expected levels/<id>.solution.json)"];
  const sol = SolutionSchema.safeParse(solutionJson);
  if (!sol.success) return sol.error.issues.map((i) => `solution: ${i.path.join(".")}: ${i.message}`);
  const { world, events } = runReplay(level, sol.data.inputs);
  const at = `tick ${world.tick}, player x=${world.player.x}, y=${world.player.y}`;
  if (world.status !== "complete") errors.push(`solution: the run ends with status "${world.status}" at ${at}; expected "complete"`);
  if (!events.some((e) => e.type === "trapTriggered")) errors.push("solution: no trap triggers during the run");
  if (!events.some((e) => e.type === "coinCollected")) errors.push("solution: the run collects no coin");
  return errors;
}

function main(args: string[]): number {
  const files = args.length
    ? args
    : readdirSync("levels")
        .filter((f) => /^level-\d\d\.json$/.test(f))
        .sort()
        .map((f) => join("levels", f));
  let failed = 0;
  for (const file of files) {
    const solFile = file.replace(/\.json$/, ".solution.json");
    const level: unknown = JSON.parse(readFileSync(file, "utf8"));
    const solution: unknown = existsSync(solFile) ? JSON.parse(readFileSync(solFile, "utf8")) : undefined;
    const errors = validateLevel(level, solution);
    if (errors.length) {
      failed++;
      console.error(`FAIL ${basename(file)}`);
      for (const e of errors) console.error(`  - ${e}`);
    } else {
      console.log(`PASS ${basename(file)}`);
    }
  }
  console.log(`validate-level: ${files.length} levels, ${failed} failed`);
  return failed ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) process.exit(main(process.argv.slice(2)));
