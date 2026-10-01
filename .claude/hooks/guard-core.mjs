#!/usr/bin/env node
// Claude Code PreToolUse hook (matcher: Edit|Write|MultiEdit).
// Blocks an agent edit that puts a banned token into src/core. The list of bans: scripts/check-boundaries.mjs.
// On a block: appends one line to .agent-log/blocked.jsonl, writes the reason to stderr, exits 2.
// Exit 2 blocks the tool call, and Claude receives stderr as the reason.
// In all other cases, and on any error in this hook: exit 0.
import { appendFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

let raw = "";
process.stdin.setEncoding("utf8");
for await (const chunk of process.stdin) raw += chunk;

let ev = {};
try {
  ev = JSON.parse(raw || "{}");
} catch {
  process.exit(0);
}

let lib;
try {
  lib = await import(new URL("../../scripts/check-boundaries.mjs", import.meta.url).href);
} catch {
  process.exit(0);
}

const ti = ev.tool_input ?? {};
const path = String(ti.file_path ?? "").replace(/\\/g, "/");
if (!lib.isCorePath(path)) process.exit(0);

const texts = [ti.content, ti.new_string, ...(Array.isArray(ti.edits) ? ti.edits.map((e) => e.new_string) : [])];
const violations = texts.filter((t) => typeof t === "string").flatMap((t) => lib.findViolations(t));
if (violations.length === 0) process.exit(0);

const rules = [...new Set(violations.map((v) => v.rule))];
const rel = path.replace(/^.*?(src\/core\/)/, "$1");
const root = process.env.CLAUDE_PROJECT_DIR || ev.cwd || process.cwd();
const entry = {
  ts: new Date().toISOString(),
  id: ev.tool_use_id,
  session: String(ev.session_id ?? "").slice(0, 8),
  tool: ev.tool_name,
  path: rel,
  blocked: true,
  by: "guard-core",
  rules,
};
try {
  mkdirSync(join(root, ".agent-log"), { recursive: true });
  appendFileSync(join(root, ".agent-log", "blocked.jsonl"), JSON.stringify(entry) + "\n");
} catch {
  /* the block must work even if the log fails */
}
process.stderr.write(
  `guard-core: Blocked the edit of ${rel}. Code in src/core must not use window, document, Math.random or Date, and must not import from render/ or input/. Broken rules: ${rules.join(", ")}. Read AGENTS.md.\n`,
);
process.exit(2);
