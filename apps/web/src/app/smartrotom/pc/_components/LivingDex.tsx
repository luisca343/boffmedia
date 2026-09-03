"use client"

import { useEffect, useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import { usePokemonStore } from "@/stores/pokemonStore"
import { useMons } from "../_hooks/queries"
import { usePcUi } from "../_stores/pcUiStore"
import type { Mon } from "../_types/pc.types"
import { genOf, isShiny } from "../_utils/derive"
import { Bar, ChipButton, Icon, Modal, Sprite } from "./ui"

interface Caught {
  count: number
  shiny: boolean
}

export interface LivingDexProps {
  onClose: () => void
}

/**
 * A read-only tracker. There is deliberately no "auto-organizar" button: with only a
 * single-swap `/pc/move`, gathering one of every species would be hundreds of sequential
 * round-trips against the game server. Showing the gaps is honest; moving 900 Pokémon
 * behind one click is not.
 */
export function LivingDex({ onClose }: LivingDexProps) {
  const t = useTranslations("pc")
  const { mons } = useMons()
  const allPokemon = usePokemonStore((s) => s.allPokemon)
  const isLoadingSpecies = usePokemonStore((s) => s.isLoading)
  const fetchAllPokemon = usePokemonStore((s) => s.fetchAllPokemon)
  const setActiveBox = usePcUi((s) => s.setActiveBox)
  const setDetail = usePcUi((s) => s.setDetail)

  const [onlyMissing, setOnlyMissing] = useState(false)
  const [gen, setGen] = useState(0)

  // The species list is the real Pokédex, not a hardcoded count. If nothing else has
  // pulled it yet, pull it here — `isLoading` guards the double fetch.
  useEffect(() => {
    if (!allPokemon.length && !isLoadingSpecies) void fetchAllPokemon()
  }, [allPokemon.length, isLoadingSpecies, fetchAllPokemon])

  const caught = useMemo(() => {
    const m = new Map<number, Caught>()
    for (const { pokemon } of mons) {
      const e = m.get(pokemon.dex) ?? { count: 0, shiny: false }
      e.count += 1
      if (isShiny(pokemon)) e.shiny = true
      m.set(pokemon.dex, e)
    }
    return m
  }, [mons])

  const dex = useMemo(() => {
    const seen = new Set<number>()
    return allPokemon
      .filter((p) => {
        if (seen.has(p.dex)) return false
        seen.add(p.dex)
        return true
      })
      .sort((a, b) => a.dex - b.dex)
  }, [allPokemon])

  const gens = useMemo(() => [...new Set(dex.map((d) => genOf(d.dex)))].sort((a, b) => a - b), [dex])

  const shown = dex.filter((d) => (gen === 0 || genOf(d.dex) === gen) && (!onlyMissing || !caught.has(d.dex)))
  const total = dex.length
  const have = dex.filter((d) => caught.has(d.dex)).length
  const pct = total ? Math.round((have / total) * 100) : 0

  const goTo = (dexNum: number) => {
    const inBox = mons.find((m) => m.pokemon.dex === dexNum && m.loc.kind === "box")
    const found: Mon | undefined = inBox ?? mons.find((m) => m.pokemon.dex === dexNum)
    if (!found) return
    if (found.loc.kind === "box") setActiveBox(found.loc.box ?? 0)
    setDetail(found.loc)
    onClose()
  }

  return (
    <Modal
      onClose={onClose}
      title={t("livingDex.title")}
      subtitle={t("livingDex.subtitle")}
      icon="book"
      tone="text-pc-gold"
      width={920}
      headerExtra={
        <div className="mr-1.5 text-right">
          <div className="font-pc-mono text-[1.125rem] font-extrabold text-pc-gold">
            {have}
            <span className="text-[0.8125rem] text-pc-fg-subtle">/{total}</span>
          </div>
          <div className="text-[0.65625rem] text-pc-fg-subtle">{t("livingDex.complete", { pct })}</div>
        </div>
      }
      footer={
        <p className="flex-1 text-[0.75rem] text-pc-fg-muted">
          {t("livingDex.missing", { count: total - have })}
        </p>
      }
    >
      {/* `Modal` has no sub-header slot and its body is the scroll container, so the
          filters pin themselves to the top of it. */}
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-2.5 border-b border-pc-line bg-[var(--pc-panel)] px-[1.125rem] py-3 backdrop-blur-md">
        <Bar pct={pct} tone="linear-gradient(90deg, rgb(var(--pc-gold)), #ff8a3d)" className="min-w-[10rem] flex-1" />
        <div className="flex flex-wrap gap-[0.3125rem]">
          <ChipButton active={gen === 0} onClick={() => setGen(0)}>
            {t("livingDex.all")}
          </ChipButton>
          {gens.map((g) => (
            <ChipButton key={g} active={gen === g} onClick={() => setGen(g)}>
              Gen {g}
            </ChipButton>
          ))}
        </div>
        <ChipButton
          onClick={() => setOnlyMissing((v) => !v)}
          className={onlyMissing ? "border-pc-rose text-pc-rose" : ""}
        >
          <Icon name="target" size={12} />
          {t("livingDex.onlyMissing")}
        </ChipButton>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(4rem,1fr))] gap-2 p-4">
        {shown.map((d) => {
          const c = caught.get(d.dex)
          return (
            <button
              key={d.dex}
              type="button"
              disabled={!c}
              onClick={() => goTo(d.dex)}
              title={c ? `${d.name} — ir al ejemplar` : `${d.name} — no capturado`}
              className={[
                "relative flex aspect-square flex-col items-center justify-center rounded-[10px] p-1 focus-visible:outline-none",
                c
                  ? "cursor-pointer border border-pc-line-strong bg-gradient-to-b from-[rgb(13_20_36_/_.5)] to-[rgb(9_14_26_/_.65)]"
                  : "cursor-default border border-dashed border-pc-line bg-white/[.015]",
              ].join(" ")}
            >
              {c ? (
                <Sprite dex={d.dex} palette={c.shiny ? "shiny" : undefined} className="h-[78%] w-[78%]" alt={d.name} />
              ) : (
                <span className="p-0.5 text-center text-[0.5625rem] leading-tight text-pc-fg-subtle/70">{d.name}</span>
              )}
              <span className="absolute inset-x-0 bottom-0.5 text-center font-pc-mono text-[0.53125rem] text-pc-fg-subtle">
                #{String(d.dex).padStart(3, "0")}
              </span>
              {c?.shiny && (
                <Icon name="sparkles" size={11} fill="currentColor" className="absolute right-[3px] top-[3px] text-pc-gold" />
              )}
              {c && c.count > 1 && (
                <span className="absolute left-[3px] top-[3px] font-pc-mono text-[0.53125rem] font-extrabold text-pc-cyan">
                  ×{c.count}
                </span>
              )}
            </button>
          )
        })}
        {shown.length === 0 && (
          <p className="col-span-full p-8 text-center text-pc-fg-subtle">
            {dex.length ? t("livingDex.noGaps") : t("livingDex.loading")}
          </p>
        )}
      </div>
    </Modal>
  )
}
