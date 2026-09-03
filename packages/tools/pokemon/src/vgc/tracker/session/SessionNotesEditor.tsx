"use client"

import { useRef, useState } from "react"
import { useVgcT } from "../../i18n";
import { Icon } from "@boffmedia/ui"

export function SessionNotesEditor({ notes, onSave }: { notes?: string; onSave: (notes: string) => void }) {
  const t = useVgcT("tracker")
  const [value, setValue] = useState(notes ?? "")
  const timer = useRef<ReturnType<typeof setTimeout>>(null)

  const handleChange = (text: string) => {
    setValue(text)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => onSave(text), 800)
  }

  return (
    <div className="grid gap-[0.375rem] border border-solid border-line border-l-[3px] border-l-signal bg-panel px-[0.875rem] py-[0.6875rem]">
      <span className="inline-flex items-center gap-[0.375rem] font-mono text-[0.59375rem] font-semibold uppercase leading-none tracking-[0.12em] text-signal">
        <Icon name="message" size={12} />
        {t("sessionNotes.label")}
      </span>
      <textarea
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={t("sessionNotes.placeholder")}
        rows={2}
        className="w-full resize-none border-0 bg-transparent p-0 font-body text-[0.78125rem] leading-[1.55] text-txt-muted outline-none placeholder:text-txt-dim"
      />
    </div>
  )
}
