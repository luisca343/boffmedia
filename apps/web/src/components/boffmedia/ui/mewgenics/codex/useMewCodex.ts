"use client"

import * as React from "react"
import { MewData, select, useMewData } from "../mew-store"
import { MEW, MEW_CATS, type MewRec } from "../mew-util"
import { CX_CAP, CX_FILTERS, cxReadHash, cxSearchText, cxTitle, cxWriteHash, type FilterDef, type TrailItem } from "./codex-config"

export interface FilterOption { value: string; label: string; count: number; color?: string }
export interface FilterGroup extends FilterDef { options: FilterOption[] }

/**
 * All codex state, derivations and navigation handlers. The shell + chrome + roster
 * components are pure presenters of this model (separates state logic from render).
 */
export function useMewCodex() {
  const { ready, error, rev } = useMewData()
  const boot = React.useRef(true)
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const detailRef = React.useRef<HTMLElement>(null)

  // Start from the SSR-safe default; the deep-link hash is applied post-mount
  // (reading window.location.hash in the initializer would break hydration).
  const [cat, setCat] = React.useState("items")
  const [selId, setSelId] = React.useState<string | null>(null)
  const [q, setQ] = React.useState("")
  const [filters, setFilters] = React.useState<Record<string, string>>({})
  const [sort, setSort] = React.useState("name")
  const [view, setView] = React.useState<"grid" | "list">("grid")
  const [rosterOpen, setRosterOpen] = React.useState(false)
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
      return { ...fd, options: keys.map((k) => ({ value: k, label: fd.labelFn ? fd.labelFn(k) : k, count: counts[k], color: fd.colorFn ? fd.colorFn(k) : undefined })) }
    })
  }, [cat, list])

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

  const ensureVisible = React.useCallback((id: string) => {
    const sc = scrollRef.current
    if (!sc) return
    let el: HTMLElement | null = null
    try { el = sc.querySelector('[data-cxid="' + (window.CSS && CSS.escape ? CSS.escape(id) : id) + '"]') } catch { /* noop */ }
    if (!el) return
    const r = el.getBoundingClientRect(), rs = sc.getBoundingClientRect()
    if (r.top < rs.top + 10) sc.scrollTop += r.top - (rs.top + 10)
    else if (r.bottom > rs.bottom - 10) sc.scrollTop += r.bottom - (rs.bottom - 10)
  }, [])

  const pick = React.useCallback((id: string) => {
    setSelId(id)
    setRosterOpen(false)
    requestAnimationFrame(() => { if (detailRef.current) detailRef.current.scrollTop = 0 })
  }, [])
  const pickCat = (k: string) => { setCat(k); setQ(""); setFilters({}); setSort("name"); setSelId(null) }
  const onNav = (nextCat: string, id: string) => {
    if (!MEW.catBy[nextCat]) return
    if (nextCat !== cat) { setCat(nextCat); setQ(""); setFilters({}); setSort("name") }
    pick(id)
  }
  const randomPick = () => {
    const arr = filtered.length ? filtered : list
    if (!arr.length) return
    const r = arr[Math.floor(Math.random() * arr.length)]
    pick(r.id)
    requestAnimationFrame(() => ensureVisible(r.id))
  }

  // default selection when category changes / on ready / when list populates late
  React.useEffect(() => {
    if (!ready) return
    if (boot.current) { boot.current = false; if (selId && select.get(cat, selId)) return }
    if (!selId || !select.get(cat, selId)) setSelId(filtered.length ? filtered[0].id : null)
  }, [ready, cat, filtered.length])

  React.useEffect(() => { if (ready && selId) cxWriteHash(cat, selId) }, [cat, selId, ready])

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

  // keyboard: ↑/↓ entries · ←/→ categories · "/" focuses search
  React.useEffect(() => {
    if (!ready) return
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      const tag = (t?.tagName || "").toLowerCase()
      const typing = tag === "input" || tag === "textarea" || tag === "select" || t?.isContentEditable
      if (e.key === "/" && !typing) {
        e.preventDefault()
        const el = scrollRef.current?.closest(".mew-roster")?.querySelector("input")
        if (el) (el as HTMLInputElement).focus()
        return
      }
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        if (!shown.length) return
        e.preventDefault()
        const idx = shown.findIndex((r) => r.id === selId)
        const ni = idx < 0 ? 0 : Math.max(0, Math.min(shown.length - 1, idx + (e.key === "ArrowDown" ? 1 : -1)))
        const next = shown[ni]
        if (next && next.id !== selId) { pick(next.id); requestAnimationFrame(() => ensureVisible(next.id)) }
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
    cat, selId, q, filters, sort, view, rosterOpen, trail,
    setQ, setFilters, setSort, setView, setRosterOpen,
    scrollRef, detailRef,
    filterOpts, filtered, shown, selRec, total, abilitiesLoading,
    pick, pickCat, onNav, randomPick,
  }
}

export type MewCodexModel = ReturnType<typeof useMewCodex>
