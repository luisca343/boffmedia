import { useMemo, useState } from "react"

import { Badge, Button, Empty, Icon, Kicker, Panel, Progress, SearchInput } from "@boffmedia/ui"

import type { InstallState, PackEntry } from "../services/types"
import { useLauncher } from "../state/launcher"
import { formatBytes, formatWhen } from "../utils/format"
import { PHASE_LABEL } from "../utils/labels"

function StateBadge({ state }: { state: InstallState }) {
  switch (state.kind) {
    case "installed":
      return <Badge tone="ok">Instalado</Badge>
    case "outdated":
      return <Badge tone="warn">Actualización</Badge>
    case "installing":
      return <Badge tone="info">Instalando</Badge>
    case "broken":
      return <Badge tone="bad">Dañado</Badge>
    default:
      return <Badge>No instalado</Badge>
  }
}

function AccessBadge({ entry }: { entry: PackEntry }) {
  const kind = entry.pack.accessKind
  if (kind === "public") return <Badge>Público</Badge>
  if (kind === "password") return <Badge tone="info">Con contraseña</Badge>
  return <Badge tone="live">Acceso concedido</Badge>
}

function PackCard({ entry }: { entry: PackEntry }) {
  const { go, install, play, repair, game } = useLauncher()
  const { pack, latest, state } = entry
  const busy = game.kind === "preparing" || game.kind === "running"
  // A pack with no published version is listed but cannot be installed —
  // offering the button anyway would produce a 404 the player cannot act on.
  const needsInstall =
    !!latest && (state.kind === "not-installed" || state.kind === "outdated")

  return (
    <Panel
      hover
      title={pack.name}
      aside={<StateBadge state={state} />}
      className="cursor-pointer"
      onClick={() => go("pack", pack.id)}
    >
      <p className="mb-4 min-h-[40px] text-sm text-txt-muted">{pack.summary}</p>

      {/* An install runs for minutes; a card that only says "Instalando" makes
          the player click through to the detail view to learn whether anything
          is happening. */}
      {state.kind === "installing" && (
        <div className="mb-4">
          <Progress value={state.progress.fraction * 100} />
          <p className="mt-1.5 truncate font-mono text-[11px] text-txt-dim">
            {PHASE_LABEL[state.progress.phase]}
            {state.progress.currentFile ? ` · ${state.progress.currentFile}` : ""}
          </p>
        </div>
      )}

      {state.kind === "broken" && (
        <p className="mb-4 rounded-sm border border-bad/40 bg-bad/10 px-2.5 py-2 text-[11px] text-txt-muted">
          {state.reason}
        </p>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <AccessBadge entry={entry} />
        <span className="font-mono text-[11px] text-txt-dim">
          {latest
            ? `${latest.minecraft} · ${latest.fileCount} archivos`
            : "Sin versión publicada"}
        </span>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-line pt-3">
        <span className="text-xs text-txt-dim">
          {entry.lastPlayed ? `Jugado ${formatWhen(entry.lastPlayed)}` : "Nunca jugado"}
          {state.kind === "installed" || state.kind === "outdated"
            ? ` · ${formatBytes(state.sizeBytes)}`
            : ""}
        </span>
        {state.kind === "broken" ? (
          <Button
            size="sm"
            variant="default"
            icon="refresh"
            disabled={!latest}
            onClick={(e) => {
              e.stopPropagation()
              void repair(pack.id)
            }}
          >
            Reparar
          </Button>
        ) : (
          <Button
            size="sm"
            variant={needsInstall ? "default" : "pri"}
            icon={needsInstall ? "download" : "play"}
            loading={state.kind === "installing" || (!needsInstall && game.kind === "preparing")}
            disabled={!latest || (!needsInstall && busy)}
            onClick={(e) => {
              e.stopPropagation()
              // Launching from the card is the whole point of the library
              // screen; sending the player to the detail view to press a second
              // button is what made every pack look unplayable from here.
              if (needsInstall) void install(pack.id)
              else void play(pack.id)
            }}
          >
            {!latest
              ? "No disponible"
              : state.kind === "outdated"
                ? "Actualizar"
                : needsInstall
                  ? "Instalar"
                  : game.kind === "running"
                    ? "En ejecución"
                    : "Jugar"}
          </Button>
        )}
      </div>
    </Panel>
  )
}

export function Packs() {
  const { packs, packsLoading, packsError, reloadPacks } = useLauncher()
  const [query, setQuery] = useState("")

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return packs
    return packs.filter(
      (p) =>
        p.pack.name.toLowerCase().includes(q) ||
        (p.pack.summary ?? "").toLowerCase().includes(q) ||
        p.pack.slug.includes(q),
    )
  }, [packs, query])

  return (
    <div className="px-8 py-7">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Kicker>Tu biblioteca</Kicker>
          <h1 className="font-display text-[30px]/none font-bold uppercase tracking-[0.06em] text-txt">
            Packs
          </h1>
        </div>
        <div className="w-[280px]">
          <SearchInput value={query} onChange={setQuery} placeholder="Buscar pack…" size="sm" />
        </div>
      </header>

      {/* Three distinct states, deliberately not collapsed into one: a server
          that cannot be reached is not the same as a library that is empty,
          and telling a player to ask for an invite when the API is down is how
          support tickets get filed against the wrong thing. */}
      {packsError && (
        <Empty icon="alert" title="No se pudo cargar tu biblioteca" lead={packsError}>
          <Button size="sm" icon="refresh" onClick={reloadPacks}>
            Reintentar
          </Button>
        </Empty>
      )}

      {!packsError && packsLoading && packs.length === 0 && (
        <Empty icon="cube" title="Cargando tus packs…" lead="Consultando el registro." />
      )}

      {!packsError && !packsLoading && packs.length === 0 && (
        <Empty
          icon="cube"
          title="No hay packs disponibles"
          lead="Tu cuenta no tiene acceso a ningún pack todavía. Pide una invitación al administrador."
        />
      )}

      {packs.length > 0 && shown.length === 0 && (
        <Empty icon="search" title="Sin resultados" lead={`Nada coincide con «${query}».`} />
      )}

      <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(320px,1fr))]">
        {shown.map((entry) => (
          <PackCard key={entry.pack.id} entry={entry} />
        ))}
      </div>

      {packs.length > 0 && (
        <p className="mt-6 flex items-center gap-2 text-xs text-txt-dim">
          <Icon name="shield" size={13} />
          Solo se listan los packs a los que tu UUID tiene acceso.
        </p>
      )}
    </div>
  )
}
