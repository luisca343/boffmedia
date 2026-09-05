#!/usr/bin/env node
/**
 * A CJS-only workspace package must be aliased to its source by every Vite host
 * that can reach it.
 *
 * THE FAILURE THIS PREVENTS, which has now happened twice. A workspace package
 * whose `exports["."]` has `require` and `default` but no `import` cannot be
 * consumed by a bundler: Rollup reads `dist/cjs/index.js`, finds no ES named
 * exports, and dies with `"toID" is not exported by …`. In a production build
 * that is a hard failure. In a dev server it is worse -- the page goes BLANK
 * with `does not provide an export named 'X'` and no React error, because it
 * happens at module evaluation before anything renders.
 *
 * AND THEY SURFACE ONE AT A TIME. Rollup stops at the first bad import, so
 * fixing `asset-paths` reveals `pokemon-identity`, which would in turn reveal
 * the next one. `apps/desktop/vite.config.ts` carried the asset-paths alias for
 * months and was missing pokemon-identity; nothing noticed until the damage
 * calculator imported `toID` and the desktop build stopped working. The
 * battlesim e2e host had already hit all three and written the warning down --
 * in a comment, in a different file, which is not a mechanism.
 *
 * WHY NOT JUST GIVE THEM ESM BUILDS. Some could, and `@boffmedia/battle-core`
 * and `@boffmedia/pack-schema` did exactly that -- they are dual-built and are
 * therefore NOT flagged here, which is the point: this gate does not care how a
 * package solves it, only that a host is not left reading a CJS bundle. Where a
 * dual build is not on the table, aliasing to source per host is the
 * established answer (CLAUDE.md, `asset-paths`).
 *
 * REACHABILITY, not "every package". A host is only required to alias what it
 * can actually import: its own workspace dependencies, plus theirs, walked
 * transitively. Demanding an alias for something a host never touches is the
 * kind of noise that gets a gate deleted.
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const rel = (p) => relative(ROOT, p).split(sep).join('/');

const SKIP = new Set(['node_modules', 'dist', '.next', 'coverage', '.vite', 'target', 'test-results']);

function walk(dir, match, out = []) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    if (SKIP.has(e.name)) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, match, out);
    else if (match(e.name)) out.push(p);
  }
  return out;
}

/* ── the workspace ──────────────────────────────────────────────────────── */

const pkgFiles = [
  ...walk(join(ROOT, 'apps'), (n) => n === 'package.json'),
  ...walk(join(ROOT, 'packages'), (n) => n === 'package.json'),
];

/** name -> { dir, json } for every workspace package. */
const byName = new Map();
for (const file of pkgFiles) {
  let json;
  try {
    json = JSON.parse(readFileSync(file, 'utf8'));
  } catch {
    continue;
  }
  if (!json.name) continue;
  if (byName.has(json.name)) continue; // first wins; nested copies are not workspace roots
  byName.set(json.name, { dir: dirname(file), json });
}

/**
 * CJS-only: the package publishes a build, and its `.` export offers no `import`
 * condition. A package with no `exports` map at all that points `main` at a
 * `dist/cjs` path counts too -- that is the same trap wearing older clothes.
 */
function isCjsOnly({ json }) {
  const dot = json.exports?.['.'];
  if (dot && typeof dot === 'object') {
    if (dot.import || dot.module) return false;
    return Boolean(dot.require || dot.default);
  }
  if (!dot && typeof json.main === 'string') {
    return /dist[\\/]cjs[\\/]/.test(json.main) && !json.module;
  }
  return false;
}

const cjsOnly = [...byName.entries()].filter(([, v]) => isCjsOnly(v)).map(([name]) => name);

// A scan that stops finding any CJS-only package is a scan that has stopped
// reading what it claims to read, and would then pass forever.
if (cjsOnly.length === 0) {
  console.error(
    `FAIL -- read ${byName.size} workspace packages and found ZERO that are CJS-only.\n` +
      `There have been at least two (@boffmedia/asset-paths, @boffmedia/pokemon-identity),\n` +
      `so either they all gained ESM builds -- in which case delete this gate and say so --\n` +
      `or the exports parsing here has stopped matching.\n`,
  );
  process.exit(1);
}

/** Workspace deps of a package, by name. */
const depsOf = (name) => {
  const hit = byName.get(name);
  if (!hit) return [];
  const all = { ...(hit.json.dependencies ?? {}), ...(hit.json.devDependencies ?? {}) };
  return Object.keys(all).filter((d) => byName.has(d));
};

/** Every workspace package reachable from `name`, transitively. */
function reachable(name) {
  const seen = new Set();
  const stack = depsOf(name);
  while (stack.length) {
    const cur = stack.pop();
    if (seen.has(cur)) continue;
    seen.add(cur);
    stack.push(...depsOf(cur));
  }
  return seen;
}

/* ── the vite hosts ─────────────────────────────────────────────────────── */

const viteConfigs = [
  ...walk(join(ROOT, 'apps'), (n) => /^vite\.config\.(m?[jt]s)$/.test(n)),
  ...walk(join(ROOT, 'packages'), (n) => /^vite\.config\.(m?[jt]s)$/.test(n)),
];

if (viteConfigs.length === 0) {
  console.error('FAIL -- no vite.config files found at all. This gate is inert.\n');
  process.exit(1);
}

/** The workspace package a config belongs to: nearest ancestor package.json. */
function ownerOf(configPath) {
  let dir = dirname(configPath);
  while (dir.startsWith(ROOT)) {
    const p = join(dir, 'package.json');
    if (existsSync(p)) {
      try {
        const name = JSON.parse(readFileSync(p, 'utf8')).name;
        if (name && byName.has(name)) return name;
      } catch {
        /* keep walking */
      }
    }
    const up = dirname(dir);
    if (up === dir) break;
    dir = up;
  }
  return null;
}

const failures = [];
let checked = 0;

for (const config of viteConfigs) {
  const owner = ownerOf(config);
  if (!owner) continue;
  const text = readFileSync(config, 'utf8');
  const canReach = reachable(owner);
  for (const pkg of cjsOnly) {
    if (!canReach.has(pkg)) continue;
    checked++;
    // The alias only has to be present as a key; where it points is the
    // author's business, and a substring check is what survives the three
    // different path-building styles these configs use.
    if (!text.includes(`"${pkg}"`) && !text.includes(`'${pkg}'`)) {
      failures.push({ config: rel(config), owner, pkg });
    }
  }
}

console.log(
  `check-cjs-only-aliases: ${viteConfigs.length} vite host(s), ${byName.size} workspace packages, ` +
    `${cjsOnly.length} CJS-only (${cjsOnly.join(', ')}), ${checked} host/package pair(s) checked.\n`,
);

if (failures.length) {
  console.error('FAIL -- a Vite host can reach a CJS-only package it does not alias:\n');
  for (const f of failures) {
    console.error(`  ${f.config}\n    (${f.owner}) can import ${f.pkg}, which ships no ESM build.\n`);
  }
  console.error(
    `Rollup will read its \`dist/cjs/index.js\` and fail with \`"X" is not exported\` -- and in a\n` +
      `dev server the page goes blank at module evaluation with no React error. Add an alias to\n` +
      `the package's \`src\`, the way apps/desktop/vite.config.ts does for @boffmedia/asset-paths.\n\n` +
      `Or give the package a dual build, like @boffmedia/battle-core and @boffmedia/pack-schema:\n` +
      `this gate stops flagging anything whose \`exports["."]\` gains an \`import\` condition, and\n` +
      `that fixes every host at once instead of one at a time.\n`,
  );
  process.exit(1);
}

console.log('OK -- every Vite host aliases the CJS-only packages it can reach.\n');
