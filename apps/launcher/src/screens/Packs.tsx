import { useMemo, useState } from "react"

import { Badge, Button, Empty, Icon, Kicker, Panel, SearchInput } from "@boffmedia/ui"

import type { InstallState, PackEntry } from "../services/types"
import { useLauncher } from "../state/launcher"
import { formatBytes, formatWhen } from "../utils/format"

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
  const a = entry.pack.access
  if (a.kind === "public") return <Badge>Público</Badge>
  if (a.kind === "password") return <Badge tone="info">Con contraseña</Badge>
  return <Badge tone="live">Acceso concedido</Badge>
}

function PackCard({ entry }: { entry: PackEntry }) {
  const { go, install } = useLauncher()
  const { pack, latest, state } = entry
  const needsInstall = state.kind === "not-installed" || state.kind === "outdated"

  return (
    <Panel
      hover
      title={pack.name}
      aside={<StateBadge state={state} />}
      className="cursor-pointer"
      onClick={() => go("pack", pack.id)}
    >
      <p className="mb-4 min-h-[40px] text-sm text-txt-muted">{pack.summary}</p>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <AccessBadge entry={entry} />
        <span className="font-mono text-[11px] text-txt-dim">
          {latest.dependencies.minecraft} · {latest.files.length} archivos
        </span>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-line pt-3">
        <span className="text-xs text-txt-dim">
          {entry.lastPlayed ? `Jugado ${formatWhen(entry.lastPlayed)}` : "Nunca jugado"}
          {state.kind === "installed" || state.kind === "outdated"
            ? ` · ${formatBytes(state.sizeBytes)}`
            : ""}
        </span>
        <Button
          size="sm"
          variant={needsInstall ? "default" : "pri"}
          icon={needsInstall ? "download" : "play"}
          loading={state.kind === "installing"}
          onClick={(e) => {
            e.stopPropagation()
            if (needsInstall) void install(pack.id)
            else go("pack", pack.id)
          }}
        >
          {state.kind === "outdated" ? "Actualizar" : needsInstall ? "Instalar" : "Jugar"}
        </Button>
      </div>
    </Panel>
  )
}

export function Packs() {
  const { packs } = useLauncher()
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

      {packs.length === 0 && (
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
