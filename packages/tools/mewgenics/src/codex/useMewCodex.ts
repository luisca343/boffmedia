"use client"

import * as React from "react"
import { useToolT, useLocale, asMewLang, MEWGENICS_NS } from "../i18n"
import { MewData, select, useMewData } from "../mew-store"
import { MEW, MEW_CATS, type MewRec } from "../mew-util"
import { CX_CAP, CX_FILTERS, cxBuildHash, cxParseHash, cxSearchText, cxTitle, type FilterDef, type TrailItem } from "./codex-config"
import { useMewNav } from "../nav"
import { mewRead, mewWrite } from "../storage"
import { scrollPortTo, scrollPortToSettled, scrollTopOf } from "../scrollport"
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
  const t = useToolT(MEWGENICS_NS)
  const locale = asMewLang(useLocale())
  const { ready, error, rev } = useMewData(locale)
  const nav = useMewNav()
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

  // Apply the address on mount and whenever the host reports a new one.
  //
  // On the web that covers the deep link, the back button and a pasted hash —
  // the three things the two `popstate`/`hashchange` listeners used to cover
  // separately, which is why they collapse into one effect here. In the
  // launcher `nav.hash` only changes when this tool changes it, so the same
  // effect keeps state and address in step with no host involvement at all.
  React.useEffect(() => {
    const h = cxParseHash(nav.hash)
    if (h.c && MEW.catBy[h.c]) setCat(h.c)
    setSelId(h.id || null)
    setQ(h.q)
    setFilters(h.filters)
    setSort(h.sort)
  }, [nav.hash])

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
    // 488 of 760 mutations are bare numbered stat rolls (`numbered`, set by the
    // normalizer from the absence of a description AND a passive). They bury
    // the 272 real ones, so they are folded away until asked for.
    const showNumbered = filters.__numbered === "1"
    const out = list.filter((r) => {
      if (r.numbered && !showNumbered) return false
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
  /** How many records the numbered-mutation fold is currently hiding. */
  const numberedHidden = React.useMemo(
    () => (filters.__numbered === "1" ? 0 : list.reduce((n, r) => n + (r.numbered ? 1 : 0), 0)),
    [list, filters.__numbered],
  )
  const selRec = selId ? select.get(cat, selId) : null
  const canLoadMore = shownCount < filtered.length

  // Reset pagination when filters/sort/category/search change
  React.useEffect(() => {
    setShownCount(CX_CAP)
  }, [cat, q, filters, sort])

  // Browse ⇄ detail: `selId === null` is the grid, a selection is the fiche.
  // Opening a fiche (first pick or cross-link) pushes an entry; back walks it.
  //
  // The address write stays OUT of the setSelId updater: React runs updaters in
  // the render phase, and on the web `nav.push` mutates history, which Next
  // patches to update the Router — mutating it from there is a setState-during-
  // render on another component.
  const pick = React.useCallback((id: string, catOverride?: string) => {
    const c = catOverride ?? cat
    const hash = cxBuildHash(c, id, q, filters, sort)
    if (selId == null) {
      // Remember where the grid was before it is replaced by the fiche, so
      // `back` can put the player back on the row they clicked.
      browseScroll.current[c] = scrollTopOf(codexRef.current)
      nav.push(hash)
    } else {
      nav.replace(hash)
    }
    setSelId(id)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        scrollPortTo(codexRef.current, 0, true)
        // Move focus onto the codex container so Escape (bound on it,
        // container-scoped) works right away. Without this, opening a fiche
        // any way other than a click — a deep link, ArrowUp/ArrowDown paging
        // — left focus on <body>, and a keydown there never reaches this
        // container's listener.
        codexRef.current?.focus({ preventScroll: true })
      })
    })
  }, [cat, selId, q, sort, filters, nav])

  const back = React.useCallback(() => {
    // `nav.back()` walks only entries THIS TOOL pushed and says whether it
    // found one. The old test was `window.history.length > 1`, which is the
    // whole tab's depth: it was true after any ordinary browsing, so the grid
    // was restored by luck on the web and would have walked the player out of
    // the tool entirely in the launcher.
    const y = browseScroll.current[cat] ?? 0
    const restore = () => scrollPortToSettled(codexRef.current, y)
    if (nav.back()) {
      // Only where the host does not do it itself. The browser restores the
      // document scroll after a `history.back()` and waits for layout to settle
      // first; the launcher's memory backing has no such machinery, so without
      // this "back" landed the player at the top of a list they were halfway
      // down. Doing it in BOTH raced the browser and lost the difference —
      // two animation frames is too early on a grid whose art is still arriving.
      if (!nav.restoresScroll) restore()
      return
    }
    setSelId(null)
    nav.replace(cxBuildHash(cat, null, q, filters, sort))
    restore()
  }, [cat, q, filters, sort, nav])

  const pickCat = (k: string) => {
    catState.current[cat] = { q, filters, sort }
    const restored = catState.current[k] || { q: "", filters: {}, sort: "name" }
    setCat(k)
    setQ(restored.q)
    setFilters(restored.filters)
    setSort(restored.sort)
    setSelId(null)
    browseScroll.current[k] = 0
    nav.replace(cxBuildHash(k, null, restored.q, restored.filters, restored.sort))
    requestAnimationFrame(() => scrollPortTo(codexRef.current, 0))
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

  // trail of visited entities (dedup, newest first) + persist
  React.useEffect(() => {
    if (!ready || !selRec) return
    const key = cat + ":" + selRec.id
    const name = cxTitle(selRec)
    setTrail((t) => {
      if (t.length && t[0].key === key) return t
      const updated = [{ key, cat, id: selRec.id, name }].concat(t.filter((x) => x.key !== key)).slice(0, 8)
      mewWrite("trail", updated)
      return updated
    })
  }, [cat, selId, ready])

  // Load the remembered preferences on mount.
  //
  // One effect rather than the five it used to be, because the reads are
  // asynchronous now (`toolStorage` is a promise in both hosts) and five
  // independent async effects would each need their own cancellation. `alive`
  // is that cancellation: a read can resolve after the tool has been closed,
  // and setting state then is a leak warning at best.
  React.useEffect(() => {
    let alive = true
    void (async () => {
      const [trail, favs, view, cursor, sound] = await Promise.all([
        mewRead<TrailItem[]>("trail"),
        mewRead<string[]>("favs"),
        mewRead<string>("view"),
        mewRead<string>("cursor"),
        mewRead<string>("sound"),
      ])
      if (!alive) return
      if (Array.isArray(trail)) setTrail(trail)
      if (Array.isArray(favs)) setFavIds(new Set(favs))
      if (view === "grid" || view === "list") setView(view)
      if (cursor === "1") setCursorEnabled(true)
      // Sound stays off for anyone who asked for less motion, exactly as
      // before — the toggle is a preference, not an override of that request.
      if (sound === "1" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setSoundEnabled(true)
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  // Persist the three toggles when they change. `boot` is not consulted here:
  // writing the value that was just read back is harmless, and skipping the
  // first change would lose a toggle flipped before the read resolved.
  React.useEffect(() => {
    mewWrite("view", view)
  }, [view])

  React.useEffect(() => {
    mewWrite("cursor", cursorEnabled ? "1" : "0")
  }, [cursorEnabled])

  React.useEffect(() => {
    mewWrite("sound", soundEnabled ? "1" : "0")
  }, [soundEnabled])

  const isFav = (rec: MewRec) => favIds.has(`${cat}:${rec.id}`)
  const toggleFav = React.useCallback((rec: MewRec) => {
    setFavIds((f) => {
      const key = `${cat}:${rec.id}`
      const updated = new Set(f)
      if (updated.has(key)) updated.delete(key)
      else updated.add(key)
      mewWrite("favs", Array.from(updated))
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
    filterOpts, filtered, shown, selRec, total, abilitiesLoading, numberedHidden,
    prevRec, nextRec,
    pick, back, pickCat, onNav, randomPick, loadMore, canLoadMore, isFav, toggleFav, playSound,
  }
}

export type MewCodexModel = ReturnType<typeof useMewCodex>
