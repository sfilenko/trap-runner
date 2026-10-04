#!/usr/bin/env node
// Loop engineering: Claude Code (headless) makes one level, the validator checks it, the errors go back to
// the next iteration. Stops on the first PASS or at --max-iter. One JSON line per iteration goes to
// .agent-log/loops/<time>-level-NN.jsonl.
// Guard: the agent may change only the level and its solution. A change to another file stops the loop
// (exit 3), so a PASS cannot come from a changed validator, schema or test.
// Usage: pnpm level:loop --level 04 [--max-iter 5] [--budget-usd 1]
import { spawnSync } from "node:child_process";
import { appendFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";

const { values } = parseArgs({
  options: {
    level: { type: "string" },
    "max-iter": { type: "string", default: "5" },
    "budget-usd": { type: "string", default: "1" },
  },
});
if (!/^\d\d$/.test(values.level ?? "")) {
  console.error("level-loop: Give the level number as two digits, for example: --level 04");
  process.exit(2);
}
const nn = values.level;
const maxIter = Number(values["max-iter"]);
const budget = values["budget-usd"];
const file = `levels/level-${nn}.json`;

const logDir = join(".agent-log", "loops");
mkdirSync(logDir, { recursive: true });
const logFile = join(logDir, `${new Date().toISOString().replace(/[:.]/g, "-")}-level-${nn}.jsonl`);

// On Windows, `claude` and `pnpm` are .cmd shims, so they need a shell, and arguments need quotes.
const isWin = process.platform === "win32";
const quote = (a) => (isWin && /[\s()*,]/.test(a) ? `"${a}"` : a);
const exec = (cmd, args, input) =>
  spawnSync(cmd, isWin ? args.map(quote) : args, { input, encoding: "utf8", shell: isWin, maxBuffer: 1 << 26 });

// Changed and new files outside .agent-log/ and outside the level and its solution.
const allowed = new Set([file, `levels/level-${nn}.solution.json`]);
const changedOutside = () => {
  const g = exec("git", ["status", "--porcelain", "--untracked-files=all"]);
  if (g.status !== 0) {
    console.error(`level-loop: STOP. git status failed, so the guard cannot check the files: ${g.stderr.trim()}`);
    process.exit(3);
  }
  return g.stdout
    .split("\n")
    .map((l) => l.trimEnd())
    .filter(Boolean)
    .map((l) => l.slice(3).split(" -> ").pop())
    .filter((p) => !p.startsWith(".agent-log/") && !allowed.has(p));
};

const dirty = changedOutside();
if (dirty.length > 0) {
  console.error(`level-loop: Commit these changes before the loop starts: ${dirty.join(", ")}`);
  process.exit(2);
}

let feedback = "";
for (let iter = 1; iter <= maxIter; iter++) {
  const prompt = [
    `Use the make-level skill. Create ${file} and levels/level-${nn}.solution.json.`,
    "The level must be different from the other levels in levels/.",
    feedback && `The last validation failed. Output:\n${feedback}\nChange the level or the solution so that the validation passes.`,
  ]
    .filter(Boolean)
    .join("\n");

  const started = Date.now();
  const r = exec(
    "claude",
    ["-p", "--output-format", "json", "--max-budget-usd", budget, "--permission-mode", "acceptEdits",
     "--allowedTools", "Read,Edit,Write,Glob,Grep,Skill,Bash(pnpm validate:levels *)"],
    prompt,
  );
  let result = {};
  try {
    result = JSON.parse(r.stdout);
  } catch {
    /* no JSON: the log keeps claude_exit */
  }

  const outside = changedOutside();
  if (outside.length > 0) {
    const entry = {
      iter,
      ok: false,
      ms: Date.now() - started,
      cost_usd: result.total_cost_usd ?? null,
      turns: result.num_turns ?? null,
      claude_exit: r.status,
      outside,
    };
    appendFileSync(logFile, JSON.stringify(entry) + "\n");
    console.error(`level-loop: STOP. The agent changed files outside the level: ${outside.join(", ")}. Examine and revert these changes. Log: ${logFile}`);
    process.exit(3);
  }

  const v = exec("pnpm", ["validate:levels", file]);
  const ok = v.status === 0;
  feedback = `${v.stdout}${v.stderr}`.trim();

  const entry = {
    iter,
    ok,
    ms: Date.now() - started,
    cost_usd: result.total_cost_usd ?? null,
    turns: result.num_turns ?? null,
    claude_exit: r.status,
    validation: feedback.split("\n").slice(0, 20),
  };
  appendFileSync(logFile, JSON.stringify(entry) + "\n");
  console.log(`iter ${iter}: ${ok ? "PASS" : "FAIL"}  turns=${entry.turns ?? "?"}  cost_usd=${entry.cost_usd ?? "?"}`);
  if (ok) {
    console.log(`level-loop: PASS after ${iter} iteration(s). Log: ${logFile}`);
    process.exit(0);
  }
}
console.log(`level-loop: no PASS after ${maxIter} iterations. Log: ${logFile}`);
process.exit(1);
