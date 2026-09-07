"use client"

import { useState, type ReactNode } from "react"
import { useVgcT } from "../../i18n";
import { cn } from "@boffmedia/ui/cn"
import { Icon } from "@boffmedia/ui"
import { DkSprite, DkTeam, DkCopy } from "@boffmedia/ui/datakit"
import { spriteUrl, handleSpriteError } from "../../tracker-core/types"
import type { TeamSlot, TeamEntry } from "../_lib/meta-types"
import { MvSpread, MvType } from "./MvBits"

/** Six compact Pokémon cards with the details available in the source paste. */
export function MvTeamGrid({ team }: { team: TeamSlot[] }) {
  const t = useVgcT("meta")

  return (
    <div className="grid grid-cols-1 gap-[0.625rem] min-[720px]:grid-cols-2 min-[1080px]:grid-cols-3">
      {team.map((s, i) => (
        <article key={`${s.name}-${i}`} className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)] overflow-hidden border border-solid border-line-2 bg-panel">
          <header className="col-span-2 flex min-w-0 items-center gap-2 border-b border-solid border-line bg-panel-2 px-3 py-2">
            <span className="grid h-11 w-11 flex-none place-items-center border border-solid border-line-2 bg-base">
              <DkSprite src={spriteUrl(s.name)} alt={s.name} size={44} onError={handleSpriteError} />
            </span>
            <div className="min-w-0">
              <h4 className="m-0 truncate font-display text-[0.8125rem] font-bold uppercase leading-[1.15] tracking-[0.03em]">{s.name}</h4>
              {s.tera && s.tera !== "Nada" && s.tera !== "None" && (
                <div className="mt-1 flex">
                  <MvType type={s.tera} small />
                </div>
              )}
            </div>
          </header>

          <div className="min-w-0 border-r border-solid border-line bg-base p-3">
            <div className="grid gap-3">
              {s.ability && <TeamFact label={t("detail.team.ability")} value={s.ability} />}
              {s.item && <TeamFact label={t("detail.team.item")} value={s.item} />}
            </div>
            {(s.nature || s.ev?.some((value) => value > 0)) && (
              <div className="mt-3 min-w-0 border-t border-dashed border-line pt-2">
                <TeamLabel>{t("detail.team.spread")}</TeamLabel>
                <div className="mt-1">
                  <MvSpread nature={s.nature || t("detail.team.neutral")} ev={s.ev ?? []} />
                </div>
              </div>
            )}
          </div>

          <div className="min-w-0 p-3">
            <TeamLabel>{t("detail.team.moves")}</TeamLabel>
            {s.moves.length > 0 ? (
              <ul className="mt-2 grid list-none border-t border-dashed border-line p-0">
                {s.moves.map((move, moveIndex) => (
                  <li key={`${move}-${moveIndex}`} className="flex min-h-8 items-center gap-2 border-b border-dashed border-line py-1.5 font-body text-[0.75rem] font-medium leading-[1.25] text-txt last:border-b-0">
                    <span aria-hidden="true" className="h-1 w-1 flex-none bg-accent" />
                    <span className="min-w-0 break-words">{move}</span>
                    {s.moveTypes?.[moveIndex] && <MvType type={s.moveTypes[moveIndex]!} small />}
                  </li>
                ))}
              </ul>
            ) : (
              <span className="mt-2 block font-mono text-[0.75rem] text-txt-dim">{t("detail.noData")}</span>
            )}
          </div>
        </article>
      ))}
    </div>
  )
}

function TeamLabel({ children }: { children: ReactNode }) {
  return <span className="block font-mono text-[0.5625rem] font-semibold uppercase leading-none tracking-[0.1em] text-txt-dim">{children}</span>
}

function TeamFact({ label, value }: { label: ReactNode; value: string }) {
  return (
    <div className="min-w-0">
      <TeamLabel>{label}</TeamLabel>
      <span className="mt-1 block truncate font-body text-[0.6875rem] leading-[1.2] text-txt">{value}</span>
    </div>
  )
}

/** Collapsible featured-team row: rank + record + sprite strip → grid + copy. */
export function MvTeamRow({ team }: { team: TeamEntry }) {
  const t = useVgcT("meta")
  const [open, setOpen] = useState(false)
  return (
    <div className={cn("border border-solid bg-base", open ? "border-line-2" : "border-line")}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 border-0 bg-transparent px-3 py-[0.5625rem] text-left hover:bg-panel-2 focus-visible:outline-2 focus-visible:outline-accent-line"
      >
        <div className="min-w-0 flex-1">
          {team.tournamentName && (
            <span className="mb-1 block truncate font-mono text-[0.625rem] font-semibold uppercase leading-none tracking-[0.06em] text-txt-dim">
              {team.tournamentName}
            </span>
          )}
          <div className="flex min-w-0 items-center gap-2">
            <span className="whitespace-nowrap font-display text-[0.75rem] font-bold uppercase leading-none tracking-[0.05em]">
              {team.source === "limitless" && team.rank && `${t("detail.team.top")} `}
              {team.name}
            </span>
            {team.record && team.record !== "—" && (
              <span className="bg-ok-soft px-[0.375rem] py-[3px] font-mono text-[0.625rem] font-semibold leading-none text-ok">{team.record}</span>
            )}
          </div>
        </div>
        <DkTeam
          className="ml-auto"
          size={32}
          slots={team.team.slice(0, 6).map((s) => ({ name: s.name, src: spriteUrl(s.name), onError: handleSpriteError }))}
        />
        <Icon name="chevron" size={14} className="flex-none text-txt-dim transition-transform" style={{ transform: open ? "rotate(180deg)" : "none" }} />
      </button>
      {open && (
        <div className="border-t border-solid border-line p-3">
          <MvTeamGrid team={team.team} />
          {team.rawText && (
            <div className="mt-[0.625rem] flex justify-end">
              <DkCopy text={team.rawText} label={t("detail.copyPaste")} copiedLabel={t("detail.copied")} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
