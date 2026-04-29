export const USER_ROLES = {
  BOFF_ADMIN: 'BOFF_ADMIN',
  ROTOM_ADMIN: 'ROTOM_ADMIN',
  ROTOM_FURRET: 'ROTOM_FURRET',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];
