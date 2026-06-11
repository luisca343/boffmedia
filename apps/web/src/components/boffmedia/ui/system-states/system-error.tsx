"use client"

import { Icon } from "../../primitives/icon"
import { BoffButton as Button } from "../../primitives/button"
import { SystemStateShell } from "./system-state-shell"

interface SystemErrorProps {
  message?: string
  digest?: string
  onRetry?: () => void
  onHome?: () => void
}

export function SystemError({ message = "Cannot read properties of undefined (reading 'map')", digest = "a7f3c9e1b2d4", onRetry, onHome }: SystemErrorProps) {
  return (
    <SystemStateShell bg="warm" role="alert">
      <div
        className="w-[78px] h-[78px] rounded-[var(--radius-lg)] grid place-items-center mb-[1.4rem] text-white"
        style={{
          background: "linear-gradient(135deg, var(--rose-500), var(--orange-500))",
          boxShadow: "0 16px 40px -16px var(--rose-500)",
        }}
      >
        <Icon name="alert" size={34} />
      </div>
      <h1
        className="text-[length:var(--t-3xl)] leading-[1.05] mb-[0.7rem]"
        style={{
          background: "linear-gradient(90deg, var(--rose-400), var(--orange-400))",
          WebkitBackgroundClip: "text", backgroundClip: "text",
          color: "transparent",
        }}
      >
        ¡Algo salió mal!
      </h1>
      <p className="text-[var(--text-muted)] text-[length:var(--t-base)] max-w-[38ch] mx-auto mb-[1.6rem]">
        Ha ocurrido un error inesperado. Puedes reintentar la acción o volver al inicio.
      </p>

      <div
        className="w-full text-left bg-[color-mix(in_srgb,var(--surface-2)_75%,transparent)] border border-[var(--border)] rounded-[var(--radius-lg)] p-[1rem_1.1rem] mb-[1.6rem]"
        style={{ backdropFilter: "blur(8px)" }}
      >
        <span className="block font-[var(--label-font)] text-[0.66rem] tracking-[0.14em] uppercase text-[var(--text-dim)] mb-[0.35rem]">
          Mensaje de error
        </span>
        <p className="font-mono text-[length:var(--t-sm)] text-[var(--text)] leading-[1.5] break-words m-0">
          {message || "Error desconocido"}
        </p>
        {digest && (
          <p className="font-mono text-[length:var(--t-xs)] text-[var(--text-muted)] m-0 mt-[0.7rem] pt-[0.7rem] border-t border-[var(--border)]">
            <span className="block font-[var(--label-font)] text-[0.66rem] tracking-[0.14em] uppercase text-[var(--text-dim)] mb-[0.35rem]">
              ID de seguimiento
            </span>
            {digest}
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-[0.7rem] justify-center">
        <Button variant="primary" icon="refresh" onClick={onRetry}>Reintentar</Button>
        <Button variant="ghost" icon="home" onClick={onHome}>Inicio</Button>
      </div>
      <p className="mt-[1.5rem] text-[length:var(--t-xs)] text-[var(--text-dim)]">
        ¿Necesitas ayuda?{" "}
        <a href="https://discord.com/invite/R7MEDDSM5C" target="_blank" rel="noreferrer" className="text-[var(--accent-bright)] underline underline-offset-2 hover:text-[var(--text)]">
          Comunidad Discord
        </a>
      </p>
    </SystemStateShell>
  )
}
