import { Banner, Button, Progress } from "@boffmedia/ui"
import { useEffect } from "react"

import { dismissUpdate, installUpdate, startUpdateCheck, useUpdates } from "../services/updates"

// Sits ABOVE the router, so it is visible on the sign-in screen too. It must
// never gate sign-in: the check runs in the background and this renders nothing
// at all until an update actually exists.

export function UpdateBanner() {
  const { phase, update, progress, error, dismissed } = useUpdates()

  useEffect(() => {
    startUpdateCheck()
  }, [])

  const installing = phase === "installing"

  // `failed` still needs the banner (the user asked for the install and it
  // broke); `checking`/`idle` never do — a silent check is the whole point.
  if (!update || (dismissed && !installing && phase !== "failed")) return null

  return (
    <div className="px-8 pt-4">
      <Banner
        tone={phase === "failed" ? "error" : "info"}
        icon={phase === "failed" ? "alert" : "download"}
        title={
          phase === "failed"
            ? "No se pudo actualizar el launcher"
            : `Hay una nueva versión del launcher (${update.version})`
        }
        onClose={installing ? undefined : dismissUpdate}
        actions={
          installing ? undefined : (
            <Button
              size="sm"
              icon="download"
              onClick={() => {
                void installUpdate()
              }}
            >
              {phase === "failed" ? "Reintentar" : "Actualizar y reiniciar"}
            </Button>
          )
        }
      >
        {phase === "failed" ? (
          <p className="text-sm">{error ?? "Inténtalo de nuevo más tarde."}</p>
        ) : installing ? (
          <div className="flex flex-col gap-2">
            <p className="text-sm">
              Descargando la actualización. El launcher se reiniciará solo al terminar; no
              cierres la ventana.
            </p>
            {/* No Content-Length yet means the size is unknown — a bar pinned at
                0 % would read as "atascado", so it creeps instead. */}
            <Progress value={progress === null ? 4 : Math.round(progress * 100)} />
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            <p className="text-sm text-txt-dim">
              Tienes la {update.currentVersion}. Se descargará e instalará sola, y el launcher
              se reiniciará al terminar.
            </p>
            {update.notes ? (
              <p className="whitespace-pre-line text-sm text-txt-dim">{update.notes}</p>
            ) : null}
          </div>
        )}
      </Banner>
    </div>
  )
}
