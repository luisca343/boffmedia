#!/usr/bin/env node
/**
 * N25. `drizzle-kit generate` diffs the current schema against the LATEST
 * snapshot in `drizzle/migrations/meta/`. If that snapshot is older than the
 * newest migration, every migration in between is re-emitted as if it were new
 * work -- and the output looks entirely legitimate and EXITS 0.
 *
 * That is exactly what happened here. Migrations 0004 and 0007-0020 were written
 * BY HAND, and drizzle-kit only writes a snapshot when it generates one itself,
 * so the chain stopped at 0006 while the journal ran to 0020. Running `generate`
 * on a tree with no schema changes at all produced a 152-line migration
 * recreating twelve tables that already existed. Applying it would have failed on
 * "table already exists"; committing it would have poisoned the chain for
 * everyone.
 *
 * THE INVARIANT: the LAST journal entry must have a snapshot. Intermediate gaps
 * are fine and expected -- a hand-written migration in the middle of the history
 * costs nothing, because `generate` only ever reads the newest. It is the
 * newest being stale that breaks it.
 *
 * So after hand-writing a migration, write its snapshot too. The cheap way is to
 * generate the schema into a scratch `out` directory and copy the resulting
 * snapshot in under the new index, with `prevId` chained to the previous one --
 * which is how `0020_snapshot.json` was reconstructed.
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const META = join(ROOT, 'apps/api/drizzle/migrations/meta');
const JOURNAL = join(META, '_journal.json');

if (!existsSync(JOURNAL)) {
  console.error(`FAIL -- ${JOURNAL} does not exist. This gate is reading the wrong path.`);
  process.exit(1);
}

const journal = JSON.parse(readFileSync(JOURNAL, 'utf8'));
const entries = journal.entries ?? [];
if (entries.length === 0) {
  console.error('FAIL -- the migration journal has no entries. This gate is inert.');
  process.exit(1);
}

const last = entries[entries.length - 1];
const idx = String(last.idx).padStart(4, '0');
const expected = `${idx}_snapshot.json`;

const present = readdirSync(META).filter((f) => f.endsWith('_snapshot.json'));

if (!present.includes(expected)) {
  const newest = present.sort().pop() ?? '(none)';
  console.error(
    `FAIL -- the newest migration has no snapshot.\n\n` +
      `  journal ends at   ${idx}_${last.tag}\n` +
      `  newest snapshot   ${newest}\n\n` +
      `\`drizzle-kit generate\` diffs against the newest snapshot, so it will re-emit every\n` +
      `migration after ${newest.slice(0, 4)} as if it were new work -- a large, plausible-looking\n` +
      `migration that recreates tables which already exist, and it EXITS 0.\n\n` +
      `Write ${expected}: generate the schema into a scratch \`out\` directory, then copy its\n` +
      `snapshot here under this index with \`prevId\` set to the previous snapshot's \`id\`.\n\n` +
      `Gaps EARLIER in the chain are fine -- only the newest one is read.\n`,
  );
  process.exit(1);
}

console.log(
  `check-migration-snapshots: journal ends at ${idx}_${last.tag}, and ${expected} exists ` +
    `(${present.length} snapshots for ${entries.length} migrations; earlier gaps are expected ` +
    `where migrations were hand-written).\n`,
);
