/**
 * MH Wilds game data, fetched through `@boffmedia/tool-kit`'s `api` capability.
 *
 * Every endpoint here is `@Public()` on the API side, so the calls stay
 * `auth: "optional"` (the seam's default): the launcher attaches a session if
 * the player happens to have one and proceeds anonymously otherwise, which is
 * what lets the Tools section work without a Boffmedia account (plan D4).
 *
 * The `ApiResponse` envelope and the NON-throwing contract are kept exactly as
 * `@/services/boffAPI` had them. The capability throws `ToolApiError`; catching
 * it here is what let the hooks move across unchanged, since every call site
 * was written as `if (res.success && res.data)`.
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
  loadMhwildsGearAssetManifest,
  type MhwildsGearAssetManifest,
} from "./bestiary/assets";

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
    const response = await get<Weapon[]>("/tools/mhwilds/weapons", { locale });
    if (!response.success || !Array.isArray(response.data)) return response;
    const manifest = await loadMhwildsGearAssetManifest();
    return {
      ...response,
      data: response.data.map((weapon) => enrichWeapon(weapon, manifest)),
    };
  }

  static async getArmor(locale?: string): Promise<ApiResponse<ArmorPiece[]>> {
    const response = await get<ArmorPiece[]>("/tools/mhwilds/armor", {
      locale,
    });
    if (!response.success || !Array.isArray(response.data)) return response;

    // The API owns the canonical records, while the local pack owns optional
    // rasters. Join them by stable armor-set id + slot instead of by array
    // position. A missing entry is explicit so consumers can render a
    // semantic fallback without probing a guaranteed 404.
    const manifest = await loadMhwildsGearAssetManifest();
    if (!manifest?.armor) return response;
    return {
      ...response,
      data: response.data.map((piece) => {
        const gameId = piece.armorSet?.gameId;
        const directEntry =
          gameId == null ? undefined : manifest.armor?.[String(gameId)];
        // Do not fall back to `armorSet.id`: it is the API's mutable primary
        // key, whereas the extracted pack is keyed by the game's stable id.
        // The API repository supplies that stable id from the checked-in
        // crosswalk, and an absent join must remain an explicit null.
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

  static getCharms(locale?: string): Promise<ApiResponse<Charm[]>> {
    // The raw charms endpoint returns grouped charm tables. The planner needs
    // the flattened, named ranks (name, description, rarity and skills).
    return get<Charm[]>("/tools/mhwilds/charms/ranks", { locale });
  }

  static getDecorations(locale?: string): Promise<ApiResponse<Decoration[]>> {
    return get<Decoration[]>("/tools/mhwilds/decorations", { locale });
  }

  /** Generic because the skill shape is the caller's concern: the planner
   *  enriches it into its own `ServerSkill`, and nothing here needs to know. */
  static getSkills<T = unknown>(locale?: string): Promise<ApiResponse<T[]>> {
    return get<T[]>("/tools/mhwilds/skills", { locale });
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
    const response = await get<T>("/tools/mhwilds/weapons/tree", { locale });
    if (!response.success || response.data == null) return response;
    const manifest = await loadMhwildsGearAssetManifest();
    if (!manifest) return response;
    return {
      ...response,
      data: enrichWeaponTree(response.data, manifest) as T,
    };
  }
}
