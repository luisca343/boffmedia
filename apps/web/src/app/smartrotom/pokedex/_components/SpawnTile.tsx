"use client"

import Link from "next/link"
import Image from "next/image"
import { useTranslations } from "next-intl"
import { PokedexStatus } from "../dexUtils"
import { getSpriteUrl } from "@/utils/spriteUtils"
import type { PossibleSpawn } from "./PossibleSpawns"

const SHADOW = "drop-shadow(0 3px 4px rgba(0,0,0,.3))"

function formatPercentage(pct: number): string {
  if (pct <= 0.0009) return pct.toFixed(4)
  if (pct <= 0.009) return pct.toFixed(3)
  return pct.toFixed(2)
}

export function SpawnTile({
  spawn,
  accent,
  status,
}: {
  spawn: PossibleSpawn
  accent: string
  status: PokedexStatus
}) {
  const t = useTranslations("pokedex")
  const form = spawn.form || "base"
  const palette = spawn.palette || "none"
  const isUnseen = status === PokedexStatus.UNSEEN
  const spriteUrl = getSpriteUrl({ id: spawn.dex, form, palette })

  // The default form and palette are skipped by name, not by an empty translation:
  // `form_base` is blank but `palette_none` reads "Base". Anything the locale lacks
  // falls back to its raw id.
  const label = (kind: string, value: string) => (t.has(`${kind}_${value}`) ? t(`${kind}_${value}`) : value)
  const formLabel = form === "base" ? "" : label("form", form)
  const paletteLabel = palette === "none" ? "" : label("palette", palette)

  // Unknown hides each part but keeps their count, so a variant still reads as a variant.
  const parts = [spawn.species, formLabel, paletteLabel].filter(Boolean)
  const name = (isUnseen ? parts.map(() => "???") : parts).join(" ")

  return (
    <div
      className="rounded-[10px] transition-all hover:-translate-y-0.5"
      style={{ background: `radial-gradient(80px 60px at 50% 0%, ${accent}, transparent 70%), rgba(255, 255, 255, 0.025)` }}
    >
      <Link
        href={`/smartrotom/pokedex/entrada/${spawn.dex}/${form}`}
        className="relative border border-white/[0.06] rounded-[10px] p-2.5 flex flex-col items-center gap-1 text-pk-surface-100 hover:border-pk-primary-400/30 transition-colors"
      >
        {isUnseen && (
          <span
            className="absolute top-1.5 right-1.5 font-pk-mono text-[8px] font-bold tracking-widest px-1 py-px rounded"
            style={{ background: accent, color: "#030609" }}
          >
            NUEVO
          </span>
        )}
        {spriteUrl && (
          <Image
            src={spriteUrl}
            alt={name}
            width={56}
            height={56}
            // An inline filter beats a brightness-0 class, so the silhouette has to live here too.
            style={{ imageRendering: "pixelated", filter: isUnseen ? `brightness(0) ${SHADOW}` : SHADOW }}
          />
        )}
        <span className="text-[11px] font-medium text-pk-surface-200 text-center leading-tight">{name}</span>
        <span className="font-pk-mono text-[11px] tabular-nums font-semibold" style={{ color: accent }}>
          {formatPercentage(spawn.percentage)}%
        </span>
      </Link>
    </div>
  )
}
