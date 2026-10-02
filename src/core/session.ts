import type { World } from "./types";
export interface Session { levelIndex: number; deaths: number; score: number; finished: boolean }
export function newSession(): Session {
  return { levelIndex: 0, deaths: 0, score: 0, finished: false };
}
export function applyOutcome(s: Session, w: World, levelCount: number): Session {
  return s;
}
