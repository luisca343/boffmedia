"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { Icon } from "@boffmedia/ui"
import { DkSprite, DkTeam, DkCopy } from "@/components/boffmedia/ui/tools/datakit"
import { spriteUrl, handleSpriteError } from "@/features/vgc-tracker/types"
import type { TeamSlot, TeamEntry } from "../_lib/meta-types"

/** 6-slot team card grid (sprite + item + tera + moves). */
export function MvTeamGrid({ team }: { team: TeamSlot[] }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-[10px]">
      {team.map((s, i) => (
        <div key={`${s.name}-${i}`} className="flex min-w-0 items-start gap-[10px] border border-solid border-line bg-panel px-[10px] py-[9px]">
          <DkSprite src={spriteUrl(s.name)} alt={s.name} size={46} onError={handleSpriteError} />
          <div className="grid min-w-0 gap-[2px]">
            <b className="font-display text-[12.5px] font-bold uppercase leading-[1.15] tracking-[0.03em]">{s.name}</b>
            {s.item && <span className="font-mono text-[10px] leading-[1.3] text-txt-muted">{s.item}</span>}
            {s.tera && s.tera !== "Nada" && (
              <span className="font-mono text-[9px] font-semibold uppercase leading-none tracking-[0.08em] text-warn">Tera {s.tera}</span>
            )}
            {s.moves.length > 0 && (
              <ul className="mt-1 list-none p-0 font-mono text-[10.5px] leading-[1.5] text-txt-dim">
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
  const t = useTranslations("vgc.meta")
  const [open, setOpen] = useState(false)
  return (
    <div className={cn("border border-solid bg-base", open ? "border-line-2" : "border-line")}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 border-0 bg-transparent px-3 py-[9px] text-left hover:bg-panel-2 focus-visible:outline-2 focus-visible:outline-accent-line"
      >
        <span className="whitespace-nowrap font-display text-[12px] font-bold uppercase leading-none tracking-[0.05em]">{team.name}</span>
        {team.record && team.record !== "—" && (
          <span className="bg-ok-soft px-[6px] py-[3px] font-mono text-[10px] font-semibold leading-none text-ok">{team.record}</span>
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
            <div className="mt-[10px] flex justify-end">
              <DkCopy text={team.rawText} label={t("detail.copyPaste")} copiedLabel={t("detail.copied")} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
