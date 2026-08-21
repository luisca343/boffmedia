#!/usr/bin/env node

/**
 * One-shot, idempotent public/ assets reorganization.
 *
 * Moves ~275K files from the flat public/ tree into a product-organized layout:
 *   public/{boffmedia/, smartrotom/, jcef/, blog/}
 *   var/uploads/{sharex,profiles,chat,mhwilds}   (local disk: hot user content)
 *   laboon/cefbuilds                              (network storage: cold blobs)
 *
 * Environment overrides (testing only):
 *   MIGRATE_PUBLIC_ROOT - absolute path to public dir (default: <cwd>/public)
 *   MIGRATE_LABOON_ROOT  - absolute path to laboon dir (default: <cwd>/laboon)
 *   MIGRATE_UPLOADS_ROOT - absolute path to the uploads dir (default: <cwd>/var/uploads)
 *
 * Invariants:
 *   - All moves are renames; cross-mount falls back to recursive copy + verify + delete.
 *   - Pre-flight validation: if source exists AND dest exists, abort before any write.
 *   - Idempotent: source absent + dest present → skipped (already migrated).
 *   - --dry-run prints planned operations without touching disk.
 *   - Backs up .trash-2026-07-14, public/combates and public/data/tcgpocket
 *     before removing them; nothing is deleted outright.
 *   - Preserves: public/data/wingull, smartrotom/* (except img/sharex), jcef/, blog/.
 *   - Second consecutive run: zero operations, exit 0.
 */

const fs = require('fs');
const path = require('path');

const PUBLIC = path.resolve(process.env.MIGRATE_PUBLIC_ROOT || 'public');
const LABOON = path.resolve(process.env.MIGRATE_LABOON_ROOT || 'laboon');
const BACKUP = path.join(LABOON, 'backups', 'public-reorg-2026-08-21');
// Hot user content stays on local disk: laboon is network storage, and these
// files are read on ordinary page loads rather than downloaded on demand.
const UPLOADS = path.resolve(process.env.MIGRATE_UPLOADS_ROOT || path.join('var', 'uploads'));

const dryRun = process.argv.includes('--dry-run');

// Order matters: assets/img becomes boffmedia/img, so it must move BEFORE
// the entries that land inside it, or it would clobber their parent.
const MOVES = [
  { from: 'assets/fonts', to: 'boffmedia/fonts' },
  { from: 'assets/brand', to: 'boffmedia/brand' },
  // CRITICAL: this runs BEFORE misiones so it doesn't clobber the destination parent
  { from: 'assets/img', to: 'boffmedia/img' },
  { from: 'assets/misiones', to: 'boffmedia/img/misiones' },
  { from: 'assets/audio', to: 'boffmedia/img/audio', optional: true },
  { from: 'img/games/tcg', to: 'boffmedia/tools/tcg' },
  { from: 'battlesim', to: 'boffmedia/tools/battlesim' },
  { from: 'data/mewgenics', to: 'boffmedia/tools/mewgenics' },
  { from: 'data/mhwilds', to: 'boffmedia/tools/mhwilds' },
  { from: 'smartrotom/img/sharex', to: path.join(UPLOADS, 'sharex') },
  { from: 'uploads/profiles', to: path.join(UPLOADS, 'profiles') },
  { from: 'uploads/chat-screenshots', to: path.join(UPLOADS, 'chat', 'chat-screenshots') },
  { from: 'uploads/chatapp', to: path.join(UPLOADS, 'chat', 'chatapp') },
  { from: 'uploads/cefbuilds', to: path.join(LABOON, 'cefbuilds') },
];

// Directories to back up and remove
const REMOVE = [
  { from: '.trash-2026-07-14', to: path.join(BACKUP, '.trash-2026-07-14') },
  { from: 'combates', to: path.join(BACKUP, 'combates') },
  // Dormant: no code path reads these, and the tool's card art comes from
  // boffmedia/tools/tcg instead.
  { from: 'data/tcgpocket', to: path.join(BACKUP, 'tcgpocket') },
];

// Directories that must never be touched
const KEEP = [
  'public/data/wingull',
  'public/smartrotom/combates',
  'public/smartrotom',  // entire subtree
  'public/jcef',
  'public/blog',
];

// The KEEP list is enforced HERE as well as in the move planner: emptiness is
// not a licence to delete. A protected directory that happens to hold no files
// is still a directory somebody asked to keep.
const KEEP_ABS = new Set(
  KEEP.map((rel) =>
    path.resolve(rel.startsWith('public/') ? path.join(PUBLIC, rel.slice(7)) : rel),
  ),
);

function isProtected(dir) {
  const abs = path.resolve(dir);
  for (const keep of KEEP_ABS) {
    if (abs === keep || abs.startsWith(keep + path.sep)) return true;
  }
  return false;
}

const ops = [];
let conflictFound = false;

function exists(p) {
  try {
    fs.statSync(p);
    return true;
  } catch {
    return false;
  }
}

function countFilesRecursive(dir) {
  let count = 0;
  function walk(p) {
    const entries = fs.readdirSync(p, { withFileTypes: true });
    for (const ent of entries) {
      if (ent.isFile()) {
        count++;
      } else if (ent.isDirectory()) {
        walk(path.join(p, ent.name));
      }
    }
  }
  try {
    walk(dir);
  } catch {
    return 0;
  }
  return count;
}

function ensureDir(p) {
  if (!exists(p)) {
    fs.mkdirSync(p, { recursive: true });
    ops.push({ verb: 'MKDIR', path: p });
  }
}

function moveDir(from, to) {
  const fromAbs = path.isAbsolute(from) ? from : path.join(PUBLIC, from);
  const toAbs = path.isAbsolute(to) ? to : path.join(PUBLIC, to);
  const fromExists = exists(fromAbs);
  const toExists = exists(toAbs);

  if (!fromExists && toExists) {
    ops.push({ verb: 'SKIP', from, to, reason: 'already migrated' });
    return;
  }

  if (!fromExists) {
    ops.push({ verb: 'SKIP', from, to, reason: 'source missing' });
    return;
  }

  if (fromExists && toExists) {
    conflictFound = true;
    ops.push({
      verb: 'CONFLICT',
      from,
      to,
      reason: 'source AND dest both exist'
    });
    return;
  }

  ops.push({ verb: 'MOVE', from, to });
}

function backupAndRemove(fromPath, toPath) {
  const fromAbs = path.isAbsolute(fromPath) ? fromPath : path.join(PUBLIC, fromPath);
  const toAbs = toPath;
  const exists_ = exists(fromAbs);

  if (!exists_) {
    ops.push({ verb: 'SKIP', path: fromPath, reason: 'not found' });
    return;
  }

  ops.push({ verb: 'BACKUP', from: fromPath, to: toPath });
}

// === PRE-FLIGHT: Check all MOVES for conflicts ===
console.log('Pre-flight validation...');
for (const move of MOVES) {
  if (move.optional && !exists(path.isAbsolute(move.from) ? move.from : path.join(PUBLIC, move.from))) {
    continue;
  }
  const fromAbs = path.isAbsolute(move.from) ? move.from : path.join(PUBLIC, move.from);
  const toAbs = path.isAbsolute(move.to) ? move.to : path.join(PUBLIC, move.to);
  if (exists(fromAbs) && exists(toAbs)) {
    console.error(`ABORT: source and destination both exist:`);
    console.error(`  FROM: ${fromAbs}`);
    console.error(`  TO:   ${toAbs}`);
    process.exit(1);
  }
}

// === Build operation list ===
console.log('Building operation plan...\n');

// Process MOVES
for (const move of MOVES) {
  const fromAbs = path.isAbsolute(move.from) ? move.from : path.join(PUBLIC, move.from);
  if (move.optional && !exists(fromAbs)) {
    continue;
  }
  moveDir(move.from, move.to);
}

// Process REMOVE (back up first, then mark for removal)
for (const item of REMOVE) {
  const fromPath = item.from;
  const toPath = item.to;
  backupAndRemove(fromPath, toPath);
}

// Create necessary empty directories even if nothing moves into them
const dirsToCreate = [
  path.join(UPLOADS, 'sharex'),
  path.join(UPLOADS, 'profiles'),
  path.join(UPLOADS, 'chat'),
  path.join(UPLOADS, 'mhwilds'),
];

for (const dir of dirsToCreate) {
  if (!exists(dir)) {
    ops.push({ verb: 'MKDIR', path: dir });
  }
}

if (conflictFound) {
  console.error('ABORT: Pre-flight validation found conflicts. No changes made.');
  process.exit(1);
}

// === Print plan ===
console.log('Planned operations:\n');
for (const op of ops) {
  if (op.verb === 'MOVE') {
    console.log(`  MOVE  ${op.from} → ${op.to}`);
  } else if (op.verb === 'SKIP') {
    console.log(`  SKIP  ${op.from || op.path} (${op.reason})`);
  } else if (op.verb === 'BACKUP') {
    console.log(`  BACKUP  ${op.from} → ${op.to}`);
  } else if (op.verb === 'MKDIR') {
    console.log(`  MKDIR  ${op.path}`);
  } else if (op.verb === 'CONFLICT') {
    console.log(`  CONFLICT  ${op.from} (${op.reason})`);
  }
}

if (dryRun) {
  console.log('\n--dry-run: no changes made.');
  console.log(`\nSummary: ${ops.length} operations planned`);
  process.exit(0);
}

// === Execute ===
console.log('\nExecuting...\n');

for (const op of ops) {
  if (op.verb === 'MOVE') {
    const fromAbs = path.isAbsolute(op.from) ? op.from : path.join(PUBLIC, op.from);
    const toAbs = path.isAbsolute(op.to) ? op.to : path.join(PUBLIC, op.to);

    // Ensure parent directory exists before move
    fs.mkdirSync(path.dirname(toAbs), { recursive: true });

    try {
      // Try rename first
      fs.renameSync(fromAbs, toAbs);
      console.log(`  ✓ MOVE  ${op.from}`);
    } catch (err) {
      if (err.code === 'EXDEV' || err.code === 'EACCES') {
        // Cross-mount or permission: copy + verify + delete
        console.log(`  ⟳ COPY  ${op.from} (cross-mount fallback)`);
        try {
          fs.cpSync(fromAbs, toAbs, { recursive: true, errorOnExist: false });
          const srcCount = countFilesRecursive(fromAbs);
          const dstCount = countFilesRecursive(toAbs);
          if (srcCount !== dstCount) {
            console.error(`  ✗ VERIFY FAILED: src=${srcCount} files, dst=${dstCount} files`);
            console.error(`    Aborting. Source left intact.`);
            process.exit(1);
          }
          fs.rmSync(fromAbs, { recursive: true, force: true });
          console.log(`  ✓ MOVE  ${op.from} (copy verified and source removed)`);
        } catch (e) {
          console.error(`  ✗ COPY FAILED: ${e.message}`);
          process.exit(1);
        }
      } else {
        console.error(`  ✗ MOVE FAILED: ${err.message}`);
        process.exit(1);
      }
    }
  } else if (op.verb === 'BACKUP') {
    const fromPath = path.isAbsolute(op.from) ? op.from : path.join(PUBLIC, op.from);
    const toPath = op.to;

    // Ensure parent directory exists before backup
    fs.mkdirSync(path.dirname(toPath), { recursive: true });

    try {
      fs.renameSync(fromPath, toPath);
      console.log(`  ✓ BACKUP  ${op.from}`);
    } catch (err) {
      if (err.code === 'EXDEV' || err.code === 'EACCES') {
        console.log(`  ⟳ COPY  ${op.from} (cross-mount fallback)`);
        try {
          fs.cpSync(fromPath, toPath, { recursive: true, errorOnExist: false });
          const srcCount = countFilesRecursive(fromPath);
          const dstCount = countFilesRecursive(toPath);
          if (srcCount !== dstCount) {
            console.error(`  ✗ VERIFY FAILED: src=${srcCount} files, dst=${dstCount} files`);
            console.error(`    Aborting. Source left intact.`);
            process.exit(1);
          }
          fs.rmSync(fromPath, { recursive: true, force: true });
          console.log(`  ✓ BACKUP  ${op.from} (copy verified and source removed)`);
        } catch (e) {
          console.error(`  ✗ BACKUP FAILED: ${e.message}`);
          process.exit(1);
        }
      } else {
        console.error(`  ✗ BACKUP FAILED: ${err.message}`);
        process.exit(1);
      }
    }
  } else if (op.verb === 'MKDIR') {
    if (!exists(op.path)) {
      fs.mkdirSync(op.path, { recursive: true });
      console.log(`  ✓ MKDIR  ${op.path}`);
    }
  }
}

// === Clean up empty parent directories ===
const emptyDirs = [
  path.join(PUBLIC, 'assets'),
  path.join(PUBLIC, 'img'),
  path.join(PUBLIC, 'uploads'),
  path.join(PUBLIC, 'data'),
];

function pruneIfEmpty(dir) {
  if (!exists(dir)) return true;
  if (isProtected(dir)) {
    console.log(`  KEEP  ${path.relative(PUBLIC, dir)}/ (protected)`);
    return false;
  }
  let entries;
  try {
    entries = fs.readdirSync(dir);
  } catch (err) {
    console.log(`  KEEP  ${path.relative(PUBLIC, dir)}/ (${err.code})`);
    return false;
  }
  // A moved subtree leaves its parents holding nothing but each other (img/
  // keeps an empty games/ once games/tcg is gone), so a directory is judged
  // only after its own children have had the chance to go.
  for (const entry of entries) {
    const child = path.join(dir, entry);
    let isDir = false;
    try {
      isDir = fs.statSync(child).isDirectory();
    } catch {
      isDir = false;
    }
    if (isDir) pruneIfEmpty(child);
  }
  const remaining = fs.readdirSync(dir);
  if (remaining.length === 0) {
    fs.rmdirSync(dir);
    console.log(`  REMOVE  ${path.relative(PUBLIC, dir)}/`);
    return true;
  }
  console.log(
    `  KEEP  ${path.relative(PUBLIC, dir)}/ (not empty: ${remaining.join(', ')})`,
  );
  return false;
}

console.log('\nCleaning up empty directories...\n');
for (const dir of emptyDirs) {
  pruneIfEmpty(dir);
}

console.log('\n✓ Migration complete.');
const performed = ops.filter((op) => op.verb !== 'SKIP').length;
const skipped = ops.length - performed;
console.log(`Operations performed: ${performed}, already migrated: ${skipped}`);
process.exit(0);
