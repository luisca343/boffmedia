import { useEffect, useMemo, useState } from "react"
import { useLocale } from "next-intl"
import { MhWildsService } from "@/services/api/tools/mhWildsService"

interface ForgeMat {
  item: { id: string | number; name: string; rarity?: number }
  quantity: number
}
interface WeaponTree {
  tree: any[]
  treeByKind: Record<string, any[]>
}

// Ancestor chain [root … node] for the weapon, or null if not found.
function findPath(roots: any[], id: string): any[] | null {
  for (const root of roots) {
    const stack: any[] = []
    const dfs = (n: any): any[] | null => {
      stack.push(n)
      if (String(n.id) === id) return [...stack]
      for (const c of n.children || []) {
        const r = dfs(c)
        if (r) return r
      }
      stack.pop()
      return null
    }
    const r = dfs(root)
    if (r) return r
  }
  return null
}

function stepMats(node: any, hasParent: boolean): ForgeMat[] {
  return (hasParent ? node.upgradeMaterials : node.craftingMaterials) || node.craftingMaterials || []
}

/**
 * Cumulative forge cost for a weapon across its FULL upgrade path (root → equipped),
 * derived from the real weapon-tree API. Fetches the tree lazily (once, only when a
 * weapon is set) and aggregates crafting + upgrade materials + zenny per step.
 */
export function useForgePath(weaponId: string | null, weaponKind?: string) {
  const locale = useLocale()
  const [tree, setTree] = useState<WeaponTree | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!weaponId || tree) return
    let cancelled = false
    setLoading(true)
    MhWildsService.getWeaponTree(locale)
      .then((r) => {
        if (!cancelled) setTree((r.data as WeaponTree) ?? null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [weaponId, locale, tree])

  const { materials, steps, zenny } = useMemo(() => {
    if (!weaponId || !tree) return { materials: [] as ForgeMat[], steps: 0, zenny: 0 }
    const roots = (weaponKind && tree.treeByKind?.[weaponKind]) || tree.tree
    const path = findPath(roots, weaponId) || findPath(tree.tree, weaponId)
    if (!path) return { materials: [] as ForgeMat[], steps: 0, zenny: 0 }
    const agg = new Map<string, ForgeMat>()
    let z = 0
    path.forEach((node, i) => {
      const hasParent = i > 0
      z += (hasParent ? node.upgradeZennyCost : node.craftingZennyCost) || 0
      stepMats(node, hasParent).forEach((m) => {
        if (!m.item) return
        const key = String(m.item.id)
        const ex = agg.get(key)
        if (ex) ex.quantity += m.quantity || 1
        else agg.set(key, { item: m.item, quantity: m.quantity || 1 })
      })
    })
    return { materials: Array.from(agg.values()), steps: path.length, zenny: z }
  }, [weaponId, tree, weaponKind])

  return { materials, steps, zenny, loading: !!weaponId && loading && !tree }
}
