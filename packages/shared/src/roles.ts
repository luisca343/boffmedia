export const USER_ROLES = {
  BOFF_ADMIN: 'BOFF_ADMIN',
  // Boffmedia admin sub-roles (can also hold BOFF_ADMIN for backward compatibility).
  // These allow fine-grained access within the admin console.
  BOFF_ADMIN_CONTENT: 'BOFF_ADMIN_CONTENT', // Events, tournaments, games, achievements, moderation, content
  BOFF_ADMIN_RELEASE: 'BOFF_ADMIN_RELEASE', // Desktop builds, pack releases
  ROTOM_ADMIN: 'ROTOM_ADMIN',
  ROTOM_FURRET: 'ROTOM_FURRET',
  // Opens /smartrotom/gobierno. The three GOB_* ranks below are titles, not extra access —
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
