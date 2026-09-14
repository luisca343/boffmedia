import type {
  ArmorPiece,
  Charm,
  Weapon,
  WeaponTreeData,
  WeaponTreeNode,
} from "../types";

export interface LocalArmorSetIdentity {
  id: string | number;
  gameId: string | number;
}

/** The runtime pack currently ships the two supported UI locales. */
export function mhwildsCatalogLocale(locale?: string): "en" | "es" {
  return locale?.toLowerCase().startsWith("es") ? "es" : "en";
}

export function mhwildsCatalogPath(locale: string | undefined, file: string): string {
  return `${mhwildsCatalogLocale(locale)}/${file}`;
}

/**
 * The API's charm-ranks endpoint flattened the game's grouped charm table.
 * Keep that response shape so planner consumers do not need a second branch
 * just because the source is now the local game-data pack.
 */
export function flattenLocalCharmRanks(value: unknown): Charm[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((charmGroup) => {
    if (!charmGroup || typeof charmGroup !== "object") return [];
    const group = charmGroup as Record<string, unknown>;
    const ranks = Array.isArray(group.ranks) ? group.ranks : [];
    if (ranks.length === 0) return [];

    return ranks.map((rank) => ({
      ...(rank as Record<string, unknown>),
      charm: {
        ...((rank as Record<string, unknown>).charm as Record<string, unknown>),
        id: group.id,
        gameId: group.gameId,
      },
    })) as Charm[];
  });
}

/** Join the stable game armor-set id to the local catalog's set id. */
export function joinLocalArmorSetIdentities(
  armor: ArmorPiece[],
  identities: LocalArmorSetIdentity[],
): ArmorPiece[] {
  const gameIds = new Map(
    identities.map((identity) => [String(identity.id), identity.gameId]),
  );

  return armor.map((piece) => {
    const armorSet = piece.armorSet;
    if (!armorSet || armorSet.gameId != null || armorSet.id == null) return piece;

    const gameId = gameIds.get(String(armorSet.id));
    if (gameId == null) return piece;

    return {
      ...piece,
      armorSet: { ...armorSet, gameId },
    };
  });
}

function addChild(
  childrenByParent: Map<string, { id: string | number; name?: string }[]>,
  parentKey: string | undefined,
  child: { id?: string | number; name?: string } | null | undefined,
): void {
  if (parentKey == null || child?.id == null) return;

  const children = childrenByParent.get(parentKey) ?? [];
  if (children.some((existing) => String(existing.id) === String(child.id))) return;

  children.push({ id: child.id, name: child.name });
  childrenByParent.set(parentKey, children);
}

/**
 * Rebuild the processed tree from the local weapon catalog. This deliberately
 * does not trust an older tree snapshot: the catalog is the source of truth,
 * and title-update rows can change the branch links.
 */
export function buildLocalWeaponTree(weapons: Weapon[]): WeaponTreeData {
  const weaponKey = (kind: string, id: unknown) => `${kind}:${String(id)}`;
  const weaponsByKey = new Map(
    weapons.map((weapon) => [weaponKey(weapon.kind, weapon.id), weapon]),
  );
  const childrenByParent = new Map<
    string,
    { id: string | number; name?: string }[]
  >();

  for (const weapon of weapons) {
    for (const branch of weapon.crafting?.branches ?? [])
      addChild(childrenByParent, weaponKey(weapon.kind, weapon.id), branch);

    addChild(
      childrenByParent,
      weapon.crafting?.previous?.id == null
        ? undefined
        : weaponKey(weapon.kind, weapon.crafting.previous.id),
      weapon,
    );
  }

  const buildBranch = (
    weapon: Weapon,
    parentPath: string[],
  ): WeaponTreeNode => {
    const id = String(weapon.id);
    const pathKey = [...parentPath, id].join("/");
    const childLinks =
      childrenByParent.get(weaponKey(weapon.kind, weapon.id)) ??
      weapon.crafting?.branches ?? [];
    const activePath = [...parentPath, id];

    const node: WeaponTreeNode = {
      ...weapon,
      pathKey,
      assetKey:
        weapon.gameId == null ? undefined : `${weapon.kind}:${weapon.gameId}`,
      craftingMaterials:
        weapon.crafting?.craftingMaterials ?? weapon.crafting?.materials ?? [],
      craftingZennyCost:
        weapon.crafting?.craftingZennyCost ?? weapon.crafting?.zennyCost ?? 0,
      upgradeMaterials: weapon.crafting?.upgradeMaterials ?? [],
      upgradeZennyCost: weapon.crafting?.upgradeZennyCost ?? 0,
      children: [],
    };

    node.children = childLinks
      .filter((child) => !activePath.includes(String(child.id)))
      .map((child) => weaponsByKey.get(weaponKey(weapon.kind, child.id)))
      .filter((child): child is Weapon => child != null)
      .map((child) => buildBranch(child, activePath));

    return node;
  };

  const roots = weapons.filter((weapon) => {
    const previousId = weapon.crafting?.previous?.id;
    return (
      previousId == null ||
      !weaponsByKey.has(weaponKey(weapon.kind, previousId))
    );
  });

  const tree = roots.map((weapon) => buildBranch(weapon, []));
  const treeByKind = roots.reduce<Record<string, WeaponTreeNode[]>>(
    (grouped, weapon) => {
      (grouped[weapon.kind] ??= []).push(buildBranch(weapon, []));
      return grouped;
    },
    {},
  );

  return {
    tree,
    treeByKind,
    totalWeapons: weapons.length,
    weaponKinds: Object.keys(treeByKind),
  };
}
