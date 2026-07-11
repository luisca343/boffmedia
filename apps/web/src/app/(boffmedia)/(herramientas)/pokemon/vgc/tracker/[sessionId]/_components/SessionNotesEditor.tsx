"use client"

import { useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { Icon } from "@/components/boffmedia/primitives"

export function SessionNotesEditor({ notes, onSave }: { notes?: string; onSave: (notes: string) => void }) {
  const t = useTranslations("vgc.tracker")
  const [value, setValue] = useState(notes ?? "")
  const timer = useRef<ReturnType<typeof setTimeout>>(null)

  const handleChange = (text: string) => {
    setValue(text)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => onSave(text), 800)
  }

  return (
    <div className="grid gap-[6px] border border-solid border-line border-l-[3px] border-l-signal bg-panel px-[14px] py-[11px]">
      <span className="inline-flex items-center gap-[6px] font-mono text-[9.5px] font-semibold uppercase leading-none tracking-[0.12em] text-signal">
        <Icon name="message" size={12} />
        {t("sessionNotes.label")}
      </span>
      <textarea
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={t("sessionNotes.placeholder")}
        rows={2}
        className="w-full resize-none border-0 bg-transparent p-0 font-body text-[12.5px] leading-[1.55] text-txt-muted outline-none placeholder:text-txt-dim"
      />
    </div>
  )
}
