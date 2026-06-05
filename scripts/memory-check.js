#!/usr/bin/env node

/**
 * Memory check script for WSL environments
 * Verifies available memory before running heavy Node.js processes
 * Exits with code 1 if insufficient memory (prevents OOM crash)
 */

const { execSync } = require('child_process');
const os = require('os');

const MIN_AVAILABLE_MB = 4096; // 4GB minimum required (eslint needs 2GB per process)
const WARN_AVAILABLE_MB = 5120; // 5GB warning threshold

function getAvailableMemoryMB() {
  try {
    // Linux: read from /proc/meminfo for accurate available memory
    const meminfo = execSync('cat /proc/meminfo', { encoding: 'utf8' });
    const availableMatch = meminfo.match(/MemAvailable:\s+(\d+)\s+kB/);
    if (availableMatch) {
      return Math.floor(parseInt(availableMatch[1]) / 1024);
    }
  } catch (e) {
    // Fallback to os.freemem()
  }
  return Math.floor(os.freemem() / (1024 * 1024));
}

function getSwapUsageMB() {
  try {
    const meminfo = execSync('cat /proc/meminfo', { encoding: 'utf8' });
    const totalMatch = meminfo.match(/SwapTotal:\s+(\d+)\s+kB/);
    const freeMatch = meminfo.match(/SwapFree:\s+(\d+)\s+kB/);
    if (totalMatch && freeMatch) {
      return Math.floor((parseInt(totalMatch[1]) - parseInt(freeMatch[1])) / 1024);
    }
  } catch (e) {
    // Ignore
  }
  return 0;
}

const available = getAvailableMemoryMB();
const swapUsed = getSwapUsageMB();
const totalMem = Math.floor(os.totalmem() / (1024 * 1024));

console.log(`Memory Status:`);
console.log(`  Total: ${totalMem}MB`);
console.log(`  Available: ${available}MB`);
console.log(`  Swap Used: ${swapUsed}MB`);

if (available < MIN_AVAILABLE_MB) {
  console.error(`\n❌ INSUFFICIENT MEMORY: ${available}MB available, ${MIN_AVAILABLE_MB}MB required`);
  console.error(`\nTo free memory:`);
  console.error(`  1. Close unnecessary VSCode tabs/extensions`);
  console.error(`  2. Stop unused dev servers`);
  console.error(`  3. Run: wsl --shutdown (from Windows) and restart`);
  process.exit(1);
}

if (available < WARN_AVAILABLE_MB) {
  console.warn(`\n⚠️  LOW MEMORY WARNING: ${available}MB available`);
  console.warn(`   Consider freeing memory before continuing.`);
}

console.log(`\n✅ Sufficient memory available (${available}MB)`);
process.exit(0);
