import {
  apiAuthedAutoBinaryPOST,
  apiAuthedAutoDELETE,
  apiAuthedAutoGET,
  apiAuthedAutoPATCH,
  apiAuthedAutoPOST,
} from '@/services/boffAPI';

// The launcher's pack registry (HANDOFF §7), admin half. The launcher itself
// talks to /packs/launcher/* with its own session; nothing here is reachable
// without BOFF_ADMIN.
//
// Types are declared locally rather than imported from @boffmedia/pack-schema:
// these are the API's response shapes, which are not the manifest — the
// manifest is what the LAUNCHER consumes, and conflating the two is how a
// dashboard ends up rendering fields the API never sends.

export type PackAccessKind = 'public' | 'password' | 'allowlist';
export type PackLoader = 'forge' | 'neoforge' | 'fabric-loader' | 'quilt-loader';

/** A pack's Quick Play target — present only for "server packs". Port defaults
 *  to the vanilla 25565 when omitted. */
export interface ServerAddress {
  host: string;
  port?: number;
}

export interface AdminPack {
  id: string;
  slug: string;
  name: string;
  summary: string | null;
  iconUrl: string | null;
  accessKind: PackAccessKind;
  server?: { host: string; port: number } | null;
  archived: boolean;
  hasPassword: boolean;
  aclCount: number;
  versionCount: number;
  latestVersionId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PackVersionRow {
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

export interface AccessRow {
  uuid: string;
  grantedAt: string;
}

export interface InviteRow {
  code: string;
  packId: string;
  createdBy: number | null;
  createdAt: string;
  expiresAt: string | null;
  maxUses: number;
  uses: number;
  revoked: boolean;
}

export interface AuditRow {
  id: number;
  packId: string | null;
  uuid: string | null;
  action: string;
  meta: Record<string, unknown> | null;
  at: string;
}

export interface GalleryImage {
  url: string;
  alt?: string;
}

export interface CreatePackInput {
  slug: string;
  name: string;
  summary?: string;
  description?: string;
  iconUrl?: string;
  gallery?: GalleryImage[];
  accessKind: PackAccessKind;
  password?: string;
  server?: ServerAddress;
}

export interface BundledWorld {
  folder: string;
  source: {
    kind: 'override';
    blobSha512: string;
  };
  sizeBytes: number;
  sha512: string;
}

export interface UpdatePackInput {
  name?: string;
  summary?: string;
  description?: string;
  iconUrl?: string;
  gallery?: GalleryImage[];
  accessKind?: PackAccessKind;
  password?: string;
  /** `null` clears it (back to a client pack); an object sets it. */
  server?: ServerAddress | null;
  archived?: boolean;
}

export interface CreateVersionInput {
  name: string;
  minecraft: string;
  loader?: PackLoader;
  loaderVersion?: string;
  notes?: string;
  /** PackFile[] — the API validates this with @boffmedia/pack-schema. */
  files: unknown[];
  worlds?: BundledWorld[];
}

// The catalog vocabulary is shared with apps/launcher, which browses mods too
// but reaches Modrinth directly instead of through these routes. It lives in
// @boffmedia/ui next to the <ModBrowser> that renders it; a second copy here
// is how the two ends start disagreeing about a field. Re-exported so existing
// `from '@/services/api/boffmedia/packsService'` imports keep working.
export type {
  CatalogCategory,
  CatalogLoader,
  CatalogProjectType,
  CatalogSort,
  ModDependency,
  ModFile,
  ModPlatform,
  ModProject,
  ModSearchHit,
  ModSearchInput,
  ModSearchPage,
  ResolveSource,
  ResolvedFile,
  SideSupport,
} from '@boffmedia/ui';

import type {
  CatalogCategory,
  CatalogLoader,
  CatalogProjectType,
  ModFile,
  ModPlatform,
  ModProject,
  ModSearchHit,
  ModSearchInput,
  ModSearchPage,
  ResolveSource,
  ResolvedFile,
} from '@boffmedia/ui';

export interface GameVersion {
  id: string;
  type: 'release' | 'snapshot' | 'old_beta' | 'old_alpha';
  releaseTime: string;
  latest: boolean;
}

export interface LoaderVersion {
  version: string;
  stable: boolean;
  latest: boolean;
  recommended: boolean;
}

function queryString(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === '') continue;
    search.set(key, String(value));
  }
  const encoded = search.toString();
  return encoded ? `?${encoded}` : '';
}

export class PacksService {
  static list(includeArchived = false) {
    return apiAuthedAutoGET<AdminPack[]>(
      `/packs/admin${includeArchived ? '?archived=true' : ''}`,
    );
  }

  static create(input: CreatePackInput) {
    return apiAuthedAutoPOST<{ id: string }>('/packs/admin', input);
  }

  static update(id: string, input: UpdatePackInput) {
    return apiAuthedAutoPATCH<void>(`/packs/admin/${id}`, input);
  }

  // ── Versions ─────────────────────────────────────────────────────────────

  static versions(packId: string) {
    return apiAuthedAutoGET<PackVersionRow[]>(`/packs/admin/${packId}/versions`);
  }

  static createVersion(packId: string, input: CreateVersionInput) {
    return apiAuthedAutoPOST<{ id: string }>(`/packs/admin/${packId}/versions`, input);
  }

  /** The only call that returns a version's `files` — the list endpoint omits
   *  them. This is what "clone" and "edit draft" start from. */
  static versionDetail(packId: string, versionId: string) {
    return apiAuthedAutoGET<PackVersionRow & { files: unknown[] }>(
      `/packs/admin/${packId}/versions/${versionId}`,
    );
  }

  /** Drafts only: the API refuses to rewrite a published version, because
   *  launchers have already installed against its manifest. */
  static updateVersion(packId: string, versionId: string, input: CreateVersionInput) {
    return apiAuthedAutoPATCH<void>(`/packs/admin/${packId}/versions/${versionId}`, input);
  }

  static deleteVersion(packId: string, versionId: string) {
    return apiAuthedAutoDELETE<void>(`/packs/admin/${packId}/versions/${versionId}`);
  }

  /** Publishing also makes this the pack's latest version — one step, so the
   *  two can never disagree. */
  static publishVersion(packId: string, versionId: string) {
    return apiAuthedAutoPOST<void>(
      `/packs/admin/${packId}/versions/${versionId}/publish`,
      {},
    );
  }

  // ── Override blobs ───────────────────────────────────────────────────────

  /** Is this content already stored? Blobs are content-addressed, so a hit
   *  means the exact bytes are there and the upload can be skipped. */
  static blobStatus(sha512: string) {
    return apiAuthedAutoGET<{ present: boolean; sizeBytes: number | null }>(
      `/packs/admin/blobs/${sha512}`,
    );
  }

  /** Upload one override file. The returned sha512 is the SERVER's hash of the
   *  bytes it received — that is the value a manifest must reference, never one
   *  computed here, or the launcher's verification fails after download. */
  static uploadBlob(file: Blob) {
    return apiAuthedAutoBinaryPOST<{ sha512: string; size: number }>(
      '/packs/admin/blobs',
      file,
    );
  }

  // ── Mod catalog ──────────────────────────────────────────────────────────

  /** With no `query` this browses the catalog by `sort` — that is what lets the
   *  picker show something before the admin has typed anything. */
  static searchMods(input: ModSearchInput) {
    return apiAuthedAutoGET<ModSearchPage>(
      `/packs/admin/catalog/search${queryString({
        platform: input.platform,
        query: input.query,
        gameVersion: input.gameVersion,
        loader: input.loader,
        page: input.page,
        pageSize: input.pageSize,
        projectType: input.projectType,
        sort: input.sort,
        category: input.category,
      })}`,
    );
  }

  static categories(platform: ModPlatform, projectType: CatalogProjectType = 'mod') {
    return apiAuthedAutoGET<CatalogCategory[]>(
      `/packs/admin/catalog/categories${queryString({ platform, projectType })}`,
    );
  }

  static project(platform: ModPlatform, projectId: string) {
    return apiAuthedAutoGET<ModProject>(`/packs/admin/catalog/${platform}/${projectId}`);
  }

  /** One batched call per platform — this is how a dependency list gets names
   *  and icons instead of bare ids. */
  static projectSummaries(platform: ModPlatform, ids: string[]) {
    return apiAuthedAutoGET<ModSearchHit[]>(
      `/packs/admin/catalog/projects${queryString({ platform, ids: ids.join(',') })}`,
    );
  }

  // ── Version metadata (autocompletion) ────────────────────────────────────

  static minecraftVersions() {
    return apiAuthedAutoGET<GameVersion[]>('/packs/admin/meta/minecraft');
  }

  /** `loader` is the MANIFEST id ("fabric-loader"), not the catalog id. */
  static loaderVersions(loader: PackLoader, minecraft: string) {
    return apiAuthedAutoGET<LoaderVersion[]>(
      `/packs/admin/meta/loader${queryString({ loader, minecraft })}`,
    );
  }

  static curseforgeFiles(
    projectId: string,
    filters: { gameVersion?: string; loader?: CatalogLoader; pageSize?: number } = {},
  ) {
    return apiAuthedAutoGET<ModFile[]>(
      `/packs/admin/catalog/curseforge/${projectId}/files${queryString({
        gameVersion: filters.gameVersion,
        loader: filters.loader,
        pageSize: filters.pageSize,
      })}`,
    );
  }

  static modrinthVersions(
    projectId: string,
    filters: { gameVersion?: string; loader?: CatalogLoader } = {},
  ) {
    return apiAuthedAutoGET<ModFile[]>(
      `/packs/admin/catalog/modrinth/${projectId}/versions${queryString({
        gameVersion: filters.gameVersion,
        loader: filters.loader,
      })}`,
    );
  }

  /** CurseForge publishes only sha1/md5, so the server downloads and hashes the
   *  bytes for `curseforge` and `url` sources — this call can take seconds. */
  static resolveFile(source: ResolveSource) {
    return apiAuthedAutoPOST<ResolvedFile>('/packs/admin/catalog/resolve', { source });
  }

  // ── Access ───────────────────────────────────────────────────────────────

  static access(packId: string) {
    return apiAuthedAutoGET<AccessRow[]>(`/packs/admin/${packId}/access`);
  }

  static grant(packId: string, uuid: string) {
    return apiAuthedAutoPOST<void>(`/packs/admin/${packId}/access`, { uuid });
  }

  static revoke(packId: string, uuid: string) {
    return apiAuthedAutoDELETE<void>(`/packs/admin/${packId}/access/${uuid}`);
  }

  // ── Invites ──────────────────────────────────────────────────────────────

  static invites(packId: string) {
    return apiAuthedAutoGET<InviteRow[]>(`/packs/admin/${packId}/invites`);
  }

  static createInvite(packId: string, maxUses: number, expiresAt?: string) {
    return apiAuthedAutoPOST<{ code: string }>(`/packs/admin/${packId}/invites`, {
      maxUses,
      ...(expiresAt ? { expiresAt } : {}),
    });
  }

  static revokeInvite(code: string) {
    return apiAuthedAutoDELETE<void>(`/packs/admin/invites/${code}`);
  }

  // ── Audit ────────────────────────────────────────────────────────────────

  static audit(packId: string, limit = 50) {
    return apiAuthedAutoGET<AuditRow[]>(`/packs/admin/${packId}/audit?limit=${limit}`);
  }
}
