// Domain types for the pack registry. Local to the module on purpose — apps/api
// must never import @boffmedia/shared (it widens tsc's rootDir and moves the
// build output), and the same reasoning applies to @boffmedia/pack-schema's
// TypeScript types. The zod schema itself IS imported, as compiled CJS, because
// validation has to be the same code the dashboard runs.

import type { GameType, PackAccessKind, PackLoader } from '@/_db/schema/Packs';

export type { GameType, PackAccessKind, PackLoader };

/** What a launcher is told about a pack it can see. Never includes the password
 *  hash, the ACL, or unpublished versions. */
export interface LauncherPackView {
  id: string;
  slug: string;
  name: string;
  /** Resolved, never null — the API translates a NULL column to 'minecraft' so
   *  clients never re-implement the default. */
  gameType: GameType;
  summary: string | null;
  iconUrl: string | null;
  description?: string;
  gallery?: StoredPackGalleryImage[];
  accessKind: PackAccessKind;
  /** Present only for "server packs" — the Quick Play target. */
  server?: StoredPackServer;
  latestVersion: {
    id: string;
    name: string;
    /** Null for non-minecraft packs. */
    minecraft: string | null;
    loader: PackLoader | null;
    loaderVersion: string | null;
    fileCount: number;
    worldCount: number;
    /** How many things the player can switch on or off in this version.
     *
     *  A COUNT and not the model: the library card only has to answer "does this
     *  pack let me choose anything?", and shipping every group's features on
     *  every card of a 40-pack library is a lot of payload to answer a yes/no.
     *  The full model arrives with the manifest, at install time, which is when
     *  the player is actually choosing. */
    optionalFeatureCount: number;
    /** Present for emulator packs — the library sidebar's system mapping. */
    emulatorKind?: 'mgba' | 'melonds' | null;
    createdAt: string;
  } | null;
}

/**
 * What a stranger sees on a pack's shareable page.
 *
 * PUBLIC PACKS ONLY, and that is the whole access rule: `password` and
 * `allowlist` exist precisely so a pack's composition is not public, so those
 * 404 rather than getting a reduced page. One rule, nothing to get subtly wrong
 * later, and no disclosure of the existence or the name of a private pack.
 *
 * Deliberately NOT the manifest. This is a shop window, not an install source:
 * no download URLs, no blob hashes, no `files[]`. What it carries is what
 * someone deciding whether to install would want — what the pack is, what it
 * runs on, and what it lets them choose.
 */
export interface PublicPackView {
  slug: string;
  name: string;
  summary: string | null;
  description: string | null;
  iconUrl: string | null;
  gallery: StoredPackGalleryImage[];
  /** Present only for server packs — the host, never the port, because the page
   *  is a description and not something anything connects from. */
  serverHost: string | null;
  version: {
    name: string;
    minecraft: string | null;
    loader: PackLoader | null;
    loaderVersion: string | null;
    fileCount: number;
    createdAt: string;
  } | null;
  /** The optional-content model, exactly as `@boffmedia/ui`'s OptionalChooser
   *  renders it in `readOnly` mode — so the page and the launcher show the same
   *  thing from one component. Effective state is the AUTHOR's default here:
   *  nobody is installed, so there are no player choices to reflect. */
  optionalGroups: unknown[];
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
  /** Null for non-minecraft packs. */
  minecraft: string | null;
  loader: PackLoader | null;
  loaderVersion: string | null;
  fileCount: number;
  worldCount: number;
  emulatorKind?: 'mgba' | 'melonds' | null;
  published: boolean;
  notes: string | null;
  createdAt: string;
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
    | { kind: 'user-provided'; hint: string }
    // The romhack case: produced on the client from a clean file plus a patch,
    // both of which are other entries in files[]. The server never hosts the
    // result, which is exactly why it was missing here and why an emulator
    // pack's manifest did not type against its own stored shape.
    | {
        kind: 'patched';
        base: string;
        patch: string;
        format: 'bps' | 'ups';
      };
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
    | { kind: 'override'; blobSha512: string }
    | { kind: 'user-provided'; hint: string };
  sizeBytes: number;
  sha512: string;
}

/**
 * Who a launcher request is. The Boffmedia account is the principal — packs,
 * events, entitlements and downloads need no Minecraft identity at all.
 *
 * `mcUuid` is carried only so Minecraft-specific behaviour (legacy pack_acl
 * pre-grants, server allowlisting) still has it, and is absent for an account
 * that has never linked Minecraft.
 */
export interface DesktopPrincipal {
  userId: number;
  username: string;
  mcUuid?: string | null;
  /** The `launcher_token_version` embedded in the session at mint time. The
   *  guard compares it against the account's current value to reject revoked
   *  sessions. Absent on tokens minted before revocation existed (treated as 0). */
  tokenVersion?: number;
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
  INVITE_REVOKED: 'invite.revoked',
  DESKTOP_AUTH: 'desktop.auth',
  DESKTOP_DENIED: 'desktop.denied',
  MANIFEST_SERVED: 'manifest.served',
  FILE_SERVED: 'file.served',
} as const;

export type AuditAction = (typeof AUDIT)[keyof typeof AUDIT];
