"use client"

import { Icon } from "../../primitives/icon"
import { BoffButton as Button } from "../../primitives/button"
import { SystemStateShell } from "./system-state-shell"

interface SystemNotFoundProps {
  onHome?: () => void
  onTools?: () => void
}

export function SystemNotFound({ onHome, onTools }: SystemNotFoundProps) {
  return (
    <SystemStateShell bg="accent">
      <div
        className="font-display font-black leading-[0.9] tracking-[-0.02em] mb-[0.4rem]"
        style={{
          fontSize: "clamp(5rem, 18vw, 9rem)",
          background: "linear-gradient(180deg, var(--accent-bright), var(--accent))",
          WebkitBackgroundClip: "text", backgroundClip: "text",
          color: "transparent",
        }}
      >
        404
      </div>
      <p className="font-[var(--label-font)] text-[length:var(--t-xs)] tracking-[var(--label-spacing)] uppercase text-[var(--text-dim)] mb-[0.7rem]">
        Página no encontrada
      </p>
      <p className="text-[var(--text-muted)] text-[length:var(--t-base)] max-w-[38ch] mx-auto mb-[1.6rem]">
        Parece que te has aventurado en territorio inexplorado. Incluso los mejores exploradores se pierden a veces — volvamos a un lugar conocido.
      </p>
      <div className="flex flex-wrap gap-[0.7rem] justify-center">
        <Button variant="primary" icon="home" onClick={onHome}>Volver al inicio</Button>
        <Button variant="ghost" iconRight="arrow" onClick={onTools}>Ver herramientas</Button>
      </div>
    </SystemStateShell>
  )
}
