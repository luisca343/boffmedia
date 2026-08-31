"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useLocale } from "next-intl"
import { MewData, select, useMewData } from "../mew-store"
import { MEW, MEW_CATS, type MewRec } from "../mew-util"
import { CX_CAP, CX_FILTERS, cxReadHash, cxSearchText, cxTitle, cxWriteHash, type FilterDef, type TrailItem } from "./codex-config"
import { useMewSounds } from "./useMewSounds"

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
  const locale = useLocale() as "es" | "en"
  const { ready, error, rev } = useMewData(locale)
  const boot = React.useRef(true)
  // Forward ref to the actual input for keyboard shortcuts
  const searchRef = React.useRef<HTMLInputElement>(null)
  // Ref to the codex container for scoped keyboard handling
  const codexRef = React.useRef<HTMLDivElement>(null)
  // Scroll per category: maps category key to the scroll offset when we left it
  const browseScroll = React.useRef<Record<string, number>>({})
  // Per-category state: preserve search/filters/sort when switching categories
  const catState = React.useRef<Record<string, { q: string; filters: Record<string, string>; sort: string }>>({})

  // Start from the SSR-safe default; the deep-link hash is applied post-mount
  // (reading window.location.hash in the initializer would break hydration).
  const [cat, setCat] = React.useState("items")
  const [selId, setSelId] = React.useState<string | null>(null)
  const [q, setQ] = React.useState("")
  const [filters, setFilters] = React.useState<Record<string, string>>({})
  const [sort, setSort] = React.useState("name")
  const [view, setView] = React.useState<"grid" | "list">("grid")
  const [trail, setTrail] = React.useState<TrailItem[]>([])
  const [shownCount, setShownCount] = React.useState(CX_CAP)
  const [favIds, setFavIds] = React.useState<Set<string>>(new Set())
  const [cursorEnabled, setCursorEnabled] = React.useState(false)
  const [soundEnabled, setSoundEnabled] = React.useState(false)
  const { playSound } = useMewSounds(soundEnabled)

  // apply the deep-link hash once, client-side (kept out of the initial render)
  // and listen for popstate + hash changes to sync state with browser history
  React.useEffect(() => {
    const h = cxReadHash()
    if (h.c && MEW.catBy[h.c]) setCat(h.c)
    if (h.id) setSelId(h.id)
    if (h.q) setQ(h.q)
    if (Object.keys(h.filters).length > 0) setFilters(h.filters)
    if (h.sort) setSort(h.sort)

    const onPopstate = () => {
      const h = cxReadHash()
      if (h.c && MEW.catBy[h.c]) setCat(h.c)
      setSelId(h.id || null)
      setQ(h.q)
      setFilters(h.filters)
      setSort(h.sort)
    }
    const onHashchange = () => {
      const h = cxReadHash()
      if (h.c && MEW.catBy[h.c]) setCat(h.c)
      setSelId(h.id || null)
      setQ(h.q)
      setFilters(h.filters)
      setSort(h.sort)
    }
    window.addEventListener("popstate", onPopstate)
    window.addEventListener("hashchange", onHashchange)
    return () => {
      window.removeEventListener("popstate", onPopstate)
      window.removeEventListener("hashchange", onHashchange)
    }
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
      const tk = (s: string, v?: string) => {
        if (!/^[a-z][\w]*(\.[\w]+)+$/.test(s)) return s
        if (s === "browse.act" && v) return t(s) + " " + v
        return t(s)
      }
      return { ...fd, label: t(fd.label), options: keys.map((k) => ({ value: k, label: fd.labelFn ? tk(fd.labelFn(k), k) : k, count: counts[k], color: fd.colorFn ? fd.colorFn(k) : undefined })) }
    })
  }, [cat, list, t])

  // Debounce search input (150ms) so filtering only runs on pause, not every keystroke
  const [debouncedQ, setDebouncedQ] = React.useState("")
  React.useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQ(q), 150)
    return () => clearTimeout(timer)
  }, [q])

  const filtered = React.useMemo(() => {
    const term = debouncedQ.trim().toLowerCase()
    const favOnly = filters.__fav === "1"
    const out = list.filter((r) => {
      for (const fd of filterDefs) {
        const fv = filters[fd.key]
        if (fv && fd.from(r) !== fv) return false
      }
      if (term && cxSearchText(cat, r).indexOf(term) < 0) return false
      if (favOnly && !isFav(r)) return false
      return true
    })
    const byName = (a: MewRec, b: MewRec) => cxTitle(a).localeCompare(cxTitle(b))
    const cmp: Record<string, (a: MewRec, b: MewRec) => number> = {
      name: byName,
      rarity: (a, b) => (MEW.rarity(b.rarity).rank ?? 999) - (MEW.rarity(a.rarity).rank ?? 999) || byName(a, b),
      kind: (a, b) => String(a.kind).localeCompare(String(b.kind)) || byName(a, b),
      hp: (a, b) => (b.hp || 0) - (a.hp || 0) || byName(a, b),
      faction: (a, b) => String(a.faction).localeCompare(String(b.faction)) || byName(a, b),
    }
    return out.slice().sort(cmp[sort] || byName)
  }, [list, debouncedQ, filters, sort, cat, favIds])

  const shown = filtered.slice(0, shownCount)
  const selRec = selId ? select.get(cat, selId) : null
  const canLoadMore = shownCount < filtered.length

  // Reset pagination when filters/sort/category/search change
  React.useEffect(() => {
    setShownCount(CX_CAP)
  }, [cat, q, filters, sort])

  // Browse ⇄ detail: `selId === null` is the grid, a selection is the fiche.
  // Opening a fiche (first pick or cross-link) pushes history; back walks it.
  //
  // The history write stays OUT of the setSelId updater: React runs updaters in
  // the render phase, and Next patches history.pushState to update the Router —
  // mutating it from there is a setState-during-render on another component.
  const pick = React.useCallback((id: string, catOverride?: string) => {
    const c = catOverride ?? cat
    const url = window.location.hash.split("?")[0] + "?" + new URLSearchParams({
      c,
      id,
      ...(q ? { q } : {}),
      ...(sort !== "name" ? { sort } : {}),
      ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v).map(([k, v]) => [`f_${k}`, v])),
    }).toString()
    if (selId == null) {
      browseScroll.current[c] = window.scrollY
      window.history.pushState(null, "", url)
    } else {
      window.history.replaceState(null, "", url)
    }
    setSelId(id)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
        window.scrollTo({ top: 0, behavior: prefersReduced ? "auto" : "smooth" })
      })
    })
  }, [cat, selId, q, sort, filters])

  const back = React.useCallback(() => {
    // If the previous entry is the grid (category-only hash), use history.back()
    // to walk naturally; else just clear selId and restore grid scroll
    if (window.history.length > 1) {
      window.history.back()
    } else {
      setSelId(null)
      const y = browseScroll.current[cat] ?? 0
      requestAnimationFrame(() => {
        requestAnimationFrame(() => window.scrollTo({ top: y }))
      })
    }
  }, [cat])

  const pickCat = (k: string) => {
    catState.current[cat] = { q, filters, sort }
    const restored = catState.current[k] || { q: "", filters: {}, sort: "name" }
    setCat(k)
    setQ(restored.q)
    setFilters(restored.filters)
    setSort(restored.sort)
    setSelId(null)
    browseScroll.current[k] = 0
    const p = new URLSearchParams()
    p.set("c", k)
    if (restored.q) p.set("q", restored.q)
    if (restored.sort !== "name") p.set("sort", restored.sort)
    Object.entries(restored.filters).forEach(([fk, fv]) => {
      if (fv) p.set(`f_${fk}`, fv)
    })
    window.history.replaceState(null, "", window.location.hash.split("?")[0] + (p.toString() ? "?" + p.toString() : ""))
    requestAnimationFrame(() => window.scrollTo({ top: 0 }))
  }
  const onNav = (nextCat: string, id: string) => {
    if (!MEW.catBy[nextCat]) return
    const catChanged = nextCat !== cat
    if (catChanged) {
      catState.current[cat] = { q, filters, sort }
      const restored = catState.current[nextCat] || { q: "", filters: {}, sort: "name" }
      setCat(nextCat)
      setQ(restored.q)
      setFilters(restored.filters)
      setSort(restored.sort)
    }
    pick(id, nextCat)
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

  // Prev/next within the full filtered set (not capped at shownCount)
  const selIdx = selId ? filtered.findIndex((r) => r.id === selId) : -1
  const prevRec = selIdx > 0 ? filtered[selIdx - 1] : null
  const nextRec = selIdx >= 0 && selIdx < filtered.length - 1 ? filtered[selIdx + 1] : null

  // trail of visited entities (dedup, newest first) + persist to localStorage
  React.useEffect(() => {
    if (!ready || !selRec) return
    const key = cat + ":" + selRec.id
    const name = cxTitle(selRec)
    setTrail((t) => {
      if (t.length && t[0].key === key) return t
      const updated = [{ key, cat, id: selRec.id, name }].concat(t.filter((x) => x.key !== key)).slice(0, 8)
      try {
        localStorage.setItem("mew-codex:trail", JSON.stringify(updated))
      } catch { /* noop */ }
      return updated
    })
  }, [cat, selId, ready])

  // Load trail from localStorage on mount
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem("mew-codex:trail")
      if (stored) setTrail(JSON.parse(stored))
    } catch { /* noop */ }
  }, [])

  // Load favorites from localStorage on mount
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem("mew-codex:favs")
      if (stored) setFavIds(new Set(JSON.parse(stored)))
    } catch { /* noop */ }
  }, [])

  // Load view mode from localStorage on mount
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem("mew-codex:view")
      if (stored && (stored === "grid" || stored === "list")) setView(stored as "grid" | "list")
    } catch { /* noop */ }
  }, [])

  // Persist view mode to localStorage when it changes
  React.useEffect(() => {
    try {
      localStorage.setItem("mew-codex:view", view)
    } catch { /* noop */ }
  }, [view])

  // Load cursor toggle from localStorage on mount
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem("mew-codex:cursor")
      if (stored === "1") setCursorEnabled(true)
    } catch { /* noop */ }
  }, [])

  // Persist cursor toggle to localStorage when it changes
  React.useEffect(() => {
    try {
      localStorage.setItem("mew-codex:cursor", cursorEnabled ? "1" : "0")
    } catch { /* noop */ }
  }, [cursorEnabled])

  // Load sound toggle from localStorage on mount
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem("mew-codex:sound")
      const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      if (stored === "1" && !prefersReduced) setSoundEnabled(true)
    } catch { /* noop */ }
  }, [])

  // Persist sound toggle to localStorage when it changes
  React.useEffect(() => {
    try {
      localStorage.setItem("mew-codex:sound", soundEnabled ? "1" : "0")
    } catch { /* noop */ }
  }, [soundEnabled])

  const isFav = (rec: MewRec) => favIds.has(`${cat}:${rec.id}`)
  const toggleFav = React.useCallback((rec: MewRec) => {
    setFavIds((f) => {
      const key = `${cat}:${rec.id}`
      const updated = new Set(f)
      if (updated.has(key)) updated.delete(key)
      else updated.add(key)
      try {
        localStorage.setItem("mew-codex:favs", JSON.stringify(Array.from(updated)))
      } catch { /* noop */ }
      return updated
    })
  }, [cat])

  // Keyboard. The bindings are mode-aware now that browse and detail are separate
  // screens: ←/→ always walks categories, "/" always focuses search, but ↑/↓ pages
  // between fiches only while one is open, and Esc returns to the grid.
  React.useEffect(() => {
    if (!ready) return
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement
      const tag = (el?.tagName || "").toLowerCase()
      const typing = tag === "input" || tag === "textarea" || tag === "select" || el?.isContentEditable
      // Skip arrow keys only if genuinely interactive elements have focus
      const isInteractive = el?.tagName === "BUTTON" || el?.tagName === "A" || el?.getAttribute("role") === "tab"

      if (e.key === "/" && !typing) {
        e.preventDefault()
        if (selId) back()
        requestAnimationFrame(() => searchRef.current?.focus())
        return
      }
      if (e.key === "Escape" && !typing && selId) { e.preventDefault(); back(); return }
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        if (!selId || isInteractive) return
        const next = e.key === "ArrowDown" ? nextRec : prevRec
        if (!next) return
        e.preventDefault()
        pick(next.id)
      } else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        if (isInteractive) return
        e.preventDefault()
        const i = MEW_CATS.findIndex((c) => c.key === cat)
        const n = MEW_CATS[(i + (e.key === "ArrowRight" ? 1 : MEW_CATS.length - 1)) % MEW_CATS.length]
        pickCat(n.key)
      }
    }
    const container = codexRef.current
    if (container) {
      container.addEventListener("keydown", onKey)
      return () => container.removeEventListener("keydown", onKey)
    }
  }, [ready, selId, nextRec, prevRec, cat, pick, back, pickCat])

  const total = ready ? MewData.total() : 0
  const abilitiesLoading = MewData.remoteState.abilities === "loading"
  const loadMore = React.useCallback(() => setShownCount((c) => c + CX_CAP), [])

  return {
    ready, error, catDef,
    cat, selId, q, filters, sort, view, trail, shownCount, favIds, cursorEnabled, soundEnabled,
    setQ, setFilters, setSort, setView, setCursorEnabled, setSoundEnabled,
    searchRef, codexRef,
    filterOpts, filtered, shown, selRec, total, abilitiesLoading,
    prevRec, nextRec,
    pick, back, pickCat, onNav, randomPick, loadMore, canLoadMore, isFav, toggleFav, playSound,
  }
}

export type MewCodexModel = ReturnType<typeof useMewCodex>
