#!/usr/bin/env node

/**
 * Sequential lint runner for memory-constrained environments
 * Runs lint on each package one at a time to prevent OOM
 */

const { execSync, spawn } = require('child_process');
const path = require('path');

const PACKAGES = ['apps/web', 'apps/api'];
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
    ? ['-c', '.eslintrc.memory-safe.js', 'src/**/*.ts', 'test/**/*.ts', '--fix']
    : ['src'];

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
