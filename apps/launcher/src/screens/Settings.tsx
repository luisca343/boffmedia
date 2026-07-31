import { Badge, Button, DataList, Divider, Field, Input, Kicker, Panel, Slider, Toggle } from "@boffmedia/ui"
import { useEffect, useState } from "react"

import { getRuntimeInfo } from "../runtime"
import { checkForUpdates, useUpdates } from "../services/updates"
import { useLauncher } from "../state/launcher"
import { formatBytes } from "../utils/format"

// HANDOFF §6.3: "Wrong Java version is the single most common launcher support
// ticket." Hence the explicit, visible Java row rather than silent detection.

export function Settings() {
  const { settings, patchSettings, account } = useLauncher()
  const { phase, update, error } = useUpdates()
  const [version, setVersion] = useState<string | null>(null)

  useEffect(() => {
    // Null in a browser tab, where there is no shell to ask.
    void getRuntimeInfo().then((info) => setVersion(info?.appVersion ?? null))
  }, [])

  const checking = phase === "checking"

  return (
    <div className="px-8 py-7">
      <header className="mb-6">
        <Kicker>Preferencias</Kicker>
        <h1 className="font-display text-[30px]/none font-bold uppercase tracking-[0.06em] text-txt">
          Ajustes
        </h1>
      </header>

      <div className="grid max-w-[900px] gap-4 [grid-template-columns:repeat(auto-fit,minmax(340px,1fr))]">
        <Panel
          title="Rendimiento"
          aside={<Badge tone={settings.memoryAuto ? "ok" : "info"}>
            {settings.memoryAuto ? "Automático" : "Manual"}
          </Badge>}
        >
          {/* §9 — the global default. Each pack can still inherit this, override
              it, or size itself; the per-pack control lives in su ficha. */}
          <Toggle
            on={settings.memoryAuto}
            onChange={(memoryAuto) => patchSettings({ memoryAuto })}
            label="Calcular la memoria automáticamente"
          />
          <div className="mt-4">
            <Slider
              label="Memoria asignada"
              min={2048}
              max={16384}
              step={512}
              value={settings.memoryMib}
              unit=" MiB"
              disabled={settings.memoryAuto}
              onChange={(memoryMib) => patchSettings({ memoryMib })}
            />
          </div>
          <p className="mt-2 text-xs text-txt-dim">
            {settings.memoryAuto
              ? "Se calcula por pack, con su número de mods y la RAM del equipo, sin pasar nunca del 60 % de la memoria física. Un pack concreto puede fijar el suyo desde su ficha."
              : `${formatBytes(settings.memoryMib * 1024 * 1024)} para la JVM. Asignar más memoria de la que tiene el equipo no hace que el juego falle: hace que el sistema empiece a usar el disco y se quede colgado. Deja al menos 2 GB al sistema.`}
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
          {/* §9 — rollback depth. Almost free: a retained version is its file
              list, and the .jar it names lives once in the shared cache however
              many versions reference it. */}
          <Field label="Versiones que se conservan">
            <Input
              type="number"
              min={1}
              max={20}
              value={settings.retainVersions}
              onChange={(e) =>
                patchSettings({ retainVersions: Number(e.target.value) || 1 })
              }
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

        <Panel title="Actualizaciones">
          <DataList
            rows={[
              { label: "Versión instalada", value: version ?? "Modo navegador", mono: true },
            ]}
          />
          <div className="mt-4 flex items-center gap-3">
            <Button
              size="sm"
              variant="ghost"
              icon="refresh"
              disabled={checking}
              onClick={() => {
                void checkForUpdates(true)
              }}
            >
              {checking ? "Buscando…" : "Buscar actualizaciones"}
            </Button>
            <span className="text-xs text-txt-dim">
              {error
                ? error
                : update
                  ? `Disponible la ${update.version}. Actualiza desde el aviso de arriba.`
                  : checking
                    ? "Comprobando con el servidor…"
                    : "El launcher lo comprueba solo al arrancar."}
            </span>
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
      </div>
    </div>
  )
}
