// Fixed-step clock: 60 ticks per second. A long frame (a hidden tab) counts as at most MAX_FRAME_MS.
export const TICKS_PER_SECOND = 60;
export const MAX_FRAME_MS = 250;

export function advanceClock(accMs: number, frameMs: number): { ticks: number; accMs: number } {
  const total = accMs + Math.min(Math.max(frameMs, 0), MAX_FRAME_MS);
  const ticks = Math.floor((total * TICKS_PER_SECOND) / 1000 + 1e-9);
  return { ticks, accMs: Math.max(0, total - (ticks * 1000) / TICKS_PER_SECOND) };
}
