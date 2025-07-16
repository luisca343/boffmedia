import { ArmorPiece, Charm, Decoration, Weapon } from "@/types/tools/mhwilds";
import { apiGET, ApiResponse } from "@/services/boffAPI";

export class MhWildsService {
  /**
   * Get all weapons
   */
  static getWeapons(locale: string): Promise<ApiResponse<Weapon[]>> {
    return apiGET<Weapon[]>(`/tools/mhwilds/weapons?locale=${locale}`);
  }

  /**
   * Get all armor pieces
   */
  static getArmor(locale: string): Promise<ApiResponse<ArmorPiece[]>> {
    return apiGET<ArmorPiece[]>(`/tools/mhwilds/armor?locale=${locale}`);
  }

  /**
   * Get all charms with ranks
   */
  static getCharms(locale: string): Promise<ApiResponse<Charm[]>> {
    return apiGET<Charm[]>(`/tools/mhwilds/charms/ranks?locale=${locale}`);
  }

  /**
   * Get all decorations
   */
  static getDecorations(locale: string): Promise<ApiResponse<Decoration[]>> {
    return apiGET<Decoration[]>(`/tools/mhwilds/decorations?locale=${locale}`);
  }

  /**
   * Get all skills
   */
  static getSkills(locale: string): Promise<ApiResponse<any[]>> {
    return apiGET<any[]>(`/tools/mhwilds/skills?locale=${locale}`);
  }

  /**
   * Get weapon tree data
   */
  static getWeaponTree(locale: string): Promise<ApiResponse<any>> {
    return apiGET<any>(`/tools/mhwilds/weapon-tree?locale=${locale}`);
  }
}