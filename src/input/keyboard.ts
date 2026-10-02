import type { InputFrame } from "../core/types";
export function toInput(held: ReadonlySet<string>): InputFrame {
  return { left: false, right: false, jump: false };
}
export function attachKeyboard(target: EventTarget): { read(): InputFrame; dispose(): void } {
  return { read: () => ({ left: false, right: false, jump: false }), dispose: () => {} };
}
