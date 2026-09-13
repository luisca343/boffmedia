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
        const charmRanks = Array.isArray(charm?.ranks) ? charm.ranks : [];
        return ranks.concat(
          charmRanks.map((rank: any) => ({
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
      // The processed tree is derived data. Read the current weapon catalog
      // before accepting it so a cache generated before a title update cannot
      // silently hide the new weapons.
      const weaponsResult = await this.mhwildsRepository.getWeapons(locale);
      const weapons = weaponsResult.data;

      // Check if we have cached weapon tree
      const cachedTree = await this.mhwildsRepository.getProcessedData(
        'weapon-tree.json',
        locale,
      );
      const cachedTreeByKind = await this.mhwildsRepository.getProcessedData(
        'weapon-tree-by-kind.json',
        locale,
      );

      if (
        cachedTree &&
        cachedTreeByKind &&
        this.isCurrentWeaponTree(cachedTree, cachedTreeByKind, weapons)
      ) {
        return {
          tree: cachedTree,
          treeByKind: cachedTreeByKind,
          totalWeapons: this.countWeaponsInTree(cachedTree),
          weaponKinds: Object.keys(cachedTreeByKind),
        };
      }

      const weaponsById = weapons.reduce(
        (map: Record<string, any>, weapon: any) => {
          map[String(weapon.id)] = weapon;
          return map;
        },
        {},
      );
      const childrenByParent = this.buildWeaponChildren(weapons);

      const rootWeapons = weapons.filter((weapon: any) => {
        const previousId = weapon.crafting?.previous?.id;
        return previousId == null || !weaponsById[String(previousId)];
      });

      const weaponTree = rootWeapons
        .map((rootWeapon: any) =>
          this.buildWeaponBranch(rootWeapon, weaponsById, [], childrenByParent),
        )
        .filter(Boolean) as WeaponTreeNode[];

      const weaponTreeByKind = rootWeapons.reduce(
        (tree: Record<string, any[]>, weapon: any) => {
          const kind = weapon.kind;
          if (!tree[kind]) {
            tree[kind] = [];
          }

          const branch = this.buildWeaponBranch(
            weapon,
            weaponsById,
            [],
            childrenByParent,
          );
          if (branch) {
            tree[kind].push(branch);
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

  /**
   * Build a complete set of parent -> child links from both representations
   * used by the upstream catalog. Most records expose `branches` on the
   * parent, but some update records only expose `previous` on the child.
   */
  private buildWeaponChildren(
    weapons: any[],
  ): Map<string, { id: number; name?: string }[]> {
    const childrenByParent = new Map<string, { id: number; name?: string }[]>();

    const addChild = (parentId: unknown, child: any) => {
      if (parentId == null || child?.id == null) return;

      const key = String(parentId);
      const children = childrenByParent.get(key) || [];
      if (
        children.some((existing) => String(existing.id) === String(child.id))
      ) {
        return;
      }

      children.push({ id: child.id, name: child.name });
      childrenByParent.set(key, children);
    };

    for (const weapon of weapons) {
      const branches = Array.isArray(weapon.crafting?.branches)
        ? weapon.crafting.branches
        : [];
      for (const branch of branches) {
        addChild(weapon.id, branch);
      }

      const previousId = weapon.crafting?.previous?.id;
      if (previousId != null) {
        addChild(previousId, weapon);
      }
    }

    return childrenByParent;
  }

  private buildWeaponBranch(
    weapon: any,
    weaponsById: Record<string, any>,
    parentPath: string[] = [],
    childrenByParent?: Map<string, { id: number; name?: string }[]>,
  ): WeaponTreeNode | null {
    if (!weapon) return null;

    const id = String(weapon.id);
    const pathKey = [...parentPath, id].join('/');
    const childLinks =
      childrenByParent?.get(id) || weapon.crafting?.branches || [];

    const node: WeaponTreeNode = {
      id: weapon.id,
      gameId: weapon.gameId,
      pathKey,
      assetKey:
        weapon.gameId == null ? undefined : `${weapon.kind}:${weapon.gameId}`,
      name: weapon.name,
      description: weapon.description,
      rarity: weapon.rarity,
      kind: weapon.kind,
      damage: weapon.damage,
      specials: weapon.specials || [],
      slots: weapon.slots || [],
      affinity: weapon.affinity || 0,
      skills: weapon.skills || [],
      series: weapon.series,
      previous: weapon.crafting?.previous || null,
      branchIds: childLinks,
      craftingMaterials: weapon.crafting?.craftingMaterials || [],
      craftingZennyCost: weapon.crafting?.craftingZennyCost || 0,
      upgradeMaterials: weapon.crafting?.upgradeMaterials || [],
      upgradeZennyCost: weapon.crafting?.upgradeZennyCost || 0,
      children: [],
    };

    if (childLinks.length > 0 && !parentPath.includes(id)) {
      node.children = childLinks
        .map((branch: any) => {
          const branchWeapon = weaponsById[String(branch.id)];
          return this.buildWeaponBranch(
            branchWeapon,
            weaponsById,
            [...parentPath, id],
            childrenByParent,
          );
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

  private isCurrentWeaponTree(
    tree: any,
    treeByKind?: Record<string, any[]>,
    weapons?: any[],
  ): boolean {
    const collectIds = (nodes: any): Set<string> | null => {
      if (!Array.isArray(nodes)) return null;

      const ids = new Set<string>();
      for (const node of nodes) {
        if (
          !node ||
          node.id == null ||
          typeof node.pathKey !== 'string' ||
          typeof node.assetKey !== 'string' ||
          !('gameId' in node) ||
          !Array.isArray(node.children)
        ) {
          return null;
        }

        ids.add(String(node.id));
        const childIds = collectIds(node.children);
        if (!childIds) return null;
        childIds.forEach((id) => ids.add(id));
      }

      return ids;
    };

    const treeIds = collectIds(tree);
    if (!treeIds) return false;

    let treeByKindIds: Set<string> | null = null;
    if (treeByKind) {
      treeByKindIds = new Set<string>();
      for (const nodes of Object.values(treeByKind)) {
        const ids = collectIds(nodes);
        if (!ids) return false;
        ids.forEach((id) => treeByKindIds?.add(id));
      }
    }

    if (!weapons) return true;

    const expectedIds = new Set(
      weapons
        .filter((weapon) => weapon?.id != null)
        .map((weapon) => String(weapon.id)),
    );
    const matchesCatalog = (ids: Set<string> | null) =>
      ids != null &&
      ids.size === expectedIds.size &&
      [...expectedIds].every((id) => ids.has(id));

    return (
      matchesCatalog(treeIds) && (!treeByKind || matchesCatalog(treeByKindIds))
    );
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
