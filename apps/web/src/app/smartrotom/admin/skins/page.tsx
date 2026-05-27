"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { RefreshCw, CheckCircle, XCircle, Loader2, ImageOff, SlidersHorizontal } from "lucide-react"
import AdminPageLayout from "@/app/smartrotom/admin/_components/AdminPageLayout"
import TerminalCard from "@/app/smartrotom/admin/_components/TerminalCard"
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
        className="flex items-center justify-center bg-highlight-900/20 border border-highlight-800/40 rounded-sm"
        style={{ width: size, height: size, flexShrink: 0 }}
      >
        <ImageOff className="w-3 h-3 text-highlight-700" />
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
  if (exists === null) return <Loader2 className="w-3 h-3 animate-spin text-highlight-600" />
  return exists
    ? <CheckCircle className="w-3 h-3 text-green-400" />
    : <XCircle className="w-3 h-3 text-red-400" />
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
    <AdminPageLayout title="NPC Skins" backLink="/smartrotom/admin" addBackgroundEffects>
      <div className="flex gap-2 mb-4 flex-wrap items-center">
        <Link
          href="/smartrotom/admin/skins/tuner"
          className="text-xs px-2 py-1 border border-highlight-600 text-highlight-400 hover:bg-highlight-900/40 flex items-center gap-1 rounded-sm transition-colors"
        >
          <SlidersHorizontal className="w-3 h-3" /> Camera Tuner
        </Link>
        <span className="text-highlight-800 text-xs">|</span>
        <button
          onClick={() => runBulk(false)}
          className="text-xs px-2 py-1 border border-highlight-600 text-highlight-400 hover:bg-highlight-900/40 flex items-center gap-1 rounded-sm transition-colors"
        >
          <RefreshCw className="w-3 h-3" /> Fill all missing
        </button>
        <button
          onClick={() => runBulk(true)}
          className="text-xs px-2 py-1 border border-highlight-600 text-highlight-400 hover:bg-highlight-900/40 flex items-center gap-1 rounded-sm transition-colors"
        >
          <RefreshCw className="w-3 h-3" /> Force re-render all
        </button>
        <span className="text-xs text-highlight-700 ml-2">
          {loading ? "Loading NPCs…" : `${skins.length} unique skins`}
        </span>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-highlight-600 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> Cargando NPCs...
        </div>
      ) : (
        <TerminalCard title="Skin catalog" description="Face (2D) + head (3D) + body (3D) renders per NPC skin">
          {/* Header */}
          <div className="grid grid-cols-[1fr_36px_44px_52px_auto_auto] gap-x-3 items-center px-2 py-1 text-xs text-highlight-700 border-b border-highlight-800/40 mb-1">
            <span>Skin / NPCs</span>
            <span className="text-center">2D</span>
            <span className="text-center">Head</span>
            <span className="text-center">Body</span>
            <span>Status</span>
            <span>Actions</span>
          </div>

          <div className="flex flex-col divide-y divide-highlight-800/30">
            {skins.map((entry, idx) => {
              const busy = entry.working !== null
              return (
                <div
                  key={entry.skinName}
                  className="grid grid-cols-[1fr_36px_44px_52px_auto_auto] gap-x-3 items-center px-2 py-1.5 hover:bg-highlight-900/10 transition-colors"
                >
                  {/* Name + NPCs */}
                  <div className="min-w-0">
                    <p className="text-highlight-300 text-xs font-mono truncate">{entry.skinName}</p>
                    <p className="text-highlight-700 text-xs truncate">{entry.npcNames.join(", ")}</p>
                  </div>

                  {/* Face (2D) preview */}
                  <div className="flex justify-center">
                    <MiniPreview key={entry.faceUrl ?? "face-empty"} url={entry.faceUrl} size={28} pixelated />
                  </div>

                  {/* Head (3D) preview */}
                  <div className="flex justify-center">
                    <MiniPreview key={entry.headUrl ?? "head-empty"} url={entry.headUrl} size={36} />
                  </div>

                  {/* Body (3D) preview */}
                  <div className="flex justify-center">
                    <MiniPreview key={entry.bodyUrl ?? "body-empty"} url={entry.bodyUrl} size={40} />
                  </div>

                  {/* Status dots */}
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1">
                      <StatusDot exists={entry.status?.sourceExists ?? null} />
                      <span className="text-xs text-highlight-700">src</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <StatusDot exists={entry.status?.faceRenderExists ?? null} />
                      <span className="text-xs text-highlight-700">2d</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <StatusDot exists={entry.status?.headRenderExists ?? null} />
                      <span className="text-xs text-highlight-700">head</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <StatusDot exists={entry.status?.bodyRenderExists ?? null} />
                      <span className="text-xs text-highlight-700">body</span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => runRender(idx, "all", false)}
                      disabled={busy}
                      className="text-xs px-1.5 py-0.5 border border-highlight-700 text-highlight-500 hover:bg-highlight-900/40 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 rounded-sm transition-colors whitespace-nowrap"
                    >
                      {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                      Fill
                    </button>
                    <button
                      onClick={() => runRender(idx, "all", true)}
                      disabled={busy}
                      className="text-xs px-1.5 py-0.5 border border-highlight-700 text-highlight-500 hover:bg-highlight-900/40 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 rounded-sm transition-colors whitespace-nowrap"
                    >
                      {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                      Force
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </TerminalCard>
      )}
    </AdminPageLayout>
  )
}
