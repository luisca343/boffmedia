"use client"

import * as React from "react"
import { BoffButton as Button } from "../../primitives/button"
import { BoffAlert as Alert } from "../../primitives/alert"
import { useToast } from "../../primitives/toast-provider"

export function SystemStatesDemoToasts() {
  const toast = useToast()
  const [alerts, setAlerts] = React.useState(["success", "error", "warning", "info"])

  const fire = (tone: "success" | "error" | "warning" | "info", title: string, desc: string) => {
    toast({ tone, title, desc })
  }

  return (
    <div className="border border-solid border-edge rounded-[var(--radius-lg)] bg-[var(--card-bg)] p-[clamp(1.4rem,3vw,2.2rem)] mt-[1.2rem]">
      <div className="flex items-center justify-between gap-4 flex-wrap mb-[1.3rem]">
        <span className="font-display text-[length:var(--t-lg)] font-bold">Notificaciones</span>
        <span className="text-ink-dim text-[length:var(--t-sm)]">Los toasts aparecen abajo a la derecha</span>
      </div>

      <div className="flex flex-wrap gap-[0.6rem] mb-[1.3rem]">
        <Button variant="ghost" size="sm" icon="check" onClick={() => fire("success", "Guardado", "Tus cambios se guardaron correctamente.")}>Éxito</Button>
        <Button variant="ghost" size="sm" icon="x" onClick={() => fire("error", "No se pudo guardar", "Revisa tu conexión e inténtalo de nuevo.")}>Error</Button>
        <Button variant="ghost" size="sm" icon="flame" onClick={() => fire("warning", "Sesión por expirar", "Vuelve a iniciar sesión en breve.")}>Aviso</Button>
        <Button variant="ghost" size="sm" icon="info" onClick={() => fire("info", "Nueva versión", "Recarga para aplicar las mejoras.")}>Info</Button>
      </div>

      <div className="flex flex-col gap-[0.8rem]">
        {alerts.includes("success") && (
          <Alert tone="success" title="Equipo registrado" onClose={() => setAlerts((a) => a.filter((x) => x !== "success"))}>
            Tu alineación quedó inscrita en el torneo del sábado.
          </Alert>
        )}
        {alerts.includes("error") && (
          <Alert tone="error" title="Validación fallida" onClose={() => setAlerts((a) => a.filter((x) => x !== "error"))}>
            Faltan movimientos en 2 Pokémon. Complétalos para continuar.
          </Alert>
        )}
        {alerts.includes("warning") && (
          <Alert tone="warning" title="Formato no legal" onClose={() => setAlerts((a) => a.filter((x) => x !== "warning"))}>
            Una especie no está permitida en VGC Reg H.
          </Alert>
        )}
        {alerts.includes("info") && (
          <Alert tone="info" title="Consejo" onClose={() => setAlerts((a) => a.filter((x) => x !== "info"))}>
            Puedes importar equipos desde Showdown pegando el paste.
          </Alert>
        )}
        {alerts.length < 4 && (
          <div>
            <Button variant="ghost" size="sm" icon="refresh" onClick={() => setAlerts(["success", "error", "warning", "info"])}>
              Restaurar alertas
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
