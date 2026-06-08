"use client"

import { useState, useCallback } from "react"
import { cn } from "@/lib/utils"
import { Icon } from "@/components/boffmedia/primitives/icon"
import { ToolTable } from "@/components/boffmedia/primitives/tool-table"
import { CopyButton } from "@/components/boffmedia/primitives/copy-button"
import { spriteUrl, handleSpriteError } from "@/features/vgc-tracker/types"
import { EmptyState } from "@/components/boffmedia/primitives/empty-state"

interface TeamSlot {
  dex: number
  name: string
  tera: string
  item: string
  moves: string[]
}

interface PlayerEntry {
  slug: string
  placing: number
  name: string
  record: string
  team: TeamSlot[]
  rawText: string
}

interface StandingsViewProps {
  players: PlayerEntry[]
  teamCache?: Map<string, { team: TeamSlot[]; rawText: string }>
  onFetchTeam?: (slug: string) => Promise<{ team: TeamSlot[]; rawText: string } | null>
}

export function VgcStandingsView({ players, teamCache, onFetchTeam }: StandingsViewProps) {
  const [open, setOpen] = useState<string | null>(null)
  const [loadingSlug, setLoadingSlug] = useState<string | null>(null)

  const handleExpand = useCallback(async (slug: string) => {
    if (open === slug) { setOpen(null); return }
    setOpen(slug)
    if (onFetchTeam && !teamCache?.has(slug) && !loadingSlug) {
      setLoadingSlug(slug)
      await onFetchTeam(slug)
      setLoadingSlug(null)
    }
  }, [open, onFetchTeam, teamCache, loadingSlug])

  const getPlayer = (p: PlayerEntry) => {
    const cached = teamCache?.get(p.slug)
    if (cached) return { ...p, team: cached.team, rawText: cached.rawText }
    return p
  }

  if (!players.length) {
    return (
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-3 text-[var(--text-dim)] p-8">
        <EmptyState icon="users" title="Sin clasificación" sub="No hay datos de jugadores disponibles para este torneo." />
      </div>
    )
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <ToolTable
        minWidth="640px"
        columns={[
          { key: "rank", label: "#", w: 48 },
          { key: "player", label: "Jugador" },
          { key: "record", label: "Récord", w: 96 },
          { key: "team", label: "Equipo" },
        ]}
      >
        <tbody>
          {players.map((p) => {
            const expanded = open === p.slug
            const player = getPlayer(p)
            const isLoading = loadingSlug === p.slug
            return (
              <>
                <tr
                  key={p.slug}
                  className={cn(
                    "cursor-pointer transition-colors",
                    expanded
                      ? "bg-[var(--accent-soft)]"
                      : "hover:bg-[color-mix(in_srgb,var(--surface-3)_45%,transparent)]",
                  )}
                  onClick={() => handleExpand(p.slug)}
                >
                  <td className="font-mono text-[var(--text-dim)] text-right py-3 px-4 border-b border-[var(--border)] text-sm">#{p.placing}</td>
                  <td className="py-3 px-4 border-b border-[var(--border)]">
                    <span className="inline-flex items-center gap-1.5 font-semibold text-[var(--text)] text-sm">
                      <Icon name="chevron" size={13} className="text-[var(--text-dim)]" style={{ transform: expanded ? "none" : "rotate(-90deg)" }} />
                      {p.name}
                    </span>
                  </td>
                  <td className="py-3 px-4 border-b border-[var(--border)]">
                    <span className="inline-flex font-mono text-xs px-2 py-[0.15rem] rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-muted)]">
                      {p.record}
                    </span>
                  </td>
                  <td className="py-3 px-4 border-b border-[var(--border)]">
                    <div className="flex items-center gap-0.5">
                      {player.team.slice(0, 6).map((s) => (
                        <img key={s.name} src={spriteUrl(s.name)} alt={s.name} width={32} height={32} className="object-contain" onError={handleSpriteError} />
                      ))}
                    </div>
                  </td>
                </tr>
                {expanded && (
                  <tr key={`${p.slug}-detail`}>
                    <td colSpan={4} className="bg-[color-mix(in_srgb,var(--surface-2)_45%,transparent)] p-4">
                      {isLoading ? (
                        <div className="flex items-center justify-center py-6 text-xs text-[var(--text-dim)]">
                          <Icon name="loader" size={14} className="animate-spin mr-2" />
                          Cargando equipo…
                        </div>
                      ) : player.team.length > 0 ? (
                        <>
                          <div className="flex justify-end mb-3">
                            <CopyButton text={player.rawText} />
                          </div>
                          <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-3">
                            {player.team.map((s, i) => (
                              <div key={i} className="flex flex-col items-center text-center p-3 border border-[var(--border)] rounded-[var(--radius)] bg-[color-mix(in_srgb,var(--surface-2)_50%,transparent)]">
                                <img src={spriteUrl(s.name)} alt={s.name} width={48} height={48} className="object-contain" onError={handleSpriteError} />
                                <p className="text-xs font-bold text-[var(--text)] leading-tight mt-1">{s.name}</p>
                                <p className="text-[11px] text-[var(--text-dim)]">{s.item}</p>
                                <span
                                  className="text-[10px] font-semibold px-1 rounded inline-block mt-0.5"
                                  style={{ color: "#f5b342", background: "color-mix(in srgb, #f5b342 14%, transparent)" }}
                                >
                                  Tera {s.tera}
                                </span>
                                <ul className="list-none m-1 p-0 flex flex-col gap-px">
                                  {s.moves.map((m) => (
                                    <li key={m} className="text-[11px] text-[var(--text-muted)]">{m}</li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <p className="text-xs text-[var(--text-dim)] text-center py-4">Equipo no disponible para este jugador.</p>
                      )}
                    </td>
                  </tr>
                )}
              </>
            )
          })}
        </tbody>
      </ToolTable>
    </div>
  )
}
