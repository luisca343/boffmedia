import { useEffect, useMemo, useState } from "react";
import { useLocale } from "../../i18n";
import { MhWildsService } from "../../service";
import type { Weapon, WeaponTreeData } from "../../types";
import {
  findWeaponPaths,
  pathStepMaterials,
  weaponTreeRoots,
  type WeaponPath,
} from "../_utils/weapon-paths";

export interface ForgePath extends WeaponPath {
  materials: any[];
  steps: number;
  zenny: number;
}

const treePromises = new Map<string, Promise<WeaponTreeData | null>>();

function loadTree(locale: string): Promise<WeaponTreeData | null> {
  const cached = treePromises.get(locale);
  if (cached) return cached;

  const promise = MhWildsService.getWeaponTree<WeaponTreeData>(locale)
    .then((response) => (response.success ? response.data || null : null))
    .catch(() => null);
  treePromises.set(locale, promise);
  return promise;
}

/** Returns every possible forge route for the requested weapon. */
export function useForgePaths(weaponId: string | null, weaponKind?: string) {
  const locale = useLocale();
  const [tree, setTree] = useState<WeaponTreeData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!weaponId || tree) return;
    let cancelled = false;
    setLoading(true);
    loadTree(locale)
      .then((nextTree) => {
        if (!cancelled) setTree(nextTree);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [locale, tree, weaponId]);

  const paths = useMemo<ForgePath[]>(() => {
    if (!weaponId || !tree) return [];
    const roots = weaponTreeRoots(tree, weaponKind);
    const rawPaths = findWeaponPaths(roots, weaponId);
    // Old API trees do not have pathKey yet, but the route index still keeps
    // every occurrence separate via the generated key.
    return rawPaths.map((path) => ({
      ...path,
      ...pathStepMaterials(path),
    }));
  }, [tree, weaponId, weaponKind]);

  return {
    paths,
    loading: !!weaponId && loading && !tree,
  };
}

/** Loads one shared tree and resolves every wishlist weapon in one pass. */
export function useForgePathsForWeapons(weapons: Weapon[]) {
  const locale = useLocale();
  const [tree, setTree] = useState<WeaponTreeData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!weapons.length || tree) return;
    let cancelled = false;
    setLoading(true);
    loadTree(locale)
      .then((nextTree) => {
        if (!cancelled) setTree(nextTree);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [locale, tree, weapons.length]);

  const paths = useMemo(() => {
    if (!tree) return weapons.map(() => [] as ForgePath[]);
    return weapons.map((weapon) => {
      const rawPaths = findWeaponPaths(
        weaponTreeRoots(tree, weapon.kind),
        String(weapon.id),
      );
      return rawPaths.map((path) => ({
        ...path,
        ...pathStepMaterials(path),
      }));
    });
  }, [tree, weapons]);

  return {
    paths,
    loading: weapons.length > 0 && loading && !tree,
  };
}

/** Backward-compatible first-route view for small consumers. */
export function useForgePath(weaponId: string | null, weaponKind?: string) {
  const result = useForgePaths(weaponId, weaponKind);
  const first = result.paths[0];
  return {
    materials: first?.materials || [],
    steps: first?.steps || 0,
    zenny: first?.zenny || 0,
    paths: result.paths,
    loading: result.loading,
  };
}
