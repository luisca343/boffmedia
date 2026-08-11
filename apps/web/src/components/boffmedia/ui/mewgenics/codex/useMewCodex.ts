"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { MewData, select, useMewData } from "../mew-store"
import { MEW, MEW_CATS, type MewRec } from "../mew-util"
import { CX_CAP, CX_FILTERS, CX_SORT, cxReadHash, cxSearchText, cxTitle, cxWriteHash, type FilterDef, type TrailItem } from "./codex-config"

export interface FilterOption { value: string; label: string; count: number; color?: string }
export interface FilterGroup extends FilterDef { options: FilterOption[] }

/**
 * All codex state, derivations and navigation handlers. The shell, chrome, browse
 * grid and fiche are pure presenters of this model.
 *
 * The codex is two screens, not two panes: `selId === null` is the browse grid,
 * a selection is the fiche. Nothing auto-selects, so you always land on the grid
 * unless a deep link names an entry.
 */
export function useMewCodex() {
  const t = useTranslations("mewgenics")
  const { ready, error, rev } = useMewData()
  const boot = React.useRef(true)
  // Wrapper, not the input: @boffmedia/ui's SearchInput does not forward a ref
  // and it is shared with the launcher, so it is not ours to change for this.
  const searchRef = React.useRef<HTMLDivElement>(null)
  // Where the browse grid was when we opened a fiche, so `back()` lands you on
  // the entry you clicked instead of at the top of the list.
  const browseScroll = React.useRef(0)

  // Start from the SSR-safe default; the deep-link hash is applied post-mount
  // (reading window.location.hash in the initializer would break hydration).
  const [cat, setCat] = React.useState("items")
  const [selId, setSelId] = React.useState<string | null>(null)
  const [q, setQ] = React.useState("")
  const [filters, setFilters] = React.useState<Record<string, string>>({})
  const [sort, setSort] = React.useState("name")
  const [view, setView] = React.useState<"grid" | "list">("grid")
  const [trail, setTrail] = React.useState<TrailItem[]>([])

  // apply the deep-link hash once, client-side (kept out of the initial render)
  React.useEffect(() => {
    const h = cxReadHash()
    if (h.c && MEW.catBy[h.c]) setCat(h.c)
    if (h.id) setSelId(h.id)
  }, [])

  const catDef = MEW.catBy[cat]
  // rev keeps this recompute honest when abilities arrive late
  const list: MewRec[] = React.useMemo(() => (ready && MewData.data[cat]) || [], [ready, cat, rev])
  const filterDefs = CX_FILTERS[cat] || []

  const filterOpts = React.useMemo<FilterGroup[]>(() => {
    return filterDefs.map((fd) => {
      const counts: Record<string, number> = {}
      list.forEach((r) => {
        const v = fd.from(r)
        if (v != null && v !== "") counts[v] = (counts[v] || 0) + 1
      })
      let keys = Object.keys(counts)
      if (fd.order) keys.sort((a, b) => { const ia = fd.order!.indexOf(a), ib = fd.order!.indexOf(b); return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.localeCompare(b) })
      else keys.sort((a, b) => counts[b] - counts[a] || a.localeCompare(b))
      // labelFn may return either a message key (`filter.kind.weapon`) or an already
      // human-readable label from mewHuman — only the former may reach t().
      const tk = (s: string) => (/^[a-z][\w]*(\.[\w]+)+$/.test(s) ? t(s) : s)
      return { ...fd, label: t(fd.label), options: keys.map((k) => ({ value: k, label: fd.labelFn ? tk(fd.labelFn(k)) : k, count: counts[k], color: fd.colorFn ? fd.colorFn(k) : undefined })) }
    })
  }, [cat, list, t])

  const filtered = React.useMemo(() => {
    const term = q.trim().toLowerCase()
    const out = list.filter((r) => {
      for (const fd of filterDefs) {
        const fv = filters[fd.key]
        if (fv && fd.from(r) !== fv) return false
      }
      if (term && cxSearchText(cat, r).indexOf(term) < 0) return false
      return true
    })
    const byName = (a: MewRec, b: MewRec) => cxTitle(a).localeCompare(cxTitle(b))
    const cmp: Record<string, (a: MewRec, b: MewRec) => number> = {
      name: byName,
      rarity: (a, b) => MEW.rarity(b.rarity).rank! - MEW.rarity(a.rarity).rank! || byName(a, b),
      kind: (a, b) => String(a.kind).localeCompare(String(b.kind)) || byName(a, b),
      hp: (a, b) => (b.hp || 0) - (a.hp || 0) || byName(a, b),
      faction: (a, b) => String(a.faction).localeCompare(String(b.faction)) || byName(a, b),
    }
    return out.slice().sort(cmp[sort] || byName)
  }, [list, q, filters, sort, cat])

  const shown = filtered.slice(0, CX_CAP)
  const selRec = selId ? select.get(cat, selId) : null

  // Browse ⇄ detail: `selId === null` is the grid, a selection is the fiche.
  const pick = React.useCallback((id: string) => {
    setSelId((cur) => {
      // Only remember the grid position when leaving it, not when hopping
      // between fiches via the trail or a cross-link.
      if (cur == null) browseScroll.current = window.scrollY
      return id
    })
    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }))
  }, [])

  const back = React.useCallback(() => {
    setSelId(null)
    const y = browseScroll.current
    requestAnimationFrame(() => window.scrollTo({ top: y }))
  }, [])

  const pickCat = (k: string) => {
    setCat(k); setQ(""); setFilters({}); setSort("name"); setSelId(null)
    browseScroll.current = 0
    requestAnimationFrame(() => window.scrollTo({ top: 0 }))
  }
  const onNav = (nextCat: string, id: string) => {
    if (!MEW.catBy[nextCat]) return
    if (nextCat !== cat) { setCat(nextCat); setQ(""); setFilters({}); setSort("name") }
    pick(id)
  }
  const randomPick = () => {
    const arr = filtered.length ? filtered : list
    if (!arr.length) return
    pick(arr[Math.floor(Math.random() * arr.length)].id)
  }

  // Browse-first: never auto-select. The only selection that survives mount is a
  // deep-linked one, which is why `boot` still clears a hash id that no longer
  // resolves (stale link, or a category whose remote data failed to load).
  React.useEffect(() => {
    if (!ready) return
    if (boot.current) { boot.current = false; if (selId && select.get(cat, selId)) return }
    if (selId && !select.get(cat, selId)) setSelId(null)
  }, [ready, cat, filtered.length])

  // Prev/next within the current result set, for the fiche's pager and ↑/↓.
  const selIdx = selId ? shown.findIndex((r) => r.id === selId) : -1
  const prevRec = selIdx > 0 ? shown[selIdx - 1] : null
  const nextRec = selIdx >= 0 && selIdx < shown.length - 1 ? shown[selIdx + 1] : null

  // Deep link tracks both modes: `?c=cat` while browsing, `?c=cat&id=…` on a fiche.
  React.useEffect(() => { if (ready) cxWriteHash(cat, selId) }, [cat, selId, ready])

  // trail of visited entities (dedup, newest first)
  React.useEffect(() => {
    if (!ready || !selRec) return
    const key = cat + ":" + selRec.id
    const name = cxTitle(selRec)
    setTrail((t) => {
      if (t.length && t[0].key === key) return t
      return [{ key, cat, id: selRec.id, name }].concat(t.filter((x) => x.key !== key)).slice(0, 8)
    })
  }, [cat, selId, ready])

  // Keyboard. The bindings are mode-aware now that browse and detail are separate
  // screens: ←/→ always walks categories, "/" always focuses search, but ↑/↓ pages
  // between fiches only while one is open, and Esc returns to the grid.
  React.useEffect(() => {
    if (!ready) return
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement
      const tag = (el?.tagName || "").toLowerCase()
      const typing = tag === "input" || tag === "textarea" || tag === "select" || el?.isContentEditable
      if (e.key === "/" && !typing) {
        e.preventDefault()
        if (selId) back()
        requestAnimationFrame(() => searchRef.current?.querySelector("input")?.focus())
        return
      }
      if (e.key === "Escape" && !typing && selId) { e.preventDefault(); back(); return }
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        if (!selId) return
        const next = e.key === "ArrowDown" ? nextRec : prevRec
        if (!next) return
        e.preventDefault()
        pick(next.id)
      } else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault()
        const i = MEW_CATS.findIndex((c) => c.key === cat)
        const n = MEW_CATS[(i + (e.key === "ArrowRight" ? 1 : MEW_CATS.length - 1)) % MEW_CATS.length]
        pickCat(n.key)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  })

  const total = ready ? MewData.total() : 0
  const abilitiesLoading = MewData.remoteState.abilities === "loading"

  return {
    ready, error, catDef,
    cat, selId, q, filters, sort, view, trail,
    setQ, setFilters, setSort, setView,
    searchRef,
    filterOpts, filtered, shown, selRec, total, abilitiesLoading,
    prevRec, nextRec,
    pick, back, pickCat, onNav, randomPick,
  }
}

export type MewCodexModel = ReturnType<typeof useMewCodex>
