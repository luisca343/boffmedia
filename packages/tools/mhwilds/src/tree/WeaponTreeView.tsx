"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useToolT } from "../i18n"
import { Button, Chip, Empty, Icon, Select, Spinner, ToolTitle } from "@boffmedia/ui"
import { useWeaponTreeData } from "./useWeaponTreeData"
import {
  MhApp, MhBar, MhBarSide, MhBody, MhWrap, MhSeal, MhModes, MhSrc, MhSearch,
  MhTypeChip, MhNodeCard, MhDrawer, MhRarity, MhStat3, MhElement, MhMaterial, MhLabel, MhLoadError,
  MhMeter,
} from "../ui/mh-kit"
import { WEAPON_TYPES, weaponAttack, firstSpecial, elementColor } from "../ui/mh-helpers"

type Node = any

const NODE_W = 212
const NODE_H = 66
const COL = NODE_W + 64
const ROW = NODE_H + 16
const LS_OWNED = "mh_tree_owned_v3"

function tLoad(): Record<string, Record<string, boolean>> {
  if (typeof window === "undefined") return {}
  try { return JSON.parse(localStorage.getItem(LS_OWNED) || "{}") || {} } catch { return {} }
}

function computeLayout(roots: Node[]) {
  const pos: Record<string, { x: number; y: number; node: Node }> = {}
  let leaf = 0
  function assign(node: Node, depth: number): number {
    const x = depth * COL
    if (!node.children || node.children.length === 0) {
      const y = leaf * ROW; leaf++; pos[node.id] = { x, y, node }; return y
    }
    const ys = node.children.map((c: Node) => assign(c, depth + 1))
    const y = (ys[0] + ys[ys.length - 1]) / 2
    pos[node.id] = { x, y, node }; return y
  }
  roots.forEach((r) => assign(r, 0))
  const edges: { from: string; to: string }[] = []
  Object.values(pos).forEach((p) => (p.node.children || []).forEach((c: Node) => edges.push({ from: String(p.node.id), to: String(c.id) })))
  const xs = Object.values(pos).map((p) => p.x)
  const ys = Object.values(pos).map((p) => p.y)
  return { pos, edges, width: (xs.length ? Math.max(...xs) : 0) + NODE_W, height: (ys.length ? Math.max(...ys) : 0) + NODE_H }
}

function flatten(roots: Node[]): { node: Node; depth: number }[] {
  const out: { node: Node; depth: number }[] = []
  const walk = (n: Node, d: number) => { out.push({ node: n, depth: d }); (n.children || []).forEach((c: Node) => walk(c, d + 1)) }
  roots.forEach((r) => walk(r, 0))
  return out
}

function pathTo(roots: Node[], id: string): string[] | null {
  const dfs = (n: Node, acc: string[]): string[] | null => {
    const next = [...acc, String(n.id)]
    if (String(n.id) === id) return next
    for (const c of n.children || []) { const r = dfs(c, next); if (r) return r }
    return null
  }
  for (const r of roots) { const res = dfs(r, []); if (res) return res }
  return null
}

export function WeaponTreeView() {
  const t = useToolT("tools.mhwilds")
  const { weaponTree, loading, error, refreshData } = useWeaponTreeData()

  const treeByKind: Record<string, Node[]> = weaponTree?.treeByKind || {}
  const availableTypes = useMemo<string[]>(() => WEAPON_TYPES.filter((k) => treeByKind[k]?.length), [treeByKind])
  const soonTypes = useMemo<string[]>(() => WEAPON_TYPES.filter((k) => !treeByKind[k]?.length), [treeByKind])

  const [type, setType] = useState<string>("long-sword")
  const [view, setView] = useState<"tree" | "outline">("tree")
  const [selId, setSelId] = useState<string | null>(null)
  const [owned, setOwned] = useState<Record<string, Record<string, boolean>>>({})
  const [q, setQ] = useState("")
  const [fRar, setFRar] = useState("all")
  const [fEl, setFEl] = useState("all")
  const [pathMode, setPathMode] = useState(true)
  const [xf, setXf] = useState({ scale: 1, tx: 40, ty: 24 })

  const stageRef = useRef<HTMLDivElement>(null)
  const drag = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null)

  useEffect(() => { setOwned(tLoad()) }, [])
  // once data lands, ensure the active type actually exists
  useEffect(() => {
    if (availableTypes.length && !availableTypes.includes(type)) {
      setType(availableTypes.includes("long-sword") ? "long-sword" : availableTypes[0])
    }
  }, [availableTypes, type])

  const roots = treeByKind[type] || []
  const layout = useMemo(() => computeLayout(roots), [roots])
  const nodesById = useMemo(() => {
    const m: Record<string, Node> = {}
    Object.values(layout.pos).forEach((p) => { m[String(p.node.id)] = p.node })
    return m
  }, [layout])
  const allNodes = useMemo(() => Object.values(nodesById), [nodesById])
  const total = allNodes.length
  const ownedSet = owned[type] || {}
  const ownedCount = allNodes.filter((n) => ownedSet[String(n.id)]).length
  const sel = selId != null ? nodesById[selId] : null

  const fit = useCallback(() => {
    const st = stageRef.current; if (!st) return
    const sw = st.clientWidth, sh = st.clientHeight
    const scale = Math.min((sw - 64) / (layout.width || 1), (sh - 56) / (layout.height || 1), 1.1)
    const s = Math.max(0.35, scale)
    setXf({ scale: s, tx: Math.max(24, (sw - layout.width * s) / 2), ty: Math.max(20, (sh - layout.height * s) / 2) })
  }, [layout])
  useEffect(() => { fit(); setSelId(null) /* eslint-disable-next-line */ }, [type, view])

  // native non-passive wheel zoom toward cursor
  useEffect(() => {
    const st = stageRef.current; if (!st || view !== "tree") return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const rect = st.getBoundingClientRect()
      const mx = e.clientX - rect.left, my = e.clientY - rect.top
      setXf((c) => {
        const factor = e.deltaY < 0 ? 1.12 : 0.89
        const ns = Math.min(2, Math.max(0.3, c.scale * factor))
        const k = ns / c.scale
        return { scale: ns, tx: mx - (mx - c.tx) * k, ty: my - (my - c.ty) * k }
      })
    }
    st.addEventListener("wheel", onWheel, { passive: false })
    return () => st.removeEventListener("wheel", onWheel)
  }, [view])

  const onPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("[data-node]")) return
    drag.current = { x: e.clientX, y: e.clientY, tx: xf.tx, ty: xf.ty }
    stageRef.current?.classList.add("cursor-grabbing")
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return
    setXf((c) => ({ ...c, tx: drag.current!.tx + (e.clientX - drag.current!.x), ty: drag.current!.ty + (e.clientY - drag.current!.y) }))
  }
  const endDrag = () => { drag.current = null; stageRef.current?.classList.remove("cursor-grabbing") }
  const zoom = (dir: number) => setXf((c) => {
    const st = stageRef.current
    const sw = st ? st.clientWidth / 2 : 300, sh = st ? st.clientHeight / 2 : 200
    const ns = Math.min(2, Math.max(0.3, c.scale * (dir > 0 ? 1.2 : 0.83)))
    const k = ns / c.scale
    return { scale: ns, tx: sw - (sw - c.tx) * k, ty: sh - (sh - c.ty) * k }
  })

  const matches = useCallback((n: Node) => {
    if (fRar !== "all" && n.rarity !== +fRar) return false
    if (fEl !== "all") { const sp = firstSpecial(n.specials); const e = sp ? sp.type.toLowerCase() : "none"; if (e !== fEl) return false }
    if (q.trim() && !n.name.toLowerCase().includes(q.trim().toLowerCase())) return false
    return true
  }, [fRar, fEl, q])
  const filtering = !!q.trim() || fRar !== "all" || fEl !== "all"

  const pathSet = useMemo(() => {
    if (!pathMode || !sel) return null
    const anc = pathTo(roots, String(sel.id)) || [String(sel.id)]
    const set: Record<string, boolean> = {}
    anc.forEach((id) => { set[id] = true })
    let cur: Node = nodesById[String(sel.id)]
    while (cur && cur.children && cur.children.length) {
      cur = [...cur.children].sort((a: Node, b: Node) => weaponAttack(b) - weaponAttack(a))[0]
      set[String(cur.id)] = true
    }
    return set
  }, [pathMode, sel, roots, nodesById])

  const nodeDim = (n: Node) => (filtering && !matches(n)) || (pathSet && !pathSet[String(n.id)])
  const edgeCls = (e: { from: string; to: string }) => {
    if (pathSet) return pathSet[e.from] && pathSet[e.to] ? "stroke-[var(--mh)] [stroke-width:3]" : "stroke-line-2 opacity-25"
    if (filtering) return matches(nodesById[e.from]) && matches(nodesById[e.to]) ? "stroke-line-2" : "stroke-line-2 opacity-25"
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
    ...["fire", "water", "thunder", "ice", "dragon", "poison", "sleep", "paralysis", "blast"].map((e) => ({ value: e, label: t(e) })),
  ]

  if (loading) {
    return (
      <MhApp>
        <div className="flex-1 grid place-items-center">
          <div className="flex flex-col items-center gap-3">
            <Spinner />
            <span className="font-mono text-[12px] uppercase tracking-[0.14em] text-[var(--mh-bright)]">{t("app.loading")}…</span>
          </div>
        </div>
      </MhApp>
    )
  }
  if (error) {
    return (
      <MhApp>
        <div className="flex-1 grid place-items-center">
          <MhLoadError title={t("tree.loadError")} detail={error}>
            <Button size="sm" variant="pri" icon="refresh" onClick={() => refreshData()}>{t("build_planner.retry")}</Button>
          </MhLoadError>
        </div>
      </MhApp>
    )
  }

  return (
    <MhApp>
      <MhBar>
        <div className="flex items-center gap-[11px] min-w-0">
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
          <MhSrc label={t("app.source")} />
        </MhBarSide>
      </MhBar>

      {/* type rail */}
      <div className="flex gap-3 items-center flex-wrap px-[clamp(16px,2.4vw,36px)] py-[11px] border-b border-line bg-base-2">
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
      <div className="flex gap-2.5 items-center flex-wrap px-[clamp(16px,2.4vw,36px)] py-2.5 border-b border-line">
        <div className="flex-1 min-w-[220px] max-w-[340px]"><MhSearch value={q} onChange={setQ} placeholder={t("tree.searchWeapon")} /></div>
        <Select ariaLabel={t("rarity")} value={fRar} onChange={setFRar} options={rarOptions} className="min-w-[130px]" />
        <Select ariaLabel={t("element")} value={fEl} onChange={setFEl} options={elOptions} className="min-w-[140px]" />
        <Chip on={pathMode} onClick={() => setPathMode((v) => !v)}>
          <Icon name="trending" size={13} className="inline align-[-2px] mr-1" />{t("tree.upgradePath")}
        </Chip>
        <span className="flex-1" />
        <span className="inline-flex items-center gap-2">
          <span className="font-mono text-[11px] leading-none text-txt-muted">{t("tree.progress")}</span>
          <MhMeter pct={total ? (ownedCount / total) * 100 : 0} className="w-[90px]" />
          <b className="font-mono text-[12px] leading-none">{ownedCount}/{total}</b>
        </span>
      </div>

      {/* body */}
      <MhBody className={view === "tree" ? "overflow-hidden flex" : ""}>
        {view === "tree" ? (
          <div className="flex-1 flex flex-col h-full">
            <div
              ref={stageRef}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={endDrag}
              onPointerLeave={endDrag}
              className="flex-1 relative overflow-hidden cursor-grab [background:radial-gradient(circle_at_1px_1px,var(--stripe)_1px,transparent_0)_0_0/26px_26px,var(--bg)]"
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
                {allNodes.map((n) => {
                  const p = layout.pos[String(n.id)]
                  return (
                    <MhNodeCard
                      key={n.id}
                      style={{ left: p.x, top: p.y, width: NODE_W }}
                      name={n.name}
                      rarity={n.rarity}
                      attack={weaponAttack(n)}
                      special={firstSpecial(n.specials)}
                      selected={selId === String(n.id)}
                      dim={!!nodeDim(n)}
                      owned={!!ownedSet[String(n.id)]}
                      isFinal={!n.children || n.children.length === 0}
                      finalLabel={t("tree.final")}
                      onSelect={() => setSelId(String(n.id))}
                    />
                  )
                })}
              </div>

              <div className="absolute left-3.5 bottom-3.5 z-[6] font-mono text-[11px] leading-none text-txt-dim bg-panel border border-line py-[7px] px-2.5 flex items-center gap-[7px]">
                <Icon name="target" size={13} />{t("tree.dragHint")}
              </div>
              <div className="absolute right-3.5 bottom-3.5 flex flex-col gap-[5px] z-[6]">
                <button type="button" onClick={() => zoom(1)} aria-label={t("tree.zoomIn")} className="w-[38px] h-[38px] grid place-items-center bg-panel border border-line text-txt-muted hover:text-txt hover:border-line-2"><Icon name="plus" size={16} /></button>
                <div className="font-mono text-[10px] leading-none text-center text-txt-dim py-[3px]">{Math.round(xf.scale * 100)}%</div>
                <button type="button" onClick={() => zoom(-1)} aria-label={t("tree.zoomOut")} className="w-[38px] h-[38px] grid place-items-center bg-panel border border-line text-txt-muted hover:text-txt hover:border-line-2"><Icon name="minus" size={16} /></button>
                <button type="button" onClick={fit} aria-label={t("tree.fit")} title={t("tree.fit")} className="w-[38px] h-[38px] grid place-items-center bg-panel border border-line text-txt-muted hover:text-txt hover:border-line-2"><Icon name="grid" size={15} /></button>
              </div>
            </div>
          </div>
        ) : (
          <MhWrap>
            <TreeOutline roots={roots} ownedSet={ownedSet} matches={filtering ? matches : null} sel={selId} onSel={setSelId} />
          </MhWrap>
        )}
      </MhBody>

      {sel && (
        <TreeDetail
          node={sel}
          roots={roots}
          nodesById={nodesById}
          owned={!!ownedSet[String(sel.id)]}
          onToggleOwned={() => toggleOwned(String(sel.id))}
          onClose={() => setSelId(null)}
          onGoTo={(id) => setSelId(id)}
        />
      )}
    </MhApp>
  )
}

// ── outline (list) ────────────────────────────────────────────────────────────
function TreeOutline({ roots, ownedSet, matches, sel, onSel }: { roots: Node[]; ownedSet: Record<string, boolean>; matches: ((n: Node) => boolean) | null; sel: string | null; onSel: (id: string) => void }) {
  const t = useToolT("tools.mhwilds")
  const flat = flatten(roots)
  const visible = matches ? flat.filter((f) => matches(f.node)) : flat
  if (!visible.length) return <Empty icon="search" title={t("tree.noResults")} lead={t("tree.noResultsLead")} />
  return (
    <div className="flex flex-col gap-[3px]">
      {visible.map(({ node, depth }) => {
        const sp = firstSpecial(node.specials)
        return (
          <button
            key={node.id}
            type="button"
            onClick={() => onSel(String(node.id))}
            style={{ marginLeft: matches ? 0 : depth * 20 }}
            className={`grid grid-cols-[1fr_auto] items-center gap-3 py-[9px] px-3 bg-panel border text-left transition-colors hover:bg-panel-2 ${sel === String(node.id) ? "border-[var(--mh)]" : "border-line hover:border-line-2"}`}
          >
            <span className="flex items-center gap-2 min-w-0">
              {ownedSet[String(node.id)] && <Icon name="check" size={13} className="text-[var(--mh-bright)]" />}
              <MhRarity rarity={node.rarity} />
              <b className="font-body text-[13px] leading-tight truncate">{node.name}</b>
              {(!node.children || !node.children.length) && <span className="text-txt-dim font-mono text-[12px] leading-none">· {t("tree.final").toLowerCase()}</span>}
            </span>
            <span className="flex gap-3 font-mono text-[11px] leading-none text-txt-muted flex-none">
              <span><Icon name="sword" size={11} className="inline align-[-1px]" /> {weaponAttack(node)}</span>
              {sp && <span style={{ color: elementColor(sp.type) }}>{sp.value}</span>}
            </span>
          </button>
        )
      })}
    </div>
  )
}

// ── detail drawer ─────────────────────────────────────────────────────────────
function TreeDetail({ node, roots, nodesById, owned, onToggleOwned, onClose, onGoTo }: {
  node: Node; roots: Node[]; nodesById: Record<string, Node>; owned: boolean; onToggleOwned: () => void; onClose: () => void; onGoTo: (id: string) => void
}) {
  const t = useToolT("tools.mhwilds")
  const sp = firstSpecial(node.specials)
  const path = pathTo(roots, String(node.id)) || [String(node.id)]
  const parentId = path.length > 1 ? path[path.length - 2] : null
  const parent = parentId ? nodesById[parentId] : null
  const stepMats: any[] = (parent ? node.upgradeMaterials : node.craftingMaterials) || node.craftingMaterials || []
  const zenny = parent ? node.upgradeZennyCost : node.craftingZennyCost

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
          <Button size="sm" icon="sword" href="/mhwilds/builds/planner">{t("tree.plan")}</Button>
        </div>
      }
    >
      <MhStat3 items={[
        { value: weaponAttack(node), label: t("attack"), mod: "attack" },
        { value: node.rarity, label: t("rarity") },
        { value: sp ? t(sp.type) : "—", label: t("element") },
      ]} />
      {sp && <div className="mt-3"><MhElement type={sp.type} value={sp.value} hidden={sp.hidden} label={t(sp.type)} /></div>}

      {parent && (
        <div className="mt-[18px]">
          <MhLabel>{t("tree.improvesFrom")}</MhLabel>
          <button type="button" onClick={() => onGoTo(String(parent.id))} className="grid grid-cols-[1fr_auto] items-center gap-3 w-full py-[9px] px-3 bg-panel border border-line text-left hover:border-line-2">
            <span className="flex items-center gap-2 min-w-0"><Icon name="back" size={13} className="text-txt-dim" /><MhRarity rarity={parent.rarity} /><b className="font-body text-[13px] leading-tight truncate">{parent.name}</b></span>
            <span className="font-mono text-[11px] leading-none text-txt-muted">{weaponAttack(parent)}</span>
          </button>
        </div>
      )}

      {stepMats.length > 0 && (
        <div className="mt-[18px]">
          <MhLabel>{parent ? t("tree.upgradeMaterials") : t("tree.craftMaterials")}{zenny ? ` · ${zenny.toLocaleString()}z` : ""}</MhLabel>
          <div className="flex flex-col gap-[5px]">
            {stepMats.map((m: any, i: number) => (
              <MhMaterial key={m.item?.id ?? i} name={m.item?.name ?? "?"} rarity={m.item?.rarity} quantity={m.quantity ?? 1} />
            ))}
          </div>
        </div>
      )}

      {node.children && node.children.length > 0 && (
        <div className="mt-[18px]">
          <MhLabel>{t("tree.improvesTo")}</MhLabel>
          <div className="flex flex-col gap-1">
            {node.children.map((c: Node) => (
              <button key={c.id} type="button" onClick={() => onGoTo(String(c.id))} className="grid grid-cols-[1fr_auto] items-center gap-3 w-full py-[9px] px-3 bg-panel border border-line text-left hover:border-line-2">
                <span className="flex items-center gap-2 min-w-0"><Icon name="chevronRight" size={13} className="text-[var(--mh-bright)]" /><MhRarity rarity={c.rarity} /><b className="font-body text-[13px] leading-tight truncate">{c.name}</b></span>
                <span className="font-mono text-[11px] leading-none text-txt-muted">{weaponAttack(c)}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </MhDrawer>
  )
}
