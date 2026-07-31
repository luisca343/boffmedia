import { useState } from "react"

import { Badge, Button, DataList, Divider, Field, Input, Kicker, Panel, Slider, Toggle } from "@boffmedia/ui"

import { updateCheck, updateInstall, type UpdateInfo } from "../runtime"
import { useLauncher } from "../state/launcher"
import { formatBytes } from "../utils/format"

// HANDOFF §6.3: "Wrong Java version is the single most common launcher support
// ticket." Hence the explicit, visible Java row rather than silent detection.

export function Settings() {
  const { settings, patchSettings, account } = useLauncher()
  const [update, setUpdate] = useState<UpdateInfo | null>(null)
  const [checking, setChecking] = useState(false)
  const [installing, setInstalling] = useState(false)
  const [updateError, setUpdateError] = useState<string | null>(null)

  const checkUpdates = async () => {
    if (checking || installing) return
    setChecking(true)
    setUpdateError(null)
    try {
      setUpdate(await updateCheck())
    } catch (error) {
      setUpdateError((error as { message?: string })?.message ?? "No se pudo comprobar si hay actualizaciones.")
    } finally {
      setChecking(false)
    }
  }

  const installUpdate = async () => {
    if (!update || installing) return
    setInstalling(true)
    setUpdateError(null)
    try {
      await updateInstall()
    } catch (error) {
      setUpdateError((error as { message?: string })?.message ?? "No se pudo instalar la actualización.")
      setInstalling(false)
    }
  }

  return (
    <div className="px-8 py-7">
      <header className="mb-6">
        <Kicker>Preferencias</Kicker>
        <h1 className="font-display text-[30px]/none font-bold uppercase tracking-[0.06em] text-txt">
          Ajustes
        </h1>
      </header>

      <div className="grid max-w-[900px] gap-4 [grid-template-columns:repeat(auto-fit,minmax(340px,1fr))]">
        <Panel title="Rendimiento">
          <Slider
            label="Memoria asignada"
            min={2048}
            max={16384}
            step={512}
            value={settings.memoryMib}
            unit=" MiB"
            onChange={(memoryMib) => patchSettings({ memoryMib })}
          />
          <p className="mt-2 text-xs text-txt-dim">
            {formatBytes(settings.memoryMib * 1024 * 1024)} para la JVM. Asignar más memoria de
            la que tiene el equipo hace que el juego no arranque — deja al menos 2 GB al
            sistema.
          </p>
        </Panel>

        <Panel title="Java">
          <Field
            label="Ruta del ejecutable"
            hint="Vacío = usar el runtime que gestiona el launcher (recomendado)"
          >
            <Input
              value={settings.javaPath ?? ""}
              placeholder="Detección automática"
              onChange={(e) => patchSettings({ javaPath: e.target.value || null })}
            />
          </Field>
          <div className="mt-3 flex items-center gap-2">
            <Badge tone={settings.javaPath ? "warn" : "ok"}>
              {settings.javaPath ? "Manual" : "Automático"}
            </Badge>
            <span className="text-xs text-txt-dim">
              {settings.javaPath
                ? "Se usará esta ruta aunque no sea compatible con el pack."
                : "Se descargará la versión que pida cada pack."}
            </span>
          </div>
        </Panel>

        <Panel title="Instalación">
          <Field label="Carpeta de juego">
            <Input
              value={settings.gameDir}
              onChange={(e) => patchSettings({ gameDir: e.target.value })}
            />
          </Field>
          <Divider className="my-4" />
          <div className="flex flex-col gap-3">
            <Toggle
              on={settings.closeOnLaunch}
              onChange={(closeOnLaunch) => patchSettings({ closeOnLaunch })}
              label="Cerrar el launcher al iniciar el juego"
            />
            <Toggle
              on={settings.keepLogs}
              onChange={(keepLogs) => patchSettings({ keepLogs })}
              label="Conservar el registro entre sesiones"
            />
          </div>
        </Panel>

        <Panel title="Cuenta">
          <DataList
            rows={[
              { label: "Usuario", value: account?.username ?? "—" },
              { label: "UUID", value: account?.uuid ?? "—", mono: true, wide: true },
              { label: "Token", value: "Almacén de credenciales del sistema", icon: "lock" },
            ]}
          />
          <p className="mt-3 text-xs text-txt-dim">
            Solo se guarda el token de actualización, y nunca en texto plano. El token de
            acceso a Minecraft dura unas 24 h y se vuelve a pedir en cada sesión.
          </p>
          <div className="mt-4">
            <Button size="sm" variant="ghost" icon="refresh">
              Revalidar sesión
            </Button>
          </div>
        </Panel>

        <Panel title="Launcher">
          <div className="flex items-center gap-2">
            <Badge tone={update ? "info" : "ok"}>{update ? `v${update.version} disponible` : "Actualizado"}</Badge>
            <span className="text-xs text-txt-dim">Las actualizaciones se verifican con firma digital.</span>
          </div>
          {update?.body && <p className="mt-3 text-xs text-txt-muted">{update.body}</p>}
          {updateError && <p className="mt-3 text-xs text-bad">{updateError}</p>}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" variant="ghost" icon="refresh" loading={checking} onClick={() => void checkUpdates()}>
              Buscar actualizaciones
            </Button>
            {update && (
              <Button size="sm" variant="pri" icon="download" loading={installing} onClick={() => void installUpdate()}>
                Instalar y reiniciar
              </Button>
            )}
          </div>
        </Panel>
      </div>
    </div>
  )
}
