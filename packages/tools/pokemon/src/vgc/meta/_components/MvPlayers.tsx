"use client"

import { useCallback, useMemo, useState } from "react"
import { useVgcT } from "../../i18n";
import { Icon, Button } from "@boffmedia/ui"
import { DkTable, DkSearch, DkChip, DkTeam, DkCopy, DkEmpty, DkSkelList } from "@boffmedia/ui/datakit"
import { spriteUrl, handleSpriteError } from "../../tracker-core/types"
import type { PlayerEntry, TeamSlot } from "../_lib/meta-types"
import { MvTeamGrid } from "./MvTeams"

interface MvPlayersProps {
  players: PlayerEntry[]
  loading?: boolean
  teamCache?: Map<string, { team: TeamSlot[]; rawText: string }>
  onFetchTeam?: (slug: string) => Promise<{ team: TeamSlot[]; rawText: string } | null>
}

export function MvPlayers({ players, loading, teamCache, onFetchTeam }: MvPlayersProps) {
  const t = useVgcT("meta")
  const [q, setQ] = useState("")
  const [open, setOpen] = useState<string | null>(null)
  const [loadingSlug, setLoadingSlug] = useState<string | null>(null)

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase()
    return term ? players.filter((p) => p.name.toLowerCase().includes(term)) : players
  }, [players, q])

  const handleExpand = useCallback(
    async (slug: string) => {
      if (open === slug) {
        setOpen(null)
        return
      }
      setOpen(slug)
      if (onFetchTeam && !teamCache?.has(slug) && !loadingSlug) {
        setLoadingSlug(slug)
        await onFetchTeam(slug)
        setLoadingSlug(null)
      }
    },
    [open, onFetchTeam, teamCache, loadingSlug],
  )

  const resolve = (p: PlayerEntry) => {
    const cached = teamCache?.get(p.slug)
    return cached ? { ...p, team: cached.team, rawText: cached.rawText } : p
  }

  return (
    <div className="grid content-start gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <DkSearch value={q} onChange={setQ} placeholder={t("standings.search")} className="min-w-[min(280px,100%)]" />
        <span className="flex-1" />
        <DkChip icon="users">{t("standings.count", { count: rows.length })}</DkChip>
      </div>

      {loading ? (
        <DkSkelList rows={10} h={48} />
      ) : rows.length === 0 ? (
        <DkEmpty icon="search" title={t("sidebar.noResults")} lead={t("empty.noPlayer", { q })}>
          <Button size="sm" onClick={() => setQ("")}>{t("empty.clear")}</Button>
        </DkEmpty>
      ) : (
        <DkTable
          minWidth="640px"
          ariaLabel={t("aria.standings")}
          columns={[
            { key: "n", label: t("standings.col.rank"), w: 52 },
            { key: "player", label: t("standings.col.player") },
            { key: "rec", label: t("standings.col.record"), w: 92 },
            { key: "team", label: t("standings.col.team"), w: 220 },
          ]}
        >
          <tbody>
            {rows.map((p) => {
              const expanded = open === p.slug
              const player = resolve(p)
              const isLoading = loadingSlug === p.slug
              return (
                <PlayerRows
                  key={p.slug}
                  player={player}
                  expanded={expanded}
                  loading={isLoading}
                  onToggle={() => handleExpand(p.slug)}
                  copyLabel={t("detail.copyPaste")}
                  copiedLabel={t("detail.copied")}
                  loadingLabel={t("standings.teamLoading")}
                  emptyLabel={t("standings.teamEmpty")}
                />
              )
            })}
          </tbody>
        </DkTable>
      )}
    </div>
  )
}

function PlayerRows({
  player,
  expanded,
  loading,
  onToggle,
  copyLabel,
  copiedLabel,
  loadingLabel,
  emptyLabel,
}: {
  player: PlayerEntry
  expanded: boolean
  loading: boolean
  onToggle: () => void
  copyLabel: string
  copiedLabel: string
  loadingLabel: string
  emptyLabel: string
}) {
  return (
    <>
      <tr className="is-click" onClick={onToggle}>
        <td className="mono text-txt-dim">{player.placing}</td>
        <td>
          <span className="inline-flex items-center gap-[9px] font-semibold">
            <Icon
              name="chevron"
              size={13}
              className="text-txt-dim transition-transform"
              style={{ transform: expanded ? "rotate(180deg)" : "rotate(-90deg)" }}
            />
            {player.name}
          </span>
        </td>
        <td className="mono">{player.record}</td>
        <td>
          <DkTeam slots={player.team.slice(0, 6).map((s) => ({ name: s.name, src: spriteUrl(s.name), onError: handleSpriteError }))} />
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={4} className="!bg-base-2 !px-4 !py-[14px]">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-6 font-mono text-[12px] text-txt-dim">
                <Icon name="refresh" size={14} className="animate-spin motion-reduce:animate-none" />
                {loadingLabel}
              </div>
            ) : player.team.length > 0 ? (
              <>
                <div className="mb-[10px] flex justify-end">
                  <DkCopy text={player.rawText} label={copyLabel} copiedLabel={copiedLabel} />
                </div>
                <MvTeamGrid team={player.team} />
              </>
            ) : (
              <p className="py-4 text-center font-mono text-[12px] text-txt-dim">{emptyLabel}</p>
            )}
          </td>
        </tr>
      )}
    </>
  )
}
