import { MEW_CATS, mewHuman, type MewRec } from "./mew-util"
import { store, type CatData, type MewIndex } from "./mew-store-state"

// Index construction + the cross-reference resolvers the fiches use to turn ids
// into records/links. Reads the shared store; owns nothing else.

export function buildIndex() {
  const d = store.data as CatData
  const idx: MewIndex = { byCat: {}, lowerChar: {}, effect: {}, abilAll: {} }
  MEW_CATS.forEach((c) => {
    const m: Record<string, MewRec> = {}
    ;(d[c.key] || []).forEach((r) => { m[r.id] = r })
    idx.byCat[c.key] = m
  })
  ;(d.characters || []).forEach((r) => { idx.lowerChar[r.id.toLowerCase()] = r })
  ;(d.passives || []).forEach((r) => { idx.effect[r.id] = { kind: "passives", rec: r } })
  ;(d.keywords || []).forEach((r) => { if (!idx.effect[r.id]) idx.effect[r.id] = { kind: "keywords", rec: r } })
  ;(store.allAbilities.length ? store.allAbilities : d.abilities || []).forEach((a) => { idx.abilAll[a.id] = a })

  // Build reverse indexes
  // keyword → abilities that apply it (via dmg.effects)
  idx.keywordAppliedBy = {}
  ;(store.allAbilities.length ? store.allAbilities : d.abilities || []).forEach((a) => {
    if (a.dmg?.effects) {
      Object.keys(a.dmg.effects).forEach((kw) => {
        if (!idx.keywordAppliedBy![kw]) idx.keywordAppliedBy![kw] = []
        idx.keywordAppliedBy![kw].push(a)
      })
    }
  })

  // passive → things that grant it (items, sets, mutations, classes)
  idx.passiveGrantedBy = {}
  ;(d.items || []).forEach((it) => {
    if (it.passives) {
      Object.keys(it.passives).forEach((p) => {
        if (!idx.passiveGrantedBy![p]) idx.passiveGrantedBy![p] = { kind: "items", recs: [] }
        idx.passiveGrantedBy![p].recs.push(it)
      })
    }
  })
  ;(d.sets || []).forEach((s) => {
    if (s.passives) {
      Object.keys(s.passives).forEach((p) => {
        if (!idx.passiveGrantedBy![p]) idx.passiveGrantedBy![p] = { kind: "sets", recs: [] }
        idx.passiveGrantedBy![p].recs.push(s)
      })
    }
  })
  ;(d.mutations || []).forEach((m) => {
    if (m.passives) {
      Object.keys(m.passives).forEach((p) => {
        if (!idx.passiveGrantedBy![p]) idx.passiveGrantedBy![p] = { kind: "mutations", recs: [] }
        idx.passiveGrantedBy![p].recs.push(m)
      })
    }
  })
  ;(d.classes || []).forEach((c) => {
    if (c.passivePool) {
      Object.keys(c.passivePool).forEach((p) => {
        if (!idx.passiveGrantedBy![p]) idx.passiveGrantedBy![p] = { kind: "classes", recs: [] }
        idx.passiveGrantedBy![p].recs.push(c)
      })
    }
  })

  // class → characters (via class in passives or as reference)
  idx.classToCharacters = {}
  ;(d.characters || []).forEach((c) => {
    if (c.passives) {
      Object.keys(c.passives).forEach((classId) => {
        if (!idx.classToCharacters![classId]) idx.classToCharacters![classId] = []
        idx.classToCharacters![classId].push(c)
      })
    }
  })

  // ability → characters and classes that use it
  idx.abilityUsedBy = {}
  ;(d.characters || []).forEach((c) => {
    if (c.atk) {
      if (!idx.abilityUsedBy![c.atk]) idx.abilityUsedBy![c.atk] = { chars: [], classes: [] }
      idx.abilityUsedBy![c.atk].chars.push(c)
    }
    if (c.spells) {
      c.spells.forEach((s) => {
        if (!idx.abilityUsedBy![s]) idx.abilityUsedBy![s] = { chars: [], classes: [] }
        idx.abilityUsedBy![s].chars.push(c)
      })
    }
  })
  ;(d.classes || []).forEach((c) => {
    if (c.abilities) {
      c.abilities.forEach((a) => {
        if (!idx.abilityUsedBy![a]) idx.abilityUsedBy![a] = { chars: [], classes: [] }
        idx.abilityUsedBy![a].classes.push(c)
      })
    }
  })

  // item → pools and shops
  idx.itemToSources = {}
  ;(d.item_pools || []).forEach((p) => {
    if (Array.isArray(p.items)) {
      ;(p.items as string[]).forEach((itemId: string) => {
        if (!idx.itemToSources![itemId]) idx.itemToSources![itemId] = { pools: [], shops: [] }
        idx.itemToSources![itemId].pools.push(p)
      })
    }
  })
  // A shop stocks FROM a pool, so its slots name pools, not items. Keying the
  // index by the pool name (as this did) filed every shop under an id no item
  // has, and the "shops" row on an item was therefore almost always empty —
  // resolve the pool to its members and file the shop under each one.
  idx.shopStock = {}
  const poolItems: Record<string, string[]> = {}
  ;(d.item_pools || []).forEach((p) => {
    if (Array.isArray(p.items)) poolItems[p.id] = p.items as string[]
  })
  const poolMembers = (pool: string): string[] => {
    if (poolItems[pool]) return poolItems[pool]
    // Shops name pool *families* ("tracy_houseshop_common"); the extracted
    // pools are suffixed per chapter ("..._0", "..._1"), so match the prefix.
    const out: string[] = []
    for (const key of Object.keys(poolItems)) {
      if (key.startsWith(pool + "_")) out.push(...poolItems[key])
    }
    // A slot can also name one specific item outright (AncestorsSkull,
    // MoneyBag_Large, …) rather than a pool.
    if (!out.length && idx.byCat.items[pool]) return [pool]
    return out
  }
  ;(d.shops || []).forEach((s) => {
    if (!s.itemGroups || typeof s.itemGroups !== "object") return
    const seen = new Set<string>()
    Object.values(s.itemGroups).forEach((group: any) => {
      if (!group || typeof group !== "object") return
      Object.values(group).forEach((slot: any) => {
        if (!slot || typeof slot !== "object" || !slot.pool) return
        poolMembers(String(slot.pool)).forEach((itemId) => {
          if (seen.has(itemId)) return
          seen.add(itemId)
          if (!idx.itemToSources![itemId]) idx.itemToSources![itemId] = { pools: [], shops: [] }
          idx.itemToSources![itemId].shops.push(s)
        })
      })
    })
    idx.shopStock![s.id] = [...seen]
  })

  // character → maps (enemies, bosses, minibosses, or via spawns if available)
  idx.characterToMaps = {}
  ;(d.maps || []).forEach((mp) => {
    const charIds = new Set<string>()
    if (typeof mp.enemies === "string") charIds.add(mp.enemies)
    if (Array.isArray(mp.bosses)) mp.bosses.forEach((b: any) => charIds.add(typeof b === "string" ? b : String(b)))
    if (Array.isArray(mp.minibosses)) mp.minibosses.forEach((b: any) => charIds.add(typeof b === "string" ? b : String(b)))
    charIds.forEach((cid) => {
      if (!idx.characterToMaps![cid]) idx.characterToMaps![cid] = []
      idx.characterToMaps![cid].push(mp)
    })
  })
  // Also include spawns if available
  if (d.spawns) {
    ;(d.spawns || []).forEach((sp) => {
      if (typeof sp.object === "string") {
        if (!idx.characterToMaps![sp.object]) idx.characterToMaps![sp.object] = []
        // spawns don't have map info in this structure; would need reverse lookup
      }
    })
  }

  // map → music (via tileset or music field)
  idx.mapToMusic = {}
  ;(d.music || []).forEach((m) => {
    idx.mapToMusic![m.id] = m
  })
  ;(d.maps || []).forEach((mp) => {
    const musicId = mp.music || mp.tileset
    if (musicId && idx.mapToMusic![musicId]) {
      idx.mapToMusic![mp.id] = idx.mapToMusic![musicId]
    }
  })

  store.index = idx
}

export const select = {
  get(cat: string, id: string): MewRec | null {
    const m = store.index?.byCat[cat]
    if (m && m[id]) return m[id]
    if (cat === "abilities" && store.index) return store.index.abilAll[id] || null
    return null
  },
  ability: (id: string): MewRec | null => (store.index ? store.index.abilAll[id] : null) || null,
  find(id?: string): { cat: string; rec: MewRec } | null {
    if (!store.index || id == null) return null
    for (const c of MEW_CATS) {
      const r = store.index.byCat[c.key][id]
      if (r) return { cat: c.key, rec: r }
    }
    return null
  },
  char(id?: string): MewRec | null {
    if (!store.index || id == null) return null
    return store.index.byCat.characters[id] || store.index.lowerChar[String(id).toLowerCase()] || null
  },
  effect: (id: string) => (store.index ? store.index.effect[id] : null) || null,
  name(id: string): string {
    const f = select.find(id)
    if (f) return f.rec.name || mewHuman(id)
    const c = select.char(id)
    if (c) return c.name
    const a = select.ability(id)
    if (a) return a.name || mewHuman(id)
    return mewHuman(id)
  },
  catOf(id: string): string | null {
    const f = select.find(id)
    if (f) return f.cat
    if (select.char(id)) return "characters"
    if (select.ability(id)) return "abilities"
    return null
  },
  charactersUsingItem(itemId: string): MewRec[] {
    return (store.data?.characters || []).filter((c) => {
      if (!c.equipment) return false
      // Walk the equipment values to compare ids exactly, avoiding substring false positives
      if (Array.isArray(c.equipment)) {
        return c.equipment.some((e) => {
          if (!e || typeof e !== "object") return e === itemId
          if (e.id === itemId) return true
          // Check nested structure if equipment is an object with id
          return false
        })
      }
      return Object.values(c.equipment).some((e) => {
        if (e === itemId) return true
        if (e && typeof e === "object" && (e as any).id === itemId) return true
        return false
      })
    })
  },
  set(setId: string): MewRec {
    const members = (store.data?.items || [])
      .filter((it) => {
        const s = Array.isArray(it.set) ? it.set : it.set ? [it.set] : []
        return s.indexOf(setId) >= 0
      })
      .map((it) => ({ id: it.id, name: it.name, kind: it.kind || "" }))
    return { id: setId, name: mewHuman(setId), members }
  },
  itemSources(itemId: string) {
    return store.itemSources?.[itemId] || { from_pools: [], from_shops: [] }
  },
  keywordAppliedBy(keywordId: string): MewRec[] {
    return store.index?.keywordAppliedBy?.[keywordId] || []
  },
  passiveGrantedBy(passiveId: string): { kind: string; recs: MewRec[] } {
    return store.index?.passiveGrantedBy?.[passiveId] || { kind: "", recs: [] }
  },
  classToCharacters(classId: string): MewRec[] {
    return store.index?.classToCharacters?.[classId] || []
  },
  abilityUsedBy(abilityId: string): { chars: MewRec[]; classes: MewRec[] } {
    return store.index?.abilityUsedBy?.[abilityId] || { chars: [], classes: [] }
  },
  itemSources2(itemId: string): { pools: MewRec[]; shops: MewRec[] } {
    return store.index?.itemToSources?.[itemId] || { pools: [], shops: [] }
  },
  /** Every item a shop can stock, resolved through its pool slots. */
  shopStock(shopId: string): string[] {
    return store.index?.shopStock?.[shopId] || []
  },
  characterToMaps(characterId: string): MewRec[] {
    return store.index?.characterToMaps?.[characterId] || []
  },
  mapToMusic(mapId: string): MewRec | null {
    return store.index?.mapToMusic?.[mapId] || null
  },
}
