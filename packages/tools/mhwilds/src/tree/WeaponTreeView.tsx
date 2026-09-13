"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useToolT } from "../i18n"
import { Button, Chip, Empty, Icon, Select, Spinner, ToolTitle } from "@boffmedia/ui"
import { useWeaponTreeData } from "./useWeaponTreeData"
import {
  MhApp, MhBar, MhBarSide, MhBody, MhWrap, MhSeal, MhModes, MhSrc, MhSearch,
  MhTypeChip, MhNodeCard, MhDrawer, MhRarity, MhStat3, MhElement, MhAttributeIcon, MhMaterial, MhLabel, MhLoadError,
  MhMeter,
} from "../ui/mh-kit"
import { MH_ELEMENT_KEYS, MH_WEAPON_AILMENT_KEYS, WEAPON_TYPES, weaponAttack, firstSpecial, elementColor, normalizeAttributeKey } from "../ui/mh-helpers"
import { mhwildsWeaponAsset } from "../bestiary/assets"
import { useWishlist, weaponWishlistEntry } from "../planner/_utils/wishlist"
import { WishlistLink } from "../planner/_components/WishlistLink"

type Node = any

const NODE_W = 252
const NODE_H = 88
const COL = NODE_W + 96
const ROW = NODE_H + 26
const ROOT_GAP = 36
const CANVAS_TOP_PAD = 104
const CANVAS_BOTTOM_PAD = 56
const LS_OWNED = "mh_tree_owned_v3"

function tLoad(): Record<string, Record<string, boolean>> {
  if (typeof window === "undefined") return {}
  try { return JSON.parse(localStorage.getItem(LS_OWNED) || "{}") || {} } catch { return {} }
}

function occurrenceKey(node: Node, parentKey: string, rootIndex?: number): string {
  return node.pathKey || `${parentKey || `root-${rootIndex ?? 0}`}/${String(node.id)}`
}

function computeLayout(roots: Node[]) {
  const pos: Record<string, { x: number; y: number; node: Node }> = {}
  let leaf = 0
  function assign(node: Node, depth: number, parentKey: string, rootIndex: number): number {
    const key = occurrenceKey(node, parentKey, rootIndex)
    const x = depth * COL
    if (!node.children || node.children.length === 0) {
      const y = leaf * ROW; leaf++; pos[key] = { x, y, node }; return y
    }
    const ys = node.children.map((c: Node) => assign(c, depth + 1, key, rootIndex))
    const y = (ys[0] + ys[ys.length - 1]) / 2
    pos[key] = { x, y, node }; return y
  }
  roots.forEach((r, index) => {
    assign(r, 0, "", index)
    if (index < roots.length - 1) leaf += ROOT_GAP / ROW
  })
  const edges: { from: string; to: string }[] = []
  Object.entries(pos).forEach(([from, p]) => (p.node.children || []).forEach((c: Node) => edges.push({ from, to: occurrenceKey(c, from) })))
  const xs = Object.values(pos).map((p) => p.x)
  const ys = Object.values(pos).map((p) => p.y)
  return { pos, edges, width: (xs.length ? Math.max(...xs) : 0) + NODE_W, height: (ys.length ? Math.max(...ys) : 0) + NODE_H }
}

function flatten(roots: Node[]): { node: Node; depth: number; key: string }[] {
  const out: { node: Node; depth: number; key: string }[] = []
  const walk = (n: Node, d: number, parentKey: string, rootIndex: number) => {
    const key = occurrenceKey(n, parentKey, rootIndex)
    out.push({ node: n, depth: d, key })
    for (const child of n.children || []) walk(child, d + 1, key, rootIndex)
  }
  roots.forEach((r, index) => walk(r, 0, "", index))
  return out
}

export function WeaponTreeView() {
  const t = useToolT("tools.mhwilds")
  const { weaponTree, loading, error, refreshData } = useWeaponTreeData()

  const treeByKind: Record<string, Node[]> = weaponTree?.treeByKind || {}
  const availableTypes = useMemo<string[]>(() => WEAPON_TYPES.filter((k) => treeByKind[k]?.length), [treeByKind])
  const soonTypes = useMemo<string[]>(() => WEAPON_TYPES.filter((k) => !treeByKind[k]?.length), [treeByKind])

  const [type, setType] = useState<string>("long-sword")
  const [view, setView] = useState<"tree" | "outline">("tree")
  const [selKey, setSelKey] = useState<string | null>(null)
  const [owned, setOwned] = useState<Record<string, Record<string, boolean>>>({})
  const [q, setQ] = useState("")
  const [fRar, setFRar] = useState("all")
  const [fEl, setFEl] = useState("all")
  const [pathMode, setPathMode] = useState(true)
  const [xf, setXf] = useState({ scale: 1, tx: 40, ty: CANVAS_TOP_PAD })
  const [isPanning, setIsPanning] = useState(false)

  const stageRef = useRef<HTMLDivElement>(null)
  const drag = useRef<{ pointerId: number; x: number; y: number; tx: number; ty: number } | null>(null)

  useEffect(() => { setOwned(tLoad()) }, [])
  // once data lands, ensure the active type actually exists
  useEffect(() => {
    if (availableTypes.length && !availableTypes.includes(type)) {
      setType(availableTypes.includes("long-sword") ? "long-sword" : availableTypes[0])
    }
  }, [availableTypes, type])

  const roots = treeByKind[type] || []
  const layout = useMemo(() => computeLayout(roots), [roots])
  const nodesByKey = useMemo(() => layout.pos, [layout])
  const allOccurrences = useMemo(() => Object.entries(layout.pos).map(([key, value]) => ({ key, node: value.node })), [layout])
  const allNodes = useMemo(() => allOccurrences.map(({ node }) => node), [allOccurrences])
  const total = allNodes.length
  const ownedSet = owned[type] || {}
  const ownedCount = allNodes.filter((n) => ownedSet[String(n.id)]).length
  const sel = selKey != null ? layout.pos[selKey]?.node || null : null

  const fit = useCallback(() => {
    const st = stageRef.current; if (!st) return
    const sw = st.clientWidth
    // Fit the columns, not the entire vertical progression. A full-tree fit
    // turns a readable weapon card into a thumbnail because the graph is much
    // taller than the viewport; the canvas remains intentionally document-sized
    // so the player can pan through the progression at a useful scale.
    const scale = Math.min((sw - 64) / (layout.width || 1), 1)
    const s = Math.max(0.55, scale)
    setXf({ scale: s, tx: Math.max(24, (sw - layout.width * s) / 2), ty: CANVAS_TOP_PAD })
  }, [layout])
  // Keep a readable starting scale when changing weapon families. The player
  // can use Fit to centre the columns, but we never cram the whole graph into
  // the visible height.
  useEffect(() => {
    setXf({ scale: 1, tx: 40, ty: CANVAS_TOP_PAD })
    setSelKey(null)
  }, [type, view])

  const zoomAround = useCallback((factor: number, clientX?: number, clientY?: number) => {
    const st = stageRef.current
    if (!st) return
    const rect = st.getBoundingClientRect()
    const visibleTop = Math.max(0, -rect.top)
    const visibleBottom = Math.min(st.clientHeight, window.innerHeight - rect.top)
    const centerY = visibleBottom > visibleTop ? (visibleTop + visibleBottom) / 2 : st.clientHeight / 2
    const mx = clientX == null ? st.clientWidth / 2 : clientX - rect.left
    const my = clientY == null ? centerY : clientY - rect.top
    setXf((c) => {
      const ns = Math.min(2, Math.max(0.3, c.scale * factor))
      const k = ns / c.scale
      return { scale: ns, tx: mx - (mx - c.tx) * k, ty: my - (my - c.ty) * k }
    })
  }, [])

  // A document-layout tool must leave the normal wheel available for page
  // scrolling. Ctrl/Cmd+wheel is the conventional canvas zoom gesture and
  // must use a native non-passive listener so the browser cannot scroll behind
  // the zoom. Trackpad pinch gestures arrive here as Ctrl+wheel on Chromium.
  useEffect(() => {
    const st = stageRef.current
    if (!st || view !== "tree") return
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return
      e.preventDefault()
      e.stopPropagation()
      const delta = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY
      const boundedDelta = Math.max(-120, Math.min(120, delta))
      zoomAround(Math.exp(-boundedDelta * 0.0015), e.clientX, e.clientY)
    }
    st.addEventListener("wheel", onWheel, { passive: false })
    return () => st.removeEventListener("wheel", onWheel)
  }, [layout, view, zoomAround])

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 || e.pointerType === "touch") return
    const target = e.target as HTMLElement
    if (target.closest("[data-node], [data-canvas-ui], button, a, input, select, textarea")) return
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { pointerId: e.pointerId, x: e.clientX, y: e.clientY, tx: xf.tx, ty: xf.ty }
    setIsPanning(true)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    const activeDrag = drag.current
    if (!activeDrag || activeDrag.pointerId !== e.pointerId) return
    e.preventDefault()
    // Capture the ref before entering React's functional updater. Pointer-up
    // can clear drag.current before React executes the updater, which was the
    // source of the intermittent "cannot read properties of null (reading tx)".
    setXf((c) => ({ ...c, tx: activeDrag.tx + (e.clientX - activeDrag.x), ty: activeDrag.ty + (e.clientY - activeDrag.y) }))
  }
  const endDrag = (e: React.PointerEvent) => {
    if (drag.current?.pointerId !== e.pointerId) return
    drag.current = null
    setIsPanning(false)
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId)
  }
  const onLostPointerCapture = (e: React.PointerEvent) => {
    if (drag.current?.pointerId !== e.pointerId) return
    drag.current = null
    setIsPanning(false)
  }
  const zoom = (dir: number) => zoomAround(dir > 0 ? 1.2 : 0.83)
  const onStageKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return
    if (e.key === "+" || e.key === "=") { e.preventDefault(); zoom(1) }
    if (e.key === "-" || e.key === "_") { e.preventDefault(); zoom(-1) }
    if (e.key === "0") { e.preventDefault(); fit() }
  }

  const matches = useCallback((n: Node) => {
    if (fRar !== "all" && n.rarity !== +fRar) return false
    if (fEl !== "all") { const sp = firstSpecial(n.specials); const e = sp ? sp.type.toLowerCase() : "none"; if (e !== fEl) return false }
    if (q.trim() && !n.name.toLowerCase().includes(q.trim().toLowerCase())) return false
    return true
  }, [fRar, fEl, q])
  const filtering = !!q.trim() || fRar !== "all" || fEl !== "all"

  const pathSet = useMemo(() => {
    if (!pathMode || !sel || !selKey) return null
    const set: Record<string, boolean> = {}
    const parts = selKey.split("/")
    for (let index = 1; index <= parts.length; index += 1) {
      set[parts.slice(0, index).join("/")] = true
    }
    let cur: Node = sel
    let curKey = selKey
    while (cur && cur.children && cur.children.length) {
      cur = [...cur.children].sort((a: Node, b: Node) => weaponAttack(b) - weaponAttack(a))[0]
      curKey = occurrenceKey(cur, curKey)
      set[curKey] = true
    }
    return set
  }, [pathMode, sel, selKey])

  const nodeDim = (n: Node, key: string) => (filtering && !matches(n)) || (pathSet && !pathSet[key])
  const edgeCls = (e: { from: string; to: string }) => {
    if (pathSet) return pathSet[e.from] && pathSet[e.to] ? "stroke-[var(--mh)] [stroke-width:3]" : "stroke-line-2 opacity-25"
    if (filtering) return matches(nodesByKey[e.from]?.node) && matches(nodesByKey[e.to]?.node) ? "stroke-line-2" : "stroke-line-2 opacity-25"
    return "stroke-line-2"
  }

  const toggleOwned = (id: string) => setOwned((o) => {
    const t2 = { ...(o[type] || {}) }
    if (t2[id]) delete t2[id]; else t2[id] = true
    const n = { ...o, [type]: t2 }
    try { localStorage.setItem(LS_OWNED, JSON.stringify(n)) } catch { /* ignore */ }
    return n
  })

  const rarOptions = [{ value: "all", label: t("tree.allRarity") }, ...[1, 2, 3, 4, 5, 6, 7, 8].map((r) => ({ value: String(r), label: `${t("rarity")} ${r}` }))]
  const elOptions = [
    { value: "all", label: t("tree.allElement") },
    { value: "none", label: t("tree.noElement") },
    ...[...MH_ELEMENT_KEYS, ...MH_WEAPON_AILMENT_KEYS].map((e) => ({ value: e, label: t(e) })),
  ]

  if (loading) {
    return (
      <MhApp className="h-[var(--tool-vh,100dvh)] overflow-hidden">
        <div className="flex-1 grid place-items-center">
          <div className="flex flex-col items-center gap-3">
            <Spinner />
            <span className="font-mono text-[0.75rem] uppercase tracking-[0.14em] text-[var(--mh-bright)]">{t("app.loading")}…</span>
          </div>
        </div>
      </MhApp>
    )
  }
  if (error) {
    return (
      <MhApp className="h-[var(--tool-vh,100dvh)] overflow-hidden">
        <div className="flex-1 grid place-items-center">
          <MhLoadError title={t("tree.loadError")} detail={error}>
            <Button size="sm" variant="pri" icon="refresh" onClick={() => refreshData()}>{t("build_planner.retry")}</Button>
          </MhLoadError>
        </div>
      </MhApp>
    )
  }

  return (
    <MhApp className="h-[var(--tool-vh,100dvh)] overflow-hidden">
      <MhBar>
        <div className="flex items-center gap-[0.6875rem] min-w-0">
          <MhSeal name="tree" />
          <ToolTitle
            title={
              <>
                {t("tree.titlePrefix")} <em className="not-italic text-[var(--mh-bright)]">{t("tree.titleAccent")}</em>
              </>
            }
            sub={`${t(`weapons.${type}`)} · ${t("tree.weaponsCount", { count: total })} · ${t("tree.forgedCount", { count: ownedCount })}`}
          />
        </div>
        <MhBarSide>
          <MhModes
            value={view}
            onChange={(v) => setView(v as "tree" | "outline")}
            options={[
              { value: "tree", label: <><Icon name="tree" size={13} />{t("tree.tree")}</> },
              { value: "outline", label: <><Icon name="list" size={13} />{t("tree.list")}</> },
            ]}
          />
          <WishlistLink />
          <MhSrc label={t("app.source")} />
        </MhBarSide>
      </MhBar>

      {/* type rail */}
      <div className="flex gap-3 items-center flex-wrap px-[clamp(1rem,2.4vw,2.25rem)] py-[0.6875rem] border-b border-line bg-base-2">
        <div className="flex gap-1.5 flex-wrap flex-1">
          {availableTypes.map((k) => (
            <MhTypeChip key={k} icon="sword" label={t(`weapons.${k}`)} count={treeByKind[k].length} on={type === k} onClick={() => setType(k)} />
          ))}
          {soonTypes.slice(0, 3).map((k) => (
            <MhTypeChip key={k} label={t(`weapons.${k}`)} count={t("tree.soon")} disabled />
          ))}
        </div>
      </div>

      {/* filter strip */}
      <div className="flex gap-2.5 items-center flex-wrap px-[clamp(1rem,2.4vw,2.25rem)] py-2.5 border-b border-line">
        <div className="flex-1 min-w-[13.75rem] max-w-[21.25rem]"><MhSearch value={q} onChange={setQ} placeholder={t("tree.searchWeapon")} /></div>
        <Select ariaLabel={t("rarity")} value={fRar} onChange={setFRar} options={rarOptions} className="min-w-[8.125rem]" />
        <Select ariaLabel={t("element")} value={fEl} onChange={setFEl} options={elOptions} className="min-w-[8.75rem]" />
        <Chip on={pathMode} onClick={() => setPathMode((v) => !v)}>
          <Icon name="trending" size={13} className="inline align-[-2px] mr-1" />{t("tree.upgradePath")}
        </Chip>
        <span className="flex-1" />
        <span className="inline-flex items-center gap-2">
          <span className="font-mono text-[0.6875rem] leading-none text-txt-muted">{t("tree.progress")}</span>
          <MhMeter pct={total ? (ownedCount / total) * 100 : 0} className="w-[5.625rem]" />
          <b className="font-mono text-[0.75rem] leading-none">{ownedCount}/{total}</b>
        </span>
      </div>

      {/* body */}
      <MhBody
        className={view === "tree"
          ? "flex min-h-0 flex-1 flex-col overflow-hidden"
          : "min-h-0 flex-1 overflow-y-auto overscroll-contain"}
      >
        {view === "tree" ? (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div
              ref={stageRef}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              onLostPointerCapture={onLostPointerCapture}
              onKeyDown={onStageKeyDown}
              onDragStart={(e) => e.preventDefault()}
              tabIndex={0}
              aria-label={t("tree.canvasLabel")}
              className={`relative min-h-0 flex-1 overflow-auto overscroll-contain select-none cursor-grab touch-pan-y outline-none [background:radial-gradient(circle_at_1px_1px,var(--stripe)_1px,transparent_0)_0_0/26px_26px,var(--bg)] ${isPanning ? "cursor-grabbing" : ""}`}
            >
              <div
                className="relative"
                style={{
                  width: layout.width + 80,
                  height: layout.height + CANVAS_TOP_PAD + CANVAS_BOTTOM_PAD,
                }}
              >
                <div className="absolute top-0 left-0 origin-top-left will-change-transform" style={{ transform: `translate(${xf.tx}px,${xf.ty}px) scale(${xf.scale})`, width: layout.width, height: layout.height }}>
                  <svg className="absolute top-0 left-0 overflow-visible pointer-events-none" width={layout.width} height={layout.height}>
                    {layout.edges.map((e, i) => {
                      const a = layout.pos[e.from], b = layout.pos[e.to]
                      if (!a || !b) return null
                      const x1 = a.x + NODE_W, y1 = a.y + NODE_H / 2, x2 = b.x, y2 = b.y + NODE_H / 2
                      const mx = (x1 + x2) / 2
                      return <path key={i} className={`fill-none [stroke-width:2] transition-[stroke,opacity] ${edgeCls(e)}`} d={`M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`} />
                    })}
                  </svg>
                  {allOccurrences.map(({ key, node: n }) => {
                    const p = layout.pos[key]
                    return (
                      <MhNodeCard
                        key={key}
                        style={{ left: p.x, top: p.y, width: NODE_W, height: NODE_H }}
                        name={n.name}
                        rarity={n.rarity}
                        attack={weaponAttack(n)}
                        special={firstSpecial(n.specials)}
                        selected={selKey === key}
                        dim={!!nodeDim(n, key)}
                        owned={!!ownedSet[String(n.id)]}
                        isFinal={!n.children || n.children.length === 0}
                        finalLabel={t("tree.final")}
                        onSelect={() => setSelKey(key)}
                      />
                    )
                  })}
                </div>
              </div>

              <div data-canvas-ui="" className="absolute inset-x-0 top-0 z-[6] flex flex-col gap-2 px-3.5 pt-3.5 pointer-events-none sm:flex-row sm:items-start sm:justify-between">
                <div className="pointer-events-auto flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[0.6875rem] leading-none text-txt-dim bg-panel border border-line py-[0.4375rem] px-2.5 select-none">
                  <Icon name="target" size={13} />
                  <span>{t("tree.dragHint")}</span>
                  <span className="text-txt-dim/70">· {t("tree.zoomHint")}</span>
                </div>
                <div className="pointer-events-auto flex items-center gap-[0.3125rem] self-end">
                  <button type="button" onClick={() => zoom(1)} aria-label={t("tree.zoomIn")} className="w-[2.375rem] h-[2.375rem] grid place-items-center bg-panel border border-line text-txt-muted hover:text-txt hover:border-line-2"><Icon name="plus" size={16} /></button>
                  <div className="w-[3.125rem] h-[2.375rem] grid place-items-center font-mono text-[0.625rem] leading-none text-center text-txt-dim bg-panel border-y border-line">{Math.round(xf.scale * 100)}%</div>
                  <button type="button" onClick={() => zoom(-1)} aria-label={t("tree.zoomOut")} className="w-[2.375rem] h-[2.375rem] grid place-items-center bg-panel border border-line text-txt-muted hover:text-txt hover:border-line-2"><Icon name="minus" size={16} /></button>
                  <button type="button" onClick={fit} aria-label={t("tree.fit")} title={t("tree.fit")} className="w-[2.375rem] h-[2.375rem] grid place-items-center bg-panel border border-line text-txt-muted hover:text-txt hover:border-line-2"><Icon name="grid" size={15} /></button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <MhWrap>
            <TreeOutline roots={roots} ownedSet={ownedSet} matches={filtering ? matches : null} sel={selKey} onSel={setSelKey} />
          </MhWrap>
        )}
      </MhBody>

      {sel && (
        <TreeDetail
          node={sel}
          pathKey={selKey || String(sel.id)}
          nodesByKey={nodesByKey}
          owned={!!ownedSet[String(sel.id)]}
          onToggleOwned={() => toggleOwned(String(sel.id))}
          onClose={() => setSelKey(null)}
          onGoTo={setSelKey}
        />
      )}
    </MhApp>
  )
}

// ── outline (list) ────────────────────────────────────────────────────────────
function TreeOutline({ roots, ownedSet, matches, sel, onSel }: { roots: Node[]; ownedSet: Record<string, boolean>; matches: ((n: Node) => boolean) | null; sel: string | null; onSel: (key: string) => void }) {
  const t = useToolT("tools.mhwilds")
  const flat = flatten(roots)
  const visible = matches ? flat.filter((f) => matches(f.node)) : flat
  if (!visible.length) return <Empty icon="search" title={t("tree.noResults")} lead={t("tree.noResultsLead")} />
  return (
    <div className="flex flex-col gap-[3px]">
      {visible.map(({ node, depth, key }) => {
        const sp = firstSpecial(node.specials)
        return (
          <button
            key={key}
            type="button"
            onClick={() => onSel(key)}
            style={{ marginLeft: matches ? 0 : depth * 20 }}
            className={`grid grid-cols-[1fr_auto] items-center gap-3 py-[0.5625rem] px-3 bg-panel border text-left transition-colors hover:bg-panel-2 ${sel === key ? "border-[var(--mh)]" : "border-line hover:border-line-2"}`}
          >
            <span className="flex items-center gap-2 min-w-0">
              {ownedSet[String(node.id)] && <Icon name="check" size={13} className="text-[var(--mh-bright)]" />}
              <MhRarity rarity={node.rarity} />
              <b className="font-body text-[0.8125rem] leading-tight truncate">{node.name}</b>
              {(!node.children || !node.children.length) && <span className="text-txt-dim font-mono text-[0.75rem] leading-none">· {t("tree.final").toLowerCase()}</span>}
            </span>
            <span className="flex gap-3 font-mono text-[0.6875rem] leading-none text-txt-muted flex-none">
              <span><Icon name="sword" size={11} className="inline align-[-1px]" /> {weaponAttack(node)}</span>
              {sp && <span className="inline-flex items-center gap-1" style={{ color: elementColor(sp.type) }}><MhAttributeIcon type={sp.type} size={11} />{sp.value}</span>}
            </span>
          </button>
        )
      })}
    </div>
  )
}

// ── detail drawer ─────────────────────────────────────────────────────────────
function TreeDetail({ node, pathKey, nodesByKey, owned, onToggleOwned, onClose, onGoTo }: {
  node: Node
  pathKey: string
  nodesByKey: Record<string, { node: Node }>
  owned: boolean
  onToggleOwned: () => void
  onClose: () => void
  onGoTo: (key: string) => void
}) {
  const t = useToolT("tools.mhwilds")
  const sp = firstSpecial(node.specials)
  const { has, toggle } = useWishlist()
  const wishlistEntry = weaponWishlistEntry(node)
  const wishlisted = has(wishlistEntry.key)
  const parentKey = pathKey.includes("/") ? pathKey.slice(0, pathKey.lastIndexOf("/")) : null
  const parent = parentKey ? nodesByKey[parentKey]?.node || null : null
  const stepMats: any[] = (parent ? node.upgradeMaterials : node.craftingMaterials) || node.craftingMaterials || []
  const zenny = parent ? node.upgradeZennyCost : node.craftingZennyCost
  const [artFailed, setArtFailed] = useState(false)
  const artSrc = mhwildsWeaponAsset(node)

  return (
    <MhDrawer
      icon={<MhRarity rarity={node.rarity} />}
      title={node.name}
      sub={`${t(`weapons.${node.kind}`)} · ${t("rarity")} ${node.rarity}`}
      onClose={onClose}
      tools={
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant={owned ? "pri" : "default"} icon={owned ? "check" : "plus"} onClick={onToggleOwned}>
            {owned ? t("tree.forgedState") : t("tree.markForged")}
          </Button>
          <Button size="sm" variant={wishlisted ? "pri" : "default"} icon={wishlisted ? "check" : "plus"} onClick={() => toggle(wishlistEntry)}>
            {wishlisted ? t("build_planner.wishlist.added") : t("build_planner.wishlist.add")}
          </Button>
          <Button size="sm" icon="sword" href="/mhwilds/builds/planner">{t("tree.plan")}</Button>
        </div>
      }
    >
      <div className="mb-4 grid grid-cols-[8rem_minmax(0,1fr)] gap-3 border border-[var(--mh-line)] bg-[var(--mh-soft)] p-3">
        <div className="grid min-h-[8rem] place-items-center border border-[var(--mh-line)] bg-base-deep">
          {artSrc && !artFailed ? (
            <img src={artSrc} alt={node.name} width={128} height={128} draggable={false} className="h-32 w-32 object-contain" onError={() => setArtFailed(true)} />
          ) : (
            <Icon name="sword" size={52} className="text-[var(--mh-bright)]" />
          )}
        </div>
        <div className="min-w-0 self-center">
          <div className="font-display text-[1.05rem] font-bold leading-tight">{node.name}</div>
          {node.description && <p className="mt-2 font-body text-[0.75rem] leading-[1.4] text-txt-muted">{node.description}</p>}
          {node.series?.name && <div className="mt-2 font-mono text-[0.625rem] uppercase tracking-[0.08em] text-txt-dim">{node.series.name}</div>}
        </div>
      </div>
      <MhStat3 items={[
        { value: weaponAttack(node), label: t("attack"), mod: "attack" },
        { value: node.rarity, label: t("rarity") },
        { value: sp ? t(normalizeAttributeKey(sp.type)) : "—", label: t("element") },
      ]} />
      {sp && <div className="mt-3"><MhElement type={sp.type} value={sp.value} hidden={sp.hidden} /></div>}

      {parent && (
        <div className="mt-[1.125rem]">
          <MhLabel>{t("tree.improvesFrom")}</MhLabel>
          <button type="button" onClick={() => onGoTo(parentKey!)} className="grid grid-cols-[1fr_auto] items-center gap-3 w-full py-[0.5625rem] px-3 bg-panel border border-line text-left hover:border-line-2">
            <span className="flex items-center gap-2 min-w-0"><Icon name="back" size={13} className="text-txt-dim" /><MhRarity rarity={parent.rarity} /><b className="font-body text-[0.8125rem] leading-tight truncate">{parent.name}</b></span>
            <span className="font-mono text-[0.6875rem] leading-none text-txt-muted">{weaponAttack(parent)}</span>
          </button>
        </div>
      )}

      {stepMats.length > 0 && (
        <div className="mt-[1.125rem]">
          <MhLabel>{parent ? t("tree.upgradeMaterials") : t("tree.craftMaterials")}{zenny ? ` · ${zenny.toLocaleString()}z` : ""}</MhLabel>
          <div className="flex flex-col gap-[0.3125rem]">
            {stepMats.map((m: any, i: number) => (
              <MhMaterial key={m.item?.gameId ?? m.item?.id ?? i} item={m.item} name={m.item?.name ?? "?"} rarity={m.item?.rarity} quantity={m.quantity ?? 1} />
            ))}
          </div>
        </div>
      )}

      {node.children && node.children.length > 0 && (
        <div className="mt-[1.125rem]">
            <MhLabel>{t("tree.improvesTo")}</MhLabel>
          <div className="flex flex-col gap-1">
            {node.children.map((c: Node) => (
              <button key={occurrenceKey(c, pathKey)} type="button" onClick={() => onGoTo(occurrenceKey(c, pathKey))} className="grid grid-cols-[1fr_auto] items-center gap-3 w-full py-[0.5625rem] px-3 bg-panel border border-line text-left hover:border-line-2">
                <span className="flex items-center gap-2 min-w-0"><Icon name="chevronRight" size={13} className="text-[var(--mh-bright)]" /><MhRarity rarity={c.rarity} /><b className="font-body text-[0.8125rem] leading-tight truncate">{c.name}</b></span>
                <span className="font-mono text-[0.6875rem] leading-none text-txt-muted">{weaponAttack(c)}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </MhDrawer>
  )
}
