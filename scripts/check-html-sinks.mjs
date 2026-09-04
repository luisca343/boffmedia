#!/usr/bin/env node
// Every `dangerouslySetInnerHTML` is an XSS unless something made it safe.
//
// The render side of the rich-text gate was audited and is clean, but "clean
// right now" is not a property a codebase keeps on its own: the eighth sink
// gets written by someone who never read the seven. So each one must either
//
//   (a) pass its value through a sanitizer in the SAME expression, or
//   (b) carry an `xss-ok:` comment within the few lines above it saying why
//       the HTML cannot be attacker-controlled.
//
// (b) is not a rubber stamp — it is a written claim, reviewable in a diff, that
// the source is a literal, an i18n value or server-generated markup. A sink
// with neither is a hard failure.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ROOTS = ['apps/web/src', 'apps/desktop/src', 'packages'];
const SKIP = new Set(['node_modules', '.next', 'dist', 'build', '.turbo', 'coverage']);

// Function names that count as sanitizing. Both are allowlist-based sanitizers
// reviewed as part of the rich-text gate; see the header of each.
//   apps/web/src/lib/sanitizeHtml.ts               → sanitizeRichText
//   packages/tools/battlesim/src/engine/sanitizeHtml.ts → sanitizeHtml
const SANITIZERS = ['sanitizeRichText', 'sanitizeHtml', 'articleHtml'];
const OPT_OUT = /xss-ok:/i;
const SINK = 'dangerouslySetInnerHTML';

function walk(dir, out = []) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    if (SKIP.has(e.name)) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(tsx|ts|jsx|js)$/.test(e.name)) out.push(p);
  }
  return out;
}

const offenders = [];
let sinks = 0;

for (const root of ROOTS) {
  for (const file of walk(join(ROOT, root))) {
    const text = readFileSync(file, 'utf8');
    if (!text.includes(SINK)) continue;
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (!lines[i].includes(SINK)) continue;
      // The sink's own file defines the sanitizers; skip the definition site.
      const posix = file.split(String.fromCharCode(92)).join('/');
      if (posix.includes('lib/sanitizeHtml') || posix.includes('engine/sanitizeHtml')) continue;
      sinks++;
      // The value can sit on the same line or the next few (prettier wraps the
      // `{{ __html: ... }}` object), so look at a small window either side.
      const expr = lines.slice(i, i + 4).join(' ');
      const preamble = lines.slice(Math.max(0, i - 8), i + 1).join('\n');
      const sanitized = SANITIZERS.some((fn) => expr.includes(`${fn}(`));
      if (sanitized || OPT_OUT.test(preamble)) continue;
      const rel = relative(ROOT, file).split(String.fromCharCode(92)).join('/');
      offenders.push(`${rel}:${i + 1}`);
    }
  }
}

if (offenders.length > 0) {
  console.error('dangerouslySetInnerHTML with no sanitizer and no `xss-ok:` justification:\n');
  for (const o of offenders) console.error(`  ${o}`);
  console.error(
    '\nEither wrap the value in sanitizeRichText() (CKEditor documents) or the\n' +
      'battlesim sanitizeHtml() (log/chat markup), or add a comment above the\n' +
      'sink starting with `xss-ok:` explaining why the HTML cannot come from a\n' +
      'user. A literal, an i18n value or server-generated SVG all qualify.\n',
  );
  process.exit(1);
}

console.log(`check-html-sinks: ${sinks} dangerouslySetInnerHTML site(s), all sanitized or justified.`);
