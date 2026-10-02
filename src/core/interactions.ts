import { LEVEL_HEIGHT, TILE, type World } from "./types";
import { overlaps, tileAt, tileBox, tileSpan } from "./geometry";
import { die } from "./events";
import { resolveEnemyContacts } from "./enemies";

// Order: coins, enemies, spikes, pit, goal. A death stops the checks, so a death beats the goal.
export function resolveInteractions(w: World, prevBottom: number): void {
  const p = w.player;
  w.coins = w.coins.filter((c) => {
    if (!overlaps(p, tileBox(c.x, c.y))) return true;
    w.collected.push(c.id);
    w.events.push({ tick: w.tick, type: "coinCollected", id: c.id });
    return false;
  });

  resolveEnemyContacts(w, prevBottom);
  if (w.status === "dead") return;

  const s = tileSpan(p);
  for (let ty = s.y0; ty <= s.y1; ty++)
    for (let tx = s.x0; tx <= s.x1; tx++)
      if (tileAt(w.grid, tx, ty) === "^") {
        die(w, "spikes");
        return;
      }

  if (p.y > LEVEL_HEIGHT * TILE) {
    die(w, "pit");
    return;
  }

  if (overlaps(p, tileBox(w.goal.x, w.goal.y))) {
    w.status = "complete";
    w.events.push({ tick: w.tick, type: "levelComplete" });
  }
}
