#!/usr/bin/env node
/**
 * Verifies the three storage roots resolve the way apps/api/src/config/paths.ts
 * builds them, against whatever is actually mounted. Run it on the host after a
 * deploy, or inside the container to check the volumes:
 *
 *   docker run --rm  *     -v /mnt/public:/app/public:ro  *     -v /mnt/laboon:/app/laboon  *     -v /mnt/uploads:/app/var/uploads  *     -v "$PWD/scripts/check-storage-roots.js:/app/check-storage-roots.js:ro"  *     --entrypoint node <api-image> /app/check-storage-roots.js
 *
 * Every line must read OK. A MISS means a volume is absent or the tree was not
 * migrated; `public is writable` means it was not mounted read-only.
 */
const { join } = require('path');
const fs = require('fs');

const pub = (...s) =>
  join(process.env.PUBLIC_ROOT || join(process.cwd(), 'public'), ...s);
const up = (...s) =>
  join(process.env.UPLOADS_ROOT || join(process.cwd(), 'var', 'uploads'), ...s);
const lab = (...s) => join(process.cwd(), 'laboon', ...s);

const rows = [
  ['publicPath()', pub()],
  ['uploadsPath()', up()],
  ['laboonPath()', lab()],
  ['public/boffmedia/img', pub('boffmedia', 'img')],
  ['public/boffmedia/tools/tcg', pub('boffmedia', 'tools', 'tcg')],
  ['public/smartrotom/packs', pub('smartrotom', 'packs')],
  ['public/jcef', pub('jcef')],
  ['uploads/sharex', up('sharex')],
  ['uploads/starbank', up('starbank')],
  ['laboon/cefbuilds', lab('cefbuilds')],
  ['laboon/pack-blobs', lab('pack-blobs')],
];

for (const [name, p] of rows) {
  console.log((fs.existsSync(p) ? 'OK   ' : 'MISS ') + name.padEnd(28) + p);
}

try {
  fs.writeFileSync(up('.wtest'), 'x');
  fs.unlinkSync(up('.wtest'));
  console.log('OK   uploads writable');
} catch (e) {
  console.log('FAIL uploads not writable: ' + e.code);
}

try {
  fs.writeFileSync(pub('.wtest'), 'x');
  fs.unlinkSync(pub('.wtest'));
  console.log('WARN public is writable (mount it :ro in production)');
} catch (e) {
  console.log('OK   public rejects writes (' + e.code + ')');
}
