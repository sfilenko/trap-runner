import type { InputFrame, World } from "./types";

// Start values. The human approves them (design §6).
// A change here breaks recorded replays and level solutions.
export const PHYS = {
  gravity: 0.5,
  maxFall: 8,
  runSpeed: 2,
  jumpVelocity: -8,
  stompBounce: -5,
} as const;

export const PLAYER_W = 12;
export const PLAYER_H = 14;

export function stepPlayer(w: World, input: InputFrame): void {}
