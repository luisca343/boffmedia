#!/usr/bin/env node
/**
 * Creates directory junctions (Windows) or symlinks (Unix) so that
 * apps/api/public and apps/web/public both point to the shared root public/ folder.
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
    if (stat.isSymbolicLink() || (isWindows && stat.isDirectory())) {
      console.log(`✔  Already linked: ${link}`);
      continue;
    }
    // Plain file placeholder (e.g. committed via git) — remove it
    fs.rmSync(link, { recursive: true, force: true });
    console.log(`   Removed existing non-link entry: ${link}`);
  }

  fs.symlinkSync(target, link, linkType);
  console.log(`✔  Created ${isWindows ? 'junction' : 'symlink'}: ${link} → ${target}`);
}
