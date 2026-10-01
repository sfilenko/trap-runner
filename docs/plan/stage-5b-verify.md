# Етап 5b · E2E, CI, перевірка перевіряючого

**Рівень довіри:** 2. **Бюджет:** ≈1.5 год.
**Результат етапу:** `pnpm e2e` зелений локально і в CI; записаний експеримент «зламали ядро → тести почервоніли → відновили».

---

### Task 5b.1: Playwright smoke + CI

**Files:** Create: `playwright.config.ts`, `e2e/smoke.spec.ts`. Modify: `package.json`, `tsconfig.json`, `.github/workflows/check.yml`.

- [ ] **Step 1 [ЛЮДИНА]: залежність і браузер** (рівень 1)
```bash
pnpm add -D @playwright/test
pnpm exec playwright install chromium
pnpm pkg set "scripts.e2e=playwright test"
```
  У `tsconfig.json` допиши в `include`: `"e2e"`, `"playwright.config.ts"`. У `allow`: `"Bash(pnpm e2e)"`.

- [ ] **Step 2: конфіг**

`playwright.config.ts`:
```ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  use: { baseURL: "http://localhost:5173" },
  webServer: {
    command: "pnpm dev --port 5173 --strictPort",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
  },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
});
```

- [ ] **Step 3: тест** — `e2e/smoke.spec.ts`
```ts
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
```
  **Цей файл у плані не запускався** (лише перевірено, що функції в `evaluate` не залежать від змінних файлу).

- [ ] **Step 4: червоний спершу.** Тимчасово заміни в `src/main.ts` рядок `const input = keyboard.read();` на `const input = { left: false, right: false, jump: false };` (гра йде, але клавіатура ігнорується).

  Run: `pnpm e2e`. Expected: FAIL на `expect(x1).toBeGreaterThan(x0)`. Поверни рядок.

  Run: `pnpm e2e`. Expected: `1 passed`.

- [ ] **Step 5: CI** — допиши в `.github/workflows/check.yml` після `pnpm check`:
```yaml
      - run: pnpm exec playwright install --with-deps chromium
      - run: pnpm e2e
```

- [ ] **Step 6 [ЛЮДИНА]: коміт, push, посилання на зелений прогін CI → autonomy-log**
```bash
git add -A
git commit -m "test(e2e): Playwright smoke - start, move, clean console; CI runs it"
```

---

### Task 5b.2: Перевірка перевіряючого (мутації)

**Рівень:** 1 (людина робить і відкочує). Курс: гейт, якого ніхто не бачив червоним, не рахується; мутація показує чутливість тесту (день 04 §9, день 06 §12). **Files:** Create: `docs/mutation-log.md`.

- [ ] **Step 1: три мутації, по одній за раз.** Після кожної: `pnpm test`, записати, **які** тести впали і **чому** (поведінка, а не import), потім `git checkout -- <file>`.

| # | Файл | Мутація | Очікувано червоні |
|---|---|---|---|
| M1 | `src/core/physics.ts` | у `moveY` гілка `dy < 0`: заміни тіло `if (isSolid(...)) {...}` на `if (false) {...}` (стеля не зупиняє) | `physics.test.ts` «a jump hits the ceiling…» |
| M2 | `src/core/physics.ts` | у `stepPlayer` прибери `&& !p.jumpHeld` | «jump only on press…», `MOVE-no-autojump-01` |
| M3 | `src/core/interactions.ts` | перенеси перевірку фінішу **перед** перевіркою шипів | «death beats the goal…», `TRAP-goal-death-01` |

  Мутація в `src/core` не порушує заборон, тож `guard-core` її пропустить. Якщо мутацію вносить агент, `log-action` її запише.

- [ ] **Step 2: `docs/mutation-log.md`**
```markdown
| # | Мутація | Команда | Червоні тести (дослівно) | Причина падіння — поведінка? | Відкат |
|---|---|---|---|---|---|
```
  Якщо якась мутація **не** дала червоного — це знахідка: тест слабкий. Додай тест (червоний → зелений) і запиши.

- [ ] **Step 3: фінальний гейт, тег**

  Run: `pnpm hooks:selftest && pnpm check && pnpm e2e`
  Expected: усі три зелені. Збережи підсумкові рядки для PR (поле «Перевірка»).
```bash
git add docs/mutation-log.md
git commit -m "docs: mutation check of the test suite"
git tag stage-5b
```
