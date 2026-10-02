import type { World } from "./types";

export interface Session {
  levelIndex: number;
  deaths: number;
  score: number;
  finished: boolean;
}

export function newSession(): Session {
  return { levelIndex: 0, deaths: 0, score: 0, finished: false };
}

// Death: +1 death, same level. Complete: add the level's coins to the score, go to the next level.
export function applyOutcome(s: Session, w: World, levelCount: number): Session {
  if (w.status === "dead") return { ...s, deaths: s.deaths + 1 };
  if (w.status !== "complete") return s;
  const next = s.levelIndex + 1;
  return {
    levelIndex: Math.min(next, levelCount - 1),
    deaths: s.deaths,
    score: s.score + w.collected.length,
    finished: next >= levelCount,
  };
}
