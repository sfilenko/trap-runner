import type { GameEvent, InputFrame, LevelDef, RleInput, World } from "./types";
import { createWorld } from "./world";
import { step } from "./step";

export function expandInputs(rle: RleInput[]): InputFrame[] {
  return rle.flatMap((r) =>
    Array.from({ length: r.ticks }, () => ({ left: !!r.left, right: !!r.right, jump: !!r.jump })),
  );
}

export function compressInputs(frames: InputFrame[]): RleInput[] {
  const out: RleInput[] = [];
  for (const f of frames) {
    const last = out[out.length - 1];
    if (last && !!last.left === f.left && !!last.right === f.right && !!last.jump === f.jump) {
      last.ticks++;
    } else {
      out.push({
        ticks: 1,
        ...(f.left ? { left: true } : {}),
        ...(f.right ? { right: true } : {}),
        ...(f.jump ? { jump: true } : {}),
      });
    }
  }
  return out;
}

export function runReplay(level: LevelDef, rle: RleInput[]): { world: World; events: GameEvent[] } {
  let world = createWorld(level);
  const events: GameEvent[] = [];
  for (const input of expandInputs(rle)) {
    if (world.status !== "playing") break;
    world = step(world, input);
    events.push(...world.events);
  }
  return { world, events };
}
