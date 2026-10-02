import { createWorld } from "./core/world";
import { step } from "./core/step";
import { applyOutcome, newSession, type Session } from "./core/session";
import { compressInputs } from "./core/replay";
import type { InputFrame, LevelDef, World } from "./core/types";
import { advanceClock } from "./clock";
import { attachKeyboard } from "./input/keyboard";
import { draw } from "./render/draw";

const modules = import.meta.glob<LevelDef>("../levels/level-*.json", { eager: true, import: "default" });
const levels = Object.entries(modules)
  .filter(([path]) => /level-\d\d\.json$/.test(path))
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([, level]) => level);
if (levels.length === 0) throw new Error("No levels found. Add levels/level-01.json.");

const canvas = document.querySelector<HTMLCanvasElement>("#game");
const ctx = canvas?.getContext("2d");
if (!canvas || !ctx) throw new Error("Canvas #game not found.");

const keyboard = attachKeyboard(window);
let session: Session = newSession();
let world: World = createWorld(levels[0]);
let recording: InputFrame[] | null = null;
let acc = 0;
let last = performance.now();

function download(name: string, data: unknown): void {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2) + "\n"], { type: "application/json" }));
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

const solutionName = (index: number) => `level-${String(index + 1).padStart(2, "0")}.solution.json`;

// Dev only: R starts a recording from a fresh attempt. The level end saves the solution file.
if (import.meta.env.DEV) {
  window.addEventListener("keydown", (e) => {
    if (e.code !== "KeyR" || session.finished) return;
    recording = [];
    world = createWorld(levels[session.levelIndex]);
    console.info(`[rec] recording ${solutionName(session.levelIndex)}`);
  });
  Object.defineProperty(window, "__game", {
    value: {
      get world() {
        return world;
      },
      get session() {
        return session;
      },
      get recording() {
        return recording !== null;
      },
    },
  });
}

function frame(now: number): void {
  const clock = advanceClock(acc, now - last);
  acc = clock.accMs;
  last = now;
  for (let i = 0; i < clock.ticks && !session.finished; i++) {
    const input = keyboard.read();
    recording?.push(input);
    world = step(world, input);
    if (world.status === "playing") continue;
    const finishedIndex = session.levelIndex;
    const outcome = world.status;
    session = applyOutcome(session, world, levels.length);
    if (recording) {
      if (outcome === "complete") {
        download(solutionName(finishedIndex), { inputs: compressInputs(recording) });
        recording = null;
      } else {
        recording = [];
      }
    }
    if (!session.finished) world = createWorld(levels[session.levelIndex]);
  }
  draw(ctx!, world, session);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
