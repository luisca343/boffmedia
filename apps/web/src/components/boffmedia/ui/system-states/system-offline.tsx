"use client"

import { Icon } from "../../primitives/icon"
import { BoffButton as Button } from "../../primitives/button"
import { SystemStateShell } from "./system-state-shell"

interface SystemOfflineProps {
  onRetry?: () => void
  onHome?: () => void
}

export function SystemOffline({ onRetry, onHome }: SystemOfflineProps) {
  return (
    <SystemStateShell bg="cool" role="status" aria-live="polite">
      <div
        className="w-[78px] h-[78px] rounded-[var(--radius-lg)] grid place-items-center mb-[1.4rem] text-white"
        style={{
          background: "linear-gradient(135deg, var(--cyan-600), var(--purple-600))",
          boxShadow: "0 16px 40px -16px var(--cyan-600)",
        }}
      >
        <Icon name="wifioff" size={32} />
      </div>
      <h1 className="text-[length:var(--t-3xl)] leading-[1.05] mb-[0.7rem]">
        Sin conexión
      </h1>
      <p className="text-[var(--text-muted)] text-[length:var(--t-base)] max-w-[38ch] mx-auto mb-[1.6rem]">
        No detectamos conexión a internet. Comprueba tu red; volveremos a cargar la página automáticamente en cuanto vuelvas a estar en línea.
      </p>
      <div className="flex flex-wrap gap-[0.7rem] justify-center">
        <Button variant="accent" icon="refresh" onClick={onRetry}>Reintentar</Button>
        <Button variant="ghost" icon="home" onClick={onHome}>Inicio</Button>
      </div>
      <p className="mt-[1.5rem] text-[length:var(--t-xs)] text-[var(--text-dim)]">
        El contenido visto recientemente sigue disponible sin conexión.
      </p>
    </SystemStateShell>
  )
}
