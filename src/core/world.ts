import { TILE, type Coin, type LevelDef, type World } from "./types";
import { PLAYER_H, PLAYER_W } from "./physics";
import { createEnemies } from "./enemies";

export function createWorld(level: LevelDef): World {
  const grid = level.tiles.map((row) => row.split(""));
  let start: { x: number; y: number } | undefined;
  let goal: { x: number; y: number } | undefined;
  const coins: Coin[] = [];
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      const c = grid[y][x];
      if (c === "S") {
        start = { x, y };
        grid[y][x] = ".";
      } else if (c === "G") {
        goal = { x, y };
        grid[y][x] = ".";
      } else if (c === "o") {
        coins.push({ id: `c${x}_${y}`, x, y });
        grid[y][x] = ".";
      }
    }
  }
  if (!start || !goal) throw new Error(`Level ${level.id}: the level must have one S tile and one G tile.`);
  return {
    level,
    tick: 0,
    grid,
    player: {
      x: start.x * TILE + (TILE - PLAYER_W) / 2,
      y: start.y * TILE + TILE - PLAYER_H,
      w: PLAYER_W,
      h: PLAYER_H,
      vx: 0,
      vy: 0,
      onGround: false,
      jumpHeld: false,
    },
    enemies: createEnemies(level.enemies ?? []),
    coins,
    collected: [],
    goal,
    triggered: [],
    pending: [],
    events: [],
    status: "playing",
  };
}
