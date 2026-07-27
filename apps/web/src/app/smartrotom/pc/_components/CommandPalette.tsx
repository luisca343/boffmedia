"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { usePcUi } from "../_stores/pcUiStore"
import { boxName } from "../_utils/boxMeta"
import { TOTAL_BOXES } from "../_utils/constants"
import { SMART_VIEWS } from "../_utils/smartViews"
import { Chip, Icon, Overlay, type IconName } from "./ui"

interface Command {
  id: string
  label: string
  icon: IconName
  /** Extra words the fuzzy match should hit — synonyms the label does not carry. */
  kw: string
  run: () => void
}

export interface CommandPaletteProps {
  onClose: () => void
  onOpenFilters: () => void
  onOpenLivingDex: () => void
  onOpenOverview: () => void
  onOpenShare: () => void
}

export function CommandPalette({
  onClose,
  onOpenFilters,
  onOpenLivingDex,
  onOpenOverview,
  onOpenShare,
}: CommandPaletteProps) {
  const t = useTranslations("pc")
  const multiMode = usePcUi((s) => s.multiMode)
  const setMultiMode = usePcUi((s) => s.setMultiMode)
  const dualMode = usePcUi((s) => s.dualMode)
  const toggleDual = usePcUi((s) => s.toggleDual)
  const sound = usePcUi((s) => s.sound)
  const setSound = usePcUi((s) => s.setSound)
  const applyView = usePcUi((s) => s.applyView)
  const setActiveBox = usePcUi((s) => s.setActiveBox)
  const boxMeta = usePcUi((s) => s.boxMeta)

  const [q, setQ] = useState("")
  const [sel, setSel] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const commands = useMemo<Command[]>(() => {
    const list: Command[] = [
      { id: "filters", label: t("topbar.filters"), icon: "sliders", kw: "filtro buscar", run: onOpenFilters },
      { id: "overview", label: t("help.shortcuts.overview"), icon: "grid", kw: "cajas todas overview", run: onOpenOverview },
      {
        id: "livingdex",
        label: t("topbar.livingDex"),
        icon: "book",
        kw: "living dex pokedex huecos completar",
        run: onOpenLivingDex,
      },
      {
        id: "multi",
        label: multiMode ? t("bulk.deselectAll") : t("topbar.multiSelect"),
        icon: "check",
        kw: "seleccionar bulk multiple",
        run: () => setMultiMode(!multiMode),
      },
      {
        id: "dual",
        label: dualMode ? t("topbar.dualBox") : t("topbar.dualBox"),
        icon: "columns",
        kw: "dual dos cajas",
        run: toggleDual,
      },
      {
        id: "sound",
        label: sound ? t("topbar.muteSound") : t("topbar.unmuteSound"),
        icon: sound ? "volumeOff" : "volume",
        kw: "sonido audio mute",
        run: () => setSound(!sound),
      },
      {
        id: "share",
        label: t("topbar.commands"),
        icon: "share",
        kw: "compartir exportar codigo share",
        run: onOpenShare,
      },
    ]

    for (const v of SMART_VIEWS) {
      list.push({
        id: v.id,
        label: `${t("views.title")}: ${v.nameKey ? t(v.nameKey) : v.name ?? ""}`,
        icon: v.icon as IconName,
        kw: `${t("views.title")} ${v.nameKey ? t(v.nameKey) : v.name ?? ""}`,
        run: () => applyView(v),
      })
    }

    for (let i = 0; i < TOTAL_BOXES; i++) {
      const name = boxName(boxMeta, i)
      list.push({
        id: `box-${i}`,
        label: `${t("filters.sortFields.box")} ${i + 1} — ${name}`,
        icon: "box",
        kw: `caja ${i + 1} ${name}`,
        run: () => setActiveBox(i),
      })
    }

    return list
  }, [
    multiMode,
    dualMode,
    sound,
    boxMeta,
    setMultiMode,
    toggleDual,
    setSound,
    applyView,
    setActiveBox,
    onOpenFilters,
    onOpenLivingDex,
    onOpenOverview,
    onOpenShare,
  ])

  const filtered = useMemo(() => {
    const t = q.toLowerCase().trim()
    if (!t) return commands.slice(0, 8)
    return commands.filter((c) => `${c.label} ${c.kw}`.toLowerCase().includes(t)).slice(0, 9)
  }, [q, commands])

  useEffect(() => {
    setSel(0)
  }, [q])

  const exec = (c: Command | undefined) => {
    if (!c) return
    onClose()
    c.run()
  }

  return (
    <Overlay onClose={onClose} align="top">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("commands.title")}
        onClick={(e) => e.stopPropagation()}
        className="pc-glass w-[560px] max-w-[94vw] animate-pc-slide-up overflow-hidden rounded-pc-lg font-pc text-pc-fg motion-reduce:animate-none"
      >
        <div className="flex items-center gap-2.5 border-b border-pc-line px-4 py-3.5">
          <Icon name="command" size={17} className="text-pc-accent" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault()
                setSel((s) => Math.min(s + 1, filtered.length - 1))
              } else if (e.key === "ArrowUp") {
                e.preventDefault()
                setSel((s) => Math.max(s - 1, 0))
              } else if (e.key === "Enter") {
                e.preventDefault()
                exec(filtered[sel])
              }
            }}
            aria-label={t("topbar.commands")}
            placeholder={t("topbar.commands")}
            className="flex-1 border-none bg-transparent p-0 text-[15px] text-pc-fg outline-none placeholder:text-pc-fg-subtle"
          />
          <Chip className="text-[10px]">ESC</Chip>
        </div>

        <div className="max-h-[360px] overflow-auto p-[7px]">
          {filtered.length === 0 && (
            <p className="p-6 text-center text-[13px] text-pc-fg-subtle">{t("empty.noResults")}</p>
          )}
          {filtered.map((c, i) => (
            <button
              key={c.id}
              type="button"
              onClick={() => exec(c)}
              onMouseEnter={() => setSel(i)}
              className={`flex w-full items-center gap-[11px] rounded-[10px] px-3 py-2.5 text-left focus-visible:outline-none ${
                i === sel ? "bg-pc-accent/[.16]" : "bg-transparent"
              }`}
            >
              <Icon name={c.icon} size={15} className={i === sel ? "text-pc-accent" : "text-pc-fg-subtle"} />
              <span className="flex-1 text-[13.5px]">{c.label}</span>
              {i === sel && <Icon name="arrowR" size={14} className="text-pc-accent" />}
            </button>
          ))}
        </div>
      </div>
    </Overlay>
  )
}
