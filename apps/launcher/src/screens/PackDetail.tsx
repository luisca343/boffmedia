import { useEffect, useState } from "react"

import {
  Badge,
  Button,
  DataList,
  Divider,
  Empty,
  Icon,
  Kicker,
  Panel,
  Progress,
  Stats,
  Stepper,
} from "@boffmedia/ui"

import type { InstallPhase } from "../services/types"
import { useLauncher } from "../state/launcher"
import { formatBytes, formatDuration, formatWhen } from "../utils/format"

// Rust reports eight fine-grained phases; the user gets four. Eight steps is
// both too granular to be meaningful and too wide for the content area — the
// Stepper hides its labels below a 1100px *viewport*, which never triggers here
// because the 228px sidebar eats the space instead.
const STEP_GROUPS: { label: string; phases: InstallPhase[] }[] = [
  { label: "Preparando", phases: ["resolving", "java"] },
  { label: "Descargando", phases: ["libraries", "assets"] },
  { label: "Instalando", phases: ["loader", "mods", "overrides"] },
  { label: "Verificando", phases: ["verifying"] },
]

const PHASE_LABEL: Record<InstallPhase, string> = {
  resolving: "Resolviendo versión",
  java: "Comprobando Java",
  libraries: "Librerías",
  assets: "Assets",
  loader: "Mod loader",
  mods: "Mods",
  overrides: "Configuración",
  verifying: "Verificando",
}

// The registry stores the loader under its dependency key, which is also what
// the version JSON uses; these are just the display names.
const LOADER_LABEL: Record<string, string> = {
  neoforge: "NeoForge",
  forge: "Forge",
  "fabric-loader": "Fabric",
  quilt: "Quilt",
}

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

export function PackDetail() {
  const { selected, install, play, stop, game, go } = useLauncher()
  const now = useNow(game.kind === "running")

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

  const { pack, latest, state } = selected
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
          {/* Exactly one action, chosen by the state machine. Never offer Play
              while an install is in flight — the jars on disk are incomplete. */}
          {running ? (
            <Button variant="danger" icon="pause" onClick={stop}>
              Detener
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
    </div>
  )
}
