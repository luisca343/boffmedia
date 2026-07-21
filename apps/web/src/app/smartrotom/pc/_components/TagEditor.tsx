"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { useMarks, useSetMark } from "../_hooks/queries"
import { SUGGESTED_TAGS, markOf } from "../_utils/marks"
import { Button, Chip, ChipButton, Icon, Input } from "./ui"

export interface TagEditorProps {
  /** The Pokémon's content hash — marks are keyed by it, never by position. */
  monKey: string
}

/** Tags are ours, not the game's: they live in `rotom_pc_marks`. */
export function TagEditor({ monKey }: TagEditorProps) {
  const t = useTranslations("pc")
  const [draft, setDraft] = useState("")
  const { data: marks } = useMarks()
  const setMark = useSetMark()

  const tags = marks ? markOf(marks, monKey).tags : []

  const write = (next: string[]) => setMark.mutate({ key: monKey, patch: { tags: next } })

  const add = (tag: string) => {
    const t = tag.trim()
    setDraft("")
    if (!t || tags.includes(t)) return
    write([...tags, t])
  }

  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-1.5">
        {tags.map((t) => (
          <Chip key={t} className="border-pc-accent text-pc-fg">
            {t}
            <button
              type="button"
              aria-label={`Quitar etiqueta ${t}`}
              onClick={() => write(tags.filter((x) => x !== t))}
              className="flex text-pc-fg-subtle transition-colors hover:text-pc-rose focus-visible:outline-none"
            >
              <Icon name="x" size={12} />
            </button>
          </Chip>
        ))}
        {tags.length === 0 && <span className="text-xs text-pc-fg-subtle">{t("detail.none")}</span>}
      </div>

      <div className="flex gap-1.5">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              add(draft)
            }
            // The drawer navigates on ← / →; typing a tag must not flip the Pokémon.
            e.stopPropagation()
          }}
          placeholder={`${t("filters.tag")}…`}
          aria-label={t("filters.tag")}
          className="flex-1"
        />
        <Button icon onClick={() => add(draft)} aria-label={t("filters.tag")} disabled={!draft.trim()}>
          <Icon name="plus" size={14} />
        </Button>
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {SUGGESTED_TAGS.filter((s) => !tags.includes(s)).map((s) => (
          <ChipButton key={s} onClick={() => add(s)}>
            + {s}
          </ChipButton>
        ))}
      </div>
    </div>
  )
}
