"use client"

import { useTranslations } from "next-intl"
import { usePokemonStore } from "@/stores/pokemonStore"
import { cn } from "@/lib/utils"
import { Icon, Pill, Sprite } from "../ui"
import { useFormat } from "../../_hooks/useFormat"
import type { RookerCapture } from "../../_types"

/**
 * A capture, attached to a trino.
 *
 * Every field on this card comes from a real `rotom_pokedex` row: the species, the
 * shiny palette, and when it was caught. That is *all* the registry stores.
 *
 * [deferred] No level, nature, capture location, ball type or IV meter: the Pokédex
 * registry has no such columns and the Pixelmon server does not expose them
 * per-capture. Inventing numbers that would look authoritative and be fiction is worse
 * than a shorter card, so it drops those rows entirely and leans on the sprite.
 * Registered in docs/smartrotom/deferred/README.md; if the game server ever exposes
 * them, they slot straight back into this grid.
 *
 * A shiny gets the full treatment — cyan border, sheen crawling across the art, sparkle
 * — because that IS the moment worth posting about, and the registry does know.
 */
export function CaptureCard({ data }: { data: RookerCapture }) {
  const t = useTranslations("rooker")
  const { fullTime } = useFormat()
  const species = usePokemonStore((s) => s.allPokemon.find((p) => p.dex === data.pokemonId))
  const name = species?.name ?? `#${String(data.pokemonId).padStart(3, "0")}`

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-rk border bg-gradient-to-b from-rk-elevated to-rk-card",
        data.shiny ? "border-rk-shiny/45" : "border-rk-line-strong",
      )}
    >
      {data.shiny && (
        // The sheen. `background-size: 200%` is what gives rk-shimmer somewhere to
        // travel — the keyframe drives background-position, not transform.
        <div
          className="pointer-events-none absolute inset-0 animate-rk-shimmer bg-[length:200%_100%] opacity-50 motion-reduce:animate-none"
          style={{
            backgroundImage:
              "linear-gradient(110deg, transparent 30%, rgb(29 155 240 / .25) 45%, rgb(255 255 255 / .35) 50%, rgb(29 155 240 / .25) 55%, transparent 70%)",
          }}
        />
      )}

      <div className="relative flex items-center gap-3.5 p-3.5">
        <div className="relative grid h-24 w-24 flex-none place-items-center rounded-rk-md bg-rk-bg/40">
          <Sprite
            dex={data.pokemonId}
            form={data.formId}
            palette={data.paletteId}
            size={86}
            alt={name}
          />
          {data.shiny && (
            <span className="absolute right-1.5 top-1.5 text-rk-shiny">
              <Icon name="sparkle" size={16} fill />
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-1.5">
            <Pill className="border border-rk-accent/30 bg-rk-accent/15 text-rk-accent">
              <Icon name="plus" size={10} /> {t("card.capture.badge")}
            </Pill>
            {data.shiny && (
              <Pill className="border border-rk-shiny/45 bg-rk-shiny/20 text-rk-shiny">{t("card.capture.shinyBadge")}</Pill>
            )}
          </div>

          <div className="text-[1.1875rem] font-bold capitalize text-rk-fg">{name.toLowerCase()}</div>

          {data.caughtAt && (
            <div className="mt-1 flex items-center gap-1.5 text-[0.78125rem] text-rk-fg-muted">
              <Icon name="calendar" size={12} className="flex-none text-rk-fg-subtle" />
              {t("card.capture.registeredOn", { date: fullTime(data.caughtAt) })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
