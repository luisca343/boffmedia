"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { RefreshCw, CheckCircle, XCircle, Loader2, ImageOff, SlidersHorizontal, Palette } from "lucide-react"
import { MisionesService } from "@/services/api/smartrotom/misionesService"
import {
  generateNpcFaceRender,
  generateNpcBodyRender,
  generateNpcHeadRender,
  checkNpcRenderStatus,
  invalidateNpcRenderCache,
} from "@/components/smartrotom/MinecraftSkin"
import { NPCCatalogResponse } from "@/types/misiones"
import { env } from "@/config/env.public"

const RENDER_BASE = `${env.NEXT_PUBLIC_API}/public/smartrotom/img/customNPC/renders`

type RenderStatus = {
  sourceExists: boolean
  faceRenderExists: boolean
  bodyRenderExists: boolean
  headRenderExists: boolean
}

type SkinEntry = {
  skinName: string
  npcNames: string[]
  status: RenderStatus | null
  faceUrl: string | null
  headUrl: string | null
  bodyUrl: string | null
  working: "face" | "body" | "head" | "all" | null
}

function MiniPreview({ url, size, pixelated }: { url: string | null; size: number; pixelated?: boolean }) {
  const [errored, setErrored] = useState(false)
  if (!url || errored) {
    return (
      <div
        className="sr-faint"
        style={{ width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--line)", borderRadius: "var(--radius)", flexShrink: 0 }}
      >
        <ImageOff style={{ width: 10, height: 10 }} />
      </div>
    )
  }
  return (
    <img
      key={url}
      src={url}
      width={size}
      height={size}
      alt=""
      onError={() => setErrored(true)}
      style={{ imageRendering: pixelated ? "pixelated" : "auto", display: "block", flexShrink: 0 }}
    />
  )
}

function StatusDot({ exists }: { exists: boolean | null }) {
  if (exists === null) return <Loader2 style={{ width: 12, height: 12, color: "var(--fg-faint)" }} className="sr-spin" />
  return exists
    ? <CheckCircle style={{ width: 12, height: 12, color: "var(--ok)" }} />
    : <XCircle style={{ width: 12, height: 12, color: "var(--crit)" }} />
}

export default function SkinsAdminPage() {
  const [skins, setSkins] = useState<SkinEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    MisionesService.getNpcCatalog()
      .then((res) => {
        const catalog = (res.data as unknown as NPCCatalogResponse) ?? {}
        const npcs = Object.values(catalog).flat()
        const byName = new Map<string, string[]>()
        for (const npc of npcs) {
          const s = npc.skin || "steve"
          if (!byName.has(s)) byName.set(s, [])
          byName.get(s)!.push(npc.name)
        }

        const entries: SkinEntry[] = Array.from(byName.entries()).map(([skinName, npcNames]) => ({
          skinName,
          npcNames,
          status: null,
          faceUrl: null,
          headUrl: null,
          bodyUrl: null,
          working: null,
        }))
        setSkins(entries)
        setLoading(false)

        entries.forEach((entry, idx) => {
          const base = entry.skinName.replace(/\.png$/i, "")
          checkNpcRenderStatus(entry.skinName).then((status) => {
            setSkins((prev) =>
              prev.map((e, i) =>
                i !== idx
                  ? e
                  : {
                      ...e,
                      status,
                      faceUrl: status.faceRenderExists ? `${RENDER_BASE}/${base}_face.png` : null,
                      headUrl: status.headRenderExists ? `${RENDER_BASE}/${base}_head.png` : null,
                      bodyUrl: status.bodyRenderExists ? `${RENDER_BASE}/${base}.png` : null,
                    }
              )
            )
          })
        })
      })
      .catch(() => setLoading(false))
  }, [])

  const runRender = async (idx: number, mode: "face" | "body" | "head" | "all", force: boolean) => {
    setSkins((prev) => prev.map((e, i) => (i === idx ? { ...e, working: mode } : e)))
    const skin = skins[idx]
    invalidateNpcRenderCache(skin.skinName)

    if (mode === "face" || mode === "all") {
      const url = await generateNpcFaceRender(skin.skinName, force)
      setSkins((prev) =>
        prev.map((e, i) =>
          i !== idx ? e : { ...e, faceUrl: url, status: e.status ? { ...e.status, faceRenderExists: !!url } : null }
        )
      )
    }
    if (mode === "head" || mode === "all") {
      const url = await generateNpcHeadRender(skin.skinName, force)
      setSkins((prev) =>
        prev.map((e, i) =>
          i !== idx ? e : { ...e, headUrl: url, status: e.status ? { ...e.status, headRenderExists: !!url } : null }
        )
      )
    }
    if (mode === "body" || mode === "all") {
      const url = await generateNpcBodyRender(skin.skinName, force)
      setSkins((prev) =>
        prev.map((e, i) =>
          i !== idx ? e : { ...e, bodyUrl: url, status: e.status ? { ...e.status, bodyRenderExists: !!url } : null }
        )
      )
    }

    setSkins((prev) => prev.map((e, i) => (i === idx ? { ...e, working: null } : e)))
  }

  const runBulk = async (force: boolean) => {
    for (let i = 0; i < skins.length; i++) {
      const s = skins[i]
      if (!force && s.status?.faceRenderExists && s.status?.headRenderExists && s.status?.bodyRenderExists) continue
      await runRender(i, "all", force)
    }
  }

  return (
    <>
      <div className="sr-page-head">
        <h1 className="sr-page-title"><Palette size={20} /> NPC Skins</h1>
        <p className="sr-page-sub">Renders por skin — cara (2D) + cabeza (3D) + cuerpo (3D)</p>
      </div>

      <div className="sr-panel">
        <div className="sr-toolbar">
          <Link href="/smartrotom/admin/skins/tuner" className="sr-btn" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <SlidersHorizontal size={13} /> Camera Tuner
          </Link>
          <button onClick={() => runBulk(false)} className="sr-btn" disabled={loading}>
            <RefreshCw size={13} /> Fill missing
          </button>
          <button onClick={() => runBulk(true)} className="sr-btn sr-danger" disabled={loading}>
            <RefreshCw size={13} /> Force re-render all
          </button>
          <span className="sr-faint" style={{ fontSize: 12, marginLeft: "auto" }}>
            {loading ? "Cargando NPCs…" : `${skins.length} skins únicas`}
          </span>
        </div>

        {loading ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: 24, color: "var(--fg-muted)", fontSize: 13 }}>
            <Loader2 size={16} className="sr-spin" /> Cargando catálogo de NPCs…
          </div>
        ) : skins.length === 0 ? (
          <div className="sr-empty" style={{ margin: 16 }}>
            <div className="sr-ic"><Palette size={28} /></div>
            <div className="sr-t">No se encontraron skins</div>
          </div>
        ) : (
          <>
            {/* Header row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 36px 44px 52px auto auto", gap: "0 12px", alignItems: "center", padding: "6px 12px", fontSize: 11, color: "var(--fg-faint)", borderBottom: "1px solid var(--line)" }}>
              <span>Skin / NPCs</span>
              <span style={{ textAlign: "center" }}>2D</span>
              <span style={{ textAlign: "center" }}>Head</span>
              <span style={{ textAlign: "center" }}>Body</span>
              <span>Status</span>
              <span>Acciones</span>
            </div>

            {skins.map((entry, idx) => {
              const busy = entry.working !== null
              return (
                <div
                  key={entry.skinName}
                  className="sr-svc-row"
                  style={{ display: "grid", gridTemplateColumns: "1fr 36px 44px 52px auto auto", gap: "0 12px", alignItems: "center" }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--fg-strong)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{entry.skinName}</div>
                    <div className="sr-faint" style={{ fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{entry.npcNames.join(", ")}</div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <MiniPreview key={entry.faceUrl ?? "face-empty"} url={entry.faceUrl} size={28} pixelated />
                  </div>
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <MiniPreview key={entry.headUrl ?? "head-empty"} url={entry.headUrl} size={36} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <MiniPreview key={entry.bodyUrl ?? "body-empty"} url={entry.bodyUrl} size={40} />
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    {([
                      { key: "sourceExists" as const,     label: "src" },
                      { key: "faceRenderExists" as const, label: "2d" },
                      { key: "headRenderExists" as const, label: "head" },
                      { key: "bodyRenderExists" as const, label: "body" },
                    ]).map(({ key, label }) => (
                      <div key={label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <StatusDot exists={entry.status ? entry.status[key] : null} />
                        <span className="sr-faint" style={{ fontSize: 10 }}>{label}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <button onClick={() => runRender(idx, "all", false)} disabled={busy} className="sr-btn sr-sm">
                      {busy ? <Loader2 size={11} className="sr-spin" /> : <RefreshCw size={11} />}
                      Fill
                    </button>
                    <button onClick={() => runRender(idx, "all", true)} disabled={busy} className="sr-btn sr-sm sr-danger">
                      {busy ? <Loader2 size={11} className="sr-spin" /> : <RefreshCw size={11} />}
                      Force
                    </button>
                  </div>
                </div>
              )
            })}
          </>
        )}
      </div>
    </>
  )
}
