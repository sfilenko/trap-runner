import { describe, expect, test } from "vitest";
import { createWorld } from "../../src/core/world";
import { step } from "../../src/core/step";
import type { InputFrame, World } from "../../src/core/types";
import { IDLE, JUMP, LEFT, RIGHT, level } from "../helpers";

function run(w: World, input: InputFrame, ticks: number): World {
  for (let i = 0; i < ticks; i++) w = step(w, input);
  return w;
}

const FLAT = level(["..........", "..........", "S........G", "##########"]);

describe("physics", () => {
  test("the player stands on the floor: y stays 34, onGround is true", () => {
    const w = run(createWorld(FLAT), IDLE, 10);
    expect(w.player).toMatchObject({ y: 34, vy: 0, onGround: true });
  });

  test("run speed is 2 px per tick", () => {
    const w = run(createWorld(FLAT), RIGHT, 30);
    expect(w.player.x).toBe(62);
  });

  test("the left edge of the level stops the player at x = 0", () => {
    const w = run(createWorld(FLAT), LEFT, 10);
    expect(w.player.x).toBe(0);
  });

  test("a wall stops the player: x = wall left edge - player width", () => {
    const w = run(createWorld(level(["..........", "......#...", "S.....#..G", "##########"])), RIGHT, 60);
    expect(w.player.x).toBe(6 * 16 - 12);
  });

  test("a jump rises 60 px and lands again", () => {
    let w = run(createWorld(FLAT), IDLE, 1);
    let minY = w.player.y;
    w = step(w, JUMP);
    for (let i = 0; i < 40; i++) {
      w = step(w, IDLE);
      minY = Math.min(minY, w.player.y);
    }
    expect(minY).toBe(34 - 60);
    expect(w.player).toMatchObject({ y: 34, onGround: true });
  });

  test("a jump hits the ceiling and does not pass through it", () => {
    let w = run(createWorld(level(["..........", "##########", "..........", "S........G", "##########"])), IDLE, 1);
    let minY = w.player.y;
    w = step(w, JUMP);
    for (let i = 0; i < 20; i++) {
      w = step(w, IDLE);
      minY = Math.min(minY, w.player.y);
    }
    expect(minY).toBe(32);
  });

  test("a fall at max speed lands on a one-tile platform (no tunneling)", () => {
    const tall = level(["S........G", ...Array.from({ length: 9 }, () => ".........."), "#........."]);
    const w = run(createWorld(tall), IDLE, 80);
    expect(w.player).toMatchObject({ y: 10 * 16 - 14, onGround: true });
  });

  test("jump only on press: holding the key does not jump again after landing", () => {
    let w = run(createWorld(FLAT), IDLE, 5);
    w = run(w, JUMP, 60);
    expect(w.player).toMatchObject({ y: 34, onGround: true });
  });

  test("a new press after landing jumps again (control for the test above)", () => {
    let w = run(createWorld(FLAT), IDLE, 5);
    w = run(w, JUMP, 1);
    w = run(w, IDLE, 40);
    w = run(w, JUMP, 1);
    w = run(w, IDLE, 5);
    expect(w.player.onGround).toBe(false);
  });
});
