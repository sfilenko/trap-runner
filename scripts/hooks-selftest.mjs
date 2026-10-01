#!/usr/bin/env node
// Self-test for the Claude Code hooks in .claude/hooks/ and for the boundary gate. No agent needed.
// Based on scripts/hooks-selftest.mjs from the course demo (day01). Changes: protect-env checks are replaced
// by guard-core and check-boundaries checks.
//   1. guard-core.mjs blocks banned tokens in src/core (exit 2), allows clean core edits and non-core edits (exit 0)
//   2. guard-core.mjs writes one line per block to .agent-log/blocked.jsonl
//   3. check-boundaries.mjs exits 0 on clean src/core and 1 on a banned token; the import ban covers
//      folder-index, side-effect and dynamic imports, and does not flag a name that only starts with "render"
//   4. log-action.mjs appends one JSON line per event (PreToolUse = proposed, Post* = executed)
//   5. a PreToolUse line without a Post line for the same id is reported as "proposed but not executed"
// Usage: pnpm hooks:selftest
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const here = process.cwd();
const tmp = mkdtempSync(join(tmpdir(), "hooks-selftest-"));
const env = { ...process.env, CLAUDE_PROJECT_DIR: tmp };
const run = (script, payload) =>
  spawnSync(process.execPath, [join(here, ".claude", "hooks", script)], { input: JSON.stringify(payload), env, encoding: "utf8" });

let failed = 0;
const check = (name, ok, extra = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? "  " + extra : ""}`);
  if (!ok) failed++;
};

const base = { session_id: "selftest-0001", cwd: tmp, permission_mode: "default" };

// 1. guard-core
for (const [name, tool, input, expect] of [
  ["Write core with Math.random", "Write", { file_path: join(tmp, "src", "core", "world.ts"), content: "export const r = Math.random();" }, 2],
  ["Edit core with Date", "Edit", { file_path: join(tmp, "src", "core", "step.ts"), old_string: "a", new_string: "const t = Date.now();" }, 2],
  ["Edit core importing render", "Edit", { file_path: join(tmp, "src", "core", "step.ts"), old_string: "a", new_string: 'import { draw } from "../render/draw";' }, 2],
  ["MultiEdit core with document", "MultiEdit", { file_path: join(tmp, "src", "core", "a.ts"), edits: [{ old_string: "a", new_string: "document.body" }] }, 2],
  ["Write clean core", "Write", { file_path: join(tmp, "src", "core", "geometry.ts"), content: "export const TILE = 16;" }, 0],
  ["Write render with window", "Write", { file_path: join(tmp, "src", "render", "draw.ts"), content: "window.x = 1;" }, 0],
]) {
  const r = run("guard-core.mjs", { ...base, hook_event_name: "PreToolUse", tool_use_id: `g-${name}`, tool_name: tool, tool_input: input });
  check(`guard-core ${name} -> exit ${expect}`, r.status === expect, r.status === 2 ? r.stderr.trim().slice(0, 60) : "");
}

// 2. blocked log
const blocked = readFileSync(join(tmp, ".agent-log", "blocked.jsonl"), "utf8").trim().split("\n").map((l) => JSON.parse(l));
check("guard-core wrote 4 blocked lines", blocked.length === 4, String(blocked.length));
check("blocked line names the rule and the repo-relative path", blocked[0].rules.includes("no-math-random") && blocked[0].path === "src/core/world.ts");

// 3. boundary gate
const gate = () => spawnSync(process.execPath, [join(here, "scripts", "check-boundaries.mjs")], { cwd: tmp, encoding: "utf8" });
mkdirSync(join(tmp, "src", "core"), { recursive: true });
writeFileSync(join(tmp, "src", "core", "ok.ts"), "export const a = 1;\n");
check("check-boundaries clean src/core -> exit 0", gate().status === 0);
writeFileSync(join(tmp, "src", "core", "bad.ts"), "export const r = Math.random();\n");
const red = gate();
check("check-boundaries Math.random -> exit 1", red.status === 1, red.stderr.trim());
const { findViolations } = await import(pathToFileURL(join(here, "scripts", "check-boundaries.mjs")).href);
for (const [name, code, banned] of [
  ["import from a folder index", 'import { draw } from "../render";', true],
  ["side-effect import", 'import "../render/draw";', true],
  ["dynamic import", 'const k = await import("../input/keyboard");', true],
  ["a name that only starts with render", 'import { r } from "./rendering";', false],
]) {
  const hit = findViolations(code).some((v) => v.rule === "no-render-or-input-import");
  check(`check-boundaries ${name} -> ${banned ? "banned" : "allowed"}`, hit === banned);
}

// 4. logger: a proposed+executed Bash, a proposed+executed Edit, a proposed+failed Bash, a proposed-only Edit (blocked)
const events = [
  { ...base, hook_event_name: "PreToolUse", tool_use_id: "t1", tool_name: "Bash", tool_input: { command: "pnpm check" } },
  { ...base, hook_event_name: "PostToolUse", tool_use_id: "t1", tool_name: "Bash", tool_input: { command: "pnpm check" }, tool_response: { stdout: "ok" }, duration_ms: 4200 },
  { ...base, hook_event_name: "PreToolUse", tool_use_id: "t2", tool_name: "Edit", tool_input: { file_path: join(tmp, "src", "render", "draw.ts") } },
  { ...base, hook_event_name: "PostToolUse", tool_use_id: "t2", tool_name: "Edit", tool_input: { file_path: join(tmp, "src", "render", "draw.ts") }, duration_ms: 15 },
  { ...base, hook_event_name: "PreToolUse", tool_use_id: "t3", tool_name: "Bash", tool_input: { command: "pnpm typecheck" } },
  { ...base, hook_event_name: "PostToolUseFailure", tool_use_id: "t3", tool_name: "Bash", tool_input: { command: "pnpm typecheck" }, error: "Exit code 2\nerror TS2339", duration_ms: 900 },
  { ...base, hook_event_name: "PreToolUse", tool_use_id: "t4", tool_name: "Edit", tool_input: { file_path: join(tmp, "src", "core", "world.ts") } },
];
for (const e of events) {
  const r = run("log-action.mjs", e);
  check(`log-action ${e.hook_event_name} ${e.tool_name} exits 0 silently`, r.status === 0 && r.stdout === "");
}
const lines = readFileSync(join(tmp, ".agent-log", "actions.jsonl"), "utf8").trim().split("\n").map((l) => JSON.parse(l));
check("log has 7 lines", lines.length === 7);
check("PreToolUse line has no exit field", lines[0].event === "PreToolUse" && !("exit" in lines[0]) && lines[0].id === "t1");
check("PostToolUse Bash keeps cmd and exit 0", lines[1].cmd === "pnpm check" && lines[1].exit === 0 && lines[1].ms === 4200);
check("Edit line stores repo-relative path", lines[3].path === "src/render/draw.ts", lines[3].path);
check("failure line carries exit code 2", lines[5].exit === 2);

// 5. summary pairs Pre/Post by id
const summary = spawnSync(process.execPath, [join(here, "scripts", "agent-log-summary.mjs"), join(tmp, ".agent-log", "actions.jsonl")], { encoding: "utf8" });
check("agent-log-summary reports 1 proposed but not executed", summary.status === 0 && /1 proposed but not executed/.test(summary.stdout));

rmSync(tmp, { recursive: true, force: true });
console.log(failed ? `\n${failed} check(s) failed` : "\nall hook checks passed");
process.exit(failed ? 1 : 0);
