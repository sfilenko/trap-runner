import { expect, test } from "@playwright/test";

// The functions inside page.evaluate run in the browser. Only their source goes there,
// so they must not use variables from this file. Type casts are removed at compile time.
interface GameProbe {
  world: { tick: number; player: { x: number } };
}
type ProbeWindow = Window & { __game?: GameProbe };

test("the game starts, the player moves right, the console stays clean", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  page.on("pageerror", (e) => errors.push(e.message));

  await page.goto("/");
  await page.waitForFunction(() => ((window as ProbeWindow).__game?.world.tick ?? 0) > 5);
  const readX = () => page.evaluate(() => (window as ProbeWindow).__game?.world.player.x ?? -1);

  const x0 = await readX();
  await page.keyboard.down("ArrowRight");
  await page.waitForTimeout(500);
  await page.keyboard.up("ArrowRight");
  const x1 = await readX();

  expect(x1).toBeGreaterThan(x0);
  expect(errors).toEqual([]);
});
