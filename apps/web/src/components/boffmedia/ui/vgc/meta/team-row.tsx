"use client"

import { ExpandableCard } from "@/components/boffmedia/primitives/expandable-card"
import { Icon } from "@/components/boffmedia/primitives/icon"
import { CopyButton } from "@/components/boffmedia/primitives/copy-button"
import { spriteUrl, handleSpriteError } from "@/features/vgc-tracker/types"

interface TeamSlot {
  dex: number
  name: string
  tera: string
  item: string
  moves: string[]
}

interface TeamEntry {
  slug: string
  name: string
  record: string
  team: TeamSlot[]
  rawText: string
}

interface TeamRowProps {
  entry: TeamEntry
}

function SlotDetail({ slot }: { slot: TeamSlot }) {
  return (
    <div className="flex flex-col items-center text-center p-[0.6rem_0.4rem] border border-edge rounded-[var(--radius)] bg-[color-mix(in_srgb,var(--layer-2)_50%,transparent)]">
      <img src={spriteUrl(slot.name)} alt={slot.name} width={48} height={48} className="object-contain" onError={handleSpriteError} />
      <p className="text-xs font-bold text-ink leading-tight mt-1">{slot.name}</p>
      <p className="text-[10px] text-ink-dim mt-0.5">{slot.item}</p>
      <span
        className="text-[10px] font-semibold px-1 rounded inline-block mt-0.5"
        style={{ color: "#f5b342", background: "color-mix(in srgb, #f5b342 14%, transparent)" }}
      >
        Tera {slot.tera}
      </span>
      <ul className="list-none m-[0.25rem_0_0] p-0 flex flex-col gap-px">
        {slot.moves.map((m) => (
          <li key={m} className="text-[11px] text-ink-muted whitespace-nowrap overflow-hidden text-ellipsis">
            {m}
          </li>
        ))}
      </ul>
    </div>
  )
}

export function VgcTeamRow({ entry }: TeamRowProps) {
  return (
    <ExpandableCard
      header={
        <div className="flex items-center gap-3">
          <div className="flex flex-col min-w-[96px] shrink-0">
            <span className="text-xs font-bold text-ink">{entry.name}</span>
            <span className="font-mono text-[10px] text-ink-dim">{entry.record}</span>
          </div>
          <div className="flex items-center gap-0.5 flex-1 min-w-0">
            {entry.team.slice(0, 6).map((s) => (
              <img key={s.name} src={spriteUrl(s.name)} alt={s.name} width={30} height={30} className="object-contain" onError={handleSpriteError} />
            ))}
          </div>
        </div>
      }
      bodyClassName="space-y-3"
    >
      <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-3">
        {entry.team.map((s, i) => (
          <SlotDetail key={s.dex + s.name + i} slot={s} />
        ))}
      </div>
      <div className="flex justify-end">
        <CopyButton text={entry.rawText} />
      </div>
    </ExpandableCard>
  )
}
