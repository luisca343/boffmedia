import type { ExtendedPokemonW } from "@/types/dto/pc-pokemon.dto"
import { genderOf, hasItem, prettyItem } from "../../_utils/derive"
import { Icon } from "./Icon"

/** A track with a fill. Every bar in the app — box fill, HP, a stat, dex progress. */
export function Bar({
  pct,
  tone,
  height = 8,
  className = "",
}: {
  pct: number
  /** A CSS colour or gradient. Data-driven (a stat value, a fill level), so inline. */
  tone: string
  height?: number
  className?: string
}) {
  return (
    <div
      className={`overflow-hidden rounded-pc-pill bg-white/[.07] ${className}`}
      style={{ height }}
      role="presentation"
    >
      <span
        className="block h-full rounded-pc-pill transition-[width] duration-300"
        style={{ width: `${Math.max(0, Math.min(100, pct))}%`, background: tone }}
      />
    </div>
  )
}

/** A stat's colour band. High stats read green, low ones rose. */
export function statTone(v: number): string {
  if (v >= 130) return "rgb(var(--pc-green))"
  if (v >= 90) return "rgb(var(--pc-cyan))"
  if (v >= 60) return "rgb(var(--pc-amber))"
  return "rgb(var(--pc-rose))"
}

export function hpTone(pct: number): string {
  if (pct > 0.5) return "rgb(var(--pc-green))"
  if (pct > 0.2) return "rgb(var(--pc-amber))"
  return "rgb(var(--pc-rose))"
}

export function GenderIcon({ gender, size = 13 }: { gender: string; size?: number }) {
  const g = gender.toLowerCase()
  if (g === "male") return <Icon name="mars" size={size} className="text-[#5aa9ff]" />
  if (g === "female") return <Icon name="venus" size={size} className="text-[#ff7eb6]" />
  return null
}

export function GenderIconFor({ pokemon, size = 13 }: { pokemon: ExtendedPokemonW; size?: number }) {
  return <GenderIcon gender={genderOf(pokemon)} size={size} />
}

/**
 * The held-item indicator on a slot. Pixelmon sends a translation key, not a sprite
 * URL, and there is no item manifest — so this is a labelled dot, not an icon. It is
 * the honest version: it tells you *that* the Pokémon holds something, and the name
 * is one hover (or the detail drawer) away.
 */
export function ItemDot({ pokemon }: { pokemon: ExtendedPokemonW }) {
  if (!hasItem(pokemon)) return null
  return (
    <span
      title={prettyItem(pokemon.item)}
      className="flex h-[0.4375rem] w-[0.4375rem] rounded-pc-pill bg-pc-amber shadow-[0_0_0_2px_rgb(7_11_22_/_.6)]"
    />
  )
}

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pc-shimmer rounded-pc-sm motion-reduce:animate-none ${className}`}
      style={{
        background:
          "linear-gradient(90deg, rgb(255 255 255 / .04) 25%, rgb(255 255 255 / .10) 37%, rgb(255 255 255 / .04) 63%)",
        backgroundSize: "200% 100%",
      }}
    />
  )
}
