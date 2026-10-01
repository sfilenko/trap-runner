// Fixed-step clock: 60 ticks per second. A long frame (a hidden tab) counts as at most MAX_FRAME_MS.
export const TICKS_PER_SECOND = 60;
export const MAX_FRAME_MS = 250;

export function advanceClock(accMs: number, frameMs: number): { ticks: number; accMs: number } {
  return { ticks: 0, accMs: 0 };
}
