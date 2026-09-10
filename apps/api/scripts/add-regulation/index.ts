#!/usr/bin/env ts-node
/**
 * Regenerates the Champions mod and its format registry from upstream Showdown.
 *
 * Usage (from apps/api/):
 *   pnpm add-regulation "[Gen 9 Champions] VGC 2026 Reg M-B"
 *   pnpm add-regulation --forget "[Gen 9 Champions] Draft"
 *   pnpm add-regulation --ref master --source ../../pokemon-showdown
 *
 * The script tracks a SET of format names (persisted in packages/battle-core/src/mods/champions/.source.json)
 * and re-resolves every one of them against upstream on each run. That is deliberate: a format's `mod` is
 * not stable across regulations — upstream moved Reg M-A from `champions` to `championsregma` when Reg M-B
 * took over the `champions` name — so regenerating only the newly added format would leave every existing
 * regulation pointing at another regulation's data, with no error and no visible diff. Re-resolving all of
 * them makes that class of drift self-correcting. When upstream retires an
 * old format, its previous local registry entry and generated delta are
 * retained and chained after any newer upstream regulation layer.
 *
 * Everything it writes is generated. Review the diff, then commit.
 */
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { Dex } from '@pkmn/sim';

import { FILE_CONFIGS } from '../convert-showdown-mod/config';
import {
  convertFile,
  generateIndex,
  validateOutput,
} from '../convert-showdown-mod/converter';
import {
  loadGeneratedFormats,
  loadUpstreamFormats,
  resolveModChain,
  toFormatId,
  UpstreamFormat,
} from './formats';
import { buildPokedexDelta } from './pokedex-delta';
import { resolveUpstream, UpstreamSource } from './upstream';

// ---------------------------------------------------------------------------
// Paths & constants
// ---------------------------------------------------------------------------

// Output path changed: champions mod data now lives in @boffmedia/battle-core
const ROOT_MOD_ID = 'champions';
const MOD_DIR = path.resolve(
  __dirname,
  '../../../../packages/battle-core/src/mods/champions',
);
const PROVENANCE_FILE = path.join(MOD_DIR, '.source.json');
const REGISTRY_FILE = path.join(MOD_DIR, 'registry.generated.ts');
const CACHE_DIR = path.join(os.tmpdir(), 'boffmedia-showdown-src');
// Display base for the paths this script prints. All three uses are
// `relativeImport(VGC_DIR, …)` inside a console.log, so this only affects how
// generated-file paths are shown — never where anything is written. Running via
// `pnpm --filter api add-regulation` puts cwd at apps/api, which is the most
// useful thing to print paths relative to.
const VGC_DIR = process.cwd();

/**
 * Seeds the tracked set on the very first run, before .source.json exists.
 * Matches the formats that were hand-declared in champions.mod.ts.
 */
const DEFAULT_TRACKED_FORMATS = [
  '[Gen 9 Champions] VGC 2026 Reg M-A',
  '[Gen 9 Champions] VGC 2026 Reg M-A (Bo3)',
  '[Gen 9 Champions] BSS Reg M-A',
  '[Gen 9 Champions] OU',
  '[Gen 9 Champions] Draft',
];

/**
 * Files the generator owns in a mod directory. Anything else is left alone.
 *
 * `index.ts` is deliberately absent: it is rewritten unconditionally on every
 * run, so listing it here would make prune report a deletion it then undoes.
 */
const GENERATED_MOD_FILES = new Set(
  Object.values(FILE_CONFIGS).map((c) => c.outputFile),
);

interface Provenance {
  generator: string;
  upstreamRepo: string;
  upstreamRef: string;
  upstreamCommit: string;
  upstreamCommittedAt: string;
  pkmnSimVersion: string;
  trackedFormats: string[];
  /** Formats retained from the previous local registry because upstream dropped them. */
  archivedFormats: string[];
  mods: string[];
  pokedexBackfill: { count: number; species: string[] };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fail(message: string): never {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

function readTrackedFormats(): string[] {
  if (!fs.existsSync(PROVENANCE_FILE)) return [...DEFAULT_TRACKED_FORMATS];
  try {
    const parsed = JSON.parse(
      fs.readFileSync(PROVENANCE_FILE, 'utf-8'),
    ) as Provenance;
    return Array.isArray(parsed.trackedFormats) && parsed.trackedFormats.length
      ? parsed.trackedFormats
      : [...DEFAULT_TRACKED_FORMATS];
  } catch {
    return [...DEFAULT_TRACKED_FORMATS];
  }
}

function pkmnSimVersion(): string {
  // @pkmn/sim declares an `exports` map, so require.resolve() on its
  // package.json is blocked. Resolve the entry point instead and walk up to the
  // package root, which is stable regardless of the exports layout.
  try {
    let dir = path.dirname(require.resolve('@pkmn/sim'));
    for (let i = 0; i < 6; i++) {
      const candidate = path.join(dir, 'package.json');
      if (fs.existsSync(candidate)) {
        const pkg = JSON.parse(fs.readFileSync(candidate, 'utf-8'));
        if (pkg.name === '@pkmn/sim' && pkg.version) return pkg.version as string;
      }
      const parent = path.dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
  } catch {
    // Fall through to 'unknown'; provenance records the gap rather than lying.
  }
  return 'unknown';
}

/**
 * Directory a mod's generated files live in.
 *
 * The root mod keeps the historical `mod/` location so its (large) generated
 * files stay diffable across this restructure. Descendants use their stable
 * suffix under it, so `championsregma` stays in `mod/regma/` even after its
 * parent changes from `champions` to `championsregmb`.
 */
function outputDirFor(modId: string): string {
  const suffix = modId.startsWith(ROOT_MOD_ID)
    ? modId.slice(ROOT_MOD_ID.length)
    : modId;
  return suffix ? path.join(MOD_DIR, suffix) : MOD_DIR;
}

function relativeImport(from: string, to: string): string {
  const rel = path.relative(from, to).split(path.sep).join('/');
  return rel.startsWith('.') ? rel : `./${rel}`;
}

function recordParent(
  parentOf: Map<string, string | null>,
  id: string,
  parent: string | null,
): void {
  if (parentOf.has(id) && parentOf.get(id) !== parent) {
    fail(
      `Conflicting parents for mod "${id}": ` +
        `"${parentOf.get(id) ?? '(base)'}" and "${parent ?? '(base)'}".`,
    );
  }
  parentOf.set(id, parent);
}

function inheritedParent(scriptFile: string): string | null {
  if (!fs.existsSync(scriptFile)) return null;
  const match = /^\s*inherit\s*:\s*['"]([^'"]+)['"]/m.exec(
    fs.readFileSync(scriptFile, 'utf-8'),
  );
  return match?.[1] ?? null;
}

/** Resolves the parent chain of a mod already generated in this repository. */
function resolveLocalModChain(modId: string): string[] {
  const chain: string[] = [];
  const seen = new Set<string>();
  let current: string | undefined = modId;

  while (current) {
    if (seen.has(current)) {
      fail(
        `Circular local mod inheritance detected at "${current}" ` +
          `(chain: ${chain.join(' -> ')}).`,
      );
    }
    seen.add(current);
    chain.push(current);

    const dir = outputDirFor(current);
    if (!fs.existsSync(dir)) {
      fail(
        `Local generated mod directory is missing for "${current}": ` +
          `${relativeImport(VGC_DIR, dir)}.`,
      );
    }
    const parent = inheritedParent(path.join(dir, 'scripts.ts'));
    current = parent ?? undefined;
  }

  return chain;
}

/** `ma < mb < mc`; newer regulation layers must be nearer the root mod. */
function regulationSuffix(modId: string): string | null {
  return /^championsreg([a-z]+)$/.exec(modId)?.[1] ?? null;
}

function compareModIds(a: string, b: string): number {
  if (a === ROOT_MOD_ID) return b === ROOT_MOD_ID ? 0 : -1;
  if (b === ROOT_MOD_ID) return 1;

  const aReg = regulationSuffix(a);
  const bReg = regulationSuffix(b);
  if (aReg && bReg) return bReg.localeCompare(aReg);
  if (aReg) return -1;
  if (bReg) return 1;
  return a.localeCompare(b);
}

function nearestNewerRegulation(
  modId: string,
  allModIds: Iterable<string>,
): string | null {
  const suffix = regulationSuffix(modId);
  if (!suffix) return null;

  return (
    [...allModIds]
      .filter((candidate) => {
        const candidateSuffix = regulationSuffix(candidate);
        return candidateSuffix && candidateSuffix > suffix;
      })
      .sort((a, b) => {
        const aSuffix = regulationSuffix(a)!;
        const bSuffix = regulationSuffix(b)!;
        return aSuffix.localeCompare(bSuffix);
      })[0] ?? null
  );
}

// ---------------------------------------------------------------------------
// Conversion
// ---------------------------------------------------------------------------

interface ConvertedMod {
  id: string;
  parentId: string | null;
  dir: string;
  /** Base file names written, e.g. ['abilities.ts', 'scripts.ts']. */
  files: string[];
}

function convertMod(
  upstream: UpstreamSource,
  modId: string,
  parentId: string | null,
  dryRun: boolean,
): ConvertedMod {
  const sourceDir = path.join(upstream.dir, 'data', 'mods', modId);
  if (!fs.existsSync(sourceDir)) {
    fail(`Upstream mod directory not found: data/mods/${modId}`);
  }

  const outDir = outputDirFor(modId);
  if (!dryRun) fs.mkdirSync(outDir, { recursive: true });

  const written: string[] = [];
  console.log(`\n  mod ${modId} -> ${relativeImport(VGC_DIR, outDir)}/`);

  // The conversion loop iterates FILE_CONFIGS, so a data table upstream adds
  // that we have no config for would be skipped without a word — the exact
  // silent-drift shape this generator exists to prevent. Fail on it instead.
  const unknown = fs
    .readdirSync(sourceDir)
    .filter((f) => f.endsWith('.ts') && !FILE_CONFIGS[f]);
  if (unknown.length) {
    fail(
      `data/mods/${modId} contains ${unknown.length} file(s) this generator ` +
        `does not know how to convert: ${unknown.join(', ')}.\n` +
        `  Upstream added a data table. Add an entry for each to FILE_CONFIGS ` +
        `in scripts/convert-showdown-mod/config.ts (and to MOD_DATA_KEYS here ` +
        `if it must reach Dex.mod()), then re-run.`,
    );
  }

  for (const fileName of Object.keys(FILE_CONFIGS)) {
    const sourcePath = path.join(sourceDir, fileName);
    if (!fs.existsSync(sourcePath)) continue;

    // Git checks the upstream clone out with CRLF on Windows. .gitattributes
    // would normalize on commit anyway, but normalizing here keeps the working
    // tree byte-identical to what lands and stops Prettier from reflowing it.
    const raw = fs.readFileSync(sourcePath, 'utf-8').replace(/\r\n/g, '\n');
    const result = convertFile(sourcePath, raw);
    if (result.skipped || result.output === null) {
      console.log(`    skip  ${fileName}: ${result.reason}`);
      continue;
    }

    const errors = validateOutput(result.output, result.config!);
    if (errors.length) {
      fail(
        `${modId}/${fileName} failed validation:\n  - ${errors.join('\n  - ')}`,
      );
    }

    if (!dryRun) {
      fs.writeFileSync(
        path.join(outDir, result.config!.outputFile),
        result.output,
        'utf-8',
      );
    }
    written.push(result.config!.outputFile);
    console.log(`    done  ${fileName}`);
  }

  return { id: modId, parentId, dir: outDir, files: written };
}

/**
 * Keeps a generated regulation mod that upstream has retired.
 *
 * Showdown stores a regulation as a delta over the immediately newer
 * regulation. When that older regulation disappears upstream, its local delta
 * is still valid; only its `inherit` target must move one layer down the
 * preserved chain (for example, M-A: champions -> championsregmb).
 */
function preserveMod(
  modId: string,
  parentId: string | null,
  dryRun: boolean,
): ConvertedMod {
  const dir = outputDirFor(modId);
  if (!fs.existsSync(dir)) {
    fail(
      `Cannot preserve retired mod "${modId}": generated directory ` +
        `${relativeImport(VGC_DIR, dir)} does not exist.`,
    );
  }

  const files = fs
    .readdirSync(dir)
    .filter((entry) => GENERATED_MOD_FILES.has(entry))
    .sort();
  if (!files.length) {
    fail(
      `Cannot preserve retired mod "${modId}": no generated data files ` +
        `were found in ${relativeImport(VGC_DIR, dir)}.`,
    );
  }

  const scriptFile = path.join(dir, 'scripts.ts');
  if (!parentId || !fs.existsSync(scriptFile)) {
    fail(
      `Cannot preserve retired mod "${modId}": it needs a generated ` +
        `scripts.ts with an inheritance target.`,
    );
  }

  const source = fs.readFileSync(scriptFile, 'utf-8');
  const match = /^(\s*inherit\s*:\s*)(['"])([^'"]+)\2/m.exec(source);
  if (!match) {
    fail(
      `Cannot preserve retired mod "${modId}": ${relativeImport(VGC_DIR, scriptFile)} ` +
        `does not declare inherit.`,
    );
  }

  const rewritten = source.replace(
    match[0],
    `${match[1]}${match[2]}${parentId}${match[2]}`,
  );
  console.log(
    `\n  archive ${modId} -> ${relativeImport(VGC_DIR, dir)}/ ` +
      `(inherit: ${match[3]} -> ${parentId})`,
  );
  if (!dryRun && rewritten !== source) {
    fs.writeFileSync(scriptFile, rewritten, 'utf-8');
  }

  return { id: modId, parentId, dir, files };
}

/**
 * Removes generated files this run did not produce, so a file deleted upstream
 * does not linger and keep being registered.
 */
function pruneStale(
  mod: ConvertedMod,
  keep: Set<string>,
  dryRun: boolean,
): void {
  if (!fs.existsSync(mod.dir)) return;
  for (const entry of fs.readdirSync(mod.dir)) {
    if (!GENERATED_MOD_FILES.has(entry) || keep.has(entry)) continue;
    console.log(`    prune ${entry} (no longer produced upstream)`);
    if (!dryRun) fs.rmSync(path.join(mod.dir, entry), { force: true });
  }
}

// ---------------------------------------------------------------------------
// Registry emission
// ---------------------------------------------------------------------------

/** Maps a generated file to the const it exports and the key Dex.mod() wants. */
const MOD_DATA_KEYS: Record<string, { exportName: string; dataKey: string }> = {
  'abilities.ts': { exportName: 'Abilities', dataKey: 'Abilities' },
  'conditions.ts': { exportName: 'Conditions', dataKey: 'Conditions' },
  'formats-data.ts': { exportName: 'FormatsData', dataKey: 'FormatsData' },
  'items.ts': { exportName: 'Items', dataKey: 'Items' },
  'learnsets.ts': { exportName: 'Learnsets', dataKey: 'Learnsets' },
  'moves.ts': { exportName: 'Moves', dataKey: 'Moves' },
  'pokedex.ts': { exportName: 'Pokedex', dataKey: 'Species' },
  'rulesets.ts': { exportName: 'Rulesets', dataKey: 'Rulesets' },
  'scripts.ts': { exportName: 'Scripts', dataKey: 'Scripts' },
};

function pascal(modId: string): string {
  return modId.charAt(0).toUpperCase() + modId.slice(1);
}

function serializeFormat(format: UpstreamFormat): string {
  const lines: string[] = ['  {'];
  for (const [key, value] of Object.entries(format)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      lines.push(
        `    ${key}: [${value.map((v) => JSON.stringify(v)).join(', ')}],`,
      );
    } else {
      lines.push(`    ${key}: ${JSON.stringify(value)},`);
    }
  }
  lines.push('  },');
  return lines.join('\n');
}

function emitRegistry(
  mods: ConvertedMod[],
  formats: UpstreamFormat[],
  provenance: Provenance,
  dryRun: boolean,
): void {
  const imports: string[] = [];
  const modEntries: string[] = [];

  for (const mod of mods) {
    const alias = pascal(mod.id);
    const pairs: string[] = [];

    for (const file of mod.files) {
      const meta = MOD_DATA_KEYS[file];
      if (!meta) continue;
      const local = `${alias}${meta.exportName}`;
      const from = relativeImport(
        MOD_DIR,
        path.join(mod.dir, file.replace(/\.ts$/, '')),
      );
      imports.push(`import { ${meta.exportName} as ${local} } from '${from}';`);
      pairs.push(`      ${meta.dataKey}: ${local},`);
    }

    modEntries.push(
      `  {\n    id: '${mod.id}',\n    data: {\n${pairs.join('\n')}\n    },\n  },`,
    );
  }

  const header = [
    '/**',
    ' * AUTO-GENERATED by `pnpm add-regulation`. Do not edit by hand.',
    ' *',
    ` * Upstream : smogon/pokemon-showdown@${provenance.upstreamCommit.slice(0, 9)} (${provenance.upstreamCommittedAt})`,
    ` * Built for: @pkmn/sim ${provenance.pkmnSimVersion}`,
    ' *',
    ' * Regenerate with:',
    ' *   pnpm add-regulation "<upstream format name>"',
    ' */',
  ].join('\n');

  const body = [
    header,
    [...new Set(imports)].sort().join('\n'),
    '',
    'export interface ChampionsModRegistration {',
    "  /** Mod id as the sim knows it, e.g. 'championsregma'. */",
    '  id: string;',
    '  /** Data tables handed to Dex.mod(). */',
    '  data: Record<string, unknown>;',
    '}',
    '',
    '/**',
    ' * Ordered parents-first: a mod whose Scripts declare `inherit` needs its',
    " * parent already present in the sim's dex registry when it is registered.",
    ' */',
    'export const CHAMPIONS_MODS: readonly ChampionsModRegistration[] = [',
    modEntries.join('\n'),
    '];',
    '',
    '/** Format entries, copied verbatim from upstream `config/formats.ts`. */',
    'export const CHAMPIONS_FORMATS = [',
    formats.map(serializeFormat).join('\n'),
    '] as const;',
    '',
  ].join('\n');

  if (!dryRun) fs.writeFileSync(REGISTRY_FILE, body, 'utf-8');
  console.log(`\n  done  ${relativeImport(VGC_DIR, REGISTRY_FILE)}`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(): void {
  const argv = process.argv.slice(2);
  const dryRun = argv.includes('--dry-run');

  const valueOf = (flag: string): string | undefined => {
    const i = argv.indexOf(flag);
    return i >= 0 ? argv[i + 1] : undefined;
  };

  const ref = valueOf('--ref') ?? 'master';
  const sourceDir = valueOf('--source');
  const forget = valueOf('--forget');
  // --list takes an OPTIONAL substring, so distinguish "absent" from "empty",
  // and do not swallow a following flag as if it were the filter.
  const rawList = valueOf('--list');
  const listFilter = argv.includes('--list')
    ? rawList && !rawList.startsWith('--')
      ? rawList
      : ''
    : undefined;
  const FLAGS_WITH_VALUES = ['--ref', '--source', '--forget', '--list'];
  const positional = argv.filter(
    (a, i) => !a.startsWith('--') && !FLAGS_WITH_VALUES.includes(argv[i - 1]),
  );

  // -- Resolve the tracked set ----------------------------------------------
  const tracked = new Set(readTrackedFormats());
  for (const name of positional) tracked.add(name);
  if (forget && !tracked.delete(forget)) {
    fail(
      `--forget "${forget}" is not in the tracked set:\n  ${[...tracked].join('\n  ')}`,
    );
  }
  if (!tracked.size) fail('No formats tracked. Pass an upstream format name.');

  // -- Upstream --------------------------------------------------------------
  console.log(`Ref     : ${ref}`);
  const upstream = resolveUpstream({ sourceDir, ref, cacheDir: CACHE_DIR });
  console.log(
    `Source  : ${upstream.dir}${upstream.fetched ? '' : ' (local, no fetch)'}`,
  );
  console.log(`Commit  : ${upstream.commit} (${upstream.committedAt})`);
  console.log(`Sim     : @pkmn/sim ${pkmnSimVersion()}`);

  // -- Resolve every tracked format against upstream -------------------------
  const upstreamFormats = loadUpstreamFormats(upstream.dir);

  // A format is addressed by its exact upstream name, which nobody can guess
  // when a new regulation drops. --list is how you find the string to pass.
  if (listFilter !== undefined) {
    const needle = (listFilter || 'Champions').toLowerCase();
    const matches = [...upstreamFormats.values()]
      .filter((f) => f.name.toLowerCase().includes(needle))
      .sort((a, b) => a.name.localeCompare(b.name));
    console.log(`\nUpstream formats matching "${needle}":\n`);
    for (const f of matches) {
      const mark = tracked.has(f.name) ? '*' : ' ';
      console.log(
        `  ${mark} ${f.name.padEnd(42)} ${toFormatId(f.name).padEnd(32)} [mod: ${f.mod ?? 'base'}]`,
      );
    }
    console.log(`\n  ${matches.length} match(es); * = already tracked.`);
    console.log('  Add one with:  pnpm add-regulation "<name>"');
    return;
  }

  const localFormats = fs.existsSync(REGISTRY_FILE)
    ? loadGeneratedFormats(REGISTRY_FILE)
    : new Map<string, UpstreamFormat>();
  const archivedFormats = new Set<string>();
  const sourceByFormatId = new Map<string, 'upstream' | 'archive'>();
  const resolved: UpstreamFormat[] = [];

  for (const name of tracked) {
    const formatId = toFormatId(name);
    const upstreamFormat = upstreamFormats.get(formatId);
    if (upstreamFormat) {
      resolved.push(upstreamFormat);
      sourceByFormatId.set(formatId, 'upstream');
      continue;
    }

    const localFormat = localFormats.get(formatId);
    if (localFormat) {
      resolved.push(localFormat);
      archivedFormats.add(localFormat.name);
      sourceByFormatId.set(formatId, 'archive');
      continue;
    }

    fail(
      `Format "${name}" no longer exists upstream at ${ref}, and no ` +
        `matching entry exists in the local generated registry.\n` +
        `  Nothing was written. Keep the historical generated registry or ` +
        `remove the format explicitly with --forget if it is truly retired.\n` +
        `  To see what upstream offers:\n    pnpm add-regulation --list`,
    );
  }
  resolved.sort((a, b) => a.name.localeCompare(b.name));

  // -- Collect the mods those formats need, parents first --------------------
  // Current upstream chains are authoritative for formats it still publishes.
  // Archived formats use their previous local chain, then get reparented below
  // when a newer regulation layer is now available.
  const parentOf = new Map<string, string | null>();
  const localParentOf = new Map<string, string | null>();
  const upstreamModIds = new Set<string>();
  const localModIds = new Set<string>();

  for (const format of resolved) {
    if (!format.mod) continue; // a base-gen format needs no mod of ours
    const formatId = toFormatId(format.name);
    const source = sourceByFormatId.get(formatId);
    const chain =
      source === 'archive'
        ? resolveLocalModChain(format.mod)
        : resolveModChain(upstream.dir, format.mod);
    const target = source === 'archive' ? localParentOf : parentOf;
    for (let i = chain.length - 1; i >= 0; i--) {
      const id = chain[i];
      const parent = i === chain.length - 1 ? null : chain[i + 1];
      recordParent(target, id, parent);
      if (source === 'archive') localModIds.add(id);
      else upstreamModIds.add(id);
    }
  }

  // A retired regulation's delta was authored against the previous root. If
  // upstream has since added an intermediate child mod, put the archived
  // delta after that child so the chain remains semantically correct:
  // champions (M-C) -> championsregmb (M-B) -> championsregma (M-A).
  const allModIds = new Set([...parentOf.keys(), ...localModIds]);
  for (const modId of localModIds) {
    if (parentOf.has(modId)) continue;

    const localParent = localParentOf.get(modId) ?? null;
    const newer = nearestNewerRegulation(modId, allModIds);
    const parent = newer ?? localParent;

    if (!parent) {
      fail(`Archived mod "${modId}" has no parent in the local mod chain.`);
    }
    if (!parentOf.has(parent) && !localModIds.has(parent)) {
      fail(
        `Archived mod "${modId}" points at missing parent "${parent}".`,
      );
    }
    if (
      regulationSuffix(modId) &&
      localParent === ROOT_MOD_ID &&
      !newer &&
      upstreamModIds.has(ROOT_MOD_ID)
    ) {
      fail(
        `Cannot safely preserve archived mod "${modId}": its local delta ` +
          `was based on "${ROOT_MOD_ID}", but no newer intermediate ` +
          `regulation mod is available. Add regulations sequentially so each ` +
          `archived delta has its immediate parent.`,
      );
    }
    recordParent(parentOf, modId, parent);
  }

  // Topological order, with a deterministic preference for newer regulation
  // layers near the root. Dex.mod() requires every parent to exist first.
  const ordered: string[] = [];
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const visit = (id: string): void => {
    if (visited.has(id)) return;
    if (visiting.has(id)) fail(`Circular combined mod chain at "${id}".`);
    visiting.add(id);
    const parent = parentOf.get(id);
    if (parent) {
      if (!parentOf.has(parent)) {
        fail(`Mod "${id}" has unresolved parent "${parent}".`);
      }
      visit(parent);
    }
    visiting.delete(id);
    visited.add(id);
    ordered.push(id);
  };
  [...parentOf.keys()].sort(compareModIds).forEach(visit);

  if (!ordered.length) fail('No Showdown mods resolved from the tracked formats.');
  console.log(`\nFormats : ${resolved.length} tracked`);
  if (archivedFormats.size) {
    console.log(`Archived: ${[...archivedFormats].sort().join(' | ')}`);
  }
  console.log(`Mods    : ${ordered.join(' -> ')}`);

  // -- Convert each mod ------------------------------------------------------
  const converted: ConvertedMod[] = [];
  for (const modId of ordered) {
    const parent = parentOf.get(modId) ?? null;
    converted.push(
      upstreamModIds.has(modId)
        ? convertMod(upstream, modId, parent, dryRun)
        : preserveMod(modId, parent, dryRun),
    );
  }

  // -- Species backfill, attached to the root mod ----------------------------
  const rootMod = converted[0];
  const knownIds = new Set(Object.keys(Dex.data.Pokedex));
  const delta = buildPokedexDelta(upstream.dir, knownIds);
  const pokedexResult = convertFile(
    path.join(rootMod.dir, 'pokedex.ts'),
    delta.source,
  );
  if (pokedexResult.skipped || pokedexResult.output === null) {
    fail(`Pokedex backfill conversion failed: ${pokedexResult.reason}`);
  }
  if (!dryRun) {
    fs.writeFileSync(
      path.join(rootMod.dir, 'pokedex.ts'),
      pokedexResult.output,
      'utf-8',
    );
  }
  rootMod.files.push('pokedex.ts');

  // The converter drops cosmetic-form stubs (partial entries that
  // ModdedSpeciesData rejects; the base species carries them via
  // `cosmeticFormes`). Report what actually landed rather than what we offered,
  // so .source.json cannot overstate the backfill.
  // Filtering the offered ids against the output — rather than re-scanning it
  // for top-level keys — keeps this independent of the emitted indentation, and
  // no nested property shares a name with a species id.
  const emitted = delta.added.filter((id) =>
    new RegExp(`^[ \\t]+${id}: \\{`, 'm').test(pokedexResult.output!),
  );
  const stripped = delta.added.length - emitted.length;
  console.log(
    `\n  done  pokedex.ts backfill: ${emitted.length} species missing from ` +
      `@pkmn/sim ${pkmnSimVersion()}` +
      (stripped > 0 ? ` (+${stripped} cosmetic stubs dropped)` : ''),
  );

  // -- Barrels, pruning, registry, provenance --------------------------------
  for (const mod of converted) {
    pruneStale(mod, new Set(mod.files), dryRun);
    if (!dryRun) {
      const generatedIndex = generateIndex(mod.files);
      const publicExports =
        mod.id === ROOT_MOD_ID
          ? "export { initChampionsMod, listChampionsFormatIds } from './registry.js';\n"
          : '';
      fs.writeFileSync(
        path.join(mod.dir, 'index.ts'),
        generatedIndex + publicExports,
        'utf-8',
      );
    }
  }

  const provenance: Provenance = {
    generator: 'apps/api/scripts/add-regulation',
    upstreamRepo: 'smogon/pokemon-showdown',
    upstreamRef: ref,
    upstreamCommit: upstream.commit,
    upstreamCommittedAt: upstream.committedAt,
    pkmnSimVersion: pkmnSimVersion(),
    trackedFormats: resolved.map((f) => f.name),
    archivedFormats: [...archivedFormats].sort(),
    mods: ordered,
    pokedexBackfill: { count: emitted.length, species: emitted },
  };

  emitRegistry(converted, resolved, provenance, dryRun);
  if (!dryRun) {
    fs.writeFileSync(
      PROVENANCE_FILE,
      `${JSON.stringify(provenance, null, 2)}\n`,
      'utf-8',
    );
  }
  console.log(`  done  ${relativeImport(VGC_DIR, PROVENANCE_FILE)}`);

  const summary = resolved
    .map(
      (f) =>
        `  ${toFormatId(f.name).padEnd(32)} ${f.name}  [mod: ${f.mod ?? 'base'}]`,
    )
    .join('\n');
  console.log(
    `\n${dryRun ? '(dry run - nothing written)' : 'Generated.'} ` +
      `Formats now registered:\n${summary}`,
  );
  if (!dryRun) {
    console.log('\nReview the diff, run `pnpm type-check`, then commit.');
  }
}

main();
