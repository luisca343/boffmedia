"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Icon } from "@/components/boffmedia/primitives/icon"

const LOCALES = [
  { code: "es", label: "ES" },
  { code: "en", label: "EN" },
]

export function LangSwitcher() {
  const [lang, setLang] = React.useState("es")
  return (
    <div className="inline-flex items-center gap-1">
      <Icon name="globe" size={15} className="shrink-0 text-txt-dim" />
      {LOCALES.map((l) => (
        <button
          key={l.code}
          type="button"
          aria-pressed={lang === l.code}
          onClick={() => setLang(l.code)}
          className={cn(
            "px-1.5 py-[5px] font-mono text-[12px] font-bold leading-none tracking-[0.06em] transition-colors duration-[140ms]",
            lang === l.code ? "text-accent" : "text-txt-muted hover:text-txt",
          )}
        >
          {l.label}
        </button>
      ))}
    </div>
  )
}
