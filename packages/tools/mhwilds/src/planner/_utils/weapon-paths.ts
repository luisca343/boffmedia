/** A tree node shape kept deliberately permissive for old cached API trees. */
export interface WeaponTreeNodeLike {
  id: string | number;
  name?: string;
  children?: WeaponTreeNodeLike[];
  craftingMaterials?: any[];
  craftingZennyCost?: number;
  upgradeMaterials?: any[];
  upgradeZennyCost?: number;
  pathKey?: string;
}

export interface WeaponPath {
  key: string;
  nodes: WeaponTreeNodeLike[];
}

function occurrenceKey(node: WeaponTreeNodeLike, fallback: string): string {
  return node.pathKey || `${fallback}/${String(node.id)}`;
}

/**
 * Finds every root-to-target route, including duplicate occurrences of a
 * converging weapon. The caller chooses the route; this function never
 * silently picks the first one.
 */
export function findWeaponPaths(
  roots: WeaponTreeNodeLike[],
  targetId: string,
): WeaponPath[] {
  const found: WeaponPath[] = [];

  const visit = (
    node: WeaponTreeNodeLike,
    nodes: WeaponTreeNodeLike[],
    keys: string[],
    activeIds: Set<string>,
  ): void => {
    const id = String(node.id);
    const key = occurrenceKey(node, keys[keys.length - 1] || "root");
    // A malformed remote tree must not take down the planner with recursion.
    if (activeIds.has(id)) return;

    const nextNodes = [...nodes, node];
    const nextKeys = [...keys, key];
    if (id === targetId) {
      found.push({ key: nextKeys.join("→"), nodes: nextNodes });
      return;
    }

    const nextActiveIds = new Set(activeIds);
    nextActiveIds.add(id);
    for (const child of node.children || []) {
      visit(child, nextNodes, nextKeys, nextActiveIds);
    }
  };

  for (const root of roots) visit(root, [], [], new Set());
  return found;
}

export function weaponTreeRoots(
  tree: { tree?: WeaponTreeNodeLike[]; treeByKind?: Record<string, WeaponTreeNodeLike[]> } | null,
  kind?: string,
): WeaponTreeNodeLike[] {
  if (!tree) return [];
  return (kind && tree.treeByKind?.[kind]) || tree.tree || [];
}

export function pathStepMaterials(
  path: WeaponPath,
): { materials: any[]; zenny: number; steps: number } {
  const materials: any[] = [];
  let zenny = 0;

  path.nodes.forEach((node, index) => {
    const isUpgrade = index > 0;
    const stepMaterials = isUpgrade
      ? node.upgradeMaterials || node.craftingMaterials || []
      : node.craftingMaterials || [];
    materials.push(...stepMaterials);
    zenny += Number(
      isUpgrade ? node.upgradeZennyCost : node.craftingZennyCost,
    ) || 0;
  });

  return { materials, zenny, steps: path.nodes.length };
}
