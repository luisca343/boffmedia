#!/usr/bin/env node
/**
 * T5. One sync vocabulary, and a gate so the next one cannot appear quietly.
 *
 * There were three, and they had grown apart in the worst possible way -- not by
 * disagreeing loudly, but by using the SAME WORDS for different things:
 *
 *   `offline`  meant SIGNED OUT in the VGC tracker and NO NETWORK in battlesim
 *   `idle`     meant SYNCED in the tracker, and nothing anywhere else
 *   `pending`  meant QUEUED in the teambuilder, which the kit already called `queued`
 *   `error`    meant REJECTED in the teambuilder and RETRYING in the tracker
 *
 * Nothing caught it because a status union is just a string union: every tool
 * compiled, every badge rendered, and the only way to notice was to read all
 * three files side by side. `ToolSyncState` in `@boffmedia/tool-kit` is now the
 * only one, and this refuses a fourth.
 *
 * WHAT IT LOOKS FOR: any exported union of string literals, anywhere under
 * `packages/tools` or an app's `src`, carrying TWO OR MORE of the words below.
 *
 * It matches on the MEMBERS, not on the type's name, and the first cut had that
 * backwards. Keying on "Sync" in the name immediately flagged
 * `type SyncTable = "sessions" | "matches" | "series" | "presets"` -- a list of
 * table names -- while it would still have missed a genuine second vocabulary
 * called `UploadState` or `SaveStatus`. A gate that fires on the innocent case
 * and not the guilty one is worse than none, because the fix for the noise is
 * to delete the gate.
 *
 * The word list is deliberately narrow. A generic `"idle" | "loading" | "error"`
 * fetch state does not trip it, and neither does the API's `TcgSyncStage`
 * ("missing" | "cards-partial" | ...) -- which is why that one needs no path
 * exclusion.
 *
 * WHAT IT DELIBERATELY ALLOWS: `type X = ToolSyncState` and
 * `Extract<ToolSyncState, ...>`. Aliasing and narrowing the shared union is the
 * intended way to say "this surface can only produce these" -- and renaming a
 * member in the kit stays a compile error at every such site.
 *
 * The one it must never allow is the one that started this: a tool inventing
 * `"idle" | "syncing" | "error" | "offline"` because those words felt natural.
 * They are natural. That is the problem -- four other people picked words that
 * felt natural too, and no two sets matched.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const rel = (p) => relative(ROOT, p).split('\\').join('/');

const ROOTS = [join(ROOT, 'packages/tools'), join(ROOT, 'apps/web/src'), join(ROOT, 'apps/desktop/src')];

/** The one file allowed to declare the vocabulary. */
const CANONICAL = 'packages/tools/kit/src/sync-policy.ts';

/**
 * CORE: words that can only be about where a player's data lives. At least one
 * of these must be present, and it is what separates a sync vocabulary from
 * every other state machine in the repo.
 */
const CORE_WORDS = new Set([
  'synced', 'syncing', 'unsynced', 'retrying', 'stuck', 'rejected',
  'offline', 'local-only', 'localonly', 'conflict', 'uploading', 'dirty',
]);

/**
 * SOFT: words the three old vocabularies used for sync states, but which any
 * state machine may legitimately use. They count towards the total, never
 * towards the required CORE hit.
 *
 * They cannot stand alone, and two real unions in this repo are why. Requiring
 * only "two sync-ish words" flagged
 * `PvpTransportStatus = "idle" | "connecting" | "connected" | "error"` (a SOCKET
 * connection, not data) and
 * `AvJobStatus = "idle" | "queued" | "running" | "done" | "error" | "cancelled"`
 * (an admin job queue). Both are correct as they are. A gate whose first run
 * produces two false positives teaches everyone to pass `--no-verify`.
 */
const SOFT_WORDS = new Set(['queued', 'pending', 'idle', 'error', 'saved']);

/** Paths exempted for a stated reason. Empty, and it should stay that way. */
const UNRELATED = [];

const SKIP_DIRS = new Set(['node_modules', 'dist', '.next', 'coverage', '.vite', 'test-results']);

function walk(dir, out = []) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    if (SKIP_DIRS.has(e.name)) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(e.name) && !/\.d\.ts$/.test(e.name)) out.push(p);
  }
  return out;
}

/**
 * `export type Whatever = "a" | "b" ...`
 *
 * At least TWO string literals: a single-literal alias is a constant, not a
 * vocabulary, and flagging it would be the noise that gets a gate turned off.
 */
const DECL = /export\s+type\s+(\w+)\s*=\s*((?:\s*\|?\s*"[^"]+"\s*)(?:\|\s*"[^"]+"\s*){1,})[;\n]/g;

const offenders = [];
let scanned = 0;
let canonicalSeen = false;

for (const root of ROOTS) {
  for (const file of walk(root)) {
    const r = rel(file);
    scanned++;
    if (r === CANONICAL) {
      canonicalSeen = true;
      continue;
    }
    if (UNRELATED.includes(r)) continue;
    const text = readFileSync(file, 'utf8');
    for (const m of text.matchAll(DECL)) {
      const line = text.slice(0, m.index).split('\n').length;
      const members = [...m[2].matchAll(/"([^"]+)"/g)].map((x) => x[1]);
      const lower = members.map((w) => w.toLowerCase());
      const core = lower.filter((w) => CORE_WORDS.has(w));
      const hits = lower.filter((w) => CORE_WORDS.has(w) || SOFT_WORDS.has(w));
      // One unambiguous word, and at least two sync words in total.
      if (core.length === 0 || hits.length < 2) continue;
      offenders.push({ file: r, line, name: m[1], members, hits });
    }
  }
}

// A walk that stops finding the canonical declaration is a walk that has stopped
// reading what it claims to read -- and it would then pass forever.
if (!canonicalSeen) {
  console.error(
    `FAIL -- ${CANONICAL} was not visited by this scan (${scanned} files walked).\n` +
      `The gate cannot vouch for a vocabulary it never located. Fix the paths here.\n`,
  );
  process.exit(1);
}

const canonical = readFileSync(join(ROOT, CANONICAL), 'utf8');
const members = [...(canonical.match(/export type ToolSyncState =([\s\S]*?);/)?.[1] ?? '').matchAll(/"([^"]+)"/g)].map(
  (m) => m[1],
);
if (members.length < 5) {
  console.error(
    `FAIL -- read only ${members.length} members of ToolSyncState from ${CANONICAL}.\n` +
      `It has had 7-8 for the life of this gate, so the pattern has stopped matching\n` +
      `and everything below is vacuous.\n`,
  );
  process.exit(1);
}

if (offenders.length) {
  console.error('FAIL -- a second sync vocabulary was declared:\n');
  for (const o of offenders) {
    console.error(
      `  ${o.file}:${o.line}  type ${o.name} = ${o.members.map((x) => `"${x}"`).join(' | ')}\n` +
        `      sync words in it: ${o.hits.join(', ')}`,
    );
  }
  console.error(
    `\nThe shared one is \`ToolSyncState\` in @boffmedia/tool-kit:\n` +
      `  ${members.map((m) => `"${m}"`).join(' | ')}\n\n` +
      `Use it, or narrow it — \`Extract<ToolSyncState, "synced" | "queued">\` is the\n` +
      `supported way to say "this surface can only produce these", and it keeps a\n` +
      `rename in the kit a compile error here.\n\n` +
      `If a member you need genuinely does not exist, ADD IT TO THE KIT. That is how\n` +
      `\`conflict\` got there: three tools, one of which needed to tell a player to\n` +
      `pull rather than to discard, and no word for it.\n\n` +
      `If this really is an unrelated subsystem whose states happen to share these\n` +
      `words, add its path to UNRELATED in this file with a line saying what it is.\n`,
  );
  process.exit(1);
}

console.log(
  `check-sync-vocabulary: ${scanned} files, one vocabulary — ToolSyncState ` +
    `(${members.length} members: ${members.join(', ')}).\n`,
);
