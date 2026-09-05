#!/usr/bin/env node
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const API_SRC = join(ROOT, 'apps/api/src/api');

const OWNERSHIP_GUARDS = ['OwnerOrAdminGuard', 'DesktopOrUserAuthGuard'];
const OPT_OUT = /ownership-ok:/i;

/**
 * A route may also be marked `ownership-review:` — "this one needs a PRODUCT
 * decision, not an engineering one, and nobody has made it yet".
 *
 * Why that exists rather than just leaving the gate red: a gate that is red
 * forever is a gate people stop reading, and the entries below are genuinely
 * undecided (is a player's mining history meant to be visible like the
 * leaderboard? is a caza capture private until the hunt closes?). Left red, the
 * whole lint chain stays red and the next REAL violation hides among them.
 *
 * Why it is not a rubber stamp: the comment alone is not enough. A route counts
 * as under review only if it is ALSO listed here, so deferring a new one means
 * editing this file — a visible diff in a pull request — rather than quietly
 * typing a magic word into a controller. The list is a ratchet: it may shrink
 * freely, and it may only grow deliberately. A stale entry fails the gate too,
 * so a decision that gets made cannot go unrecorded.
 */
const REVIEW_MARKER = /ownership-review:/i;
const REVIEW_ALLOWLIST = new Set([
]);
const BACKSLASH = String.fromCharCode(92);

const USER_OWNING_CONTROLLERS = [
  'boffmedia/users',
  'boffmedia/public-profile',
  'boffmedia/data-export',
  'smartrotom/users',
];

const USER_PARAM_PATTERNS = [
  ':userId',
  ':uuid',
  ':clientId',
  ':handle',
  ':ownerId',
  ':account',
];

function walk(dir, out = []) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    if (['node_modules', '.next', 'dist', 'build'].includes(e.name)) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.controller.ts')) out.push(p);
  }
  return out;
}

function isUserOwningController(filePath) {
  const normalized = filePath.split(BACKSLASH).join('/');
  return USER_OWNING_CONTROLLERS.some(controller =>
    normalized.includes('/api/' + controller + '/')
  );
}

function isPerUserRoute(path, filePath) {
  if (USER_PARAM_PATTERNS.some(pattern => path.includes(pattern))) {
    return true;
  }
  if (path.includes(':id') && isUserOwningController(filePath)) {
    return true;
  }
  return false;
}

function hasOwnershipGuard(guards) {
  return guards.some(guard =>
    OWNERSHIP_GUARDS.some(ownershipGuard => guard.includes(ownershipGuard))
  );
}

// Collect all decorators attached to a handler (before and after HTTP method)
function collectDecoratorBlock(lines, httpMethodLineIndex) {
  const decorators = [];
  const guardStrings = [];

  // Collect decorators BEFORE the HTTP method (going backwards)
  for (let i = httpMethodLineIndex - 1; i >= 0; i--) {
    const line = lines[i].trim();
    if (line === '' || line.startsWith('//') || line.startsWith('/*')) {
      continue;
    }
    if (!line.startsWith('@')) {
      break;
    }
    decorators.unshift(line);
    const guardsMatch = line.match(/@UseGuards\s*\(\s*([^)]+)\s*\)/);
    if (guardsMatch) {
      guardStrings.push(guardsMatch[1]);
    }
  }

  // Collect decorators AFTER the HTTP method (going forwards up to the next @)
  for (let i = httpMethodLineIndex + 1; i < Math.min(httpMethodLineIndex + 20, lines.length); i++) {
    const line = lines[i].trim();
    if (line === '' || line.startsWith('//')) {
      continue;
    }
    if (!line.startsWith('@')) {
      break;
    }
    decorators.push(line);
    const guardsMatch = line.match(/@UseGuards\s*\(\s*([^)]+)\s*\)/);
    if (guardsMatch) {
      guardStrings.push(guardsMatch[1]);
    }
  }

  return {
    decorators,
    guards: guardStrings
      .flatMap(str => str.split(',').map(g => g.trim()))
      .filter(Boolean),
  };
}

/**
 * The comment block that belongs to THIS route, and to no other.
 *
 * It used to be a fixed window — the eight, then ten, lines above the
 * decorator — and that was wrong in the one direction that matters. A route
 * added directly beneath a justified one inherits its neighbour's
 * `ownership-ok:` and is waved straight through. Found by negative-testing
 * this gate: an unguarded `@Get('leak/:uuid')` inserted above a documented
 * route was counted as PROTECTED, which is the exact failure mode
 * (a guard that reports success while checking nothing) this file exists to
 * stop happening elsewhere.
 *
 * So walk backwards only through the lines that are unambiguously attached to
 * this handler — its own decorators, its own comments, blank lines between
 * them — and stop at the first line of real code, which is the previous
 * handler's closing brace. A comment above that brace belongs to the previous
 * route.
 */
function preambleFor(lines, httpMethodLineIndex) {
  const collected = [lines[httpMethodLineIndex]];
  for (let i = httpMethodLineIndex - 1; i >= 0; i--) {
    const line = lines[i].trim();
    if (
      line === '' ||
      line.startsWith('//') ||
      line.startsWith('/*') ||
      line.startsWith('*') ||
      line.startsWith('*/') ||
      line.startsWith('@')
    ) {
      collected.unshift(lines[i]);
      continue;
    }
    break;
  }
  return collected.join('\n');
}

const violations = [];
const underReview = [];
let totalPerUserRoutes = 0;
let protectedRoutes = 0;

for (const file of walk(API_SRC)) {
  const text = readFileSync(file, 'utf8');
  const lines = text.split('\n');

  let classLevelGuards = [];
  for (let i = 0; i < Math.min(50, lines.length); i++) {
    if (lines[i].includes('@Controller') && i > 0) {
      for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
        const guardsMatch = lines[j].match(/@UseGuards\s*\(\s*([^)]+)\s*\)/);
        if (guardsMatch) {
          classLevelGuards = guardsMatch[1]
            .split(',')
            .map(g => g.trim())
            .filter(Boolean);
          break;
        }
        if (lines[j].includes('{')) break;
      }
      break;
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const methodMatch = line.match(/@(Get|Post|Put|Patch|Delete)\s*\(\s*['"]([^'"]*)['"]\s*\)/);
    if (!methodMatch) continue;

    const method = methodMatch[1];
    const path = methodMatch[2];

    if (!isPerUserRoute(path, file)) {
      continue;
    }

    totalPerUserRoutes++;

    const { decorators, guards: routeGuards } = collectDecoratorBlock(lines, i);
    const allGuards = [...classLevelGuards, ...routeGuards];

    if (hasOwnershipGuard(allGuards)) {
      protectedRoutes++;
      continue;
    }

    const preamble = preambleFor(lines, i);
    if (OPT_OUT.test(preamble)) {
      protectedRoutes++;
      continue;
    }

    const rel = relative(ROOT, file).split(BACKSLASH).join('/');

    if (REVIEW_MARKER.test(preamble)) {
      const key = `${rel.replace('apps/api/src/api/', '')}::${method.toUpperCase()} ${path}`;
      if (REVIEW_ALLOWLIST.has(key)) {
        underReview.push({ key, file: rel, line: i + 1, path });
        continue;
      }
      violations.push({
        file: rel,
        line: i + 1,
        method,
        path,
        guards: allGuards,
        note:
          'carries an `ownership-review:` comment but is NOT in REVIEW_ALLOWLIST in ' +
          'scripts/check-ownership-routes.mjs. Deferring a decision is fine; doing it ' +
          'invisibly is not — add it to that list in the same commit.',
      });
      continue;
    }
    violations.push({
      file: rel,
      line: i + 1,
      method,
      path,
      guards: allGuards,
    });
  }
}

console.log(`Checked ${totalPerUserRoutes} per-user routes across all controllers.\n`);

if (underReview.length > 0) {
  console.log(
    `${underReview.length} route(s) awaiting an OWNER DECISION (\`ownership-review:\`). These ` +
      `are open product questions, not oversights — the reasoning is written on each route:\n`,
  );
  for (const r of underReview) {
    console.log(`  ${r.file}:${r.line}  ${r.key.split('::')[1]}`);
  }
  console.log('');
}

// The allowlist is a ratchet in both directions. An entry that matches no
// route carrying the marker is stale — either the route was fixed and the
// entry was never removed, or it moved and the deferral is now silently
// covering nothing. Both mean the list has stopped being a decision record.
const reviewed = new Set(underReview.map((r) => r.key));
const stale = [...REVIEW_ALLOWLIST].filter((k) => !reviewed.has(k));
if (stale.length > 0) {
  console.error(
    `❌ ${stale.length} entr${stale.length === 1 ? 'y' : 'ies'} in REVIEW_ALLOWLIST match no ` +
      `route carrying an \`ownership-review:\` comment:\n`,
  );
  for (const k of stale) console.error(`  ${k}`);
  console.error(
    '\nEither the route was decided and fixed (remove the entry) or it was renamed\n' +
      '(update the entry). An allowlist nobody prunes stops being a decision record.\n',
  );
  process.exit(1);
}

if (violations.length > 0) {
  console.error('❌ Unguarded per-user routes (no ownership guard, no opt-out comment):\n');
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}`);
    console.error(`    ${v.method} ${v.path}`);
    console.error(`    Guards: ${v.guards.join(', ') || '(none)'}`);
    if (v.note) console.error(`    ${v.note}`);
    console.error('');
  }
  console.error(
    'Each per-user route must either:\n' +
    '  (a) have OwnerOrAdminGuard or DesktopOrUserAuthGuard in @UseGuards, or\n' +
    '  (b) check ownership in the service layer AND carry an `ownership-ok:` comment.\n',
  );
  process.exit(1);
} else {
  console.log(
    `✅ All ${totalPerUserRoutes} per-user routes are accounted for` +
      (underReview.length
        ? `: ${totalPerUserRoutes - underReview.length} protected, ${underReview.length} awaiting an owner decision`
        : ' and protected') +
      '.\n',
  );
  process.exit(0);
}
