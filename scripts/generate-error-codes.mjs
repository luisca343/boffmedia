#!/usr/bin/env node
// Generates the API-error code enum for BOTH sides from one catalog.
//
// Why two outputs: `apps/api` cannot import `@boffmedia/shared` (it breaks
// `nest start`), so the API gets its own constant file. They are generated
// together from apps/api/src/common/errors/catalog.json so they cannot drift.
//
// Run: `pnpm generate:error-codes` (also chained into `pnpm generate:shared`).
// `--check` exits non-zero when either output is stale, for CI/lint.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CATALOG = join(ROOT, 'apps/api/src/common/errors/catalog.json');
const API_OUT = join(ROOT, 'apps/api/src/common/errors/error-codes.generated.ts');
const SHARED_OUT = join(ROOT, 'packages/shared/src/errorCodes.generated.ts');

const catalog = JSON.parse(readFileSync(CATALOG, 'utf8'));
const codes = Object.keys(catalog.codes).sort();

for (const code of codes) {
  if (!/^[A-Z][A-Z0-9_]*$/.test(code)) {
    throw new Error(`Invalid error code "${code}" — use SCREAMING_SNAKE_CASE.`);
  }
  if (typeof catalog.codes[code].es !== 'string' || !catalog.codes[code].es) {
    throw new Error(`Error code "${code}" is missing its Spanish fallback ("es").`);
  }
}

const BANNER = `// GENERATED FILE — DO NOT EDIT.
// Source: apps/api/src/common/errors/catalog.json
// Regenerate: pnpm generate:error-codes
`;

// Single-quoted to match the API's prettier config (JSON.stringify would emit
// double quotes and fail `eslint --max-warnings 0`).
const sq = (s) => `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;

const members = codes.map((c) => `  ${c}: '${c}',`).join('\n');
const fallbacks = codes
  .map((c) => `  ${c}: ${sq(catalog.codes[c].es)},`)
  .join('\n');

const api = `${BANNER}
/** Stable, machine-readable codes for errors that surface to a user. */
export const ApiErrorCode = {
${members}
} as const;

export type ApiErrorCode = (typeof ApiErrorCode)[keyof typeof ApiErrorCode];

/** Spanish fallback text shipped as \`userMessage\` alongside each code. */
export const API_ERROR_FALLBACK_ES: Record<ApiErrorCode, string> = {
${fallbacks}
};
`;

const shared = `${BANNER}
/**
 * Stable API error codes. The API attaches one to every user-facing exception
 * and keeps its Spanish \`userMessage\` as the fallback; the web maps
 * code -> translated string via \`useApiError()\`.
 */
export const ApiErrorCode = {
${members}
} as const;

export type ApiErrorCode = (typeof ApiErrorCode)[keyof typeof ApiErrorCode];

export const API_ERROR_CODES: readonly ApiErrorCode[] = Object.values(ApiErrorCode);

export function isApiErrorCode(value: unknown): value is ApiErrorCode {
  return typeof value === 'string' && value in ApiErrorCode;
}
`;

// Run the emitted TS through prettier so `eslint` (prettier/prettier, error)
// passes on the generated files. Without this a single fallback string longer
// than the print width fails the lint of a file nobody is allowed to edit.
let format = async (code) => code;
try {
  // prettier lives in apps/api's node_modules (pnpm isolates), not the root's.
  const require = createRequire(join(ROOT, 'apps/api/package.json'));
  const mod = await import(pathToFileURL(require.resolve('prettier')).href);
  // prettier ships CJS, so the ESM import wraps the API under `default`.
  const prettier = mod.resolveConfig ? mod : mod.default;
  const config = (await prettier.resolveConfig(API_OUT)) ?? {};
  format = (code) => prettier.format(code, { ...config, parser: 'typescript' });
} catch {
  console.warn('prettier unavailable — emitting unformatted output');
}

const outputs = [
  [API_OUT, await format(api)],
  [SHARED_OUT, await format(shared)],
];

const check = process.argv.includes('--check');
let stale = false;

for (const [path, content] of outputs) {
  const current = existsSync(path) ? readFileSync(path, 'utf8') : null;
  if (current === content) continue;
  if (check) {
    console.error(`STALE: ${path}`);
    stale = true;
  } else {
    writeFileSync(path, content, 'utf8');
    console.log(`wrote ${path}`);
  }
}

if (check) {
  if (stale) {
    console.error('Run `pnpm generate:error-codes`.');
    process.exit(1);
  }
  console.log(`error codes up to date (${codes.length} codes)`);
} else {
  console.log(`${codes.length} error codes generated.`);
}
