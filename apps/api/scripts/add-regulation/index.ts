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
 * them makes that class of drift self-correcting.
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
const MOD_DIR = path.resolve(
  __dirname,
  '../../../packages/battle-core/src/mods/champions',
);
const PROVENANCE_FILE = path.join(MOD_DIR, '.source.json');
const REGISTRY_FILE = path.join(MOD_DIR, 'registry.generated.ts');
const CACHE_DIR = path.join(os.tmpdir(), 'boffmedia-showdown-src');

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
 * files stay diffable across this restructure. Descendants nest under it, named
 * by the part of their id that is not shared with the parent —
 * `championsregma` under parent `champions` becomes `mod/regma/`.
 */
function outputDirFor(modId: string, parentId: string | null): string {
  if (!parentId) return MOD_DIR;
  const suffix = modId.startsWith(parentId)
    ? modId.slice(parentId.length)
    : modId;
  return path.join(MOD_DIR, suffix || modId);
}

function relativeImport(from: string, to: string): string {
  const rel = path.relative(from, to).split(path.sep).join('/');
  return rel.startsWith('.') ? rel : `./${rel}`;
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

  const outDir = outputDirFor(modId, parentId);
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

  const resolved: UpstreamFormat[] = [];

  for (const name of tracked) {
    const format = upstreamFormats.get(toFormatId(name));
    if (!format) {
      fail(
        `Format "${name}" no longer exists upstream at ${ref}.\n` +
          `  It is still tracked, so nothing was written. Either correct the ` +
          `name or drop it with:\n    pnpm add-regulation --forget "${name}"\n` +
          `  To see what upstream offers:\n    pnpm add-regulation --list`,
      );
    }
    resolved.push(format);
  }
  resolved.sort((a, b) => a.name.localeCompare(b.name));

  // -- Collect the mods those formats need, parents first --------------------
  const parentOf = new Map<string, string | null>();
  const ordered: string[] = [];

  for (const format of resolved) {
    if (!format.mod) continue; // a base-gen format needs no mod of ours
    const chain = resolveModChain(upstream.dir, format.mod); // child -> root
    for (let i = chain.length - 1; i >= 0; i--) {
      const id = chain[i];
      const parent = i === chain.length - 1 ? null : chain[i + 1];
      if (!parentOf.has(id)) {
        parentOf.set(id, parent);
        ordered.push(id);
      }
    }
  }

  if (!ordered.length) fail('No Showdown mods resolved from the tracked formats.');
  console.log(`\nFormats : ${resolved.length} tracked`);
  console.log(`Mods    : ${ordered.join(' -> ')}`);

  // -- Convert each mod ------------------------------------------------------
  const converted: ConvertedMod[] = [];
  for (const modId of ordered) {
    converted.push(
      convertMod(upstream, modId, parentOf.get(modId) ?? null, dryRun),
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
      fs.writeFileSync(
        path.join(mod.dir, 'index.ts'),
        generateIndex(mod.files),
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
