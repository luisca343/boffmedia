"use client"

import { Icon } from "../../primitives/icon"
import { BoffButton as Button } from "../../primitives/button"
import { SystemStateShell } from "./system-state-shell"

interface SystemForbiddenProps {
  onLogin?: () => void
  onHome?: () => void
}

export function SystemForbidden({ onLogin, onHome }: SystemForbiddenProps) {
  return (
    <SystemStateShell bg="warm" role="alert">
      <div
        className="w-[78px] h-[78px] rounded-[var(--radius-lg)] grid place-items-center mb-[1.4rem] text-white"
        style={{
          background: "linear-gradient(135deg, var(--orange-600), var(--rose-500))",
        }}
      >
        <Icon name="lock" size={30} />
      </div>
      <p className="font-[var(--label-font)] text-[length:var(--t-xs)] tracking-[var(--label-spacing)] uppercase text-[var(--text-dim)] mb-[0.7rem]">
        Error 403
      </p>
      <h1 className="text-[length:var(--t-3xl)] leading-[1.05] mb-[0.7rem]">
        Acceso restringido
      </h1>
      <p className="text-[var(--text-muted)] text-[length:var(--t-base)] max-w-[38ch] mx-auto mb-[1.6rem]">
        Necesitas una sesión iniciada para ver esta página, o tu cuenta no tiene los permisos requeridos.
      </p>
      <div className="flex flex-wrap gap-[0.7rem] justify-center">
        <Button variant="primary" icon="user" onClick={onLogin}>Iniciar sesión</Button>
        <Button variant="ghost" icon="home" onClick={onHome}>Volver al inicio</Button>
      </div>
      <p className="mt-[1.5rem] text-[length:var(--t-xs)] text-[var(--text-dim)]">
        ¿Crees que es un error?{" "}
        <a href="https://discord.com/invite/R7MEDDSM5C" target="_blank" rel="noreferrer" className="text-[var(--accent-bright)] underline underline-offset-2 hover:text-[var(--text)]">
          Avísanos en Discord
        </a>
      </p>
    </SystemStateShell>
  )
}
