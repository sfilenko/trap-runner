import type { InputFrame, LevelDef } from "../src/core/types";

export const IDLE: InputFrame = { left: false, right: false, jump: false };
export const RIGHT: InputFrame = { left: false, right: true, jump: false };
export const LEFT: InputFrame = { left: true, right: false, jump: false };
export const JUMP: InputFrame = { left: false, right: false, jump: true };

export function level(tiles: string[], traps: LevelDef["traps"] = []): LevelDef {
  return { id: "level-99", tiles, traps };
}

// Pads a level to 15 rows: empty rows on top.
export function rows15(bottom: string[]): string[] {
  const width = bottom[0].length;
  return [...Array.from({ length: 15 - bottom.length }, () => ".".repeat(width)), ...bottom];
}
