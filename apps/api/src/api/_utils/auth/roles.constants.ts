// Deliberately duplicated from `packages/shared/src/roles.ts` rather than imported: pulling
// that package into the API's compilation widens tsc's rootDir to the monorepo root, which
// moves the build output from `dist/main.js` to `dist/apps/api/src/main.js` and breaks
// `nest start`. Keep the two files in step by hand.
export const USER_ROLES = {
  BOFF_ADMIN: 'BOFF_ADMIN',
  // Boffmedia admin sub-roles (can also hold BOFF_ADMIN for backward compatibility).
  // These allow fine-grained access within the admin console.
  BOFF_ADMIN_CONTENT: 'BOFF_ADMIN_CONTENT', // Events, tournaments, games, achievements, moderation, content
  BOFF_ADMIN_RELEASE: 'BOFF_ADMIN_RELEASE', // Desktop builds, pack releases
  ROTOM_ADMIN: 'ROTOM_ADMIN',
  ROTOM_FURRET: 'ROTOM_FURRET',
  // Opens /smartrotom/gobierno. The three GOB_* ranks are titles, not extra access —
  // an officer's rank is the highest one they hold.
  GOBIERNO: 'GOBIERNO',
  GOB_AGENTE: 'GOB_AGENTE',
  GOB_INSPECTOR: 'GOB_INSPECTOR',
  GOB_ALCALDE: 'GOB_ALCALDE',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

// Highest first — the officer's rank is the first of these they hold.
export const GOBIERNO_RANKS = [
  { role: USER_ROLES.GOB_ALCALDE, label: 'Alcalde', prefix: 'A' },
  { role: USER_ROLES.GOB_INSPECTOR, label: 'Inspector', prefix: 'I' },
  { role: USER_ROLES.GOB_AGENTE, label: 'Agente', prefix: 'G' },
] as const;

/**
 * The roles that make an account an administrative one, and therefore the roles
 * that MUST carry a second factor (see `auth/two-factor`).
 *
 * Includes:
 * - BOFF_ADMIN: full admin (publishes packs/desktop releases, moderates content, manages events)
 * - BOFF_ADMIN_RELEASE: can publish desktop releases to all users (critical access)
 * - BOFF_ADMIN_CONTENT: can moderate content and manage events (reaches all users)
 * - ROTOM_ADMIN: runs the in-game economy and player administration
 *
 * Sub-roles (BOFF_ADMIN_*) require 2FA to prevent privilege escalation and ensure
 * accountability for high-impact changes (especially releases that reach every player).
 *
 * The GOB_* ranks are deliberately absent: they are titles inside the
 * SmartRotom fiction, not access to the platform.
 */
export const ADMIN_ROLES: readonly UserRole[] = [
  USER_ROLES.BOFF_ADMIN,
  USER_ROLES.BOFF_ADMIN_CONTENT,
  USER_ROLES.BOFF_ADMIN_RELEASE,
  USER_ROLES.ROTOM_ADMIN,
];

/** True when the account holds a role that requires two-factor authentication. */
export const holdsAdminRole = (roles: readonly string[] | undefined): boolean =>
  Boolean(roles?.some((r) => ADMIN_ROLES.includes(r as UserRole)));
