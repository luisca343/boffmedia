#!/usr/bin/env node
/**
 * Destructive database reset: drops EVERY table and view in one schema, then
 * optionally re-applies the migration chain from `drizzle/migrations/*.sql`.
 *
 * Plain CommonJS depending only on `mysql2`, which is a production dependency —
 * so this runs unchanged inside the API container (`docker exec`), where the
 * database is usually the only place it is reachable from. It deliberately does
 * NOT use drizzle-kit: the runtime image ships `drizzle/` but not
 * `drizzle.config.ts`, and that config imports `src/config/env`, which is not
 * in the image either.
 *
 * Why it drops everything rather than matching a prefix: `drizzle/reset-test-db.sql`
 * matches `tools_vgc_` literally, so on a database that has drifted to older
 * table names it silently leaves every stale table behind — which is the exact
 * situation a reset is usually trying to escape.
 *
 *   # 1. see what would happen (default — never destroys anything)
 *   node scripts/reset-database.js --database=boffmedia
 *
 *   # 2. actually do it
 *   node scripts/reset-database.js --database=boffmedia --execute
 *
 *   # 3. wipe and rebuild the schema in one pass
 *   node scripts/reset-database.js --database=boffmedia --execute --migrate
 *
 * Connection comes from DATABASE_URL, or DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME.
 * Seeds are NOT run here: they need ts-node and `src/`, so run `seed:system`
 * then `seed:dev` from a checkout afterwards.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// dotenv is present in a checkout and absent in the pruned image; either is fine.
try {
  require('dotenv').config({ quiet: true });
} catch {
  /* env comes from the process in the container */
}

const mysql = require('mysql2/promise');

const arg = (name) => {
  const hit = process.argv.find((a) => a === `--${name}` || a.startsWith(`--${name}=`));
  if (!hit) return null;
  return hit.includes('=') ? hit.slice(hit.indexOf('=') + 1) : true;
};

const TARGET = arg('database');
const EXECUTE = arg('execute') === true;
const MIGRATE = arg('migrate') === true;

function connectionConfig() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const need = ['DB_HOST', 'DB_USER', 'DB_NAME'];
  const missing = need.filter((k) => !process.env[k]);
  if (missing.length) {
    console.error(`No DATABASE_URL, and missing: ${missing.join(', ')}`);
    process.exit(1);
  }
  return {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: false,
  };
}

/** Where `drizzle/migrations` sits, from a checkout or from /app in the image. */
function migrationsDir() {
  const candidates = [
    path.resolve(__dirname, '..', 'drizzle', 'migrations'),
    path.resolve(process.cwd(), 'drizzle', 'migrations'),
    path.resolve(process.cwd(), 'apps', 'api', 'drizzle', 'migrations'),
  ];
  return candidates.find((d) => fs.existsSync(path.join(d, 'meta', '_journal.json'))) || null;
}

async function main() {
  if (!TARGET || TARGET === true) {
    console.error(
      'Refusing to run without --database=<name>.\n' +
        'The name must match the database the connection actually lands in; that\n' +
        'match is the only thing standing between this and the wrong server.',
    );
    process.exit(1);
  }

  const c = await mysql.createConnection(connectionConfig());

  const [[cur]] = await c.query('SELECT DATABASE() AS d, VERSION() AS v');
  if (cur.d !== TARGET) {
    console.error(
      `REFUSING: connected to "${cur.d}" but --database says "${TARGET}".`,
    );
    await c.end();
    process.exit(1);
  }

  const [[host]] = await c.query('SELECT @@hostname AS h, @@port AS p');
  const [views] = await c.query(
    'SELECT table_name AS t FROM information_schema.views WHERE table_schema = DATABASE()',
  );
  const [tables] = await c.query(
    "SELECT table_name AS t FROM information_schema.tables WHERE table_schema = DATABASE() AND table_type = 'BASE TABLE'",
  );
  const [[rows]] = await c.query(
    'SELECT COALESCE(SUM(table_rows), 0) AS n FROM information_schema.tables WHERE table_schema = DATABASE()',
  );

  const viewNames = views.map((r) => r.t || r.TABLE_NAME);
  const tableNames = tables.map((r) => r.t || r.TABLE_NAME);

  console.log('');
  console.log('  server      :', `${host.h}:${host.p}  (MySQL ${cur.v})`);
  console.log('  database    :', cur.d);
  console.log('  tables      :', tableNames.length);
  console.log('  views       :', viewNames.length);
  console.log('  approx rows :', Number(rows.n).toLocaleString(), '(engine estimate)');
  console.log('');

  if (!EXECUTE) {
    console.log('  DRY RUN — nothing was changed.');
    console.log('  Re-run with --execute to drop all of the above.');
    console.log('  Add --migrate to re-apply drizzle/migrations afterwards.');
    console.log('');
    await c.end();
    return;
  }

  console.log('  DROPPING EVERYTHING…');
  await c.query('SET FOREIGN_KEY_CHECKS = 0');

  for (const v of viewNames) await c.query(`DROP VIEW IF EXISTS \`${v}\``);
  if (viewNames.length) console.log(`  dropped ${viewNames.length} view(s)`);

  // Batched: dropping 150+ tables one statement at a time is needlessly slow,
  // and with FK checks off the order does not matter.
  const CHUNK = 25;
  for (let i = 0; i < tableNames.length; i += CHUNK) {
    const chunk = tableNames.slice(i, i + CHUNK);
    await c.query(`DROP TABLE IF EXISTS ${chunk.map((t) => `\`${t}\``).join(', ')}`);
    console.log(`  dropped ${Math.min(i + CHUNK, tableNames.length)}/${tableNames.length} tables`);
  }

  await c.query('SET FOREIGN_KEY_CHECKS = 1');

  const [[left]] = await c.query(
    'SELECT COUNT(*) AS n FROM information_schema.tables WHERE table_schema = DATABASE()',
  );
  console.log('  remaining objects:', left.n);

  if (!MIGRATE) {
    console.log('');
    console.log('  Schema is now EMPTY. Apply migrations before starting the API,');
    console.log('  or re-run with --migrate.');
    console.log('');
    await c.end();
    return;
  }

  const dir = migrationsDir();
  if (!dir) {
    console.error('  --migrate: could not find drizzle/migrations/meta/_journal.json');
    await c.end();
    process.exit(1);
  }

  console.log('');
  console.log('  applying migrations from', dir);

  // The journal is the ordering authority — filenames sort lexically today but
  // that is a coincidence, not a guarantee.
  const journal = JSON.parse(
    fs.readFileSync(path.join(dir, 'meta', '_journal.json'), 'utf8'),
  );

  await c.query(
    'CREATE TABLE IF NOT EXISTS `__drizzle_migrations` (' +
      '`id` bigint unsigned AUTO_INCREMENT PRIMARY KEY, ' +
      '`hash` text NOT NULL, ' +
      '`created_at` bigint)',
  );

  for (const entry of journal.entries) {
    const file = path.join(dir, `${entry.tag}.sql`);
    if (!fs.existsSync(file)) {
      console.error(`  MISSING migration file: ${entry.tag}.sql`);
      await c.end();
      process.exit(1);
    }

    const sql = fs.readFileSync(file, 'utf8');
    const hash = crypto.createHash('sha256').update(sql).digest('hex');

    const statements = sql
      .split('--> statement-breakpoint')
      .map((s) => s.trim())
      .filter(Boolean);

    for (const stmt of statements) await c.query(stmt);

    await c.query(
      'INSERT INTO `__drizzle_migrations` (hash, created_at) VALUES (?, ?)',
      [hash, Date.now()],
    );
    console.log(`  applied ${entry.tag}  (${statements.length} statements)`);
  }

  const [[after]] = await c.query(
    "SELECT COUNT(*) AS n FROM information_schema.tables WHERE table_schema = DATABASE() AND table_type = 'BASE TABLE'",
  );
  console.log('');
  console.log('  tables now  :', after.n);
  console.log('  NEXT: seed from a checkout — seed:system, then seed:dev.');
  console.log('        seed:system needs SEED_ADMIN_PASSWORD (min 12 chars).');
  console.log('');

  await c.end();
}

main().catch((e) => {
  console.error('ERR', e.code || e.message);
  process.exit(1);
});
