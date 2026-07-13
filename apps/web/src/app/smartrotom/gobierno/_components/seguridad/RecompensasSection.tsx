"use client"

// The public bounty wall: a view over active Buscados, not its own register. Same query
// params as BuscadosSection so TanStack Query serves both pages from one cached fetch.
import { useMemo } from "react"
import { userMessageFrom } from "@/services/boffAPI"
import { Avatar, Badge, Empty, Icon, Seal, Skeleton } from "../ui"
import { useBuscados } from "../../_hooks/queries"
import { useGobiernoUi } from "../../_stores/useGobiernoUi"
import { money } from "../../_utils/format"
import { severityTone } from "./severity"

export function RecompensasSection() {
  // Same query params as BuscadosSection (`limit`/`page`, per ListBuscadosQueryDto) so the
  // two pages share one cached fetch instead of issuing two different requests.
  const { data, isLoading, isError, error } = useBuscados({ limit: 100 })
  const openDossier = useGobiernoUi((s) => s.openDossier)

  const active = useMemo(
    () => (data?.items ?? []).filter((b) => b.status === "active").sort((a, b) => b.bounty - a.bounty),
    [data],
  )
  const total = active.reduce((sum, b) => sum + b.bounty, 0)

  return (
    <div className="mx-auto max-w-[1000px]">
      <div className="mb-2 text-center">
        <Badge tone="seguridad" className="mb-3.5">
          Tablón público · Ciudadanía
        </Badge>
        <div className="mb-2.5 flex justify-center">
          <Seal size={66} />
        </div>
        <h1 className="font-gt-display text-[44px] leading-[0.95] text-gt-ink-900">Tablón de recompensas</h1>
        <p className="mx-auto mt-2.5 max-w-[560px] text-[14px] leading-relaxed text-gt-ink-500">
          El Gobierno de Teras ofrece las siguientes recompensas por la captura de infractores. Repórtalos a
          cualquier oficial de guardia.
        </p>
        {active.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
            <Badge tone="danger" icon="coins" className="px-3.5 py-[7px] text-[13px]">
              Bolsa total · {money(total)} ₽
            </Badge>
            <Badge tone="default" icon="users" className="px-3.5 py-[7px] text-[13px]">
              {active.length} reclamados
            </Badge>
          </div>
        )}
      </div>

      <div className="my-6 h-px bg-gt-line-strong" />

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[210px] w-full" />
          ))}
        </div>
      ) : isError ? (
        <Empty
          icon="alert"
          title="No se ha podido cargar el tablón"
          sub={error ? userMessageFrom(error, "Inténtalo de nuevo en unos segundos.") : undefined}
        />
      ) : active.length === 0 ? (
        <Empty
          icon="scroll"
          title="No hay recompensas activas en este momento"
          sub="Vuelve más tarde: el Gobierno de Teras publicará aquí las órdenes de busca y captura vigentes."
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {active.map((b, i) => {
            const sev = severityTone(b.severity)
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => openDossier(b.player.uuid)}
                className={`overflow-hidden rounded-gt border bg-gt-paper-0 text-center shadow-gt transition-transform hover:-translate-y-0.5 motion-reduce:hover:translate-y-0 ${
                  i === 0 ? "border-gt-gold" : "border-gt-line-strong"
                }`}
              >
                {i === 0 && (
                  <div className="flex items-center justify-center gap-1.5 bg-gt-gold py-1 font-gt-mono text-[9.5px] font-bold uppercase tracking-[.14em] text-white">
                    <Icon name="star" size={11} fill="#fff" />
                    Más buscado
                  </div>
                )}
                <div className="p-4">
                  <Avatar user={b.player.username} size={80} />
                  <div className="mt-2.5 font-gt-display text-[17px] font-bold text-gt-ink-900">{b.player.username}</div>
                  <div className="mt-1">
                    <Badge tone={sev.tone}>{sev.label}</Badge>
                  </div>
                  <div className="mt-2.5 font-gt-display text-[25px] font-bold tabular-nums text-gt-danger">
                    {money(b.bounty)} ₽
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
