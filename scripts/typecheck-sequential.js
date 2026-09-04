#!/usr/bin/env node

/**
 * Sequential type-check runner for memory-constrained environments
 * Runs tsc --noEmit on each package one at a time to prevent OOM
 */

const { spawn } = require('child_process');
const os = require('os');
const path = require('path');

// Every workspace package with its own tsconfig. Keep this list in sync when
// adding one — a missing entry makes `pnpm type-check` report green for code it
// never looked at.
const PACKAGES = [
  'apps/web',
  'apps/api',
  'apps/desktop',
  'packages/ui',
  'packages/pack-schema',
  'packages/battle-core',
  'packages/asset-paths',
  'packages/pokemon-identity',
  'packages/pkmn-names',
  'packages/tools/kit',
  'packages/tools/minecraft',
  'packages/tools/mhwilds',
  'packages/tools/pokemon',
  'packages/tools/mewgenics',
  'packages/tools/misc',
  'packages/tools/battlesim',
];
function getAvailableMemoryMB() {
  try {
    // Linux/WSL: MemAvailable is the honest number — it accounts for reclaimable
    // page cache, which os.freemem() reports as "used".
    const meminfo = require('fs').readFileSync('/proc/meminfo', 'utf8');
    const match = meminfo.match(/MemAvailable:\s+(\d+)\s+kB/);
    if (match) return Math.floor(parseInt(match[1]) / 1024);
  } catch {
    /* not Linux — fall through */
  }
  // Everywhere else (Windows, macOS) /proc does not exist. This used to return a
  // hardcoded 4096, which made the printed figure fiction on every dev machine.
  return Math.floor(os.freemem() / 1024 / 1024);
}

// apps/api is a large NestJS graph and OOMs at 2048MB; that failure was
// invisible while the runner itself was broken. Take half of what is actually
// free, clamped — the whole point of running sequentially is that one process
// may use a lot, and a fixed cap sized for the smallest package defeats it.
const MEMORY_LIMIT = Math.min(8192, Math.max(4096, Math.floor(getAvailableMemoryMB() / 2)));

async function runTypeCheck(pkg) {
  const pkgDir = path.resolve(__dirname, '..', pkg);
  const pkgName = pkg.split('/').pop();
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Type-checking: ${pkgName}`);
  console.log(`Memory available: ${getAvailableMemoryMB()}MB`);
  console.log(`${'='.repeat(60)}\n`);

  // Run tsc's own JS entry point under THIS node rather than shelling out to
  // `npx`. On Windows `npx` is a .cmd shim, and spawn() without shell:true
  // cannot execute it — the whole run died with `spawn npx ENOENT` and, because
  // a failed package only sets a flag, reported "some packages failed" for code
  // it had never read. Resolving the binary is also a good deal faster than npx.
  let tscPath;
  try {
    tscPath = require.resolve('typescript/bin/tsc', { paths: [pkgDir] });
  } catch {
    console.error(`\n❌ ${pkgName}: typescript is not installed for this package`);
    return Promise.reject(new Error(`typescript not resolvable from ${pkgDir}`));
  }

  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [tscPath, '--noEmit', '--skipLibCheck'], {
      cwd: pkgDir,
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_OPTIONS: `--max-old-space-size=${MEMORY_LIMIT}`
      }
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log(`\n✅ ${pkgName} type-check passed`);
        resolve();
      } else {
        console.error(`\n❌ ${pkgName} type-check failed (exit code ${code})`);
        reject(new Error(`Type-check failed for ${pkgName}`));
      }
    });

    child.on('error', (err) => {
      console.error(`\n❌ ${pkgName} type-check error: ${err.message}`);
      reject(err);
    });
  });
}

async function main() {
  console.log('Sequential Type-Check Runner');
  console.log(`Memory limit per process: ${MEMORY_LIMIT}MB`);
  console.log(`Packages to check: ${PACKAGES.join(', ')}`);
  
  const startTime = Date.now();
  let failed = false;

  for (const pkg of PACKAGES) {
    try {
      await runTypeCheck(pkg);
    } catch (err) {
      failed = true;
    }
  }

  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Completed in ${elapsed}s`);
  
  if (failed) {
    console.error('Some packages failed type-check');
    process.exit(1);
  } else {
    console.log('All packages passed type-check');
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
