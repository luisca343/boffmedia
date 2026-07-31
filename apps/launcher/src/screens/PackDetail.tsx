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

export function PackDetail() {
  const { selected, install, play, repair, stop, game, go, logs } = useLauncher()
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
    </div>
  )
}
