#!/usr/bin/env node
/**
 * Locale JSON guard. Three checks, all hard failures:
 *   1. every locale file parses as JSON
 *   2. every locale file is a JSON OBJECT at the top level
 *   3. no duplicate keys within one object
 *
 * Why this exists as its own gate, ahead of check-i18n.mjs:
 *
 * A committed `en/admin.json` had typographic quotes as its JSON DELIMITERS
 * (`“versionName”: …`). The file could not parse, it is reached from
 * layout.tsx through i18n/request.ts, and so every route returned 500. The
 * first thing to report it was the dev server refusing to compile a page.
 *
 * check-i18n.mjs did read the file — and mislabelled the failure. Its parity
 * loop wraps the non-base locale in `try { JSON.parse(…) } catch { "missing
 * entirely" }`, so a SYNTAX ERROR in a file that exists is reported as an
 * ABSENT FILE, and the base locale is parsed with no guard at all and dies
 * with a raw stack trace. Neither message names the real problem, and a check
 * that fails for the wrong reason is the thing that gets rationalised away.
 * So parsing is asserted first, on its own, with the line and column.
 *
 * Duplicate keys are here rather than in check-i18n because JSON.parse cannot
 * see them: it keeps the LAST occurrence and reports success. Two keys of the
 * same name are always a merge accident, and the surviving one is whichever
 * came second — silently, in a file nobody reads top to bottom. Detecting it
 * needs a scanner over the raw text, which is what `duplicateKeys` below is.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const ROOT = "apps/web/locales";

const violations = [];

/** Every *.json under dir, recursively, repo-relative and slash-separated. */
const walk = (dir, out = []) => {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (entry.endsWith(".json")) out.push(full.split(sep).join("/"));
  }
  return out;
};

/**
 * Line/column for a character offset, plus the source line and a caret.
 * Node's own SyntaxError text varies by version and sometimes gives only a
 * byte position, which tells you nothing about a 2000-line catalog.
 */
const locate = (src, pos) => {
  const upto = src.slice(0, pos);
  const line = upto.split("\n").length;
  const col = pos - (upto.lastIndexOf("\n") + 1) + 1;
  const text = src.split("\n")[line - 1] ?? "";
  return { line, col, text, caret: " ".repeat(Math.max(0, col - 1)) + "^" };
};

const posOf = (err) => {
  const m = /position\s+(\d+)/i.exec(err.message);
  return m ? Number(m[1]) : null;
};

/**
 * Duplicate keys per object, as `path.to.key`. A hand-rolled scanner because
 * no parser in the standard library will report this — string-aware (so a
 * brace or quote INSIDE a value is not structure) and escape-aware.
 */
const duplicateKeys = (src) => {
  const dups = [];
  const stack = []; // { keys:Set, path:string } for objects, null for arrays
  let i = 0;
  let pendingKey = null; // last string token read while directly inside an object

  const path = () =>
    stack
      .map((f) => f?.label)
      .filter(Boolean)
      .join(".");

  while (i < src.length) {
    const ch = src[i];

    if (ch === '"') {
      const start = i;
      i++;
      let value = "";
      while (i < src.length) {
        if (src[i] === "\\") {
          value += src[i + 1];
          i += 2;
          continue;
        }
        if (src[i] === '"') break;
        value += src[i];
        i++;
      }
      i++; // closing quote
      // A string is a KEY only if the next non-space character is a colon and
      // we are directly inside an object.
      let j = i;
      while (j < src.length && /\s/.test(src[j])) j++;
      const top = stack[stack.length - 1];
      if (src[j] === ":" && top && top.keys) {
        if (top.keys.has(value)) {
          const { line, col } = locate(src, start);
          const p = path();
          dups.push(`${p ? `${p}.` : ""}${value}  (line ${line}, column ${col})`);
        } else top.keys.add(value);
        pendingKey = value;
      }
      continue;
    }

    if (ch === "{") {
      stack.push({ keys: new Set(), label: pendingKey });
      pendingKey = null;
    } else if (ch === "[") {
      stack.push({ keys: null, label: pendingKey });
      pendingKey = null;
    } else if (ch === "}" || ch === "]") {
      stack.pop();
      pendingKey = null;
    }
    i++;
  }
  return dups;
};

let files;
try {
  files = walk(ROOT);
} catch (err) {
  console.error(`❌ cannot read ${ROOT}: ${err.message}`);
  process.exit(1);
}

if (files.length === 0) {
  console.error(`❌ no locale files found under ${ROOT} — the walk is wrong, not the repo`);
  process.exit(1);
}

for (const file of files) {
  const src = readFileSync(file, "utf8");

  let parsed;
  try {
    parsed = JSON.parse(src);
  } catch (err) {
    const pos = posOf(err);
    if (pos === null) {
      violations.push(`${file}\n    ${err.message}`);
    } else {
      const { line, col, text, caret } = locate(src, pos);
      violations.push(
        `${file}:${line}:${col}\n    ${err.message}\n    ${text.trim()}\n    ${caret.slice(Math.max(0, text.length - text.trimStart().length))}`,
      );
    }
    continue;
  }

  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    violations.push(
      `${file}\n    top level is ${Array.isArray(parsed) ? "an array" : typeof parsed}; a locale namespace must be an object`,
    );
    continue;
  }

  for (const dup of duplicateKeys(src)) {
    violations.push(
      `${file}\n    duplicate key ${dup}\n    JSON.parse keeps the LAST one silently, so the first translation is dead`,
    );
  }
}

if (violations.length) {
  console.error(`\n❌ locale JSON: ${violations.length} violation(s)\n`);
  for (const v of violations) console.error(`  ${v}\n`);
  console.error(
    `These files are loaded by apps/web/src/i18n/request.ts from layout.tsx.\n` +
      `An unparseable one takes every route down with a 500.\n`,
  );
  process.exit(1);
}

console.log(`✅ locale JSON: ${files.length} files parse, are objects, and have no duplicate keys`);
