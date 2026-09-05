#!/usr/bin/env node
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const API_SRC = join(ROOT, 'apps/api/src/api');

const OWNERSHIP_GUARDS = ['OwnerOrAdminGuard', 'DesktopOrUserAuthGuard'];
const OPT_OUT = /ownership-ok:/i;
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

const violations = [];
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

    const preamble = lines.slice(Math.max(0, i - 8), i + 1).join('\n');
    if (OPT_OUT.test(preamble)) {
      protectedRoutes++;
      continue;
    }

    const rel = relative(ROOT, file).split(BACKSLASH).join('/');
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

if (violations.length > 0) {
  console.error('❌ Unguarded per-user routes (no ownership guard, no opt-out comment):\n');
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}`);
    console.error(`    ${v.method} ${v.path}`);
    console.error(`    Guards: ${v.guards.join(', ') || '(none)'}`);
    console.error('');
  }
  console.error(
    'Each per-user route must either:\n' +
    '  (a) have OwnerOrAdminGuard or DesktopOrUserAuthGuard in @UseGuards, or\n' +
    '  (b) check ownership in the service layer AND carry an `ownership-ok:` comment.\n',
  );
  process.exit(1);
} else {
  console.log(`✅ All ${totalPerUserRoutes} per-user routes are protected.\n`);
  process.exit(0);
}
