"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { Icon } from "@boffmedia/ui"

const LOCALES = [
  { code: "es", label: "ES" },
  { code: "en", label: "EN" },
]

export function LangSwitcher() {
  const locale = useLocale()
  const tNav = useTranslations("nav.v3")
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()

  const change = (code: string) => {
    if (code === locale) return
    document.cookie = `NEXT_LOCALE=${code};path=/;max-age=31536000`
    startTransition(() => router.refresh())
  }

  return (
    <div className="inline-flex items-center gap-1" role="group" aria-label={tNav("language")}>
      <Icon name="globe" size={15} className={cn("shrink-0", isPending ? "text-accent" : "text-txt-dim")} />
      {LOCALES.map((l) => (
        <button
          key={l.code}
          type="button"
          aria-pressed={locale === l.code}
          disabled={isPending}
          onClick={() => change(l.code)}
          className={cn(
            "px-1.5 py-[5px] font-mono text-[12px] font-bold leading-none tracking-[0.06em] transition-colors duration-[140ms]",
            locale === l.code ? "text-accent" : "text-txt-muted hover:text-txt",
            isPending && "cursor-wait",
          )}
        >
          {l.label}
        </button>
      ))}
    </div>
  )
}
