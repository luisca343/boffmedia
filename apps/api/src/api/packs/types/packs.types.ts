// Domain types for the pack registry. Local to the module on purpose — apps/api
// must never import @boffmedia/shared (it widens tsc's rootDir and moves the
// build output), and the same reasoning applies to @boffmedia/pack-schema's
// TypeScript types. The zod schema itself IS imported, as compiled CJS, because
// validation has to be the same code the dashboard runs.

import type { PackAccessKind, PackLoader } from '@/_db/schema/Packs';

export type { PackAccessKind, PackLoader };

/** What a launcher is told about a pack it can see. Never includes the password
 *  hash, the ACL, or unpublished versions. */
export interface LauncherPackView {
  id: string;
  slug: string;
  name: string;
  summary: string | null;
  iconUrl: string | null;
  accessKind: PackAccessKind;
  latestVersion: {
    id: string;
    name: string;
    minecraft: string;
    loader: PackLoader | null;
    loaderVersion: string | null;
    fileCount: number;
    createdAt: string;
  } | null;
}

/** The admin view: everything, including who has access. */
export interface AdminPackView extends Omit<LauncherPackView, 'latestVersion'> {
  archived: boolean;
  hasPassword: boolean;
  aclCount: number;
  versionCount: number;
  latestVersionId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PackVersionView {
  id: string;
  packId: string;
  name: string;
  minecraft: string;
  loader: PackLoader | null;
  loaderVersion: string | null;
  fileCount: number;
  published: boolean;
  notes: string | null;
  createdAt: string;
}

/** A launcher session, minted only after `hasJoined` proved UUID ownership. */
export interface LauncherPrincipal {
  uuid: string;
  username: string;
}

/** §7.2 step 1 — the serverId the launcher must present to Mojang. */
export interface JoinChallenge {
  serverId: string;
  expiresInSeconds: number;
}

export const AUDIT = {
  PACK_CREATED: 'pack.created',
  PACK_UPDATED: 'pack.updated',
  PACK_ARCHIVED: 'pack.archived',
  VERSION_CREATED: 'version.created',
  VERSION_PUBLISHED: 'version.published',
  ACCESS_GRANTED: 'access.granted',
  ACCESS_REVOKED: 'access.revoked',
  INVITE_CREATED: 'invite.created',
  INVITE_REDEEMED: 'invite.redeemed',
  LAUNCHER_AUTH: 'launcher.auth',
  MANIFEST_SERVED: 'manifest.served',
} as const;

export type AuditAction = (typeof AUDIT)[keyof typeof AUDIT];
