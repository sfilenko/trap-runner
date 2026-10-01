#!/usr/bin/env node
// Bans for src/core (pure, deterministic game logic). This is the ONLY copy of the list.
// Used by `pnpm check` (scans src/core) and by the guard-core hook (checks one agent edit).
// Usage: node scripts/check-boundaries.mjs
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { pathToFileURL } from "node:url";

export const BANS = [
  { rule: "no-window", re: /\bwindow\b/ },
  { rule: "no-document", re: /\bdocument\b/ },
  { rule: "no-math-random", re: /\bMath\.random\b/ },
  { rule: "no-date", re: /\bDate\b/ },
  // Static (`from "../render"`, `from "../render/x"`), side-effect (`import "../input/x"`) and dynamic (`import("...")`) imports.
  { rule: "no-render-or-input-import", re: /(?:\bfrom|\bimport|\brequire)\s*\(?\s*["'](?:[^"']*\/)?(?:render|input)(?:\/|["'])/ },
];

export function findViolations(text) {
  const out = [];
  String(text)
    .split(/\r?\n/)
    .forEach((line, i) => {
      for (const b of BANS) if (b.re.test(line)) out.push({ rule: b.rule, line: i + 1, text: line.trim() });
    });
  return out;
}

export const isCorePath = (p) => /(^|\/)src\/core\//.test(String(p).replace(/\\/g, "/"));

function walk(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const files = walk(join("src", "core")).filter((f) => f.endsWith(".ts"));
  let count = 0;
  for (const f of files) {
    for (const v of findViolations(readFileSync(f, "utf8"))) {
      console.error(`${relative(".", f).replace(/\\/g, "/")}:${v.line} ${v.rule}: ${v.text}`);
      count++;
    }
  }
  console.log(`check-boundaries: ${files.length} files in src/core, ${count} violations`);
  process.exit(count ? 1 : 0);
}
