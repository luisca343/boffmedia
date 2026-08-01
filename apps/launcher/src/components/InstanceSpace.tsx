import { useCallback, useEffect, useState } from "react"

import {
  Badge,
  Button,
  Divider,
  Empty,
  Field,
  Input,
  Panel,
  Seg,
  Slider,
  Toggle,
} from "@boffmedia/ui"

import {
  instanceOptional,
  instanceOptionalSet,
  instanceRuntime,
  instanceRuntimeSet,
  instanceVersions,
  type InstanceRuntime,
  type JavaChoice,
  type MemoryChoice,
  type OptionalFile,
  type RetainedVersion,
  type RuntimeSource,
} from "../runtime"
import { useLauncher } from "../state/launcher"
import { formatBytes, formatWhen } from "../utils/format"

// HANDOFF §9 — "locked vs. user space" and "pack version pinning + rollback".
//
// A separate component rather than more of PackDetail: these panels read the
// instance marker on the Rust side while the provider owns access orchestration
// and the install state machine.
//
// Everything here goes through runtime.ts, so `dev:renderer` renders it against
// the in-process simulation and the screen stays browser-runnable.

type Props = {
  packId: string
  slug: string
  /** Called after a revert so the library's install state stops claiming the
   *  version that was just rolled back. */
  onChanged?: () => void
}

// §9 — "per-instance Java runtime + memory, with a sane heuristic". Three
// states, three badges: what the player picked must be readable at a glance, or
// "why is this pack using 4 GB?" becomes a support ticket.
const SOURCE_LABEL: Record<RuntimeSource, string> = {
  global: "Heredado",
  override: "Este pack",
  auto: "Automático",
}

const SOURCE_TONE: Record<RuntimeSource, "info" | "warn" | "ok"> = {
  global: "info",
  override: "warn",
  auto: "ok",
}

const gib = (mib: number) => `${(mib / 1024).toFixed(1).replace(".", ",")} GB`

export function InstanceSpace({ packId, slug, onChanged }: Props) {
  const { revert: revertPack } = useLauncher()
  const [optional, setOptional] = useState<OptionalFile[] | null>(null)
  const [versions, setVersions] = useState<RetainedVersion[] | null>(null)
  const [runtime, setRuntime] = useState<InstanceRuntime | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(() => {
    void instanceOptional(slug).then(setOptional)
    void instanceVersions(slug).then(setVersions)
    void instanceRuntime(slug).then(setRuntime)
  }, [slug])

  useEffect(refresh, [refresh])

  const toggle = async (file: OptionalFile) => {
    setError(null)
    setBusy(file.path)
    try {
      setOptional(await instanceOptionalSet(slug, file.path, !file.enabled))
    } catch (err) {
      setError((err as { message?: string })?.message ?? "No se pudo guardar la selección.")
    } finally {
      setBusy(null)
    }
  }

  const revert = async (version: RetainedVersion) => {
    setError(null)
    setBusy(version.versionId)
    try {
      if (await revertPack(packId, version.versionId)) {
        refresh()
        onChanged?.()
      }
    } catch (err) {
      setError((err as { message?: string })?.message ?? "No se pudo volver a esa versión.")
    } finally {
      setBusy(null)
    }
  }

  const saveRuntime = async (memory: MemoryChoice, java: JavaChoice) => {
    setError(null)
    // Optimistic, so dragging the slider does not lag a round trip behind the
    // finger. The server's answer replaces it, resolved values and all.
    setRuntime((current) => (current ? { ...current, over: { memory, java } } : current))
    try {
      setRuntime(await instanceRuntimeSet(slug, memory, java))
    } catch (err) {
      setError((err as { message?: string })?.message ?? "No se pudo guardar la configuración.")
      void instanceRuntime(slug).then(setRuntime)
    }
  }

  const pinned = versions?.find((v) => v.current)

  return (
    <div className="mt-4 grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(320px,1fr))]">
      <Panel
        title="Mods opcionales"
        aside={optional?.length ? <Badge tone="info">{optional.length}</Badge> : null}
      >
        {optional === null ? (
          <p className="text-sm text-txt-muted">Cargando…</p>
        ) : optional.length === 0 ? (
          <Empty
            icon="cube"
            title="Sin mods opcionales"
            lead="Este pack no marca ningún archivo como opcional, o aún no lo has instalado."
          />
        ) : (
          <ul className="flex flex-col gap-2">
            {optional.map((file) => (
              <li key={file.path} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-mono text-xs text-txt">{file.name}</p>
                  <p className="text-[11px] text-txt-dim">{formatBytes(file.size)}</p>
                </div>
                <Toggle on={file.enabled} onChange={() => void toggle(file)} />
              </li>
            ))}
          </ul>
        )}
        <Divider label="tu espacio" className="my-4" />
        {/* The single most important thing this panel can say. Players assume
            an update wipes the folder, and then never add anything to it. */}
        <p className="text-xs text-txt-dim">
          Los mods que añadas tú a <code className="font-mono">mods/</code> sobreviven a las
          actualizaciones: el launcher solo borra archivos que instaló él y que no has
          modificado. Un opcional desactivado no se descarga.
        </p>
      </Panel>

      <Panel
        title="Versiones guardadas"
        aside={pinned ? <Badge tone="ok">{pinned.versionName}</Badge> : null}
      >
        {versions === null ? (
          <p className="text-sm text-txt-muted">Cargando…</p>
        ) : versions.length === 0 ? (
          <Empty
            icon="clock"
            title="Sin historial"
            lead="Se guardan las últimas versiones instaladas para poder volver atrás."
          />
        ) : (
          <ul className="flex flex-col gap-2">
            {versions.map((version) => (
              <li key={version.versionId} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-mono text-xs text-txt">
                    {version.versionName}
                    {version.current && (
                      <span className="ml-2 text-[11px] uppercase tracking-[0.1em] text-txt-dim">
                        actual
                      </span>
                    )}
                  </p>
                  <p className="text-[11px] text-txt-dim">
                    {formatWhen(version.installedAt)} · {version.fileCount} archivos ·{" "}
                    {version.minecraft}
                  </p>
                </div>
                {!version.current && (
                  <Button
                    size="sm"
                    icon="back"
                    // A version installed before the launcher recorded file
                    // lists has nothing to replay; offering the button would
                    // promise a rollback that cannot happen.
                    disabled={!version.revertible || busy !== null}
                    loading={busy === version.versionId}
                    onClick={() => void revert(version)}
                  >
                    Volver
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
        <Divider label="coste" className="my-4" />
        <p className="text-xs text-txt-dim">
          Una versión guardada es solo su lista de archivos: los .jar viven una sola vez en la
          caché compartida, así que conservar varias no ocupa varias copias del pack.
        </p>
      </Panel>

      {/* §9 — per-instance Java runtime + memory. The resolved values sit at the
          top, BEFORE the controls: what this pack will launch with is the
          question the panel exists to answer, and "6,0 GB (automático, 214
          mods)" beats a slider the player has to interpret. */}
      <Panel
        title="Java y memoria"
        aside={
          runtime ? (
            <Badge tone={SOURCE_TONE[runtime.effective.memorySource]}>
              {SOURCE_LABEL[runtime.effective.memorySource]}
            </Badge>
          ) : null
        }
      >
        {runtime === null ? (
          <p className="text-sm text-txt-muted">Cargando…</p>
        ) : (
          <>
            <p className="text-sm text-txt">
              <strong className="font-display text-[20px] tracking-[0.04em]">
                {gib(runtime.effective.heapMib)}
              </strong>{" "}
              <span className="text-txt-muted">
                (
                {runtime.effective.memorySource === "auto"
                  ? `automático, ${runtime.effective.modCount} mods`
                  : runtime.effective.memorySource === "override"
                    ? "definido para este pack"
                    : "de los ajustes generales"}
                )
              </span>
            </p>
            <p className="mt-1 text-xs text-txt-dim">
              {runtime.effective.javaPath
                ? `Java: ${runtime.effective.javaPath}`
                : "Java: el que instala y gestiona el launcher"}{" "}
              · {SOURCE_LABEL[runtime.effective.javaSource].toLowerCase()} · equipo con{" "}
              {gib(runtime.effective.totalRamMib)} de RAM
            </p>

            <Divider label="memoria" className="my-4" />
            <Seg
              options={[
                { value: "inherit", label: "Heredar" },
                { value: "auto", label: "Automático" },
                { value: "fixed", label: "Manual" },
              ]}
              value={runtime.over.memory.mode}
              onChange={(mode) =>
                void saveRuntime(
                  mode === "fixed"
                    ? { mode: "fixed", mib: runtime.effective.heapMib }
                    : mode === "auto"
                      ? { mode: "auto" }
                      : { mode: "inherit" },
                  runtime.over.java,
                )
              }
            />
            {runtime.over.memory.mode === "fixed" ? (
              <div className="mt-3">
                <Slider
                  label="Memoria de este pack"
                  min={1024}
                  max={16384}
                  step={512}
                  unit=" MiB"
                  value={runtime.over.memory.mib}
                  onChange={(mib) => void saveRuntime({ mode: "fixed", mib }, runtime.over.java)}
                />
                <p className="mt-2 text-xs text-txt-dim">
                  Recomendado para este pack: {gib(runtime.effective.recommendedMib)}. Pasar de
                  ahí no acelera el juego: lo que sobra del montón no se usa, y el sistema se
                  queda sin memoria.
                </p>
              </div>
            ) : (
              <p className="mt-3 text-xs text-txt-dim">
                {runtime.over.memory.mode === "auto"
                  ? `Se calcula con los mods del pack (${runtime.effective.modCount}) y la RAM del equipo, sin pasar nunca del 60 %.`
                  : runtime.globalMemoryAuto
                    ? "Los ajustes generales están en automático."
                    : `Se usa lo que digan los ajustes generales (${gib(runtime.globalMemoryMib)}).`}
              </p>
            )}

            <Divider label="java" className="my-4" />
            <Seg
              options={[
                { value: "inherit", label: "Heredar" },
                { value: "auto", label: "Automático" },
                { value: "custom", label: "Ruta" },
              ]}
              value={runtime.over.java.mode}
              onChange={(mode) =>
                void saveRuntime(
                  runtime.over.memory,
                  mode === "custom"
                    ? { mode: "custom", path: runtime.effective.javaPath ?? "" }
                    : mode === "auto"
                      ? { mode: "auto" }
                      : { mode: "inherit" },
                )
              }
            />
            {runtime.over.java.mode === "custom" ? (
              <Field
                className="mt-3"
                label="Ruta del ejecutable"
                hint="Se usa tal cual, aunque no sea compatible con el pack"
              >
                <Input
                  value={runtime.over.java.path}
                  placeholder="/ruta/a/bin/java"
                  onChange={(e) =>
                    void saveRuntime(runtime.over.memory, {
                      mode: "custom",
                      path: e.target.value,
                    })
                  }
                />
              </Field>
            ) : (
              <p className="mt-3 text-xs text-txt-dim">
                {runtime.over.java.mode === "auto"
                  ? "Este pack ignora la ruta de los ajustes y usa la versión de Java que pida."
                  : runtime.globalJavaPath
                    ? `Se usa la ruta de los ajustes generales (${runtime.globalJavaPath}).`
                    : "Los ajustes generales dejan que el launcher gestione Java."}
              </p>
            )}
          </>
        )}
      </Panel>

      {error && (
        <p className="col-span-full text-sm text-bad" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
