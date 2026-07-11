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
    return (store.data?.characters || []).filter((c) => c.equipment && JSON.stringify(c.equipment).indexOf(itemId) >= 0)
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
}
