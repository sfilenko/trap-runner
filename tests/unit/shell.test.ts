import { describe, expect, test } from "vitest";
import { attachKeyboard, toInput } from "../../src/input/keyboard";
import { cameraX } from "../../src/render/camera";
import { applyOutcome, newSession } from "../../src/core/session";
import { createWorld } from "../../src/core/world";
import { level } from "../helpers";

const key = (type: string, code: string) => Object.assign(new Event(type, { cancelable: true }), { code });

describe("keyboard", () => {
  test("maps arrows, WASD and Space to the input frame", () => {
    expect(toInput(new Set(["KeyA", "Space"]))).toEqual({ left: true, right: false, jump: true });
    expect(toInput(new Set(["ArrowRight", "KeyX"]))).toEqual({ left: false, right: true, jump: false });
  });

  test("a key stays held until keyup", () => {
    const t = new EventTarget();
    const kb = attachKeyboard(t);
    t.dispatchEvent(key("keydown", "ArrowRight"));
    expect(kb.read().right).toBe(true);
    t.dispatchEvent(key("keyup", "ArrowRight"));
    expect(kb.read().right).toBe(false);
  });

  test("losing focus (blur) releases all keys", () => {
    const t = new EventTarget();
    const kb = attachKeyboard(t);
    t.dispatchEvent(key("keydown", "ArrowRight"));
    t.dispatchEvent(new Event("blur"));
    expect(kb.read()).toEqual({ left: false, right: false, jump: false });
  });
});

describe("cameraX", () => {
  test("stays at 0 near the start", () => expect(cameraX(8, 320, 1600)).toBe(0));
  test("centers the player in the middle of the level", () => expect(cameraX(800, 320, 1600)).toBe(640));
  test("stops at the right edge of the level", () => expect(cameraX(1590, 320, 1600)).toBe(1280));
  test("a level narrower than the view stays at 0", () => expect(cameraX(100, 320, 200)).toBe(0));
});

describe("session", () => {
  const lvl = level(["..........", "..o.......", "S........G", "##########"]);

  test("a death adds 1 death and keeps the level", () => {
    const s = applyOutcome(newSession(), { ...createWorld(lvl), status: "dead" }, 3);
    expect(s).toEqual({ levelIndex: 0, deaths: 1, score: 0, finished: false });
  });

  test("a completed level adds its coins and goes to the next level", () => {
    const w = { ...createWorld(lvl), status: "complete" as const, collected: ["c2_1"] };
    expect(applyOutcome(newSession(), w, 3)).toEqual({ levelIndex: 1, deaths: 0, score: 1, finished: false });
  });

  test("completing the last level finishes the session", () => {
    const w = { ...createWorld(lvl), status: "complete" as const };
    const s = applyOutcome({ levelIndex: 2, deaths: 4, score: 5, finished: false }, w, 3);
    expect(s).toEqual({ levelIndex: 2, deaths: 4, score: 5, finished: true });
  });

  test("a World that still plays changes nothing", () => {
    const s = newSession();
    expect(applyOutcome(s, createWorld(lvl), 3)).toBe(s);
  });
});
