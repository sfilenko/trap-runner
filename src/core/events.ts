import type { DeathCause, World } from "./types";

export function die(w: World, cause: DeathCause): void {
  w.status = "dead";
  w.events.push({ tick: w.tick, type: "died", cause });
}
