#!/usr/bin/env node

/**
 * Sequential type-check runner for memory-constrained environments
 * Runs tsc --noEmit on each package one at a time to prevent OOM
 */

const { spawn } = require('child_process');
const path = require('path');

// Every workspace package with its own tsconfig. Keep this list in sync when
// adding one — a missing entry makes `pnpm type-check` report green for code it
// never looked at.
const PACKAGES = [
  'apps/web',
  'apps/api',
  'apps/launcher',
  'packages/ui',
  'packages/pack-schema',
];
const MEMORY_LIMIT = 2048; // MB per process

function getAvailableMemoryMB() {
  try {
    const meminfo = require('fs').readFileSync('/proc/meminfo', 'utf8');
    const match = meminfo.match(/MemAvailable:\s+(\d+)\s+kB/);
    return match ? Math.floor(parseInt(match[1]) / 1024) : 4096;
  } catch {
    return 4096;
  }
}

async function runTypeCheck(pkg) {
  const pkgDir = path.resolve(__dirname, '..', pkg);
  const pkgName = pkg.split('/').pop();
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Type-checking: ${pkgName}`);
  console.log(`Memory available: ${getAvailableMemoryMB()}MB`);
  console.log(`${'='.repeat(60)}\n`);

  return new Promise((resolve, reject) => {
    const child = spawn('npx', ['tsc', '--noEmit', '--skipLibCheck'], {
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
