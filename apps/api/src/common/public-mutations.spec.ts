import { readdirSync, readFileSync, statSync } from 'fs';
import { join, sep } from 'path';

/**
 * Guard-rail for the `@Public()` trap.
 *
 * The API is secure-by-default: `JwtAuthGuard` is registered as an `APP_GUARD`,
 * so every route needs a session unless it is marked `@Public()`. 31 controllers
 * carry `@Public()` at CLASS level, which turns that default off for everything
 * inside them — and, worse, means a route guard that reads `req.user` sees
 * nothing, because the global guard never ran to populate it. Four confirmed
 * authorization leaks reached production through exactly that door (a card
 * history readable by user id, a public debug controller, invite enumeration,
 * and an unauthenticated health payload).
 *
 * Rather than move `@Public()` onto ~130 individual routes — a large diff whose
 * failure mode is silently 401-ing something that must stay anonymous — this
 * test pins the blast radius: every state-changing route that ends up
 * effectively anonymous must be listed below, with a reason. Adding one without
 * listing it fails the suite.
 *
 * "Effectively anonymous" = a POST/PATCH/PUT/DELETE on a class-level
 * `@Public()` controller with no `@UseGuards`, `@RequireSession` or `@Roles`
 * anywhere in its decorator block, and no class-level `@UseGuards` either.
 */

const API_SRC = join(__dirname, '..');

/**
 * Routes that are deliberately anonymous *and* mutate. Each entry is a decision,
 * not an oversight — keep the reason current if you change one.
 */
const ALLOWED_ANONYMOUS_MUTATIONS: Record<string, string> = {
  // OAuth handshakes: the caller cannot hold a session yet — obtaining one is
  // the entire point of the request.
  'api/auth/auth.controller.ts#googleAuthRedirect': 'OAuth entry point',
  'api/auth/auth.controller.ts#discordAuthRedirect': 'OAuth entry point',
  'api/auth/auth.controller.ts#twitchAuthRedirect': 'OAuth entry point',

  // ShareX posts a per-user upload token in the form body; the handler resolves
  // it and rejects revoked tokens. The token IS the identity, so the check
  // cannot be a guard that reads `req.user`.
  'api/boffmedia/util/sharex/sharex.controller.ts#post':
    'authenticates in-handler via a ShareX upload token',

  // In-game reads implemented as POST so the player uuid travels in the body
  // rather than the URL. They return public player statistics, and the
  // Minecraft plugin is the only caller. They mutate nothing despite the verb.
  'api/smartrotom/achievement/achievement.controller.ts#getUserAchievements':
    'POST-shaped read of public player stats',
  'api/smartrotom/achievement/achievement.controller.ts#getUserAchievementById':
    'POST-shaped read of public player stats',
  'api/smartrotom/achievement/achievement.controller.ts#getUserReplay':
    'POST-shaped read of public player stats',
  'api/smartrotom/misiones/misiones.controller.ts#getQuestsForUser':
    'POST-shaped read of public player stats',
  'api/smartrotom/player/player.controller.ts#getStats':
    'POST-shaped read of public player stats',
  'api/smartrotom/player/player.controller.ts#getTeam':
    'POST-shaped read of public player stats',
};

const VERB = /@(Post|Patch|Put|Delete)\(/;
const SIGNATURE = /\n {2}(?:public\s+)?(?:async\s+)?([A-Za-z0-9_]+)\s*\(/gm;
const AUTH_MARKERS = ['@UseGuards(', '@RequireSession(', '@Roles('];

function controllerFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return controllerFiles(full);
    return entry.endsWith('.controller.ts') ? [full] : [];
  });
}

function anonymousMutations(): string[] {
  const found: string[] = [];

  for (const file of controllerFiles(API_SRC)) {
    const source = readFileSync(file, 'utf8');
    const header = source.split('export class')[0];
    if (!/^@Public\(\)/m.test(header)) continue;

    const classGuarded = header.includes('@UseGuards(');
    const body = source.slice(source.indexOf('export class'));

    // The decorator block for a method is everything between the previous
    // method signature and this one. Taking the region rather than scanning
    // forward from the verb keeps this correct whatever order the decorators
    // are written in, and survives multi-line decorator arguments.
    const signatures = [...body.matchAll(SIGNATURE)];
    signatures.forEach((match, index) => {
      const from = index === 0 ? 0 : (signatures[index - 1].index ?? 0) +
        signatures[index - 1][0].length;
      const region = body.slice(from, match.index);
      if (!VERB.test(region)) return;
      if (classGuarded) return;
      if (AUTH_MARKERS.some((marker) => region.includes(marker))) return;

      const relative = file
        .slice(file.indexOf(`${sep}src${sep}`) + 5)
        .split(sep)
        .join('/');
      found.push(`${relative}#${match[1]}`);
    });
  }

  return found.sort();
}

describe('anonymous mutating routes', () => {
  const found = anonymousMutations();

  it('are all deliberate and documented', () => {
    const undocumented = found.filter(
      (route) => !(route in ALLOWED_ANONYMOUS_MUTATIONS),
    );

    expect(undocumented).toEqual([]);
  });

  it('has no stale allowlist entries', () => {
    // A route that gained a guard should be removed from the list, so the list
    // keeps describing reality rather than accumulating history.
    const stale = Object.keys(ALLOWED_ANONYMOUS_MUTATIONS).filter(
      (route) => !found.includes(route),
    );

    expect(stale).toEqual([]);
  });
});
