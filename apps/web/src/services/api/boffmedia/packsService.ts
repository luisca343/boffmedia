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

export interface AdminPack {
  id: string;
  slug: string;
  name: string;
  summary: string | null;
  iconUrl: string | null;
  accessKind: PackAccessKind;
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

export interface CreatePackInput {
  slug: string;
  name: string;
  summary?: string;
  iconUrl?: string;
  accessKind: PackAccessKind;
  password?: string;
}

export interface UpdatePackInput {
  name?: string;
  summary?: string;
  iconUrl?: string;
  accessKind?: PackAccessKind;
  password?: string;
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
