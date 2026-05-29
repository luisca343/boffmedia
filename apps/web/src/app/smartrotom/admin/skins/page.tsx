"use client"

import { useCallback, useEffect, useState } from "react"
import { SkinViewer } from "skinview3d"
import { RefreshCw, CheckCircle, XCircle, Loader2, ImageOff, SlidersHorizontal, Users } from "lucide-react"
import Link from "next/link"
import { MisionesService } from "@/services/api/smartrotom/misionesService"
import { INPC } from "@/app/smartrotom/misiones/_types/Quest"

const RENDER_BASE = "/smartrotom/img/customNPC/renders"
const SKIN_BASE   = "/smartrotom/img/customNPC"

async function generateRender(npcName: string, skinFile: string): Promise<void> {
  const viewer = new SkinViewer({ width: 200, height: 400, enableControls: false })
  viewer.camera.rotation.x = -0.620
  viewer.camera.rotation.y = 0.534
  viewer.camera.rotation.z = 0.348
  viewer.camera.position.x = -30.5
  viewer.camera.position.y = 22.0
  viewer.camera.position.z = 42.0
  const skin = skinFile.replace(/[.]png$/i, "")
  await viewer.loadSkin(`${SKIN_BASE}/${skin}.png`)
    .catch(() => viewer.loadSkin(`${SKIN_BASE}/steve.png`))
  viewer.render()
  const image = viewer.canvas.toDataURL()
  await MisionesService.uploadCustomNpcImage({ npcName, image })
  viewer.dispose()
}

type NpcRow = { npc: INPC; hasRender: boolean | null; working: boolean }
type SkinGroup = { skinName: string; rows: NpcRow[] }

function MiniPreview({ npcName }: { npcName: string }) {
  const [state, setState] = useState<"loading" | "ok" | "err">("loading")
  const url = `${RENDER_BASE}/${npcName}.png`
  return (
    <div style={{ width: 32, height: 64, flexShrink: 0, position: "relative" }}>
      {state !== "err" && (
        <img
          key={url}
          src={url}
          width={32}
          height={64}
          alt=""
          onLoad={() => setState("ok")}
          onError={() => setState("err")}
          style={{ display: state === "ok" ? "block" : "none", imageRendering: "pixelated" }}
        />
      )}
      {state !== "ok" && (
        <div style={{ width: 32, height: 64, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--line)", borderRadius: "var(--radius)" }}>
          {state === "loading"
            ? <Loader2 size={12} className="sr-spin" style={{ color: "var(--fg-faint)" }} />
            : <ImageOff size={12} style={{ color: "var(--fg-faint)" }} />
          }
        </div>
      )}
    </div>
  )
}

export default function SkinsAdminPage() {
  const [groups, setGroups] = useState<SkinGroup[]>([])
  const [loading, setLoading] = useState(true)

  const buildGroups = useCallback((npcs: INPC[]): SkinGroup[] => {
    const map = new Map<string, INPC[]>()
    for (const npc of npcs) {
      const key = (npc.skin || "steve").replace(/[.]png$/i, "")
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(npc)
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([skinName, npcList]) => ({
        skinName,
        rows: npcList.map(npc => ({ npc, hasRender: null, working: false })),
      }))
  }, [])

  useEffect(() => {
    MisionesService.getAllNPCs()
      .then(res => {
        const npcs = (res.data as unknown as INPC[]) ?? []
        const built = buildGroups(npcs)
        setGroups(built)
        setLoading(false)
        // Fire off render-status checks
        built.forEach((group, gi) => {
          group.rows.forEach((row, ri) => {
            MisionesService.checkCustomNPCRender(row.npc.name)
              .then(r => {
                const has = !!(r.data as any)?.success || !!(r.data as any)?.img
                setGroups(prev => prev.map((g, gIdx) =>
                  gIdx !== gi ? g : {
                    ...g,
                    rows: g.rows.map((rw, rIdx) =>
                      rIdx !== ri ? rw : { ...rw, hasRender: has }
                    ),
                  }
                ))
              })
              .catch(() => {
                setGroups(prev => prev.map((g, gIdx) =>
                  gIdx !== gi ? g : {
                    ...g,
                    rows: g.rows.map((rw, rIdx) =>
                      rIdx !== ri ? rw : { ...rw, hasRender: false }
                    ),
                  }
                ))
              })
          })
        })
      })
      .catch(() => setLoading(false))
  }, [buildGroups])

  const runRender = useCallback(async (gi: number, ri: number) => {
    setGroups(prev => prev.map((g, gIdx) =>
      gIdx !== gi ? g : { ...g, rows: g.rows.map((rw, rIdx) => rIdx !== ri ? rw : { ...rw, working: true }) }
    ))
    const row = groups[gi].rows[ri]
    try {
      await generateRender(row.npc.name, row.npc.skin || row.npc.name)
      setGroups(prev => prev.map((g, gIdx) =>
        gIdx !== gi ? g : { ...g, rows: g.rows.map((rw, rIdx) => rIdx !== ri ? rw : { ...rw, working: false, hasRender: true }) }
      ))
    } catch {
      setGroups(prev => prev.map((g, gIdx) =>
        gIdx !== gi ? g : { ...g, rows: g.rows.map((rw, rIdx) => rIdx !== ri ? rw : { ...rw, working: false }) }
      ))
    }
  }, [groups])

  const runGroup = useCallback(async (gi: number, forceAll: boolean) => {
    const g = groups[gi]
    for (let ri = 0; ri < g.rows.length; ri++) {
      if (!forceAll && g.rows[ri].hasRender === true) continue
      await runRender(gi, ri)
    }
  }, [groups, runRender])

  const totalNpcs = groups.reduce((s, g) => s + g.rows.length, 0)
  const doneNpcs  = groups.reduce((s, g) => s + g.rows.filter(r => r.hasRender === true).length, 0)

  return (
    <>
      <div className="sr-page-head">
        <h1 className="sr-page-title"><Users size={20} /> Skins de NPCs</h1>
        <p className="sr-page-sub">Renders de NPCs agrupados por skin base</p>
      </div>

      <div className="sr-panel">
        <div className="sr-toolbar">
          <Link href="/smartrotom/admin/skins/tuner" className="sr-btn" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <SlidersHorizontal size={13} /> Camera Tuner
          </Link>
          {!loading && (
            <span className="sr-faint" style={{ fontSize: 12, marginLeft: "auto" }}>
              {doneNpcs}/{totalNpcs} renders listos · {groups.length} skins
            </span>
          )}
        </div>

        {loading ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: 24, color: "var(--fg-muted)", fontSize: 13 }}>
            <Loader2 size={16} className="sr-spin" /> Cargando NPCs…
          </div>
        ) : groups.length === 0 ? (
          <div className="sr-empty" style={{ margin: 16 }}>
            <div className="sr-ic"><Users size={28} /></div>
            <div className="sr-t">No se encontraron NPCs</div>
          </div>
        ) : (
          groups.map((group, gi) => {
            const allDone   = group.rows.every(r => r.hasRender === true)
            const anyWorking = group.rows.some(r => r.working)
            return (
              <div key={group.skinName} style={{ borderBottom: "1px solid var(--line)" }}>
                {/* Group header */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 12px", background: "rgb(var(--term)/0.04)" }}>
                  <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--fg-strong)", flex: 1 }}>
                    {group.skinName}
                  </span>
                  <span className="sr-faint" style={{ fontSize: 11 }}>
                    {group.rows.filter(r => r.hasRender === true).length}/{group.rows.length}
                  </span>
                  {!allDone && (
                    <button
                      onClick={() => runGroup(gi, false)}
                      disabled={anyWorking}
                      className="sr-btn sr-sm"
                    >
                      {anyWorking ? <Loader2 size={11} className="sr-spin" /> : <RefreshCw size={11} />}
                      Fill
                    </button>
                  )}
                  <button
                    onClick={() => runGroup(gi, true)}
                    disabled={anyWorking}
                    className="sr-btn sr-sm sr-danger"
                  >
                    {anyWorking ? <Loader2 size={11} className="sr-spin" /> : <RefreshCw size={11} />}
                    Re-render
                  </button>
                </div>

                {/* NPC rows */}
                {group.rows.map((row, ri) => (
                  <div
                    key={row.npc.name}
                    className="sr-svc-row"
                    style={{ display: "flex", alignItems: "center", gap: 10, paddingLeft: 28 }}
                  >
                    <MiniPreview npcName={row.npc.name} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--fg)" }}>{row.npc.name}</div>
                      <div className="sr-faint" style={{ fontSize: 11 }}>dialogId: {row.npc.dialogId}</div>
                    </div>
                    {row.hasRender === null
                      ? <Loader2 size={13} className="sr-spin sr-faint" />
                      : row.hasRender
                        ? <CheckCircle size={13} style={{ color: "var(--ok)", flexShrink: 0 }} />
                        : <XCircle size={13} style={{ color: "var(--crit)", flexShrink: 0 }} />
                    }
                    <button
                      onClick={() => runRender(gi, ri)}
                      disabled={row.working}
                      className="sr-btn sr-sm"
                    >
                      {row.working ? <Loader2 size={11} className="sr-spin" /> : <RefreshCw size={11} />}
                      {row.hasRender === false ? "Generate" : "Re-render"}
                    </button>
                  </div>
                ))}
              </div>
            )
          })
        )}
      </div>
    </>
  )
}
