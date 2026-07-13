"use client"

import { useEffect, useMemo, useRef, useState } from "react"
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
      { id: "filters", label: "Abrir filtros y búsqueda", icon: "sliders", kw: "filtro buscar", run: onOpenFilters },
      { id: "overview", label: "Vista general de cajas", icon: "grid", kw: "cajas todas overview", run: onOpenOverview },
      {
        id: "livingdex",
        label: "Living Dex — rastreador",
        icon: "book",
        kw: "living dex pokedex huecos completar",
        run: onOpenLivingDex,
      },
      {
        id: "multi",
        label: multiMode ? "Salir de selección múltiple" : "Selección múltiple",
        icon: "check",
        kw: "seleccionar bulk multiple",
        run: () => setMultiMode(!multiMode),
      },
      {
        id: "dual",
        label: dualMode ? "Desactivar doble caja" : "Activar doble caja",
        icon: "columns",
        kw: "dual dos cajas",
        run: toggleDual,
      },
      {
        id: "sound",
        label: sound ? "Silenciar sonidos" : "Activar sonidos",
        icon: sound ? "volumeOff" : "volume",
        kw: "sonido audio mute",
        run: () => setSound(!sound),
      },
      {
        id: "share",
        label: "Compartir / exportar caja actual",
        icon: "share",
        kw: "compartir exportar codigo share",
        run: onOpenShare,
      },
    ]

    for (const v of SMART_VIEWS) {
      list.push({
        id: v.id,
        label: `Vista: ${v.name}`,
        icon: v.icon as IconName,
        kw: `vista ${v.name}`,
        run: () => applyView(v),
      })
    }

    for (let i = 0; i < TOTAL_BOXES; i++) {
      const name = boxName(boxMeta, i)
      list.push({
        id: `box-${i}`,
        label: `Ir a caja ${i + 1} — ${name}`,
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
        aria-label="Paleta de comandos"
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
            aria-label="Comando"
            placeholder="Escribe un comando o caja…"
            className="flex-1 border-none bg-transparent p-0 text-[15px] text-pc-fg outline-none placeholder:text-pc-fg-subtle"
          />
          <Chip className="text-[10px]">ESC</Chip>
        </div>

        <div className="max-h-[360px] overflow-auto p-[7px]">
          {filtered.length === 0 && (
            <p className="p-6 text-center text-[13px] text-pc-fg-subtle">Sin resultados</p>
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
