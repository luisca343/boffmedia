"use client"

import { useVgcT } from "../../i18n";
import { cn } from "@boffmedia/ui/cn"
import { DkBack, DkBarList, DkSprite, DkEmpty, DkSkel } from "@boffmedia/ui/datakit"
import { spriteUrl, handleSpriteError } from "../../tracker-core/types"
import { fmtCount, type PokeData, type UsageEntry, type TeamEntry } from "../_lib/meta-types"
import { MvType, MvSpread, MvBaseStats, MvCard } from "./MvBits"
import { MvTeamRow } from "./MvTeams"

interface MvDetailProps {
  detail: PokeData | null
  entry: UsageEntry | null
  rank: number | null
  pokeMap: Record<string, PokeData>
  onSelect: (id: string) => void
  onBack?: () => void
  loading?: boolean
  teams?: TeamEntry[]
  teamsLoading?: boolean
  className?: string
}

export function MvDetail({ detail, entry, rank, pokeMap, onSelect, onBack, loading, teams, teamsLoading, className }: MvDetailProps) {
  const t = useVgcT("meta")
  const shell = cn("min-h-0 min-w-0", className)

  if (loading) {
    return (
      <section className={shell}>
        <div className="px-[var(--dk-pad)] pb-[3.75rem] pt-[1.125rem]">
          <DkSkel h={86} className="max-w-[35rem]" />
          <div className="mt-[0.875rem] grid grid-cols-[repeat(auto-fill,minmax(18.125rem,1fr))] items-start gap-3">
            {[150, 220, 180, 180, 190, 170].map((h, i) => (
              <DkSkel key={i} h={h} />
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (!detail || !entry) {
    return (
      <section className={shell}>
        <div className="px-[var(--dk-pad)] pb-[3.75rem] pt-[1.125rem]">
          <DkEmpty icon="database" title={t("detail.emptyTitle")} lead={t("detail.emptyLead")} />
        </div>
      </section>
    )
  }

  const tera = detail.tera.filter((x) => x.name !== "Nada")

  return (
    <section className={shell} aria-label={detail.name}>
      <div className="px-[var(--dk-pad)] pb-[3.75rem] pt-[1.125rem]">
        <header className="mb-4 flex flex-wrap items-center gap-[0.875rem]">
          {onBack && <DkBack onClick={onBack} label={t("detail.backToList")} />}
          <span className="grid h-[4.625rem] w-[4.625rem] flex-none place-items-center border border-solid border-line-2 bg-panel cut-tag cut-tag-edge [--cut-line:var(--line-2)] [--cut-tag:12px]">
            <DkSprite src={spriteUrl(detail.name)} alt={detail.name} size={62} onError={handleSpriteError} />
          </span>
          <div className="min-w-0">
            <h2 className="m-0 mb-[0.4375rem] font-display text-[2.125rem] font-extrabold uppercase italic leading-none tracking-[0.01em] max-[720px]:text-[1.6875rem]">{detail.name}</h2>
            <div className="flex flex-wrap gap-[0.3125rem]">
              {detail.types.map((ty) => (
                <MvType key={ty} type={ty} />
              ))}
            </div>
          </div>
          <div className="ml-auto flex flex-wrap gap-2 max-[980px]:ml-0 max-[980px]:w-full">
            <Kpi value={`#${rank}`} label={t("detail.rank")} />
            <Kpi value={`${entry.usage.toFixed(2)}%`} label={t("detail.usage")} />
            <Kpi value={fmtCount(entry.count)} label={t("detail.appearances")} />
          </div>
        </header>

        <div className="grid grid-cols-[repeat(auto-fill,minmax(18.125rem,1fr))] items-start gap-3">
          <MvCard title={t("detail.baseStats")}>
            <MvBaseStats base={detail.base} />
          </MvCard>

          <MvCard title={t("detail.moves")} aside={t("detail.topN", { n: 10 })}>
            <DkBarList items={detail.moves.map((m) => ({ name: m.name, pct: m.pct }))} max={10} empty={t("detail.noData")} />
          </MvCard>

          <MvCard title={t("detail.items")} aside={t("detail.topN", { n: 8 })}>
            <DkBarList items={detail.items.map((m) => ({ name: m.name, pct: m.pct }))} max={8} empty={t("detail.noData")} />
          </MvCard>

          <MvCard title={t("detail.abilitiesTeras")}>
            <DkBarList items={detail.abilities.map((m) => ({ name: m.name, pct: m.pct }))} max={4} empty={t("detail.noData")} />
            {tera.length > 0 && (
              <div className="flex flex-wrap gap-[0.375rem] border-t border-dashed border-line pt-[0.5625rem]">
                {tera.map((x) => (
                  <span key={x.name} className="inline-flex items-center gap-[0.375rem] border border-solid border-line bg-base py-1 pl-1 pr-[0.4375rem] font-mono text-[0.625rem] font-semibold leading-none text-txt-muted">
                    <MvType type={x.name} small />
                    <b>{x.pct.toFixed(1)}%</b>
                  </span>
                ))}
              </div>
            )}
          </MvCard>

          <MvCard title={t("detail.teammates")} aside={t("detail.clickToJump")}>
            <DkBarList
              items={detail.mates
                .filter((m) => pokeMap[m.id])
                .map((m) => {
                  const mp = pokeMap[m.id]
                  return {
                    name: mp.name,
                    pct: m.pct,
                    lead: <DkSprite src={spriteUrl(mp.name)} alt={mp.name} size={26} onError={handleSpriteError} />,
                    onClick: () => onSelect(m.id),
                  }
                })}
              max={6}
              empty={t("detail.noData")}
            />
          </MvCard>

          <MvCard title={t("detail.spreads")}>
            {detail.spreads.length === 0 ? (
              <p className="py-2 font-mono text-[0.75rem] leading-[1.5] text-txt-dim">{t("detail.noData")}</p>
            ) : (
              <div className="grid">
                {detail.spreads.map((s, i) => (
                  <div key={i} className="flex items-center gap-[0.625rem] border-b border-dashed border-[color-mix(in_srgb,var(--line)_65%,transparent)] py-[0.375rem] last:border-b-0">
                    <MvSpread nature={s.nature} ev={s.ev} />
                    <span className="flex-none font-mono text-[0.6875rem] font-semibold leading-none text-txt-muted">{s.pct.toFixed(2)}%</span>
                  </div>
                ))}
              </div>
            )}
          </MvCard>
        </div>

        <MvCard title={t("detail.teamsWith", { name: detail.name })} aside={t("detail.tournamentResults")} wide>
          {teamsLoading ? (
            <DkSkel h={120} />
          ) : teams && teams.length > 0 ? (
            <div className="grid gap-[0.375rem]">
              {teams.map((team) => (
                <MvTeamRow key={team.slug} team={team} />
              ))}
            </div>
          ) : (
            <p className="py-2 font-mono text-[0.75rem] leading-[1.5] text-txt-dim">{t("detail.noTeams")}</p>
          )}
        </MvCard>
      </div>
    </section>
  )
}

function Kpi({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <span className="grid min-w-[4.625rem] justify-items-center gap-[3px] border border-solid border-line bg-panel px-[0.875rem] py-[0.5625rem] max-[980px]:flex-1">
      <b className="font-display text-[1.1875rem] font-extrabold italic leading-none">{value}</b>
      <i className="font-mono text-[0.53125rem] font-semibold not-italic uppercase leading-none tracking-[0.12em] text-txt-dim">{label}</i>
    </span>
  )
}
