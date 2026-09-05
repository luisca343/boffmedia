#!/usr/bin/env node
/**
 * N19. A Nest module that PROVIDES a class injecting `DRIZZLE`, but does not
 * IMPORT `DrizzleModule`, compiles, type-checks, passes its specs, and then
 * fails at application startup.
 *
 * It has happened twice, three days apart, in unrelated work (A6's
 * desktop-telemetry.service, then A14's mail.service). Nothing could see it:
 *
 *   - `tsc` type-checks the class in isolation and never asks who provides it;
 *   - `check-layering` greps for the `@Inject(DRIZZLE)` string and is satisfied
 *     that the marker is present;
 *   - every spec builds the provider through a hand-mocked token, so the real
 *     resolution never runs.
 *
 * All three go green on an application that cannot start. Only booting it, or
 * reading the module by eye, finds it -- and booting the real module graph
 * exhausts a 4 GB heap here (N13 records that a gate which dies ambiguously is
 * worse than no gate), so this reads the wiring statically instead.
 *
 * THE RULE. `DrizzleModule` is NOT `@Global()`, and no module re-exports it --
 * both verified, and the second is what keeps this rule sound: there is no
 * transitive path by which a module could legitimately acquire the DRIZZLE
 * token without importing DrizzleModule itself. So:
 *
 *   for every *.module.ts:
 *     for every class in its `providers` (including `useClass`):
 *       if that class's source file injects DRIZZLE:
 *         the module must list DrizzleModule in `imports`
 *
 * If a module ever DOES re-export DrizzleModule, this script will report a false
 * positive on its children -- fix it here rather than working around it there,
 * because "who can see the token" is exactly what this is checking.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const API_SRC = join(ROOT, 'apps/api/src');
const rel = (p) => relative(ROOT, p).split('\\').join('/');

const failures = [];

function walk(dir, out = []) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    if (['node_modules', 'dist', 'coverage'].includes(e.name)) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.module.ts')) out.push(p);
  }
  return out;
}

/** The `providers: [...]` block's class identifiers, `useClass` included. */
function providerNames(text) {
  const block = sliceArray(text, 'providers');
  if (!block) return [];
  const names = new Set();
  // `{ provide: X, useClass: Y }` -- Y is the class that gets constructed.
  for (const m of block.matchAll(/useClass\s*:\s*([A-Za-z_$][\w$]*)/g)) {
    names.add(m[1]);
  }
  // Bare identifiers, minus anything that is part of an object literal key.
  const bare = block.replace(/\{[^}]*\}/g, ' ');
  for (const m of bare.matchAll(/\b([A-Z][\w$]*)\b/g)) names.add(m[1]);
  return [...names];
}

/** Balanced-bracket slice of `key: [ ... ]`, so nested arrays do not truncate it. */
function sliceArray(text, key) {
  const at = text.search(new RegExp(`\\b${key}\\s*:\\s*\\[`));
  if (at === -1) return null;
  const start = text.indexOf('[', at);
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    if (text[i] === '[') depth++;
    else if (text[i] === ']') {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return text.slice(start);
}

/** Where a module file imports a given identifier from, resolved to a real path. */
function sourceOf(moduleFile, name) {
  const text = readFileSync(moduleFile, 'utf8');
  const re = new RegExp(
    `import\\s*\\{([^}]*)\\}\\s*from\\s*['"]([^'"]+)['"]`,
    'g',
  );
  for (const m of text.matchAll(re)) {
    const named = m[1].split(',').map((x) => x.trim().split(/\s+as\s+/)[0].trim());
    if (!named.includes(name)) continue;
    let spec = m[2];
    let base;
    if (spec.startsWith('.')) base = resolve(dirname(moduleFile), spec);
    else if (spec.startsWith('@api/')) base = join(API_SRC, 'api', spec.slice(5));
    else if (spec.startsWith('@/')) base = join(API_SRC, spec.slice(2));
    else return null; // a package, never ours
    for (const cand of [`${base}.ts`, join(base, 'index.ts')]) {
      if (existsSync(cand) && statSync(cand).isFile()) return cand;
    }
    return null;
  }
  return null;
}

const INJECTS_DRIZZLE = /@Inject\(\s*DRIZZLE\s*\)/;

const modules = walk(join(API_SRC, 'api')).concat(walk(join(API_SRC, 'discord')));
if (modules.length === 0) {
  failures.push('No *.module.ts files found at all -- this gate is inert.');
}

let checkedProviders = 0;
let drizzleProviders = 0;

for (const file of modules) {
  const text = readFileSync(file, 'utf8');
  const importsDrizzle = /\bDrizzleModule\b/.test(sliceArray(text, 'imports') ?? '');

  for (const name of providerNames(text)) {
    const src = sourceOf(file, name);
    if (!src) continue;
    checkedProviders++;
    let body;
    try {
      body = readFileSync(src, 'utf8');
    } catch {
      continue;
    }
    if (!INJECTS_DRIZZLE.test(body)) continue;
    drizzleProviders++;
    if (!importsDrizzle) {
      failures.push(
        `${rel(file)}\n    provides ${name} (${rel(src)}), which injects DRIZZLE,\n` +
          `    but does not import DrizzleModule. Nest cannot resolve the token:\n` +
          `    the API compiles, the specs pass, and it fails at startup.`,
      );
    }
  }
}

// A walk that finds nothing makes every assertion above vacuously true.
if (drizzleProviders === 0) {
  failures.push(
    `Checked ${modules.length} modules and ${checkedProviders} resolvable providers, and found ZERO ` +
      `that inject DRIZZLE. The repository has ~98 such files, so this gate has stopped ` +
      `reading what it claims to read.`,
  );
}

console.log(
  `Checked ${modules.length} modules, ${checkedProviders} resolvable providers, ` +
    `${drizzleProviders} of them DRIZZLE-injecting.\n`,
);

if (failures.length) {
  console.error('FAIL -- module(s) providing a DRIZZLE-injecting class without importing DrizzleModule:\n');
  for (const f of failures) console.error(`  ${f}\n`);
  console.error(
    "Add `DrizzleModule` to the module's `imports`. It is not @Global(), so every\n" +
      'module that provides such a class needs it, and nothing else in the build will\n' +
      'tell you before the container starts.\n',
  );
  process.exit(1);
}

console.log('OK -- every DRIZZLE-injecting provider is in a module that imports DrizzleModule.\n');
