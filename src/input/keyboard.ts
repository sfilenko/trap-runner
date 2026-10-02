import type { InputFrame } from "../core/types";

const KEYMAP: Record<string, keyof InputFrame> = {
  ArrowLeft: "left",
  KeyA: "left",
  ArrowRight: "right",
  KeyD: "right",
  ArrowUp: "jump",
  KeyW: "jump",
  Space: "jump",
};

export function toInput(held: ReadonlySet<string>): InputFrame {
  const f: InputFrame = { left: false, right: false, jump: false };
  for (const code of held) {
    const k = KEYMAP[code];
    if (k) f[k] = true;
  }
  return f;
}

// When the window loses focus, all keys count as released. Without this, a key stays "held" forever.
export function attachKeyboard(target: EventTarget): { read(): InputFrame; dispose(): void } {
  const held = new Set<string>();
  const onDown = (e: Event) => {
    const code = (e as KeyboardEvent).code;
    if (KEYMAP[code]) e.preventDefault();
    held.add(code);
  };
  const onUp = (e: Event) => held.delete((e as KeyboardEvent).code);
  const onBlur = () => held.clear();
  target.addEventListener("keydown", onDown);
  target.addEventListener("keyup", onUp);
  target.addEventListener("blur", onBlur);
  return {
    read: () => toInput(held),
    dispose: () => {
      target.removeEventListener("keydown", onDown);
      target.removeEventListener("keyup", onUp);
      target.removeEventListener("blur", onBlur);
    },
  };
}
