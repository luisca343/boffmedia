/**
 * W8 ratchet: an admin-guarded route must say WHICH kind of admin.
 *
 * W8 split BOFF_ADMIN into BOFF_ADMIN_CONTENT and BOFF_ADMIN_RELEASE and
 * narrowed ~90 decorators by hand. Hand-narrowed decorators go stale on the
 * next new controller: a route added later with a plain `@Roles(BOFF_ADMIN)`
 * silently re-widens the thing this finding closed, and nothing about that
 * omission is visible in review.
 *
 * So every `@Roles(...)` naming BOFF_ADMIN must either name a sub-role
 * alongside it, or carry a `SUPERUSER_ONLY_REASON:` comment above it saying
 * why this route is for account/system administration only. The reason is a
 * claim reviewable in a diff, which a bare exemption list is not — the same
 * convention `check-html-sinks.mjs` uses with `xss-ok:`.
 *
 * Read this before changing the file walk below: the previous version of this
 * spec shelled out to `grep -r ... ${apiRoot}` with the path UNQUOTED. This
 * repo lives at "e:\Programación\Ficus Labs\boffmedia", so the space in
 * "Ficus Labs" split the argument and grep exited with an error — which the
 * spec caught and treated as "no matches found — pass". It passed
 * unconditionally on the machine it was written on. It is pure fs here for
 * that reason: no shell, no quoting, no platform-dependent failure that can
 * be mistaken for success.
 */

import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

const SUB_ROLES = ['BOFF_ADMIN_CONTENT', 'BOFF_ADMIN_RELEASE'];
const EXEMPT_MARKER = 'SUPERUSER_ONLY_REASON';
/** How far above a decorator the justifying comment may sit. */
const LOOKBACK = 12;

/** Every *.controller.ts under apps/api/src, excluding specs. */
function controllerFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === 'dist') continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) controllerFiles(full, out);
    else if (entry.endsWith('.controller.ts') && !entry.endsWith('.spec.ts')) {
      out.push(full);
    }
  }
  return out;
}

describe('Roles narrowing ratchet (W8)', () => {
  const srcRoot = join(__dirname, '..', '..', '..');
  const files = controllerFiles(srcRoot);

  it('finds the controllers it is supposed to be checking', () => {
    // Guards the walk itself. If this file ever stops finding controllers --
    // a moved directory, a renamed suffix -- every other assertion below
    // becomes vacuously true, which is exactly how the previous version of
    // this spec passed while checking nothing.
    expect(files.length).toBeGreaterThan(20);
  });

  it('every admin route names a sub-role or justifies being superuser-only', () => {
    const violations: string[] = [];

    for (const file of files) {
      const lines = readFileSync(file, 'utf8').split('\n');

      lines.forEach((line, i) => {
        const match = /@Roles\(([^)]*)\)/.exec(line);
        if (!match) return;

        const roles = match[1];
        if (!roles.includes('BOFF_ADMIN')) return;
        // SmartRotom carries its own admin tiers. Where BOFF_ADMIN appears
        // NEXT TO one of them it is a platform-superuser fallback on a route
        // whose real audience is ROTOM_ADMIN or GOBIERNO -- a different access
        // model from the eleven Boffmedia admin sections W8 is about, and one
        // the content/release split does not describe. Out of scope here
        // rather than silently exempt: narrowing those is its own decision.
        if (roles.includes('ROTOM_ADMIN') || roles.includes('GOBIERNO')) return;
        // Naming a sub-role IS the declaration. Note this must be checked on
        // the captured argument list, not the whole line, or a comment
        // mentioning the constant would satisfy it.
        if (SUB_ROLES.some((r) => roles.includes(r))) return;

        const from = Math.max(0, i - LOOKBACK);
        const justified = lines
          .slice(from, i)
          .some((l) => l.includes(EXEMPT_MARKER));
        if (justified) return;

        violations.push(
          `${file.slice(srcRoot.length + 1)}:${i + 1}  ${line.trim()}`,
        );
      });
    }

    if (violations.length) {
      throw new Error(
        `W8: ${violations.length} admin route(s) declare plain BOFF_ADMIN with no sub-role ` +
          `and no ${EXEMPT_MARKER}: comment.\n\n${violations.join('\n')}\n\n` +
          `Add USER_ROLES.BOFF_ADMIN_CONTENT or USER_ROLES.BOFF_ADMIN_RELEASE alongside it, ` +
          `or write "${EXEMPT_MARKER}: <why>" above the decorator if the route is genuinely ` +
          `account/system administration.\n`,
      );
    }
  });
});
