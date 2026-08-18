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

import type { ArmorPiece, Charm, Decoration, MhMonster, Weapon } from "./types";

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

export class MhWildsService {
  static getWeapons(locale?: string): Promise<ApiResponse<Weapon[]>> {
    return get<Weapon[]>("/tools/mhwilds/weapons", { locale });
  }

  static getArmor(locale?: string): Promise<ApiResponse<ArmorPiece[]>> {
    return get<ArmorPiece[]>("/tools/mhwilds/armor", { locale });
  }

  static getCharms(locale?: string): Promise<ApiResponse<Charm[]>> {
    return get<Charm[]>("/tools/mhwilds/charms", { locale });
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

  /** Same reasoning as `getSkills`: the tree hook owns the `WeaponTree` shape. */
  static getWeaponTree<T = unknown>(locale?: string): Promise<ApiResponse<T>> {
    return get<T>("/tools/mhwilds/weapons/tree", { locale });
  }
}
