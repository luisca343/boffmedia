"use client"

import { useMemo } from "react"
import { useTranslations } from "next-intl"
import { useSpriteManifestStore } from "@/stores/spriteManifestStore"
import { useMons, useParty, usePcBoxes, usePcUuid } from "../_hooks/queries"
import { Icon, Sprite } from "./ui"

const CELLS = 18

/**
 * The boot screen is bound to the *real* load, not a timer. Four things have to land
 * before the PC can draw itself, and each one is a quarter of the bar: the session
 * (which is what every endpoint is keyed by), storage, the party, and the sprite
 * manifest every slot resolves its image through. The grid fills with actual Pokémon
 * from the collection as they arrive — when it is full, the app is genuinely ready.
 */
export function BootScreen() {
  const t = useTranslations("pc")
  const uuid = usePcUuid()
  const pc = usePcBoxes()
  const party = useParty()
  const manifest = useSpriteManifestStore((s) => s.manifest)
  const { mons } = useMons()

  const steps = [
    { done: !!uuid, label: t("boot.connecting") },
    { done: !!manifest, label: t("boot.connecting") },
    { done: !pc.isLoading && !!pc.data, label: t("boot.loading") },
    { done: !party.isLoading && !!party.data, label: t("boot.loading") },
  ]

  const done = steps.filter((s) => s.done).length
  const pct = Math.round((done / steps.length) * 100)
  const phase = steps.find((s) => !s.done)?.label ?? t("common.loading")

  /** A spread across the collection, so the grid looks like *your* PC booting up. */
  const previews = useMemo(() => {
    if (!mons.length) return []
    const step = Math.max(1, Math.floor(mons.length / CELLS))
    const out = []
    for (let i = 0; i < mons.length && out.length < CELLS; i += step) out.push(mons[i])
    return out
  }, [mons])

  const shown = Math.round((pct / 100) * previews.length)

  return (
    <div
      className="fixed inset-0 z-[300] flex animate-pc-fade flex-col items-center justify-center gap-6 bg-pc-bg font-pc text-pc-fg motion-reduce:animate-none"
      style={{
        background:
          "radial-gradient(900px 600px at 50% 26%, rgb(var(--pc-accent) / .14), transparent 60%), rgb(var(--pc-bg))",
      }}
    >
      <span className="pc-boot-scan" />

      <div className="relative z-10 flex flex-col items-center gap-3.5">
        <div className="relative flex h-[5.25rem] w-[5.25rem] animate-pc-pulse-glow items-center justify-center rounded-[23px] border border-pc-line-strong bg-gradient-to-br from-[#1f3a63] to-[#0c1830] shadow-[inset_0_0_24px_-6px_rgb(79_155_255_/_.7)] motion-reduce:animate-none">
          <Icon name="boxes" size={42} className="text-pc-accent" />
          <span className="absolute inset-0 animate-pc-boot-spin motion-reduce:animate-none">
            <i className="absolute -top-[0.3125rem] left-1/2 -ml-[0.34375rem] block h-[0.6875rem] w-[0.6875rem] rounded-pc-pill bg-pc-cyan shadow-[0_0_12px_rgb(var(--pc-cyan))]" />
          </span>
        </div>
        <div className="text-center">
          <div className="font-pc-display text-[1.3125rem] font-bold tracking-[.14em]">
            SMARTROTOM <span className="text-pc-accent">PC</span>
          </div>
          <div className="mt-[0.3125rem] font-pc-mono text-[0.6875rem] tracking-[.06em] text-pc-fg-subtle">
            {t("topbar.subtitle")}
          </div>
        </div>
      </div>

      <div className="pc-glass relative z-10 w-[18.5rem] overflow-hidden rounded-[18px] p-[0.8125rem] shadow-[0_18px_40px_-18px_rgb(0_0_0_/_.7)]">
        <span className="pc-wp pc-wp-classic pc-wp-dots opacity-50" />
        <div className="relative z-10 grid grid-cols-6 gap-1.5">
          {Array.from({ length: CELLS }, (_, i) => {
            const m = previews[i]
            const on = !!m && i < shown
            return (
              <div
                key={i}
                className={[
                  "flex aspect-square items-center justify-center rounded-lg border bg-gradient-to-b from-[rgb(13_20_36_/_.5)] to-[rgb(9_14_26_/_.65)] transition-[opacity,transform] duration-300",
                  on ? "scale-100 border-pc-line-strong opacity-100" : "scale-[.85] border-pc-line opacity-25",
                ].join(" ")}
              >
                {on && (
                  <Sprite
                    dex={m.pokemon.dex}
                    form={m.pokemon.form}
                    palette={m.pokemon.palette}
                    className="h-[82%] w-[82%] animate-pc-boot-cell motion-reduce:animate-none"
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="relative z-10 w-[18.5rem]">
        <div className="mb-2 flex items-center justify-between font-pc-mono text-[0.71875rem]">
          <span className="flex items-center gap-2 text-pc-fg-muted">
            <span className="h-[0.4375rem] w-[0.4375rem] animate-pc-boot-blink rounded-pc-pill bg-pc-green shadow-[0_0_8px_rgb(var(--pc-green))] motion-reduce:animate-none" />
            {phase}
          </span>
          <span className="font-bold text-pc-accent">{pct}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-pc-pill bg-white/[.08]">
          <span
            className="block h-full transition-[width] duration-200"
            style={{
              width: `${pct}%`,
              background: "linear-gradient(90deg, rgb(var(--pc-accent)), rgb(var(--pc-cyan)))",
              boxShadow: "0 0 12px rgb(var(--pc-accent))",
            }}
          />
        </div>
      </div>
    </div>
  )
}
