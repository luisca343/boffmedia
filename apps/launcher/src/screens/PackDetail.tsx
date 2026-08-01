import { useEffect, useState } from "react"

import {
  Badge,
  Button,
  DataList,
  Divider,
  Empty,
  Field,
  Icon,
  Input,
  Kicker,
  Modal,
  Panel,
  Progress,
  Select,
  Stats,
  Stepper,
  toast,
} from "@boffmedia/ui"

import { CrashDiagnosisCard } from "../components/CrashDiagnosis"
import { InstanceSpace } from "../components/InstanceSpace"
import { exportMrpack, localPackGet, localPackSave } from "../runtime"
import { useLauncher } from "../state/launcher"
import { formatBytes, formatDuration, formatWhen } from "../utils/format"
import { LOADER_LABEL, PHASE_LABEL, STEP_GROUPS } from "../utils/labels"

/** Ticks once a second so the running-time readout advances. */
function useNow(active: boolean): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!active) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [active])
  return now
}

const MC_VERSIONS = ["1.21.4", "1.21.1", "1.20.4", "1.20.1", "1.19.4"]
const LOADERS = [
  { value: "", label: "Vanilla" },
  { value: "forge", label: "Forge" },
  { value: "neoforge", label: "NeoForge" },
  { value: "fabric-loader", label: "Fabric" },
  { value: "quilt-loader", label: "Quilt" },
]

/** RF-10: edit is only ever offered for a local pack, and only ever writes
 *  back to that SAME slug — `localPackSave` overwrites in place when the slug
 *  it is given already exists under `local-packs/`, so this can never create
 *  a second pack or touch a managed one. */
function EditLocalPackModal({
  open,
  onClose,
  onSaved,
  pack,
  latest,
}: {
  open: boolean
  onClose: () => void
  onSaved: () => void
  pack: { id: string; slug: string; name: string }
  latest: { minecraft: string; loader: string | null } | null
}) {
  const [name, setName] = useState(pack.name)
  const [minecraft, setMinecraft] = useState(latest?.minecraft ?? MC_VERSIONS[0])
  const [loader, setLoader] = useState(latest?.loader ?? "")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setName(pack.name)
    setMinecraft(latest?.minecraft ?? MC_VERSIONS[0])
    setLoader(latest?.loader ?? "")
  }, [open, pack.name, latest?.minecraft, latest?.loader])

  const save = async () => {
    if (!name.trim()) {
      setError("Ponle un nombre al pack.")
      return
    }
    setSaving(true)
    setError(null)
    try {
      const current = await localPackGet(pack.slug)
      const dependencies: Record<string, string> = { minecraft }
      if (loader) dependencies[loader] = "latest"
      await localPackSave({
        ...current,
        pack: { ...(current?.pack ?? { id: pack.id, slug: pack.slug, access: { kind: "public" } }), name: name.trim(), slug: pack.slug },
        version: { ...(current?.version ?? { id: "local-v1", name: "local", createdAt: new Date().toISOString(), files: [] }), dependencies },
      })
      onSaved()
      onClose()
    } catch (err) {
      setError((err as { message?: string })?.message ?? "No se pudo guardar el pack.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Editar pack local">
      <div className="flex flex-col gap-4">
        <Field label="Nombre">
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Select label="Minecraft" value={minecraft} onChange={setMinecraft} options={MC_VERSIONS} />
        <Select label="Loader" value={loader} onChange={setLoader} options={LOADERS} />
        {error && <p className="text-xs text-bad">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button size="sm" variant="pri" loading={saving} onClick={() => void save()}>
            Guardar
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export function PackDetail() {
  const { selected, install, play, repair, stop, game, go, logs, reloadPacks } = useLauncher()
  const now = useNow(game.kind === "running")
  const [editing, setEditing] = useState(false)
  const [exporting, setExporting] = useState(false)

  if (!selected) {
    return (
      <div className="px-8 py-7">
        <Empty
          icon="cube"
          title="Ningún pack seleccionado"
          lead="Elige un pack de la biblioteca."
        >
          <Button size="sm" icon="back" onClick={() => go("packs")}>
            Volver
          </Button>
        </Empty>
      </div>
    )
  }

  const { pack, latest, state, origin } = selected
  const isLocal = origin === "local"

  const doExport = async () => {
    setExporting(true)
    try {
      await exportMrpack(pack.slug)
      toast.success("Pack exportado.")
    } catch (err) {
      const message = (err as { message?: string })?.message
      if (message !== "Exportación cancelada.") {
        toast.error(message ?? "No se pudo exportar el pack.")
      }
    } finally {
      setExporting(false)
    }
  }

  // The tail is where the stack trace ends up; a crash log's first lines are
  // just the JVM banner.
  const crashLines = logs.filter((line) => line.level === "error").slice(-12)
  const installing = state.kind === "installing"
  // No published version means nothing to install, whatever the disk says.
  const needsInstall =
    !!latest && (state.kind === "not-installed" || state.kind === "outdated")
  const running = game.kind === "running"
  const loader = !latest?.loader
    ? "Vanilla"
    : `${LOADER_LABEL[latest.loader] ?? latest.loader} ${latest.loaderVersion ?? ""}`.trim()

  return (
    <div className="px-8 py-7">
      <button
        type="button"
        onClick={() => go("packs")}
        className="mb-4 flex items-center gap-1.5 text-xs uppercase tracking-[0.1em] text-txt-muted hover:text-accent-bright"
      >
        <Icon name="back" size={13} /> Biblioteca
      </button>

      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <Kicker>{pack.slug}</Kicker>
          <h1 className="font-display text-[30px]/none font-bold uppercase tracking-[0.06em] text-txt">
            {pack.name}
          </h1>
          <p className="mt-2 max-w-[560px] text-sm text-txt-muted">{pack.summary}</p>
        </div>

        <div className="flex items-center gap-2">
          {/* RF-10: a managed pack never shows these — editing or exporting it
              is not a flow this launcher offers, anywhere. */}
          {isLocal && (
            <>
              <Button size="sm" icon="edit" onClick={() => setEditing(true)}>
                Editar
              </Button>
              <Button size="sm" icon="upload" loading={exporting} onClick={() => void doExport()}>
                Exportar
              </Button>
            </>
          )}
          {/* Exactly one action, chosen by the state machine. Never offer Play
              while an install is in flight — the jars on disk are incomplete. */}
          {running ? (
            <Button variant="danger" icon="pause" onClick={stop}>
              Detener
            </Button>
          ) : state.kind === "broken" ? (
            <Button
              variant="pri"
              size="lg"
              icon="refresh"
              disabled={!latest}
              onClick={() => void repair(pack.id)}
            >
              Reparar
            </Button>
          ) : installing ? (
            // Not `loading`: that primitive hides its label behind the spinner,
            // and a blank orange box during a multi-minute install reads broken.
            <Button variant="pri" size="lg" icon="download" disabled>
              Instalando {Math.round(state.progress.fraction * 100)}%
            </Button>
          ) : needsInstall ? (
            <Button
              variant="pri"
              size="lg"
              icon="download"
              onClick={() => void install(pack.id)}
            >
              {state.kind === "outdated" ? "Actualizar" : "Instalar"}
            </Button>
          ) : (
            <Button
              variant="pri"
              size="lg"
              icon="play"
              loading={game.kind === "preparing"}
              onClick={() => void play(pack.id)}
            >
              Jugar
            </Button>
          )}
        </div>
      </header>

      {installing && (
        <Panel title="Instalando" aside={<Badge tone="info">En curso</Badge>} className="mb-4">
          <Stepper
            steps={STEP_GROUPS.map((g) => g.label)}
            current={STEP_GROUPS.findIndex((g) => g.phases.includes(state.progress.phase))}
          />
          <div className="mt-5">
            <Progress value={state.progress.fraction * 100} />
            <div className="mt-2 flex items-center justify-between gap-4 text-xs">
              <span className="truncate font-mono text-txt-dim">
                {PHASE_LABEL[state.progress.phase]} · {state.progress.currentFile}
              </span>
              <span className="shrink-0 text-txt-muted">
                {formatBytes(state.progress.downloadedBytes)} /{" "}
                {formatBytes(state.progress.totalBytes)}
              </span>
            </div>
          </div>
        </Panel>
      )}

      {state.kind === "broken" && (
        <Panel title="Instalación dañada" aside={<Badge tone="bad">Dañado</Badge>} className="mb-4">
          <p className="text-sm text-txt-muted">{state.reason}</p>
          <p className="mt-2 text-xs text-txt-dim">
            Reparar borra los mods, la configuración y el loader gestionados por el
            launcher, y los vuelve a descargar. Tus mundos, capturas y opciones no se
            tocan.
          </p>
        </Panel>
      )}

      {/* A crash the player cannot read is a support ticket. The last error
          lines are what actually names the culprit mod, so they go here rather
          than only in the log screen nobody opens. */}
      {game.kind === "crashed" && (
        <Panel
          title="El juego se cerró inesperadamente"
          aside={<Badge tone="bad">Código {game.exitCode}</Badge>}
          className="mb-4"
        >
          {/* §9 — the verdict first. The raw lines stay underneath: a wrong
              diagnosis must never hide the evidence that disproves it. */}
          <CrashDiagnosisCard diagnosis={game.diagnosis} className="mb-3" />
          {crashLines.length > 0 ? (
            <pre className="max-h-[180px] overflow-auto rounded-sm border border-line bg-black/30 p-3 font-mono text-[11px] leading-relaxed text-txt-muted">
              {crashLines.map((line) => line.text).join("\n")}
            </pre>
          ) : (
            <p className="text-sm text-txt-muted">
              No se registró ningún error antes del cierre.
            </p>
          )}
          <div className="mt-3 flex items-center gap-2">
            <Button size="sm" icon="list" onClick={() => go("logs")}>
              Ver registro completo
            </Button>
            <Button size="sm" variant="pri" icon="play" onClick={() => void play(pack.id)}>
              Reintentar
            </Button>
          </div>
        </Panel>
      )}

      {running && (
        <Panel title="Sesión" aside={<Badge tone="ok">En ejecución</Badge>} className="mb-4">
          <Stats
            items={[
              { n: formatDuration(now - game.since), l: "tiempo" },
              { n: game.pid, l: "pid" },
              { n: loader, l: "loader" },
            ]}
          />
          <p className="mt-3 text-xs text-txt-dim">
            El launcher puede cerrarse sin afectar a la partida.
          </p>
        </Panel>
      )}

      <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(320px,1fr))]">
        <Panel title="Versión">
          <DataList
            rows={[
              { label: "Última", value: latest?.name ?? "—", mono: true },
              { label: "Publicada", value: latest ? formatWhen(latest.createdAt) : "—" },
              { label: "Minecraft", value: latest?.minecraft ?? "—", mono: true },
              { label: "Loader", value: loader, mono: true },
              { label: "Archivos", value: latest?.fileCount ?? 0 },
              (state.kind === "installed" || state.kind === "outdated") && {
                label: "En disco",
                value: formatBytes(state.sizeBytes),
              },
              state.kind === "outdated" && {
                label: "Instalada",
                value: state.versionId,
                mono: true,
              },
            ]}
          />
        </Panel>

        <Panel title="Acceso">
          <DataList
            rows={[
              {
                label: "Tipo",
                value:
                  pack.accessKind === "allowlist"
                    ? "Lista de permitidos"
                    : pack.accessKind === "password"
                      ? "Contraseña"
                      : "Público",
                icon: pack.accessKind === "public" ? "globe" : "lock",
              },
              // No member count: the registry deliberately never sends the
              // allowlist to a launcher, since one member could otherwise
              // enumerate everyone else with access to the pack.
              pack.accessKind === "allowlist" && {
                label: "Tu acceso",
                value: "Concedido",
              },
            ]}
          />
          <Divider label="integridad" className="my-4" />
          <p className="text-xs text-txt-dim">
            Cada archivo se verifica por SHA-512 antes de escribirse. Un archivo que no
            coincide se vuelve a descargar; si vuelve a fallar, la instalación se marca como
            dañada en lugar de lanzarse.
          </p>
        </Panel>
      </div>

      {/* §9 — optional-mod toggles and one-click rollback. Below the fold on
          purpose: both only make sense once the pack is installed, and neither
          should compete with the single primary action in the header. */}
      <InstanceSpace slug={pack.slug} onChanged={reloadPacks} />

      {isLocal && (
        <EditLocalPackModal
          open={editing}
          onClose={() => setEditing(false)}
          onSaved={() => {
            reloadPacks()
            toast.success("Pack guardado.")
          }}
          pack={pack}
          latest={latest}
        />
      )}
    </div>
  )
}
