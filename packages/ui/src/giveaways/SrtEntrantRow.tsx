"use client"

import * as React from "react"
import { Icon, IconButton, Avatar } from "@boffmedia/ui"
import { initials } from "./draw-util"
import { SrtNumberStepper } from "./SrtNumberStepper"
import type { Entrant } from "./draw-util"

export interface SrtEntrantRowProps {
  index: number
  entrant: Entrant
  weighted: boolean
  won: boolean
  removeLabel: string
  onRename: (name: string) => void
  onWeight: (w: number) => void
  onRemove: () => void
  weightLessLabel?: string
  weightMoreLabel?: string
  editNameLabel?: string
}

export function SrtEntrantRow({
  index,
  entrant,
  weighted,
  won,
  removeLabel,
  onRename,
  onWeight,
  onRemove,
  weightLessLabel,
  weightMoreLabel,
  editNameLabel,
}: SrtEntrantRowProps) {
  const [editing, setEditing] = React.useState(false)
  const [draft, setDraft] = React.useState(entrant.name)
  React.useEffect(() => setDraft(entrant.name), [entrant.name])

  const commit = () => {
    const v = draft.trim()
    if (v) onRename(v)
    else setDraft(entrant.name)
    setEditing(false)
  }

  return (
    <div className={`grid grid-cols-[1.875rem_1fr_auto_auto] items-center gap-[0.625rem] border-b border-line px-[0.875rem] py-[0.5rem] transition-colors last:border-b-0 hover:bg-panel-2 ${won ? "opacity-55" : ""}`}>
      <span className="text-right font-mono text-[0.6875rem] font-semibold tabular-nums text-txt-dim">
        {won ? <Icon name="trophy" size={13} className="inline text-accent" /> : index}
      </span>
      {editing ? (
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit()
            if (e.key === "Escape") {
              setDraft(entrant.name)
              setEditing(false)
            }
          }}
          aria-label={editNameLabel}
          className="min-w-0 border border-accent-line bg-base-2 px-[0.5625rem] py-[0.4375rem] text-[0.875rem] font-medium text-txt outline-none"
        />
      ) : (
        <span
          onDoubleClick={() => setEditing(true)}
          title={entrant.name}
          className={`inline-flex min-w-0 cursor-text items-center gap-[0.5rem] truncate text-[0.875rem] ${won ? "text-accent" : "text-txt"}`}
        >
          <Avatar className="h-[1.625rem] w-[1.625rem] flex-none text-[0.625rem]">{initials(entrant.name)}</Avatar>
          <span className="truncate">{entrant.name}</span>
        </span>
      )}
      {weighted ? (
        <SrtNumberStepper
          value={entrant.weight || 1}
          onChange={onWeight}
          min={1}
          max={99}
          size="sm"
          lessLabel={weightLessLabel}
          moreLabel={weightMoreLabel}
        />
      ) : (
        <span aria-hidden="true" />
      )}
      <IconButton
        name="x"
        label={removeLabel}
        variant="ghost"
        size="sm"
        onClick={onRemove}
        className="border-transparent text-txt-dim transition-colors hover:border-[color-mix(in_srgb,var(--warn)_40%,transparent)] hover:text-warn"
      />
    </div>
  )
}
