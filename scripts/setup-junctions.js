#!/usr/bin/env node
/**
 * Creates directory junctions (Windows) or symlinks (Unix) so the apps reach the
 * three shared storage roots at the same relative paths they use in production:
 *
 *   public/      read-only asset tree      -> apps/api/public, apps/web/public
 *   var/uploads/ hot user content          -> apps/api/var/uploads
 *   laboon/      large cold blobs          -> apps/api/laboon
 *
 * The three are separate because their storage differs: uploads are read on
 * ordinary page loads and belong on local disk, while laboon is network storage.
 */

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const target = path.join(root, 'public');
const links = [
  path.join(root, 'apps', 'api', 'public'),
  path.join(root, 'apps', 'web', 'public'),
];

const isWindows = process.platform === 'win32';
const linkType = isWindows ? 'junction' : 'dir';

for (const link of links) {
  if (fs.existsSync(link)) {
    const stat = fs.lstatSync(link);
    const pointsToTarget = stat.isDirectory() && (() => {
      try {
        const current = fs.statSync(link);
        const targetStat = fs.statSync(target);
        return current.dev === targetStat.dev && current.ino === targetStat.ino;
      } catch {
        return false;
      }
    })();
    if (stat.isSymbolicLink() || (isWindows && stat.isDirectory()) || pointsToTarget) {
      console.log(`✔  Already linked: ${link}`);
      continue;
    }
    if (stat.isDirectory()) {
      console.warn(`⚠  Existing directory is not linked, leaving untouched: ${link}`);
      continue;
    }
    // Plain file placeholder (e.g. committed via git) — remove it
    fs.rmSync(link, { recursive: true, force: true });
    console.log(`   Removed existing non-link entry: ${link}`);
  }

  fs.symlinkSync(target, link, linkType);
  console.log(`✔  Created ${isWindows ? 'junction' : 'symlink'}: ${link} → ${target}`);
}

// Launcher artifacts and pack override blobs are private API storage, not
// public assets. Keep one ignored root shared directory so local WSL runs and
// operator tooling use the same persistent paths without exposing them to the
// web app.
const laboon = path.join(root, 'laboon');
fs.mkdirSync(path.join(laboon, 'pack-blobs'), { recursive: true });
fs.mkdirSync(path.join(laboon, 'desktop-releases'), { recursive: true });

const apiLaboon = path.join(root, 'apps', 'api', 'laboon');
if (fs.existsSync(apiLaboon)) {
  const stat = fs.lstatSync(apiLaboon);
  if (stat.isSymbolicLink() || (isWindows && stat.isDirectory())) {
    console.log(`✔  Already linked: ${apiLaboon}`);
  } else {
    console.warn(`⚠  Not a link, leaving untouched: ${apiLaboon}`);
  }
} else {
  fs.symlinkSync(laboon, apiLaboon, linkType);
  console.log(`✔  Created ${isWindows ? 'junction' : 'symlink'}: ${apiLaboon} → ${laboon}`);
}

// User uploads are their own root: they are written at runtime (so they cannot
// live in the read-only asset tree) but are also read on ordinary page loads
// (so they must not live on laboon's network storage).
const uploads = path.join(root, 'var', 'uploads');
for (const sub of ['sharex', 'profiles', 'chat', 'mhwilds', 'starbank']) {
  fs.mkdirSync(path.join(uploads, sub), { recursive: true });
}

// Only `uploads` is shared. `apps/api/var/cache` stays per-checkout, matching
// the container layout where var/ holds both and only uploads is a volume.
fs.mkdirSync(path.join(root, 'apps', 'api', 'var'), { recursive: true });

const apiUploads = path.join(root, 'apps', 'api', 'var', 'uploads');
if (fs.existsSync(apiUploads)) {
  const stat = fs.lstatSync(apiUploads);
  if (stat.isSymbolicLink() || (isWindows && stat.isDirectory())) {
    console.log(`✔  Already linked: ${apiUploads}`);
  } else {
    console.warn(`⚠  Not a link, leaving untouched: ${apiUploads}`);
  }
} else {
  fs.symlinkSync(uploads, apiUploads, linkType);
  console.log(`✔  Created ${isWindows ? 'junction' : 'symlink'}: ${apiUploads} → ${uploads}`);
}
