#!/usr/bin/env node
/**
 * X3. Keeps the three `.env.example` files from drifting away from the code and
 * the workflows that actually read the variables.
 *
 * The finding this closes was "no .env.example; environment names scattered
 * across code and workflows". Writing the three files closed the visible half.
 * This is the other half, and it is the half that lasts: a list is correct on
 * the day it is written, and a fresh clone a month later fails at first run
 * exactly as before. The gate is what makes adding a variable to `env.ts`
 * without documenting it a red build.
 *
 * FOUR CHECKS, each with a different source of truth:
 *
 *   1. apps/api/src/config/env.ts  ->  apps/api/.env.example
 *      The zod schema is the API's contract with its environment. Every key in
 *      it must appear in the example.
 *
 *   2. .github/workflows/deploy-web.yml  ->  apps/web/.env.example
 *      The deploy writes `.env.production.local` line by line. Every name it
 *      writes must be documented, because that file IS the production
 *      environment and nothing else records it.
 *
 *   3. apps/web/src/config/env.ts  ->  apps/web/.env.example
 *      The web app has its own, smaller zod schema, and it is the half that
 *      holds the server-only names (NEXTAUTH_SECRET, the OAuth pairs). Same
 *      rule as the API's.
 *
 *   4. `process.env.NEXT_PUBLIC_*` in apps/web  ->  apps/web/.env.example
 *      A NEXT_PUBLIC name is inlined into the browser bundle at build time. A
 *      name the code reads and the example does not list is a value that is
 *      `undefined` in production and nowhere visible -- which is precisely
 *      X16: the web app read two names the deploy never set, and Twitch account
 *      linking was inert in production for months.
 *
 * Extra keys in an example file are NOT an error: both examples deliberately
 * document names read straight through `process.env` rather than the schema.
 * They are reported as a notice so a dead name is at least visible.
 *
 * Every parse in here fails loudly when it finds nothing. That is deliberate:
 * this repo has shipped a gate that examined zero routes and printed GATE
 * PASSED, and a regex that silently stops matching is exactly how that happens.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const failures = [];
const notices = [];

/** `KEY=` lines in a dotenv-style file, commented lines excluded. */
function exampleKeys(file) {
  let text;
  try {
    text = readFileSync(join(ROOT, file), 'utf8');
  } catch {
    failures.push(`${file}: missing. A fresh clone has no list of variables to follow.`);
    return new Set();
  }
  const keys = new Set();
  for (const line of text.split('\n')) {
    const m = line.match(/^([A-Z][A-Z0-9_]*)\s*=/);
    if (m) keys.add(m[1]);
  }
  if (keys.size === 0) {
    failures.push(`${file}: no KEY= lines found -- the file is empty or its format changed.`);
  }
  return keys;
}

// -- 1. the API zod schema --------------------------------------------------
//
// Read as text rather than imported: env.ts is TypeScript and it parses
// process.env at import time, so requiring it from a .mjs would need both a
// transpiler and a valid environment. The keys are declared one per line at a
// fixed depth inside `envSchema = z.object({ ... })`. `envSchema` is exported
// and asserted on by env.spec.ts, so a rename that breaks this regex breaks
// that spec too.
function zodSchemaKeys(file, anchor, floor) {
  const text = readFileSync(join(ROOT, file), 'utf8');
  const start = text.indexOf(anchor);
  if (start === -1) {
    failures.push(`${file}: could not find "${anchor}" -- this gate is reading the wrong thing.`);
    return new Set();
  }
  // The schema's own closing brace, at two-space depth. Both files are
  // prettier-formatted, so this is stable; if it ever is not, the floor below
  // catches it rather than letting the gate quietly check a fragment.
  const end = text.indexOf('\n  })', start);
  const body = text.slice(start, end === -1 ? text.length : end);
  const keys = new Set();
  for (const line of body.split('\n')) {
    const m = line.match(/^ {4}([A-Z][A-Z0-9_]*):\s/);
    if (m) keys.add(m[1]);
  }
  if (keys.size < floor) {
    failures.push(
      `${file}: only ${keys.size} keys parsed out of the schema, expected at least ${floor}. ` +
        `The shape this gate reads has changed and it is now checking almost nothing.`,
    );
  }
  return keys;
}

// -- 2. what the web deploy actually writes ---------------------------------
function deployWebKeys() {
  const file = '.github/workflows/deploy-web.yml';
  const text = readFileSync(join(ROOT, file), 'utf8');
  const keys = new Set();
  // echo "KEY=${{ secrets.X }}" >> .env.production.local
  for (const m of text.matchAll(/echo\s+"([A-Z][A-Z0-9_]*)=/g)) keys.add(m[1]);
  if (keys.size === 0) {
    failures.push(
      `${file}: no 'echo KEY=' lines found -- the deploy no longer writes the env this way ` +
        `and this check is inert.`,
    );
  }
  return keys;
}

// -- 3. NEXT_PUBLIC_* the web code reads ------------------------------------
function webPublicKeys() {
  const roots = ['apps/web/src', 'apps/web/next.config.mjs', 'apps/web/proxy.ts'];
  const keys = new Set();
  const walk = (p) => {
    let st;
    try {
      st = statSync(p);
    } catch {
      return;
    }
    if (st.isDirectory()) {
      for (const e of readdirSync(p)) {
        if (e === 'node_modules' || e === '.next') continue;
        walk(join(p, e));
      }
      return;
    }
    if (!/\.(ts|tsx|js|jsx|mjs)$/.test(p)) return;
    const text = readFileSync(p, 'utf8');
    for (const m of text.matchAll(/process\.env\.(NEXT_PUBLIC_[A-Z0-9_]+)/g)) keys.add(m[1]);
  };
  for (const r of roots) walk(join(ROOT, r));
  if (keys.size === 0) {
    failures.push('apps/web: no process.env.NEXT_PUBLIC_* references found -- this check is inert.');
  }
  return keys;
}

function compare(label, required, example, exampleFile) {
  const missing = [...required].filter((k) => !example.has(k)).sort();
  if (missing.length) {
    failures.push(
      `${exampleFile} is missing ${missing.length} key(s) that ${label}:\n` +
        missing.map((k) => `    ${k}`).join('\n'),
    );
  }
}

const apiExample = exampleKeys('apps/api/.env.example');
const webExample = exampleKeys('apps/web/.env.example');
// Presence and format only: the desktop values are consumed by cargo and the
// Tauri CLI out of the shell environment, so there is no schema to compare to.
exampleKeys('apps/desktop/.env.example');

const schema = zodSchemaKeys('apps/api/src/config/env.ts', 'export const envSchema = z', 50);
const webSchema = zodSchemaKeys('apps/web/src/config/env.ts', 'export const env = z', 12);
const deployWeb = deployWebKeys();
const webPublic = webPublicKeys();

compare('apps/api/src/config/env.ts declares', schema, apiExample, 'apps/api/.env.example');
compare('apps/web/src/config/env.ts declares', webSchema, webExample, 'apps/web/.env.example');
compare(
  '.github/workflows/deploy-web.yml writes at deploy time',
  deployWeb,
  webExample,
  'apps/web/.env.example',
);
compare('apps/web reads through process.env', webPublic, webExample, 'apps/web/.env.example');

// Notices: names documented but referenced nowhere this gate can see. Not a
// failure -- a server-only name reached through ConfigService looks identical
// from here -- but a dead name (X16's NEXT_PUBLIC_TWITCH_CLIENT_SECRET) shows
// up in this list, which is more than it did before.
const knownWeb = new Set([...deployWeb, ...webPublic, ...webSchema]);
const orphanWeb = [...webExample]
  .filter((k) => !knownWeb.has(k) && k.startsWith('NEXT_PUBLIC_'))
  .sort();
if (orphanWeb.length) {
  notices.push(
    `apps/web/.env.example documents ${orphanWeb.length} NEXT_PUBLIC_* name(s) that no code ` +
      `reads and no deploy writes:\n` +
      orphanWeb.map((k) => `    ${k}`).join('\n'),
  );
}
const orphanApi = [...apiExample].filter((k) => !schema.has(k)).sort();
if (orphanApi.length) {
  notices.push(
    `apps/api/.env.example documents ${orphanApi.length} key(s) outside the zod schema ` +
      `(expected: names read straight through process.env):\n` +
      orphanApi.map((k) => `    ${k}`).join('\n'),
  );
}

console.log(
  `Checked ${schema.size} API schema keys, ${webSchema.size} web schema keys, ` +
    `${deployWeb.size} deploy-written web keys and ${webPublic.size} NEXT_PUBLIC_* references ` +
    `against the three .env.example files.\n`,
);

for (const n of notices) console.log(`i  ${n}\n`);

if (failures.length) {
  console.error('FAIL -- .env.example drift:\n');
  for (const f of failures) console.error(`  ${f}\n`);
  console.error(
    'Add the key to the example file with a comment saying what it is for, or remove it\n' +
      'from the code. A fresh clone has nothing else to go on.\n',
  );
  process.exit(1);
}

console.log('OK -- every environment name the code and the deploys use is documented.\n');
