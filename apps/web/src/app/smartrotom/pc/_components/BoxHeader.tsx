"use client"

import { useEffect, useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { usePokemonStore } from "@/stores/pokemonStore"
import type { Pokemon } from "@/types/Pokemon"
import { planOrganize, useMoveQueue } from "../_hooks/useMoveQueue"
import { usePcUi } from "../_stores/pcUiStore"
import type { Mon } from "../_types/pc.types"
import { boxName, boxTheme } from "../_utils/boxMeta"
import { fillTone, THEME_ACCENT } from "../_utils/boxThemes"
import { POKEMON_PER_BOX } from "../_utils/constants"
import { genOf, isShiny, typesOf } from "../_utils/derive"
import { Bar, Button, Chip, Icon, Input, toast, type IconName } from "./ui"

type OrganizeMode = "dex" | "type" | "gen" | "level" | "shiny"

const ORGANIZE: Array<{ mode: OrganizeMode; label: string; icon: IconName }> = [
  { mode: "dex", label: "Pokédex", icon: "list" },
  { mode: "type", label: "Tipo", icon: "grid" },
  { mode: "gen", label: "Generación", icon: "layers" },
  { mode: "level", label: "Nivel", icon: "sort" },
  { mode: "shiny", label: "Shiny primero", icon: "sparkles" },
]

/** The order the box should end up in. Packed: the Pokémon first, empties after. */
function desiredOrder(
  mode: OrganizeMode,
  contents: (Mon | null)[],
  speciesByDex: Record<number, Pokemon>,
): (Mon | null)[] {
  const list = contents.filter((m): m is Mon => m !== null)
  const byDex = (a: Mon, b: Mon) => a.pokemon.dex - b.pokemon.dex
  const firstType = (m: Mon) => typesOf(m.pokemon, speciesByDex)[0] ?? "zzz"

  const sorted = [...list]
  switch (mode) {
    case "dex":
      sorted.sort(byDex)
      break
    case "type":
      sorted.sort((a, b) => firstType(a).localeCompare(firstType(b)) || byDex(a, b))
      break
    case "gen":
      sorted.sort((a, b) => genOf(a.pokemon.dex) - genOf(b.pokemon.dex) || byDex(a, b))
      break
    case "level":
      sorted.sort((a, b) => b.pokemon.level - a.pokemon.level || byDex(a, b))
      break
    case "shiny":
      sorted.sort(
        (a, b) => Number(isShiny(b.pokemon)) - Number(isShiny(a.pokemon)) || byDex(a, b),
      )
      break
  }

  return Array.from({ length: POKEMON_PER_BOX }, (_, i) => sorted[i] ?? null)
}

export interface BoxHeaderProps {
  box: number
  contents: (Mon | null)[]
  secondary?: boolean
  onPrev: () => void
  onNext: () => void
  onTheme: () => void
  /** The page owns the share sheet. */
  onShare?: (box: number) => void
  /** Only the secondary panel closes. */
  onClose?: () => void
}

export function BoxHeader({
  box,
  contents,
  secondary = false,
  onPrev,
  onNext,
  onTheme,
  onShare,
  onClose,
}: BoxHeaderProps) {
  const t = useTranslations("pc")
  const boxMeta = usePcUi((s) => s.boxMeta)
  const renameBox = usePcUi((s) => s.renameBox)
  const speciesByDex = usePokemonStore((s) => s.pokemonByDex)
  const { run, progress, isRunning } = useMoveQueue()

  const name = boxName(boxMeta, box)
  const accent = THEME_ACCENT[boxTheme(boxMeta, box)]
  const count = contents.filter(Boolean).length

  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(name)
  const [menu, setMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => setDraft(name), [name])

  useEffect(() => {
    if (!menu) return
    const onDown = (e: Event) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenu(false)
    }
    window.addEventListener("pointerdown", onDown)
    return () => window.removeEventListener("pointerdown", onDown)
  }, [menu])

  const commitName = () => {
    setEditing(false)
    renameBox(box, draft.trim() || name)
  }

  const organize = async (mode: OrganizeMode) => {
    setMenu(false)
    const moves = planOrganize(box, contents, desiredOrder(mode, contents, speciesByDex))
    if (moves.length === 0) {
      toast(t("organize.alreadyOrdered"), "info")
      return
    }
    const ok = await run(moves, t("organize.by"))
    if (ok) toast(`${name} ${t("organize.done", { count: moves.length })}`, "success")
  }

  return (
    <div className="flex items-center gap-2.5 border-b border-pc-line px-3.5 py-2.5">
      <Button icon onClick={onPrev} aria-label={t("common.back")}>
        <Icon name="chevL" size={16} />
      </Button>

      <span
        className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-[9px]"
        style={{
          background: `linear-gradient(160deg, ${accent}44, ${accent}15)`,
          border: `1px solid ${accent}66`,
          color: accent,
        }}
      >
        <Icon name="box" size={17} />
      </span>

      <div className="min-w-0 flex-1">
        {editing ? (
          <Input
            autoFocus
            value={draft}
            aria-label="Nombre de la caja"
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur()
              if (e.key === "Escape") {
                setDraft(name)
                setEditing(false)
              }
            }}
            className="px-2 py-0.5 font-pc-display text-base font-bold"
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            title={t("common.save")}
            className="flex max-w-full cursor-text items-center gap-2 text-left"
          >
            <h3 className="truncate font-pc-display text-[17px] font-bold tracking-[.01em] text-pc-fg">
              {name}
            </h3>
            {secondary && (
              <Chip
                className="flex-none text-[10px] text-pc-green"
                style={{ borderColor: "rgb(var(--pc-green))" }}
              >
                2ª
              </Chip>
            )}
          </button>
        )}

        <div className="mt-0.5 flex items-center gap-2">
          <span className="font-pc-mono text-[11.5px] text-pc-fg-subtle">{count}/30</span>
          <Bar
            pct={(count / POKEMON_PER_BOX) * 100}
            tone={fillTone(count)}
            height={4}
            className="w-full max-w-[110px]"
          />
        </div>
      </div>

      {isRunning && progress && (
        <span className="flex-none font-pc-mono text-[11px] text-pc-accent">
          {progress.done}/{progress.total}
        </span>
      )}

      <div ref={menuRef} className="relative flex flex-none gap-1.5">
        <Button icon onClick={onTheme} aria-label="Tema de la caja">
          <Icon name="palette" size={16} />
        </Button>

        <Button
          icon
          active={menu}
          aria-label="Organizar o compartir la caja"
          aria-expanded={menu}
          onClick={() => setMenu((m) => !m)}
        >
          <Icon name="wand" size={16} />
        </Button>

        {menu && (
          <div
            role="menu"
            className="pc-glass absolute right-0 top-[42px] z-30 w-[210px] animate-pc-slide-up rounded-xl border-pc-line-strong p-[7px] shadow-[0_24px_60px_-20px_rgb(0_0_0_/_.8)] motion-reduce:animate-none"
          >
            <div className="px-2 pb-1.5 pt-1 text-[10px] font-bold uppercase tracking-[.05em] text-pc-fg-subtle">
              {t("organize.by")}
            </div>
            {ORGANIZE.map(({ mode, label, icon }) => (
              <Button
                key={mode}
                variant="ghost"
                role="menuitem"
                disabled={count < 2 || isRunning}
                onClick={() => void organize(mode)}
                className="w-full justify-start"
              >
                <Icon name={icon} size={14} className="text-pc-fg-subtle" />
                {label}
              </Button>
            ))}

            <div className="mx-1 my-1.5 h-px bg-pc-line" />

            <Button
              variant="ghost"
              role="menuitem"
              onClick={() => {
                setMenu(false)
                onShare?.(box)
              }}
              className="w-full justify-start"
            >
              <Icon name="share" size={14} className="text-pc-cyan" />
              {t("share.title")}
            </Button>
          </div>
        )}

        <Button icon onClick={onNext} aria-label={t("common.back")}>
          <Icon name="chevR" size={16} />
        </Button>

        {onClose && (
          <Button variant="ghost" icon onClick={onClose} aria-label={t("common.close")}>
            <Icon name="x" size={16} />
          </Button>
        )}
      </div>
    </div>
  )
}
