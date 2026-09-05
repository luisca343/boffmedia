#!/usr/bin/env node
// A test suite that CI does not run is a suite that only ever runs on the
// machine that wrote it. The tool-coverage pass added 183 tests across four
// packages and none of them were in tests.yml — this exists so that cannot
// happen quietly a second time.
//
// The rule: every workspace package with a `test` (or `test:unit`) script must
// appear behind a `pnpm --filter <name>` in .github/workflows/tests.yml. The
// API is the documented exception — it is gated by validate.yml instead, and
// tests.yml says why.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// Gated by validate.yml, on purpose. Duplicating it in tests.yml would put a
// 2900-test jest run in front of every PR twice.
const GATED_ELSEWHERE = new Set(['api']);

const WORKFLOWS = ['.github/workflows/tests.yml', '.github/workflows/validate.yml'];

function packageDirs() {
  const out = [];
  for (const root of ['packages', 'apps']) {
    const base = join(ROOT, root);
    if (!existsSync(base)) continue;
    for (const entry of readdirSync(base, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const dir = join(base, entry.name);
      if (existsSync(join(dir, 'package.json'))) out.push(dir);
      // packages/tools/* is a second level, and it is where most of the
      // untested-then-tested packages live.
      for (const nested of readdirSync(dir, { withFileTypes: true })) {
        if (!nested.isDirectory()) continue;
        const nestedDir = join(dir, nested.name);
        if (existsSync(join(nestedDir, 'package.json'))) out.push(nestedDir);
      }
    }
  }
  return out;
}

const ci = WORKFLOWS.filter((f) => existsSync(join(ROOT, f)))
  .map((f) => readFileSync(join(ROOT, f), 'utf8'))
  .join('\n');

const missing = [];
for (const dir of packageDirs()) {
  let pkg;
  try {
    pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));
  } catch {
    continue;
  }
  const scripts = pkg.scripts ?? {};
  // Two INDEPENDENT requirements, not one list.
  //
  //  - the unit suite: `test` OR `test:unit`, whichever the package defines.
  //    Either satisfies it. apps/web has both, and that is not an oversight —
  //    its `test` script is Playwright and its `test:unit` is vitest, which is
  //    why tests.yml runs the latter by name.
  //  - the `e2e` suite, checked SEPARATELY. The battlesim harness drives a real
  //    browser against a real bundle, and under the old rule — which looked
  //    only at `test`/`test:unit` — it could have been written, forgotten, and
  //    never run once by CI. That is exactly the hole this file exists to close
  //    for `test`; leaving a second door open would have been the joke telling
  //    itself.
  const unitScripts = ['test', 'test:unit'].filter((name) => scripts[name]);
  const requirements = [];
  if (unitScripts.length > 0) requirements.push(unitScripts);
  if (scripts.e2e) requirements.push(['e2e']);
  if (requirements.length === 0) continue;
  if (!pkg.name || GATED_ELSEWHERE.has(pkg.name)) continue;

  // Trailing boundary matters: `--filter web` must not be satisfied by
  // `--filter web-something`. The script NAME is matched too, so a package
  // wired in for `test` does not silently vouch for its `e2e` suite as well.
  const needle = `--filter ${pkg.name}`;
  const after = ci.split(needle).slice(1);
  for (const alternatives of requirements) {
    const hit = alternatives.some((suite) =>
      after.some((rest) => new RegExp(`^\\s+${suite}(\\s|$)`).test(rest)),
    );
    if (!hit) missing.push({ name: pkg.name, suite: alternatives[0] });
  }
}

if (missing.length > 0) {
  console.error('These package suites are not run by any CI workflow:\n');
  for (const m of missing) console.error(`  ${m.name}  (${m.suite})`);
  console.error(
    '\nAdd a step to .github/workflows/tests.yml:\n' +
      `\n      - name: ${missing[0].name.replace(/^@boffmedia\//, '')}\n` +
      `        run: pnpm --filter ${missing[0].name} ${missing[0].suite}\n`,
  );
  process.exit(1);
}

console.log(`check-ci-coverage: every test-bearing package suite is wired to CI.`);
