/**
 * Obtains the Pokémon Showdown source tree the generator reads from.
 *
 * By default this sparse-clones smogon/pokemon-showdown into a cache directory
 * and fetches only the four paths the generator needs, which keeps a cold run
 * around a second and a warm run near-instant. `--source` bypasses the network
 * entirely and reads a checkout you already have.
 *
 * Every run records the resolved commit so the generated files can state which
 * upstream revision produced them; without that, an upstream restructure (the
 * kind that renamed the Champions mod out from under us) is invisible in review.
 */
import { execFileSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const REPO_URL = 'https://github.com/smogon/pokemon-showdown.git';

/**
 * The only paths the generator reads. Anything else is wasted transfer.
 *
 * These are gitignore-style patterns for `sparse-checkout --no-cone`: cone mode
 * accepts directories only, and two of the three paths we need are single files.
 */
const SPARSE_PATHS = ['/config/formats.ts', '/data/pokedex.ts', '/data/mods/'];

export interface UpstreamSource {
  /** Absolute path to the repository root. */
  dir: string;
  /** Full commit SHA, or 'unknown' when --source points at a non-git tree. */
  commit: string;
  /** Commit date (YYYY-MM-DD), or 'unknown'. */
  committedAt: string;
  /** The ref that was requested. */
  ref: string;
  /** True when this run touched the network. */
  fetched: boolean;
}

function git(cwd: string, args: string[]): string {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function describe(dir: string, ref: string, fetched: boolean): UpstreamSource {
  let commit = 'unknown';
  let committedAt = 'unknown';
  try {
    commit = git(dir, ['rev-parse', 'HEAD']);
    committedAt = git(dir, ['log', '-1', '--format=%cs']);
  } catch {
    // A --source directory need not be a git checkout; provenance is then
    // recorded as unknown rather than failing the run.
  }
  return { dir, commit, committedAt, ref, fetched };
}

/**
 * Resolves the upstream tree, cloning or fetching into `cacheDir` unless
 * `sourceDir` is given.
 */
export function resolveUpstream(opts: {
  sourceDir?: string;
  ref: string;
  cacheDir: string;
}): UpstreamSource {
  const { sourceDir, ref, cacheDir } = opts;

  if (sourceDir) {
    const dir = path.resolve(sourceDir);
    if (!fs.existsSync(path.join(dir, 'config', 'formats.ts'))) {
      throw new Error(
        `--source "${dir}" does not look like a pokemon-showdown checkout ` +
          `(config/formats.ts not found).`,
      );
    }
    return describe(dir, ref, false);
  }

  const isRepo = fs.existsSync(path.join(cacheDir, '.git'));

  if (!isRepo) {
    fs.rmSync(cacheDir, { recursive: true, force: true });
    fs.mkdirSync(path.dirname(cacheDir), { recursive: true });
    // blob:none + sparse keeps this to a few MB rather than the full history.
    execFileSync(
      'git',
      [
        'clone',
        '--depth', '1',
        '--filter=blob:none',
        '--sparse',
        '--branch', ref,
        REPO_URL,
        cacheDir,
      ],
      { stdio: ['ignore', 'ignore', 'inherit'] },
    );
    git(cacheDir, ['sparse-checkout', 'set', '--no-cone', ...SPARSE_PATHS]);
    return describe(cacheDir, ref, true);
  }

  // Warm cache: move it to the requested ref without re-transferring history.
  git(cacheDir, ['fetch', '--depth', '1', 'origin', ref]);
  git(cacheDir, ['checkout', '--force', 'FETCH_HEAD']);
  git(cacheDir, ['sparse-checkout', 'set', '--no-cone', ...SPARSE_PATHS]);
  return describe(cacheDir, ref, true);
}
