"use client"

import { Icon } from "../../primitives/icon"
import { BoffButton as Button } from "../../primitives/button"
import { SystemStateShell } from "./system-state-shell"

interface SystemMaintenanceProps {
  onDiscord?: () => void
  onRefresh?: () => void
}

export function SystemMaintenance({ onDiscord, onRefresh }: SystemMaintenanceProps) {
  return (
    <SystemStateShell bg="warm" role="status" aria-live="polite">
      <div
        className="w-[78px] h-[78px] rounded-[var(--radius-lg)] grid place-items-center mb-[1.4rem] text-white"
        style={{
          background: "linear-gradient(135deg, var(--orange-500), var(--amber-400))",
          boxShadow: "0 16px 40px -16px var(--orange-500)",
        }}
      >
        <Icon name="cog" size={32} />
      </div>
      <span
        className="inline-flex items-center gap-[0.5rem] mb-[1.2rem] px-[0.85rem] py-[0.4rem] rounded-[var(--radius-pill)] border border-[var(--border-strong)] bg-[var(--surface-2)] font-[var(--label-font)] text-[length:var(--t-xs)] tracking-[var(--label-spacing)] uppercase text-[var(--text-muted)]"
      >
        <span className="w-[7px] h-[7px] rounded-full bg-[var(--amber-400)]" style={{ animation: "pulse-dot 1.6s var(--ease) infinite" }} />
        Vuelve en ~30 min
      </span>
      <h1 className="text-[length:var(--t-3xl)] leading-[1.05] mb-[0.7rem]">
        Estamos en mantenimiento
      </h1>
      <p className="text-[var(--text-muted)] text-[length:var(--t-base)] max-w-[38ch] mx-auto mb-[1.6rem]">
        Estamos aplicando mejoras a la plataforma. Volveremos muy pronto — gracias por tu paciencia.
      </p>
      <div className="flex flex-wrap gap-[0.7rem] justify-center">
        <Button variant="primary" icon="discord" href="https://discord.com/invite/R7MEDDSM5C" onClick={onDiscord}>Estado en Discord</Button>
        <Button variant="ghost" icon="refresh" onClick={onRefresh}>Comprobar de nuevo</Button>
      </div>
    </SystemStateShell>
  )
}
