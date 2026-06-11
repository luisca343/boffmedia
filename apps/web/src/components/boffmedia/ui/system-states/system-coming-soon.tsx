"use client"

import * as React from "react"
import { Icon } from "../../primitives/icon"
import { BoffButton as Button } from "../../primitives/button"
import { SystemStateShell } from "./system-state-shell"

interface SystemComingSoonProps {
  onHome?: () => void
}

export function SystemComingSoon({ onHome }: SystemComingSoonProps) {
  const [done, setDone] = React.useState(false)

  return (
    <SystemStateShell bg="accent">
      <div
        className="w-[78px] h-[78px] rounded-[var(--radius-lg)] grid place-items-center mb-[1.4rem] text-white"
        style={{
          background: "linear-gradient(135deg, var(--accent), var(--purple-500))",
        }}
      >
        <Icon name="sparkles" size={30} />
      </div>
      <span
        className="inline-flex items-center gap-[0.5rem] mb-[1.2rem] px-[0.85rem] py-[0.4rem] rounded-[var(--radius-pill)] border border-[var(--border-strong)] bg-[var(--surface-2)] font-[var(--label-font)] text-[length:var(--t-xs)] tracking-[var(--label-spacing)] uppercase text-[var(--text-muted)]"
      >
        <span className="w-[7px] h-[7px] rounded-full bg-[var(--accent-bright)]" style={{ animation: "pulse-dot 1.6s var(--ease) infinite" }} />
        Próxima fase
      </span>
      <h1 className="text-[length:var(--t-3xl)] leading-[1.05] mb-[0.7rem]">
        Muy pronto
      </h1>
      <p className="text-[var(--text-muted)] text-[length:var(--t-base)] max-w-[38ch] mx-auto mb-[1.6rem]">
        Esta sección llega en la siguiente fase del rediseño. Únete a la lista de espera y te avisaremos en cuanto esté lista.
      </p>
      {done ? (
        <span className="inline-flex items-center gap-[0.5rem] text-[length:var(--t-sm)] text-[var(--emerald-400)] font-[var(--label-font)] tracking-[0.04em]">
          <Icon name="check" size={16} />
          ¡Listo! Te avisaremos por correo.
        </span>
      ) : (
        <form
          className="flex gap-[0.6rem] w-full max-w-[24rem] mx-auto"
          onSubmit={(e) => { e.preventDefault(); setDone(true) }}
        >
          <input
            type="email"
            required
            placeholder="tu@correo.com"
            aria-label="Correo electrónico"
            className="flex-1 bg-[var(--surface-2)] border border-[var(--border-strong)] rounded-[var(--btn-radius)] px-3.5 py-3 text-[length:var(--t-sm)] text-[var(--text)] placeholder:text-[var(--text-dim)] focus:outline-none focus:border-[var(--accent)]"
          />
          <Button variant="accent" type="submit" iconRight="arrow">Avísame</Button>
        </form>
      )}
      <p className="mt-[1.2rem] text-[length:var(--t-xs)] text-[var(--text-dim)]">
        <a href="#" onClick={(e) => { e.preventDefault(); onHome?.() }} className="text-[var(--accent-bright)] hover:text-[var(--text)]">
          ← Volver al inicio
        </a>
      </p>
    </SystemStateShell>
  )
}
