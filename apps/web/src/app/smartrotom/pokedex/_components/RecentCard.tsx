"use client"

import Link from "next/link"
import { ClockIcon, ArrowRightIcon } from "@heroicons/react/24/outline"
import { useBoffSession } from "@/services/useBoffSession"
import { useGetRegistries } from "@/hooks/pokemon/useGetRegistries"
import { usePokemonStore } from "@/stores/pokemonStore"
import { StatusPill, TypeChip } from "./ui"
import { Loading } from "@/components/smartrotom/Loading"
import Image from "next/image"
import { useEffect, useState } from "react"
import { getSpriteUrl } from "@/utils/spriteUtils"

type EnrichedRegistry = {
  pokemonId: number
  formId: string
  paletteId: string
  caughtAt?: string
  seenAt?: string
  spriteUrl?: string
  name?: string
  types?: string[]
}

export function RecentCard() {
  const { session } = useBoffSession()
  const { registries, isLoading } = useGetRegistries(session.user.smartRotomUser?.uuid!)
  const { getPokemonByDex } = usePokemonStore()
  const [enriched, setEnriched] = useState<EnrichedRegistry[]>([])

  useEffect(() => {
    if (!registries?.length || !getPokemonByDex) return
    const enrich = async () => {
      const results = await Promise.all(
        registries.slice(0, 5).map(async (reg) => {
          try {
            const pokemon = await getPokemonByDex(reg.pokemonId)
            return {
              ...reg,
              name: pokemon?.name,
              types: pokemon?.forms?.[0]?.types as string[] | undefined,
            }
          } catch {
            return reg
          }
        })
      )
      setEnriched(results)
    }
    enrich()
  }, [registries, getPokemonByDex])

  return (
    <div className="bg-white/[0.025] border border-white/[0.06] rounded-[14px] p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="font-pk-display font-semibold text-[15px] tracking-tight text-pk-surface-50 flex items-center gap-2.5">
          <ClockIcon className="w-4 h-4 text-pk-primary-400" />
          Registros recientes
        </h3>
        <Link
          href="/smartrotom/pokedex/registro"
          className="text-xs text-pk-surface-400 hover:text-pk-primary-300 transition-colors flex items-center gap-1"
        >
          Ver todo
          <ArrowRightIcon className="w-3 h-3" />
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-20">
          <Loading width={30} height={30} colorClass="border-pk-primary-400" />
        </div>
      ) : !enriched.length ? (
        <div className="flex justify-center items-center h-20 text-pk-surface-400 text-sm">Sin registros todavía</div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {enriched.map((reg, i) => {
            const isShiny = reg.paletteId === "shiny"
            const statusKey = reg.caughtAt ? (isShiny ? "shiny" : "caught") : reg.seenAt ? "seen" : "unknown"
            const spriteUrl =
              reg.spriteUrl || getSpriteUrl({ id: reg.pokemonId, form: reg.formId || "base", palette: reg.paletteId || "none" })
            const timeAgo = reg.caughtAt || reg.seenAt

            return (
              <Link
                key={`${reg.pokemonId}-${reg.formId}-${i}`}
                href={`/smartrotom/pokedex/entrada/${reg.pokemonId}/${reg.formId || "base"}`}
                className="flex items-center gap-3 py-2 px-2.5 rounded-[9px] text-left transition-colors hover:bg-white/[0.04]"
              >
                <div
                  className={`w-12 h-12 rounded-lg grid place-items-center shrink-0 border ${
                    isShiny
                      ? "bg-[radial-gradient(40px_30px_at_50%_50%,rgba(240,171,252,0.25),transparent_70%)] border-pk-accent-300/30"
                      : "bg-white/[0.03] border-white/[0.05]"
                  }`}
                >
                  {spriteUrl && (
                    <Image src={spriteUrl} alt="" width={36} height={36} style={{ imageRendering: "pixelated" }} />
                  )}
                </div>
                <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[13.5px] font-semibold text-pk-surface-50">{reg.name || `#${reg.pokemonId}`}</span>
                    <StatusPill status={statusKey} size="sm" showLabel={false} />
                    {reg.types?.map((type) => (
                      <TypeChip key={type} type={type} size="sm" showLabel={false} />
                    ))}
                  </div>
                  <div className="flex items-center gap-2 text-[11.5px] text-pk-surface-400">
                    <span className="w-[3px] h-[3px] rounded-full bg-pk-surface-600" />
                    <span>{reg.formId || "base"}</span>
                  </div>
                </div>
                <span className="font-pk-mono text-[10.5px] text-pk-surface-500 shrink-0 text-right">
                  {timeAgo ? getRelativeTime(timeAgo) : "—"}
                </span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

function getRelativeTime(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMs = now - then
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return "ahora"
  if (diffMin < 60) return `${diffMin} min`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH}h`
  const diffD = Math.floor(diffH / 24)
  return `${diffD}d`
}
