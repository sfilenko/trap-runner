import type { LevelDef, World } from "./types";

export function createWorld(level: LevelDef): World {
  throw new Error(`createWorld(${level.id}): not implemented`);
}
