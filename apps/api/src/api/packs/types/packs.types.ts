// Domain types for the pack registry. Local to the module on purpose — apps/api
// must never import @boffmedia/shared (it widens tsc's rootDir and moves the
// build output), and the same reasoning applies to @boffmedia/pack-schema's
// TypeScript types. The zod schema itself IS imported, as compiled CJS, because
// validation has to be the same code the dashboard runs.

import type { PackAccessKind, PackGameType, PackLoader } from '@/_db/schema/Packs';

export type { PackAccessKind, PackGameType, PackLoader };

/** What a launcher is told about a pack it can see. Never includes the password
 *  hash, the ACL, or unpublished versions. */
export interface LauncherPackView {
  id: string;
  slug: string;
  name: string;
  summary: string | null;
  iconUrl: string | null;
  description?: string;
  gallery?: StoredPackGalleryImage[];
  accessKind: PackAccessKind;
  gameType: PackGameType;
  /** Present only for "server packs" — the Quick Play target. */
  server?: StoredPackServer;
  latestVersion: {
    id: string;
    name: string;
    /** Null for a non-Minecraft version. */
    minecraft: string | null;
    loader: PackLoader | null;
    loaderVersion: string | null;
    fileCount: number;
    worldCount: number;
    createdAt: string;
  } | null;
}

/** The stored shape of `packs.server`. Mirrors PackServer in
 *  @boffmedia/pack-schema (whose TS types must not be imported here). `port` is
 *  optional (a bare SRV host declares none), and `host` is optional too so a
 *  legacy/malformed `{}` row still types — the listing surfaces it as a server
 *  pack with an unavailable status rather than dropping or crashing it. */
export interface StoredPackServer {
  host?: string;
  port?: number;
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
  /** Null for a non-Minecraft version. */
  minecraft: string | null;
  loader: PackLoader | null;
  loaderVersion: string | null;
  /** The EmulatorSpec payload, for emulator packs. */
  emulator?: StoredEmulatorSpec;
  fileCount: number;
  worldCount: number;
  published: boolean;
  notes: string | null;
  createdAt: string;
}

/** The stored shape of `pack_versions.emulator`. Mirrors EmulatorSpec in
 *  @boffmedia/pack-schema (whose TS types must not be imported here). */
export interface StoredEmulatorSpec {
  kind: 'mgba' | 'melonds';
  executable: string;
  rom: string;
  args?: string[];
}

/**
 * The stored shape of one entry in `pack_versions.files`. Structural on purpose:
 * the column is `json().$type<unknown[]>()` and every write went through
 * `PackManifest.safeParse`, so these fields are guaranteed present — but the TS
 * types from @boffmedia/pack-schema must not be imported here (see the header).
 */
export interface StoredPackFile {
  path: string;
  sha512: string;
  fileSize: number;
  source:
    | { kind: 'modrinth'; projectId: string; versionId: string }
    | { kind: 'curseforge'; projectId: number; fileId: number }
    | { kind: 'url'; url: string }
    | { kind: 'override'; blobSha512: string }
    | { kind: 'user-provided'; hint: string };
}

export interface StoredPackGalleryImage {
  url: string;
  alt?: string;
}

export interface StoredBundledWorld {
  folder: string;
  source:
    | { kind: 'modrinth'; projectId: string; versionId: string }
    | { kind: 'curseforge'; projectId: number; fileId: number }
    | { kind: 'url'; url: string }
    | { kind: 'override'; blobSha512: string };
  sizeBytes: number;
  sha512: string;
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
  VERSION_UPDATED: 'version.updated',
  VERSION_DELETED: 'version.deleted',
  VERSION_PUBLISHED: 'version.published',
  ACCESS_GRANTED: 'access.granted',
  ACCESS_REVOKED: 'access.revoked',
  INVITE_CREATED: 'invite.created',
  INVITE_REDEEMED: 'invite.redeemed',
  LAUNCHER_AUTH: 'launcher.auth',
  MANIFEST_SERVED: 'manifest.served',
  FILE_SERVED: 'file.served',
} as const;

export type AuditAction = (typeof AUDIT)[keyof typeof AUDIT];
