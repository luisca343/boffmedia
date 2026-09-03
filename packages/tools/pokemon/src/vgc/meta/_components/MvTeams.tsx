"use client"

import { useState } from "react"
import { useVgcT } from "../../i18n";
import { cn } from "@boffmedia/ui/cn"
import { Icon } from "@boffmedia/ui"
import { DkSprite, DkTeam, DkCopy } from "@boffmedia/ui/datakit"
import { spriteUrl, handleSpriteError } from "../../tracker-core/types"
import type { TeamSlot, TeamEntry } from "../_lib/meta-types"

/** 6-slot team card grid (sprite + item + tera + moves). */
export function MvTeamGrid({ team }: { team: TeamSlot[] }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(13.125rem,1fr))] gap-[0.625rem]">
      {team.map((s, i) => (
        <div key={`${s.name}-${i}`} className="flex min-w-0 items-start gap-[0.625rem] border border-solid border-line bg-panel px-[0.625rem] py-[0.5625rem]">
          <DkSprite src={spriteUrl(s.name)} alt={s.name} size={46} onError={handleSpriteError} />
          <div className="grid min-w-0 gap-[2px]">
            <b className="font-display text-[0.78125rem] font-bold uppercase leading-[1.15] tracking-[0.03em]">{s.name}</b>
            {s.item && <span className="font-mono text-[0.625rem] leading-[1.3] text-txt-muted">{s.item}</span>}
            {s.tera && s.tera !== "Nada" && (
              <span className="font-mono text-[0.5625rem] font-semibold uppercase leading-none tracking-[0.08em] text-warn">Tera {s.tera}</span>
            )}
            {s.moves.length > 0 && (
              <ul className="mt-1 list-none p-0 font-mono text-[0.65625rem] leading-[1.5] text-txt-dim">
                {s.moves.map((m) => (
                  <li key={m} className="truncate">{m}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ))}
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
        <span className="whitespace-nowrap font-display text-[0.75rem] font-bold uppercase leading-none tracking-[0.05em]">{team.name}</span>
        {team.record && team.record !== "—" && (
          <span className="bg-ok-soft px-[0.375rem] py-[3px] font-mono text-[0.625rem] font-semibold leading-none text-ok">{team.record}</span>
        )}
        <DkTeam
          className="ml-auto"
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
