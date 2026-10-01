import type { InputFrame, World } from "./types";
import { stepPlayer } from "./physics";
import { resolveInteractions } from "./interactions";
import { checkTriggers, fireDueActions } from "./traps";

// One tick = 1/60 s. Returns a new World. The input World stays unchanged.
export function step(prev: World, input: InputFrame): World {
  if (prev.status !== "playing") return prev;
  const w = structuredClone(prev);
  w.events = [];
  fireDueActions(w);
  stepPlayer(w, input);
  resolveInteractions(w);
  if (w.status !== "dead") checkTriggers(w);
  w.tick += 1;
  return w;
}
