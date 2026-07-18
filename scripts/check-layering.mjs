#!/usr/bin/env node
// API layering guard — see .claude/context/api-standards.md §Layering for the rule and marker.
// Fails on: an unmarked service injecting DRIZZLE, marker count above baseline, or a stale
// marker (present but DRIZZLE gone — otherwise the count would never ratchet down).
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = "apps/api/src";
const MARKER = "LEGACY_DIRECT_DB";
const INJECT_DRIZZLE = "@Inject(DRIZZLE)";

// Lower this — never raise it — as services are migrated to repositories.
const LEGACY_BASELINE = 14;

const SKIP_DIRS = new Set(["node_modules", "dist", ".next", "generated"]);

// A filesystem walk rather than `git ls-files`: a brand-new service that hasn't been
// staged yet is exactly the case this guard exists to catch.
function serviceFiles(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      if (!SKIP_DIRS.has(entry)) serviceFiles(path, out);
    } else if (entry.endsWith(".service.ts") && !entry.endsWith(".spec.ts")) {
      out.push(path);
    }
  }
  return out;
}

function controllerFiles(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      if (!SKIP_DIRS.has(entry)) controllerFiles(path, out);
    } else if (entry.endsWith(".controller.ts")) {
      out.push(path);
    }
  }
  return out;
}

const violations = [];
const unannotated = [];
const marked = [];

for (const file of serviceFiles(ROOT)) {
  const src = readFileSync(file, "utf8");
  const injects = src.includes(INJECT_DRIZZLE);
  const hasMarker = src.includes(MARKER);

  if (injects && !hasMarker) unannotated.push(file);
  if (hasMarker) marked.push(file);
  if (hasMarker && !injects) {
    violations.push(
      `${file}  stale ${MARKER} marker — the service no longer injects DRIZZLE; delete the marker and lower LEGACY_BASELINE`,
    );
  }
}

for (const file of unannotated) {
  violations.push(
    `${file}  service injects DRIZZLE directly — extract a colocated repositories/*.repository.ts (api-standards.md §Layering)`,
  );
}

if (marked.length > LEGACY_BASELINE) {
  violations.push(
    `${MARKER} markers grew ${LEGACY_BASELINE} → ${marked.length} — the baseline is a ratchet; new services get a repository, not a marker`,
  );
} else if (marked.length < LEGACY_BASELINE) {
  violations.push(
    `${MARKER} markers are down to ${marked.length} (baseline says ${LEGACY_BASELINE}) — lower LEGACY_BASELINE to ${marked.length} in scripts/check-layering.mjs so the guard ratchets forward`,
  );
}

// app.module.ts excludes these prefixes from MinecraftMiddleware wholesale, so a write
// route added here without a guard would have no auth at all — not even the tripwire.
const GUARD_REQUIRED_PREFIXES = [
  "apps/api/src/api/smartrotom/gobierno",
  "apps/api/src/api/smartrotom/wigglypop",
];
const IS_METHOD = /^\s*(?:public\s+|private\s+|protected\s+)?(?:async\s+)?[\w$]+\s*\(/;

let writeRoutes = 0;
for (const prefix of GUARD_REQUIRED_PREFIXES) {
  for (const file of controllerFiles(prefix)) {
    const lines = readFileSync(file, "utf8").split("\n");
    lines.forEach((line, i) => {
      if (!/^\s*@(Post|Put|Patch|Delete)\(/.test(line)) return;
      writeRoutes++;

      // The decorator block only: back to the blank line above, forward to the handler
      // signature. A fixed look-ahead window would see the NEXT route's @UseGuards.
      let start = i;
      while (start > 0 && lines[start - 1].trim() !== "") start--;
      let end = i;
      while (end < lines.length && !IS_METHOD.test(lines[end])) end++;

      if (!lines.slice(start, end).some((l) => l.includes("UseGuards"))) {
        violations.push(
          `${file}:${i + 1}  write route has no @UseGuards — this prefix is excluded from MinecraftMiddleware, so it would ship with no auth at all`,
        );
      }
    });
  }
}

console.log(
  `layering: ${unannotated.length} unannotated direct-DB service(s), ${marked.length} ${MARKER} marker(s) (baseline ${LEGACY_BASELINE}); ${writeRoutes} guarded write route(s) under middleware-excluded prefixes`,
);

if (violations.length) {
  console.error(`\n✗ API layering check failed (${violations.length}):\n`);
  for (const v of violations) console.error("  " + v);
  console.error("");
  process.exit(1);
}
console.log("✓ API layering: no unmarked direct-DB services; legacy markers within baseline");
