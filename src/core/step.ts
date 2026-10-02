import type { InputFrame, World } from "./types";
import { stepPlayer } from "./physics";
import { moveEnemies } from "./enemies";
import { resolveInteractions } from "./interactions";
import { checkTriggers, fireDueActions } from "./traps";

// One tick = 1/60 s. Returns a new World. The input World stays unchanged.
export function step(prev: World, input: InputFrame): World {
  if (prev.status !== "playing") return prev;
  const w = structuredClone(prev);
  w.events = [];
  fireDueActions(w);
  const prevBottom = w.player.y + w.player.h;
  stepPlayer(w, input);
  moveEnemies(w);
  resolveInteractions(w, prevBottom);
  if (w.status !== "dead") checkTriggers(w);
  w.tick += 1;
  return w;
}
