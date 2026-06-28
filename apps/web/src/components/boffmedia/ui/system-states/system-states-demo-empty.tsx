"use client"

import * as React from "react"
import { Icon } from "../../primitives/icon"
import { BoffButton as Button } from "../../primitives/button"
import { BoffAlert as Alert } from "../../primitives/alert"

interface DemoEmptyStateProps {
  icon?: string
  title: string
  lead: string
  ctaLabel?: string
  ctaIcon?: string
  onCta?: () => void
  secondaryLabel?: string
  onSecondary?: () => void
}

function DemoEmptyState({ icon = "inbox", title, lead, ctaLabel, ctaIcon = "arrow", onCta, secondaryLabel, onSecondary }: DemoEmptyStateProps) {
  return (
    <div className="text-center p-[clamp(2rem,5vw,3.4rem)_1.5rem] flex flex-col items-center gap-[0.5rem] border border-dashed border-edge-strong rounded-[var(--radius-lg)] bg-[color-mix(in_srgb,var(--layer-2)_50%,transparent)]">
      <span className="w-16 h-16 rounded-[var(--radius-lg)] grid place-items-center mb-[0.4rem] text-secondary-hover bg-secondary-soft border border-solid border-[color-mix(in_srgb,var(--secondary)_30%,transparent)]">
        <Icon name={icon} size={28} />
      </span>
      <h3 className="font-display text-[length:var(--t-xl)] font-bold">{title}</h3>
      <p className="text-ink-muted text-[length:var(--t-sm)] max-w-[42ch] m-0 mb-[0.7rem]">{lead}</p>
      <div className="flex flex-wrap gap-[0.7rem] justify-center">
        {ctaLabel && <Button variant="accent" size="sm" iconRight={ctaIcon} onClick={onCta}>{ctaLabel}</Button>}
        {secondaryLabel && <Button variant="ghost" size="sm" onClick={onSecondary}>{secondaryLabel}</Button>}
      </div>
    </div>
  )
}

const EMPTY_PRESETS: Record<string, { label: string; icon: string; title: string; lead: string; cta: string; ctaIcon: string }> = {
  search:  { label: "Búsqueda",     icon: "search",   title: "Sin resultados", lead: "No encontramos nada para «mega patada». Prueba con otro término o revisa la ortografía.", cta: "Limpiar búsqueda", ctaIcon: "x" },
  tools:   { label: "Favoritos",    icon: "bookmark", title: "Aún no tienes favoritos", lead: "Marca herramientas con la estrella para tenerlas siempre a mano en esta lista.", cta: "Explorar herramientas", ctaIcon: "arrow" },
  profile: { label: "Perfil",       icon: "clock",    title: "Sin actividad todavía", lead: "Cuando participes en torneos y uses herramientas, tu actividad reciente aparecerá aquí.", cta: "Ver herramientas", ctaIcon: "arrow" },
  events:  { label: "Eventos",      icon: "trophy",   title: "No hay torneos próximos", lead: "No hay eventos programados ahora mismo. Vuelve pronto o propón uno tú mismo.", cta: "Sugerir evento", ctaIcon: "plus" },
}

export function SystemStatesDemoEmpty() {
  const [k, setK] = React.useState("search")
  const p = EMPTY_PRESETS[k]

  return (
    <div className="border border-solid border-edge rounded-[var(--radius-lg)] bg-[var(--card-bg)] p-[clamp(1.4rem,3vw,2.2rem)] mt-[1.2rem]">
      <div className="flex items-center justify-between gap-4 flex-wrap mb-[1.3rem]">
        <span className="font-display text-[length:var(--t-lg)] font-bold">Estado vacío · contexto</span>
        <div className="inline-flex flex-wrap gap-[0.3rem] p-[0.3rem] rounded-[var(--radius-pill)] bg-layer-2 border border-edge" role="group" aria-label="Contexto del estado vacío">
          {Object.entries(EMPTY_PRESETS).map(([id, v]) => (
            <button
              key={id}
              aria-pressed={k === id}
              onClick={() => setK(id)}
              className="font-[var(--label-font)] text-[length:var(--t-xs)] tracking-[0.06em] uppercase px-[0.85rem] py-[0.45rem] rounded-[var(--radius-pill)] border-0 cursor-pointer bg-transparent text-ink-muted hover:text-ink data-[pressed=true]:bg-secondary data-[pressed=true]:text-[var(--on-secondary)]"
              style={k === id ? { background: "var(--secondary)", color: "var(--on-secondary)" } : undefined}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>
      <DemoEmptyState icon={p.icon} title={p.title} lead={p.lead} ctaLabel={p.cta} ctaIcon={p.ctaIcon} onCta={() => {}} secondaryLabel="Cómo funciona" onSecondary={() => {}} />
    </div>
  )
}
