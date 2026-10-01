import type { TrapAction, TrapTrigger, World } from "./types";
import { overlaps, rectBox } from "./geometry";

export function fireDueActions(w: World): void {
  const due = w.pending.filter((p) => p.dueTick <= w.tick).sort((a, b) => a.trapIndex - b.trapIndex);
  w.pending = w.pending.filter((p) => p.dueTick > w.tick);
  for (const d of due) applyAction(w, w.level.traps[d.trapIndex].action);
}

export function checkTriggers(w: World): void {
  w.level.traps.forEach((t, i) => {
    if (w.triggered.includes(t.id) || !isTriggered(w, t.trigger)) return;
    w.triggered.push(t.id);
    w.events.push({ tick: w.tick, type: "trapTriggered", id: t.id });
    if (t.delayTicks === 0) applyAction(w, t.action);
    else w.pending.push({ trapIndex: i, dueTick: w.tick + t.delayTicks });
  });
}

function isTriggered(w: World, tr: TrapTrigger): boolean {
  if (tr.kind === "zone") return overlaps(w.player, rectBox(tr.rect));
  return w.events.some((e) => e.type === tr.event && "id" in e && e.id === tr.id);
}

export function applyAction(w: World, a: TrapAction): void {
  if (a.kind === "moveGoal") {
    w.goal = { x: a.to[0], y: a.to[1] };
    return;
  }
  const ch = a.kind === "removeTiles" ? "." : "^";
  const [x, y, wd, h] = a.rect;
  for (let ty = y; ty < y + h; ty++)
    for (let tx = x; tx < x + wd; tx++)
      if (ty >= 0 && ty < w.grid.length && tx >= 0 && tx < w.grid[ty].length) w.grid[ty][tx] = ch;
}
