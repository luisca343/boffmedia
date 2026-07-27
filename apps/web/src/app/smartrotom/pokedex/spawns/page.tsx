"use client"
import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { CompassIcon } from "lucide-react"
import { getSpawns } from "@/services/mcef/mcefApi"
import { usePokedexData } from "@/hooks/usePokedexData"
import { PokedexStatus } from "../dexUtils"
import { ScreenShell } from "../_components/ScreenShell"
import { PageHead, MetaStat } from "../_components/PageHead"
import { StatusPill } from "../_components/ui"
import { SpawnTile } from "../_components/SpawnTile"
import { RARITY_META } from "../_utils/dexMeta"
import type { PossibleSpawn } from "../_components/PossibleSpawns"

const RARITY_ORDER = ["legendary", "ultra", "rare", "uncommon", "common"]

function classifyRarity(percentage: number): string {
  if (percentage <= 0.001) return "legendary"
  if (percentage <= 0.1) return "ultra"
  if (percentage <= 0.5) return "rare"
  if (percentage <= 2) return "uncommon"
  return "common"
}

export default function SpawnsPage() {
  const t = useTranslations("pokedex")
  const [spawns, setSpawns] = useState<PossibleSpawn[]>([])
  const [tick, setTick] = useState(30)
  const [hideCaught, setHideCaught] = useState(false)
  const [hideSeen, setHideSeen] = useState(false)
  const { getPokemonStatus } = usePokedexData()

  useEffect(() => {
    const fetchSpawns = async () => {
      try {
        const result = await getSpawns()
        const res = result.data ?? []
        res.sort((a, b) => b.rarity - a.rarity)
        setSpawns(res)
      } catch (e) {
        console.error("Error fetching spawns:", e)
      }
    }
    fetchSpawns()
    const interval = setInterval(fetchSpawns, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const i = setInterval(() => setTick((prev) => (prev <= 0 ? 30 : prev - 1)), 1000)
    return () => clearInterval(i)
  }, [])

  const isHidden = (dex: number, form: string) => {
    const s = getPokemonStatus(dex, form || "base")
    if (hideCaught && (s === PokedexStatus.CAUGHT || s === PokedexStatus.SHINY)) return true
    if (hideSeen && s === PokedexStatus.SEEN) return true
    return false
  }

  const grouped: Record<string, PossibleSpawn[]> = {}
  for (const s of spawns) {
    if (isHidden(s.dex, s.form)) continue
    const r = classifyRarity(s.percentage)
    ;(grouped[r] ??= []).push(s)
  }
  const total = Object.values(grouped).reduce((a, b) => a + b.length, 0)

  return (
    <ScreenShell>
      <PageHead
        icon={CompassIcon}
        eyebrow={t("spawns_eyebrow")}
        title={t("spawns_title")}
        desc={t("spawns_desc")}
        meta={
          <>
            <MetaStat label={t("spawns_visible")} value={total} />
            <span className="inline-flex items-center justify-end gap-1.5 font-pk-mono text-pk-secondary-400">
              <span className="w-1.5 h-1.5 rounded-full bg-pk-secondary-400 shadow-[0_0_6px_#22d3ee] animate-pulse" />⟳ {tick}s
            </span>
          </>
        }
      />

      <div className="flex items-center gap-3 flex-wrap bg-white/[0.02] border border-white/[0.05] rounded-xl p-2.5">
        <span className="font-pk-mono text-[11px] tracking-[0.1em] uppercase text-pk-surface-400 mr-1">{t("spawns_hide")}</span>
        <div className="flex gap-1.5">
          <button
            onClick={() => setHideCaught((c) => !c)}
            aria-pressed={hideCaught}
            className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              hideCaught ? "bg-pk-primary-400/[0.14] border-pk-primary-400/35 text-pk-primary-200" : "bg-white/[0.03] border-white/[0.07] text-pk-surface-300 hover:text-pk-surface-100"
            }`}
          >
            <StatusPill status="caught" size="sm" showLabel={false} />
            {t("spawns_captured")}
          </button>
          <button
            onClick={() => setHideSeen((c) => !c)}
            aria-pressed={hideSeen}
            className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              hideSeen ? "bg-pk-primary-400/[0.14] border-pk-primary-400/35 text-pk-primary-200" : "bg-white/[0.03] border-white/[0.07] text-pk-surface-300 hover:text-pk-surface-100"
            }`}
          >
            <StatusPill status="seen" size="sm" showLabel={false} />
            {t("spawns_seen")}
          </button>
        </div>
        <span className="ml-auto text-[11px] text-pk-surface-500 font-pk-mono">
          {t("spawns_visible_of")} <b className="text-pk-surface-100">{total}</b> {t("spawns_of")} {spawns.length}
        </span>
      </div>

      {total === 0 ? (
        <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-8 text-center text-pk-surface-400 text-sm">{t("spawns_no_pokemon")}</div>
      ) : (
        RARITY_ORDER.map((gid) => {
          const items = grouped[gid]
          if (!items || items.length === 0) return null
          const meta = RARITY_META[gid]
          return (
            <div key={gid} className="flex flex-col gap-2">
              <div className="flex items-center gap-2.5 text-[11px] tracking-wider uppercase font-pk-mono font-semibold" style={{ color: meta.fg }}>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: meta.fg, boxShadow: `0 0 6px ${meta.fg}` }} />
                  {t(meta.labelKey)}
                  <span className="text-pk-surface-500 font-medium ml-1.5">· {items.length}</span>
                </span>
                <span className="flex-1 h-px bg-white/[0.06]" />
              </div>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-2">
                {items.map((s, i) => (
                  <SpawnTile
                    key={`${s.dex}-${s.form}-${i}`}
                    spawn={s}
                    accent={meta.fg}
                    status={getPokemonStatus(s.dex, s.form || "base")}
                  />
                ))}
              </div>
            </div>
          )
        })
      )}
    </ScreenShell>
  )
}
