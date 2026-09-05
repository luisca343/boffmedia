#!/usr/bin/env node
/**
 * X9. Versioning and changelog discipline.
 *
 * The state this replaces: no CHANGELOG, no git tags, no changesets, and a
 * desktop release whose "what's new" was a free-text box in a
 * `workflow_dispatch` form. Whatever the person releasing typed into that box
 * WAS the release note — it existed nowhere else, so there was nothing to
 * review before the release and nothing to read after it. Meanwhile the app
 * version lives in three files that nothing checked against each other.
 *
 * Deliberately NOT changesets. Changesets is built for publishing many
 * packages to a registry; this repo publishes ONE user-facing artifact (the
 * Boffmedia App) and deploys two services from immutable run-number image tags.
 * A per-package version bump ceremony would be overhead with no reader. What
 * was actually missing is smaller: one file users' release notes come from, and
 * a check that the three version fields agree.
 *
 * FOUR MODES:
 *
 *   --check-versions
 *       apps/desktop/package.json, src-tauri/tauri.conf.json and
 *       src-tauri/Cargo.toml must all carry the same version. Runs in the lint
 *       chain. tauri.conf.json is what the release workflow verifies against
 *       the requested tag, so a Cargo.toml that has drifted ships a binary
 *       reporting a version the feed does not know.
 *
 *   --check <version>
 *       CHANGELOG.md must have a section for this version, and it must not be
 *       empty. Runs in desktop-release.yml BEFORE the 20-minute Windows build,
 *       so a release without notes fails in ten seconds rather than at upload.
 *
 *   --notes <version>
 *       Print that section's body. The release workflow uses it when the
 *       `notes` input is left blank, which makes CHANGELOG.md the default
 *       source of what users see in the update banner.
 *
 *   --draft [<since>]
 *       Group the conventional commits since <since> (a tag, or the previous
 *       version's tag by default) under Keep a Changelog headings, for a human
 *       to edit into the Unreleased section. A DRAFT: commit subjects are
 *       written for developers and release notes are not, so this is a starting
 *       point, never the thing that ships.
 */
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CHANGELOG = join(ROOT, 'CHANGELOG.md');

const argv = process.argv.slice(2);
const mode = argv[0];

function die(msg) {
  console.error(`FAIL -- ${msg}`);
  process.exit(1);
}

// -- version sources --------------------------------------------------------

function desktopVersions() {
  const pkg = JSON.parse(
    readFileSync(join(ROOT, 'apps/desktop/package.json'), 'utf8'),
  ).version;
  const conf = JSON.parse(
    readFileSync(join(ROOT, 'apps/desktop/src-tauri/tauri.conf.json'), 'utf8'),
  ).version;
  // The FIRST `version = "x"` after `[package]`, so a dependency's pinned
  // version can never be read as the crate's own.
  const cargoText = readFileSync(
    join(ROOT, 'apps/desktop/src-tauri/Cargo.toml'),
    'utf8',
  );
  const pkgSection = cargoText.slice(cargoText.indexOf('[package]'));
  const cargoMatch = pkgSection.match(/^version\s*=\s*"([^"]+)"/m);
  if (!cargoMatch) die('apps/desktop/src-tauri/Cargo.toml: no version under [package].');
  return {
    'apps/desktop/package.json': pkg,
    'apps/desktop/src-tauri/tauri.conf.json': conf,
    'apps/desktop/src-tauri/Cargo.toml': cargoMatch[1],
  };
}

// -- CHANGELOG parsing ------------------------------------------------------

/**
 * Sections keyed by the version in their `## [x.y.z] - date` heading.
 * `Unreleased` is kept under that literal key.
 */
function changelogSections() {
  let text;
  try {
    text = readFileSync(CHANGELOG, 'utf8');
  } catch {
    die('CHANGELOG.md is missing. Every released version needs a section in it.');
  }
  const sections = new Map();
  const lines = text.split('\n');
  let current = null;
  let buffer = [];
  const flush = () => {
    if (current !== null) sections.set(current, buffer.join('\n').trim());
  };
  for (const line of lines) {
    const m = line.match(/^##\s+\[([^\]]+)\]/);
    if (m) {
      flush();
      current = m[1];
      buffer = [];
      continue;
    }
    if (current !== null) buffer.push(line);
  }
  flush();
  if (sections.size === 0) {
    die('CHANGELOG.md has no `## [version]` headings -- its format has changed and this script reads nothing.');
  }
  return sections;
}

// -- modes ------------------------------------------------------------------

if (mode === '--check-versions') {
  const versions = desktopVersions();
  const distinct = new Set(Object.values(versions));
  if (distinct.size !== 1) {
    console.error('FAIL -- the desktop version disagrees across its three sources:\n');
    for (const [file, v] of Object.entries(versions)) console.error(`  ${v.padEnd(12)} ${file}`);
    console.error(
      '\nAll three must match. tauri.conf.json is what desktop-release.yml checks the\n' +
        'requested tag against, so a drifted Cargo.toml ships a binary reporting a\n' +
        'version the update feed has never heard of.\n',
    );
    process.exit(1);
  }
  const version = [...distinct][0];
  const sections = changelogSections();
  // A released version must be documented. Unreleased work in progress is fine
  // -- that is what the Unreleased section is for -- so this only warns.
  if (!sections.has(version)) {
    console.log(
      `i  Desktop version ${version} has no CHANGELOG.md section yet. ` +
        `Add one before releasing it (desktop-release.yml refuses to build without it).\n`,
    );
  }
  console.log(`OK -- desktop version ${version} agrees across all three files.\n`);
  process.exit(0);
}

if (mode === '--check' || mode === '--notes') {
  const version = argv[1];
  if (!version) die(`${mode} needs a version, e.g. ${mode} 0.9.0`);
  const sections = changelogSections();
  const body = sections.get(version);
  if (body === undefined) {
    die(
      `CHANGELOG.md has no section for ${version}.\n` +
        `  Add "## [${version}] - <date>" with what changed, in words a player reads.\n` +
        `  Sections present: ${[...sections.keys()].join(', ')}`,
    );
  }
  if (!body) {
    die(`CHANGELOG.md's section for ${version} is empty. An empty release note is not a release note.`);
  }
  if (mode === '--notes') {
    process.stdout.write(body + '\n');
  } else {
    console.log(`OK -- CHANGELOG.md documents ${version} (${body.split('\n').length} lines).\n`);
  }
  process.exit(0);
}

if (mode === '--draft') {
  const since = argv[1];
  const range = since ? `${since}..HEAD` : 'HEAD';
  let log;
  try {
    log = execFileSync('git', ['log', '--format=%s', ...(since ? [range] : ['-50'])], {
      cwd: ROOT,
      encoding: 'utf8',
    });
  } catch (e) {
    die(`git log failed for range "${range}": ${e.message}`);
  }
  // Conventional-commit type -> the Keep a Changelog heading a reader expects.
  // Types absent from this map (chore, refactor, test, docs, ci) are omitted on
  // purpose: they are true statements about the repository and say nothing to
  // someone deciding whether to update.
  const HEADINGS = {
    feat: 'Added',
    fix: 'Fixed',
    perf: 'Changed',
    revert: 'Removed',
  };
  const grouped = new Map();
  let skipped = 0;
  for (const subject of log.split('\n').filter(Boolean)) {
    const m = subject.match(/^(\w+)(?:\(([^)]*)\))?(!)?:\s*(.+)$/);
    if (!m) {
      skipped++;
      continue;
    }
    const [, type, scope, breaking, rest] = m;
    const heading = breaking ? 'Changed' : HEADINGS[type];
    if (!heading) {
      skipped++;
      continue;
    }
    const entry = `- ${scope ? `**${scope}:** ` : ''}${rest}${breaking ? '  _(breaking)_' : ''}`;
    if (!grouped.has(heading)) grouped.set(heading, []);
    grouped.get(heading).push(entry);
  }
  console.log(`<!-- DRAFT from ${since ? range : 'the last 50 commits'}. Commit subjects are`);
  console.log(`     written for developers; rewrite each line for a player before shipping.`);
  console.log(`     ${skipped} commit(s) omitted as internal (chore/refactor/test/docs/ci). -->\n`);
  for (const heading of ['Added', 'Changed', 'Fixed', 'Removed']) {
    if (!grouped.has(heading)) continue;
    console.log(`### ${heading}\n`);
    for (const line of grouped.get(heading)) console.log(line);
    console.log('');
  }
  process.exit(0);
}

console.error(
  'usage: release-notes.mjs --check-versions | --check <version> | --notes <version> | --draft [<since>]',
);
process.exit(1);
