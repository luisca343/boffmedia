import { HttpException, Inject, Injectable } from '@nestjs/common';
import {
  ResourceFetchResult,
  WeaponTreeNode,
} from '@api/boffmedia/herramientas/mhwilds/repositories/mhwilds.repository';
import { MHWILDS_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';
import { IMhwildsRepository } from '../repositories/interface/mhwilds.repository.interface';

export interface WeaponTreeResult {
  tree: WeaponTreeNode[];
  treeByKind: Record<string, WeaponTreeNode[]>;
  totalWeapons: number;
  weaponKinds: string[];
}

export interface CharmRankResult {
  id: number;
  name: string;
  description: string;
  level: number;
  rarity: number;
  skills: any[];
  crafting: any;
  charm: {
    id: number;
    gameId: number;
  };
}

export interface CacheInfo {
  fromCache: boolean;
  fetchTime: Date;
  cacheAge?: number;
}

@Injectable()
export class MhwildsDataService {
  constructor(
    @Inject(MHWILDS_REPOSITORY_TOKEN)
    private readonly mhwildsRepository: IMhwildsRepository,
  ) {}

  // ==================== BASIC DATA RETRIEVAL ====================

  async getWeapons(
    locale: string,
  ): Promise<{ data: any[]; cacheInfo: CacheInfo }> {
    try {
      const result = await this.mhwildsRepository.getWeapons(locale);
      return this.formatResultWithCacheInfo(result);
    } catch (error: any) {
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Failed to get weapons: ${error.message}`);
    }
  }

  async getArmor(
    locale: string,
  ): Promise<{ data: any[]; cacheInfo: CacheInfo }> {
    try {
      const result = await this.mhwildsRepository.getArmor(locale);
      return this.formatResultWithCacheInfo(result);
    } catch (error: any) {
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Failed to get armor: ${error.message}`);
    }
  }

  async getCharms(
    locale: string,
  ): Promise<{ data: any[]; cacheInfo: CacheInfo }> {
    try {
      const result = await this.mhwildsRepository.getCharms(locale);
      return this.formatResultWithCacheInfo(result);
    } catch (error: any) {
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Failed to get charms: ${error.message}`);
    }
  }

  async getDecorations(
    locale: string,
  ): Promise<{ data: any[]; cacheInfo: CacheInfo }> {
    try {
      const result = await this.mhwildsRepository.getDecorations(locale);
      return this.formatResultWithCacheInfo(result);
    } catch (error: any) {
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Failed to get decorations: ${error.message}`);
    }
  }

  async getSkills(
    locale: string,
  ): Promise<{ data: any[]; cacheInfo: CacheInfo }> {
    try {
      const result = await this.mhwildsRepository.getSkills(locale);
      return this.formatResultWithCacheInfo(result);
    } catch (error: any) {
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Failed to get skills: ${error.message}`);
    }
  }

  async getMonsters(
    locale: string,
  ): Promise<{ data: any[]; cacheInfo: CacheInfo }> {
    try {
      const result = await this.mhwildsRepository.getMonsters(locale);
      return this.formatResultWithCacheInfo(result);
    } catch (error: any) {
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Failed to get monsters: ${error.message}`);
    }
  }

  // ==================== PROCESSED DATA OPERATIONS ====================

  async getAllCharmRanks(
    locale: string,
  ): Promise<{ data: CharmRankResult[]; cacheInfo: CacheInfo }> {
    try {
      const result = await this.mhwildsRepository.getCharms(locale);
      const charms = result.data;

      const allRanks = charms.reduce((ranks: CharmRankResult[], charm: any) => {
        return ranks.concat(
          charm.ranks.map((rank: any) => ({
            ...rank,
            charm: {
              id: charm.id,
              gameId: charm.gameId,
            },
          })),
        );
      }, []);

      return {
        data: allRanks,
        cacheInfo: this.extractCacheInfo(result),
      };
    } catch (error: any) {
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Failed to get charm ranks: ${error.message}`);
    }
  }

  async createWeaponTree(locale: string): Promise<WeaponTreeResult> {
    try {
      // Check if we have cached weapon tree
      const cachedTree = await this.mhwildsRepository.getProcessedData(
        'weapon-tree.json',
        locale,
      );
      const cachedTreeByKind = await this.mhwildsRepository.getProcessedData(
        'weapon-tree-by-kind.json',
        locale,
      );

      if (cachedTree && cachedTreeByKind) {
        return {
          tree: cachedTree,
          treeByKind: cachedTreeByKind,
          totalWeapons: this.countWeaponsInTree(cachedTree),
          weaponKinds: Object.keys(cachedTreeByKind),
        };
      }

      // Generate weapon tree from weapons data
      const weaponsResult = await this.mhwildsRepository.getWeapons(locale);
      const weapons = weaponsResult.data;

      const weaponsById = weapons.reduce(
        (map: Record<string, any>, weapon: any) => {
          map[weapon.id] = weapon;
          return map;
        },
        {},
      );

      const rootWeapons = weapons.filter(
        (weapon: any) =>
          weapon.crafting?.craftable === true && !weapon.crafting?.previous,
      );

      const weaponTree = rootWeapons.map((rootWeapon: any) =>
        this.buildWeaponBranch(rootWeapon, weaponsById),
      );

      const weaponTreeByKind = weapons.reduce(
        (tree: Record<string, any[]>, weapon: any) => {
          const kind = weapon.kind;
          if (!tree[kind]) {
            tree[kind] = [];
          }

          if (
            weapon.crafting?.craftable === true &&
            !weapon.crafting?.previous
          ) {
            tree[kind].push(this.buildWeaponBranch(weapon, weaponsById));
          }

          return tree;
        },
        {},
      );

      // Save the processed data
      await this.mhwildsRepository.saveProcessedData(
        'weapon-tree.json',
        locale,
        weaponTree,
      );
      await this.mhwildsRepository.saveProcessedData(
        'weapon-tree-by-kind.json',
        locale,
        weaponTreeByKind,
      );

      return {
        tree: weaponTree,
        treeByKind: weaponTreeByKind,
        totalWeapons: this.countWeaponsInTree(weaponTree),
        weaponKinds: Object.keys(weaponTreeByKind),
      };
    } catch (error: any) {
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Failed to create weapon tree: ${error.message}`);
    }
  }

  // ==================== SEARCH AND FILTER OPERATIONS ====================

  async searchWeaponsByName(
    locale: string,
    searchTerm: string,
  ): Promise<{ data: any[]; cacheInfo: CacheInfo }> {
    try {
      const result = await this.mhwildsRepository.getWeapons(locale);
      const weapons = result.data;

      const filteredWeapons = weapons.filter((weapon: any) =>
        weapon.name.toLowerCase().includes(searchTerm.toLowerCase()),
      );

      return {
        data: filteredWeapons,
        cacheInfo: this.extractCacheInfo(result),
      };
    } catch (error: any) {
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Failed to search weapons: ${error.message}`);
    }
  }

  async getWeaponsByKind(
    locale: string,
    kind: string,
  ): Promise<{ data: any[]; cacheInfo: CacheInfo }> {
    try {
      const result = await this.mhwildsRepository.getWeapons(locale);
      const weapons = result.data;

      const filteredWeapons = weapons.filter(
        (weapon: any) => weapon.kind.toLowerCase() === kind.toLowerCase(),
      );

      return {
        data: filteredWeapons,
        cacheInfo: this.extractCacheInfo(result),
      };
    } catch (error: any) {
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Failed to get weapons by kind: ${error.message}`);
    }
  }

  async getArmorByRarity(
    locale: string,
    rarity: number,
  ): Promise<{ data: any[]; cacheInfo: CacheInfo }> {
    try {
      const result = await this.mhwildsRepository.getArmor(locale);
      const armor = result.data;

      const filteredArmor = armor.filter(
        (piece: any) => piece.rarity === rarity,
      );

      return {
        data: filteredArmor,
        cacheInfo: this.extractCacheInfo(result),
      };
    } catch (error: any) {
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Failed to get armor by rarity: ${error.message}`);
    }
  }

  // ==================== STATISTICS OPERATIONS ====================

  async getDataStatistics(locale: string): Promise<{
    weapons: { total: number; byKind: Record<string, number> };
    armor: { total: number; byRarity: Record<number, number> };
    charms: { total: number; totalRanks: number };
    decorations: { total: number; byRarity: Record<number, number> };
    skills: { total: number };
  }> {
    try {
      const [
        weaponsResult,
        armorResult,
        charmsResult,
        decorationsResult,
        skillsResult,
      ] = await Promise.all([
        this.mhwildsRepository.getWeapons(locale),
        this.mhwildsRepository.getArmor(locale),
        this.mhwildsRepository.getCharms(locale),
        this.mhwildsRepository.getDecorations(locale),
        this.mhwildsRepository.getSkills(locale),
      ]);

      // Weapons statistics
      const weaponsByKind = weaponsResult.data.reduce(
        (acc: Record<string, number>, weapon: any) => {
          acc[weapon.kind] = (acc[weapon.kind] || 0) + 1;
          return acc;
        },
        {},
      );

      // Armor statistics
      const armorByRarity = armorResult.data.reduce(
        (acc: Record<number, number>, piece: any) => {
          acc[piece.rarity] = (acc[piece.rarity] || 0) + 1;
          return acc;
        },
        {},
      );

      // Decorations statistics
      const decorationsByRarity = decorationsResult.data.reduce(
        (acc: Record<number, number>, decoration: any) => {
          acc[decoration.rarity] = (acc[decoration.rarity] || 0) + 1;
          return acc;
        },
        {},
      );

      // Charm ranks count
      const totalCharmRanks = charmsResult.data.reduce(
        (total: number, charm: any) => {
          return total + (charm.ranks ? charm.ranks.length : 0);
        },
        0,
      );

      return {
        weapons: {
          total: weaponsResult.data.length,
          byKind: weaponsByKind,
        },
        armor: {
          total: armorResult.data.length,
          byRarity: armorByRarity,
        },
        charms: {
          total: charmsResult.data.length,
          totalRanks: totalCharmRanks,
        },
        decorations: {
          total: decorationsResult.data.length,
          byRarity: decorationsByRarity,
        },
        skills: {
          total: skillsResult.data.length,
        },
      };
    } catch (error: any) {
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Failed to get data statistics: ${error.message}`);
    }
  }

  // ==================== UTILITY METHODS ====================

  private buildWeaponBranch(
    weapon: any,
    weaponsById: Record<string, any>,
  ): WeaponTreeNode | null {
    if (!weapon) return null;

    const node: WeaponTreeNode = {
      id: weapon.id,
      name: weapon.name,
      rarity: weapon.rarity,
      kind: weapon.kind,
      damage: weapon.damage,
      specials: weapon.specials || [],
      craftingMaterials: weapon.crafting?.craftingMaterials || [],
      craftingZennyCost: weapon.crafting?.craftingZennyCost || 0,
      upgradeMaterials: weapon.crafting?.upgradeMaterials || [],
      upgradeZennyCost: weapon.crafting?.upgradeZennyCost || 0,
      children: [],
    };

    if (weapon.crafting?.branches && weapon.crafting.branches.length > 0) {
      node.children = weapon.crafting.branches
        .map((branch: any) => {
          const branchWeapon = weaponsById[branch.id];
          return this.buildWeaponBranch(branchWeapon, weaponsById);
        })
        .filter(Boolean) as WeaponTreeNode[];
    }

    return node;
  }

  private countWeaponsInTree(tree: WeaponTreeNode[]): number {
    return tree.reduce((total, node) => {
      return total + 1 + this.countWeaponsInTree(node.children);
    }, 0);
  }

  private formatResultWithCacheInfo(result: ResourceFetchResult): {
    data: any;
    cacheInfo: CacheInfo;
  } {
    return {
      data: result.data,
      cacheInfo: this.extractCacheInfo(result),
    };
  }

  private extractCacheInfo(result: ResourceFetchResult): CacheInfo {
    const cacheInfo: CacheInfo = {
      fromCache: result.fromCache,
      fetchTime: result.fetchTime,
    };

    if (result.fromCache) {
      cacheInfo.cacheAge = Date.now() - result.fetchTime.getTime();
    }

    return cacheInfo;
  }
}
