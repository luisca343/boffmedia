#!/usr/bin/env node

/**
 * Sequential lint runner for memory-constrained environments.
 * Runs lint on each package one at a time to prevent OOM.
 *
 * X6 — WHY THIS DOES NOT `--fix` BY DEFAULT.
 *
 * It used to. `pnpm lint` is the root gate, it calls this, and this shelled
 * ESLint over apps/api with `--fix` unconditionally. So checking your work
 * REWROTE files across a package you had not touched, and the resulting diff
 * arrived in whatever you committed next — recorded in project memory as
 * "root lint runs --fix; check git status afterwards", which is a workaround
 * for a tool that should not have needed one. A gate reports; it does not
 * edit. Fixing is now an explicit, separate verb.
 *
 *   pnpm lint                  report only  (what CI runs, what the chain runs)
 *   pnpm lint:fix              apply fixes to both apps
 *   node scripts/lint-sequential.js --fix --only=api    just the one you touched
 *
 * `--only` exists for the same reason: the two apps are independent, and
 * linting web to check an api change is four minutes of nothing.
 */

const { spawn } = require('child_process');
const path = require('path');

const ALL_PACKAGES = ['apps/web', 'apps/api'];

const argv = process.argv.slice(2);
const FIX = argv.includes('--fix');
const onlyArg = argv.find((a) => a.startsWith('--only='));
const only = onlyArg ? onlyArg.slice('--only='.length) : null;

const PACKAGES = only
  ? ALL_PACKAGES.filter((p) => p.split('/').pop() === only)
  : ALL_PACKAGES;

if (only && PACKAGES.length === 0) {
  console.error(
    `Unknown package "${only}". Known: ${ALL_PACKAGES.map((p) => p.split('/').pop()).join(', ')}`,
  );
  process.exit(1);
}
const WEB_MEMORY_LIMIT = 2048; // MB for web
const API_MEMORY_LIMIT = 3072; // MB for api (use memory-safe config); matches apps/api's own lint script — 2048 OOMs
const MIN_AVAILABLE_MB = 2048; // Need 2GB free to run lint safely

function getAvailableMemoryMB() {
  try {
    const meminfo = require('fs').readFileSync('/proc/meminfo', 'utf8');
    const match = meminfo.match(/MemAvailable:\s+(\d+)\s+kB/);
    return match ? Math.floor(parseInt(match[1]) / 1024) : 4096;
  } catch {
    return 4096;
  }
}

async function runLint(pkg) {
  const pkgDir = path.resolve(__dirname, '..', pkg);
  const pkgName = pkg.split('/').pop();
  const isApi = pkgName === 'api';
  const memLimit = isApi ? API_MEMORY_LIMIT : WEB_MEMORY_LIMIT;
  
  // Check memory before each package
  const available = getAvailableMemoryMB();
  if (available < MIN_AVAILABLE_MB) {
    console.error(`\n❌ Insufficient memory: ${available}MB available, ${MIN_AVAILABLE_MB}MB required`);
    console.error('Close other applications or restart WSL with: wsl --shutdown');
    throw new Error('Insufficient memory');
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Linting: ${pkgName}`);
  console.log(`Memory available: ${available}MB`);
  console.log(`Memory limit: ${memLimit}MB`);
  console.log(`${'='.repeat(60)}\n`);

  // Run ESLint's own JS entry point under THIS node rather than shelling out to
  // `pnpm lint`. Same Windows trap typecheck-sequential.js documents: `pnpm` is a
  // .cmd shim there, so spawn() without shell:true died with `spawn pnpm ENOENT`
  // and took the whole `pnpm lint` chain (v3-conventions, layering, i18n, fonts,
  // schema, error-codes) down with it before any of them ran. The per-app scripts
  // also prefix `NODE_OPTIONS='…'` POSIX-style, which cmd.exe cannot parse — the
  // memory limit is passed through the env below instead.
  const eslintPkg = require.resolve('eslint/package.json', { paths: [pkgDir] });
  const eslintBin = path.join(path.dirname(eslintPkg), require(eslintPkg).bin.eslint);
  const args = isApi
    ? ['-c', '.eslintrc.memory-safe.js', 'src/**/*.ts', 'test/**/*.ts']
    : ['src'];
  if (FIX) args.push('--fix');

  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [eslintBin, ...args], {
      cwd: pkgDir,
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_OPTIONS: `--max-old-space-size=${memLimit}`
      }
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log(`\n✅ ${pkgName} lint passed`);
        resolve();
      } else {
        console.error(`\n❌ ${pkgName} lint failed (exit code ${code})`);
        reject(new Error(`Lint failed for ${pkgName}`));
      }
    });

    child.on('error', (err) => {
      console.error(`\n❌ ${pkgName} lint error: ${err.message}`);
      reject(err);
    });
  });
}

async function main() {
  console.log('Sequential Lint Runner');
  console.log(`Memory limits: web=${WEB_MEMORY_LIMIT}MB, api=${API_MEMORY_LIMIT}MB`);
  console.log(`Packages to lint: ${PACKAGES.join(', ')}`);
  console.log(
    FIX
      ? 'Mode: --fix — THIS REWRITES FILES in the packages above, including ones you did not touch.'
      : 'Mode: report only. Run `pnpm lint:fix` (or add --fix) to apply the autofixable ones.',
  );
  
  const startTime = Date.now();
  let failed = false;

  for (const pkg of PACKAGES) {
    try {
      await runLint(pkg);
    } catch (err) {
      failed = true;
      // Continue with other packages even if one fails
    }
  }

  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Completed in ${elapsed}s`);
  
  if (failed) {
    console.error('Some packages failed lint');
    process.exit(1);
  } else {
    console.log('All packages passed lint');
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
