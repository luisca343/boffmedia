/**
 * MH Wilds game data service.
 *
 * Read-only catalog data is served from the generated local extraction pack.
 * The API capability remains only for server-owned bestiary records and
 * editorial anatomy overrides.
 *
 * The remaining API endpoints are `@Public()` on the API side, so the calls
 * stay `auth: "optional"` (the seam's default): the launcher attaches a
 * session if the player happens to have one and proceeds anonymously
 * otherwise. Local catalog requests do not use the API capability.
 *
 * The `ApiResponse` envelope and the NON-throwing contract are kept exactly as
 * `@/services/boffAPI` had them. The capability throws `ToolApiError`; catching
 * it here keeps the remaining API-backed hooks on the same non-throwing seam,
 * since every call site was written as `if (res.success && res.data)`.
 */

import { toolApi, ToolApiError } from "@boffmedia/tool-kit";

import type {
  ArmorPiece,
  Charm,
  Decoration,
  MhMonster,
  MhWildsAnatomyOverride,
  Weapon,
} from "./types";
import {
  mhwildsAsset,
  loadMhwildsGearAssetManifest,
  type MhwildsGearAssetManifest,
} from "./bestiary/assets";
import {
  buildLocalWeaponTree,
  flattenLocalCharmRanks,
  joinLocalArmorSetIdentities,
  mhwildsCatalogPath,
  type LocalArmorSetIdentity,
} from "./catalog/local-data";

/** The API's global response envelope, as `@/services/boffAPI` declared it. */
export interface ApiResponse<T = unknown> {
  statusCode: number;
  /** Machine text (English) for logs — never render it to users. */
  message?: string;
  /** Explicitly user-facing; safe to render. */
  userMessage?: string;
  code?: string;
  data?: T;
  error?: string;
  success: boolean;
}

async function get<T>(
  path: string,
  query?: Record<string, string | number | undefined>,
): Promise<ApiResponse<T>> {
  try {
    // The capability returns the body verbatim, envelope included, so the
    // response IS an ApiResponse already.
    return await toolApi().request<ApiResponse<T>>(path, { query });
  } catch (err) {
    if (err instanceof ToolApiError) {
      return {
        success: false,
        statusCode: err.status,
        error: err.message,
        userMessage: err.message,
        code: err.code,
      };
    }
    throw err;
  }
}

async function getLocal<T>(
  file: string,
  locale?: string,
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(mhwildsAsset(mhwildsCatalogPath(locale, file)), {
      cache: "no-store",
    });
    if (!response.ok) {
      return {
        success: false,
        statusCode: response.status,
        error: `Local MH Wilds catalog request failed: ${response.status}`,
      };
    }
    return {
      success: true,
      statusCode: response.status,
      data: (await response.json()) as T,
    };
  } catch (err) {
    return {
      success: false,
      statusCode: 0,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

function weaponAssetPath(
  weapon: { kind?: unknown; type?: unknown; gameId?: unknown },
  manifest: MhwildsGearAssetManifest | null,
): string | null {
  const kind = String(weapon.kind ?? weapon.type ?? "");
  const gameId = weapon.gameId == null ? null : String(weapon.gameId);
  if (!kind || gameId == null) return null;
  return manifest?.weapons?.[kind]?.[gameId] ?? null;
}

function enrichWeapon<T extends { kind?: unknown; type?: unknown; gameId?: unknown }>(
  weapon: T,
  manifest: MhwildsGearAssetManifest | null,
): T & { localAssetPath: string | null; localAssetVersion?: string } {
  return {
    ...weapon,
    localAssetPath: weaponAssetPath(weapon, manifest),
    localAssetVersion: manifest?.version,
  };
}

function enrichWeaponTree(value: unknown, manifest: MhwildsGearAssetManifest): unknown {
  if (Array.isArray(value)) return value.map((item) => enrichWeaponTree(item, manifest));
  if (!value || typeof value !== "object") return value;

  const record = value as Record<string, unknown>;
  const next: Record<string, unknown> = Object.fromEntries(
    Object.entries(record).map(([key, child]) => [
      key,
      enrichWeaponTree(child, manifest),
    ]),
  );
  if (next.gameId != null && (next.kind != null || next.type != null)) {
    next.localAssetPath = weaponAssetPath(next, manifest);
    next.localAssetVersion = manifest.version;
  }
  return next;
}

export class MhWildsService {
  static async getWeapons(locale?: string): Promise<ApiResponse<Weapon[]>> {
    const response = await getLocal<Weapon[]>("weapons.json", locale);
    if (!response.success || !Array.isArray(response.data)) return response;
    const manifest = await loadMhwildsGearAssetManifest();
    return {
      ...response,
      data: response.data.map((weapon) => enrichWeapon(weapon, manifest)),
    };
  }

  static async getArmor(locale?: string): Promise<ApiResponse<ArmorPiece[]>> {
    const [response, identities] = await Promise.all([
      getLocal<ArmorPiece[]>("armor.json", locale),
      getLocal<LocalArmorSetIdentity[]>("armor-sets.json", locale),
    ]);
    if (!response.success || !Array.isArray(response.data)) return response;

    const armor =
      identities.success && Array.isArray(identities.data)
        ? joinLocalArmorSetIdentities(response.data, identities.data)
        : response.data;

    // The local catalog owns the canonical records, while the local pack also
    // owns optional rasters. Join them by stable armor-set game id + slot.
    // A missing entry is explicit so consumers can render a semantic fallback
    // without probing a guaranteed 404.
    const manifest = await loadMhwildsGearAssetManifest();
    if (!manifest?.armor) return { ...response, data: armor };
    return {
      ...response,
      data: armor.map((piece) => {
        const gameId = piece.armorSet?.gameId;
        const directEntry =
          gameId == null ? undefined : manifest.armor?.[String(gameId)];
        // Do not fall back to `armorSet.id`: the extracted pack is keyed by
        // the game's stable id, and an absent join remains an explicit null.
        const entry =
          directEntry &&
          (directEntry.gameId == null ||
            String(directEntry.gameId) === String(gameId))
            ? directEntry
            : undefined;
        const relative = entry?.pieces?.[piece.kind]?.relative;
        return {
          ...piece,
          localAssetPath: relative ?? null,
          localAssetVersion: manifest.version,
        };
      }),
    };
  }

  static async getCharms(locale?: string): Promise<ApiResponse<Charm[]>> {
    const response = await getLocal<unknown>("charms.json", locale);
    if (!response.success) return response as ApiResponse<Charm[]>;
    return { ...response, data: flattenLocalCharmRanks(response.data) };
  }

  static getDecorations(locale?: string): Promise<ApiResponse<Decoration[]>> {
    return getLocal<Decoration[]>("decorations.json", locale);
  }

  /** Generic because the skill shape is the caller's concern: the planner
   *  enriches it into its own `ServerSkill`, and nothing here needs to know. */
  static getSkills<T = unknown>(locale?: string): Promise<ApiResponse<T[]>> {
    return getLocal<T[]>("skills.json", locale);
  }

  static getMonsters(locale?: string): Promise<ApiResponse<MhMonster[]>> {
    return get<MhMonster[]>("/tools/mhwilds/monsters", { locale });
  }

  /** Public corrections made in the admin Hunter's Manual editor. */
  static getAnatomyOverrides(): Promise<ApiResponse<MhWildsAnatomyOverride[]>> {
    return get<MhWildsAnatomyOverride[]>("/tools/mhwilds/anatomy-overrides");
  }

  /** Same reasoning as `getSkills`: the tree hook owns the `WeaponTree` shape. */
  static async getWeaponTree<T = unknown>(locale?: string): Promise<ApiResponse<T>> {
    const response = await this.getWeapons(locale);
    if (!response.success || !Array.isArray(response.data))
      return response as ApiResponse<T>;

    const tree = buildLocalWeaponTree(response.data);
    const manifest = await loadMhwildsGearAssetManifest();
    if (!manifest) return { ...response, data: tree as T };
    return {
      ...response,
      data: enrichWeaponTree(tree, manifest) as T,
    };
  }
}
