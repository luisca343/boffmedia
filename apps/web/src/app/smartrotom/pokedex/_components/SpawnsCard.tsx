"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { CompassIcon } from "lucide-react"
import Image from "next/image"
import { getSpawns } from "@/services/mcef/mcefApi"
import { Loading } from "@/components/smartrotom/Loading"
import { RARITY_META } from "../_utils/dexMeta"
import { usePokedexData } from "@/hooks/usePokedexData"
import { PokedexStatus } from "../dexUtils"
import { getSpriteUrl } from "@/utils/spriteUtils"
import type { PossibleSpawn } from "./PossibleSpawns"

const RARITY_ORDER = ["legendary", "ultra", "rare", "uncommon", "common"]
const RARITY_THRESHOLDS: Record<string, number> = {
  legendary: 0.001,
  ultra: 0.1,
  rare: 0.5,
  uncommon: 2,
  common: 100,
}

function classifyRarity(percentage: number): string {
  if (percentage <= RARITY_THRESHOLDS.legendary) return "legendary"
  if (percentage <= RARITY_THRESHOLDS.ultra) return "ultra"
  if (percentage <= RARITY_THRESHOLDS.rare) return "rare"
  if (percentage <= RARITY_THRESHOLDS.uncommon) return "uncommon"
  return "common"
}

export function SpawnsCard() {
  const [spawns, setSpawns] = useState<PossibleSpawn[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const [tick, setTick] = useState(30)
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
      } finally {
        setIsLoading(false)
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

  const grouped: Record<string, PossibleSpawn[]> = {}
  for (const s of spawns) {
    const r = classifyRarity(s.percentage)
    if (!grouped[r]) grouped[r] = []
    grouped[r].push(s)
  }

  const groups = filter === "all" ? RARITY_ORDER : [filter]

  const filters = [
    { id: "all", label: "Todos" },
    { id: "ultra", label: "Ultra" },
    { id: "rare", label: "Raros" },
  ]

  return (
    <div className="bg-white/[0.025] border border-white/[0.06] rounded-[14px] p-[18px_20px] flex flex-col gap-3.5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-pk-display font-semibold text-[15px] tracking-tight text-pk-surface-50 flex items-center gap-2.5">
          <CompassIcon className="w-4 h-4 text-pk-primary-400" />
          Apariciones activas
          <span className="inline-flex items-center gap-1.5 font-pk-mono text-[10.5px] text-pk-surface-500">
            <span className="w-1.5 h-1.5 rounded-full bg-pk-secondary-400 shadow-[0_0_6px_#22d3ee] animate-pulse" />
            Actualiza en {tick}s
          </span>
        </h3>
        <div className="flex gap-1.5">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
                filter === f.id
                  ? "bg-pk-primary-400/[0.14] text-pk-primary-200 shadow-[inset_0_0_0_1px_rgba(249,115,22,0.3)]"
                  : "text-pk-surface-300 hover:text-pk-surface-100 hover:bg-white/[0.04]"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-20">
          <Loading width={30} height={30} colorClass="border-pk-primary-400" />
        </div>
      ) : (
        <div>
          {groups.map((gid) => {
            const items = grouped[gid]
            if (!items || items.length === 0) return null
            const meta = RARITY_META[gid]
            return (
              <div key={gid} className="flex flex-col gap-2 mb-3.5 last:mb-0">
                <div className="flex items-center gap-2.5 text-[11px] tracking-wider uppercase font-pk-mono font-semibold" style={{ color: meta.fg }}>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ background: meta.fg, boxShadow: `0 0 6px ${meta.fg}` }} />
                    {meta.label}
                    <span className="text-pk-surface-500 font-medium ml-1.5">· {items.length}</span>
                  </span>
                  <span className="flex-1 h-px bg-white/[0.06]" />
                </div>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(88px,1fr))] gap-2">
                  {items.map((s, i) => {
                    const status = getPokemonStatus(s.dex, s.form || "base")
                    const isNew = status === PokedexStatus.UNSEEN
                    const spriteUrl = getSpriteUrl({ id: s.dex, form: s.form || "base", palette: s.palette || "none" })
                    return (
                      <div
                        key={`${s.dex}-${s.form}-${i}`}
                        className="rounded-[10px] transition-all hover:-translate-y-0.5"
                        style={{ background: `radial-gradient(80px 60px at 50% 0%, ${meta.fg}, transparent 70%), rgba(255, 255, 255, 0.025)` }}
                      >
                        <Link
                          href={`/smartrotom/pokedex/entrada/${s.dex}/${s.form || "base"}`}
                          className="relative border border-white/[0.06] rounded-[10px] p-2.5 flex flex-col items-center gap-1 text-pk-surface-100 hover:border-pk-primary-400/30"
                        >
                          {isNew && (
                            <span
                              className="absolute top-1.5 right-1.5 font-pk-mono text-[8px] font-bold tracking-widest px-1 py-px rounded"
                              style={{ background: meta.fg, color: "#030609" }}
                            >
                              NUEVO
                            </span>
                          )}
                          {spriteUrl && (
                            <Image
                              src={spriteUrl}
                              alt={s.species}
                              width={56}
                              height={56}
                              style={{ imageRendering: "pixelated", filter: "drop-shadow(0 3px 4px rgba(0,0,0,.3))" }}
                            />
                          )}
                          <span className="text-[11px] font-medium text-pk-surface-200 text-center leading-tight">{s.species}</span>
                          <span className="font-pk-mono text-[11px] tabular-nums font-semibold" style={{ color: meta.fg }}>
                            {formatPercentage(s.percentage)}%
                          </span>
                        </Link>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function formatPercentage(pct: number): string {
  if (pct <= 0.0009) return pct.toFixed(4)
  if (pct <= 0.009) return pct.toFixed(3)
  return pct.toFixed(2)
}
