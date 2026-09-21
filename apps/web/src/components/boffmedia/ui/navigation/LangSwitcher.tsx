"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { Icon } from "@boffmedia/ui"

const LOCALES = [
  // These regions follow the app's canonical Intl tags (es-ES / en-US). The
  // flag is a visual cue only; the locale code remains the accessible label.
  { code: "es", label: "ES", region: "ES" },
  { code: "en", label: "EN", region: "US" },
] as const

function LocaleFlag({ region }: { region: "ES" | "US" }) {
  const isSpain = region === "ES"

  return (
    <svg
      aria-hidden="true"
      className="h-3 w-4 shrink-0 rounded-[2px] ring-1 ring-black/20"
      focusable="false"
      viewBox="0 0 16 12"
      xmlns="http://www.w3.org/2000/svg"
    >
      {isSpain ? (
        <>
          <rect width="16" height="12" fill="#AA151B" />
          <rect y="3" width="16" height="6" fill="#F1BF00" />
        </>
      ) : (
        <>
          <rect width="16" height="12" fill="#B22234" />
          <path fill="#fff" d="M0 1.7h16v1.35H0zM0 4.4h16v1.35H0zM0 7.1h16v1.35H0zM0 9.8h16v1.35H0z" />
          <rect width="7.25" height="6.5" fill="#3C3B6E" />
          <g fill="#fff">
            <circle cx="1.1" cy="1" r=".35" /><circle cx="2.5" cy="1" r=".35" /><circle cx="3.9" cy="1" r=".35" /><circle cx="5.3" cy="1" r=".35" />
            <circle cx="1.8" cy="2.1" r=".35" /><circle cx="3.2" cy="2.1" r=".35" /><circle cx="4.6" cy="2.1" r=".35" /><circle cx="6" cy="2.1" r=".35" />
            <circle cx="1.1" cy="3.2" r=".35" /><circle cx="2.5" cy="3.2" r=".35" /><circle cx="3.9" cy="3.2" r=".35" /><circle cx="5.3" cy="3.2" r=".35" />
            <circle cx="1.8" cy="4.3" r=".35" /><circle cx="3.2" cy="4.3" r=".35" /><circle cx="4.6" cy="4.3" r=".35" /><circle cx="6" cy="4.3" r=".35" />
            <circle cx="1.1" cy="5.4" r=".35" /><circle cx="2.5" cy="5.4" r=".35" /><circle cx="3.9" cy="5.4" r=".35" /><circle cx="5.3" cy="5.4" r=".35" />
          </g>
        </>
      )}
    </svg>
  )
}

export function LangSwitcher() {
  const locale = useLocale()
  const tNav = useTranslations("nav.v3")
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()
  const [open, setOpen] = React.useState(false)
  const rootRef = React.useRef<HTMLDivElement>(null)
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const optionRefs = React.useRef<Array<HTMLButtonElement | null>>([])
  const menuId = React.useId()
  const selectedLocale = LOCALES.find((option) => option.code === locale) ?? LOCALES[0]

  React.useEffect(() => {
    if (!open) return

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault()
        setOpen(false)
        triggerRef.current?.focus()
      }
    }

    document.addEventListener("pointerdown", onPointerDown)
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("pointerdown", onPointerDown)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [open])

  const change = (code: string) => {
    setOpen(false)
    if (code === locale) return
    document.cookie = `NEXT_LOCALE=${code};path=/;max-age=31536000`
    startTransition(() => router.refresh())
  }

  const focusOption = (index: number) => {
    const nextIndex = (index + LOCALES.length) % LOCALES.length
    optionRefs.current[nextIndex]?.focus()
  }

  const onTriggerKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      setOpen(true)
      window.setTimeout(() => optionRefs.current[0]?.focus(), 0)
    }
  }

  const onOptionKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key === "ArrowDown") {
      event.preventDefault()
      focusOption(index + 1)
    } else if (event.key === "ArrowUp") {
      event.preventDefault()
      focusOption(index - 1)
    } else if (event.key === "Home") {
      event.preventDefault()
      focusOption(0)
    } else if (event.key === "End") {
      event.preventDefault()
      focusOption(LOCALES.length - 1)
    }
  }

  return (
    <div
      ref={rootRef}
      onBlur={(event) => {
        if (!event.relatedTarget || !rootRef.current?.contains(event.relatedTarget)) setOpen(false)
      }}
      className="relative inline-flex h-full items-stretch"
    >
      <button
        ref={triggerRef}
        type="button"
        aria-label={tNav("language")}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        disabled={isPending}
        onClick={() => setOpen((value) => !value)}
        onKeyDown={onTriggerKeyDown}
        className={cn(
          "flex items-center gap-[0.4375rem] border-y-[3px] border-transparent px-1.5 font-mono text-[0.75rem] font-bold leading-none tracking-[0.06em] transition-colors duration-[140ms]",
          open ? "border-b-accent text-txt" : "text-txt-muted hover:text-txt",
          isPending && "cursor-wait",
        )}
      >
        <LocaleFlag region={selectedLocale.region} />
        {selectedLocale.label}
        <Icon name="chevronDown" size={11} className={cn("transition-transform duration-[140ms]", open && "rotate-180 text-accent")} />
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label={tNav("language")}
          className="cut-tag cut-tag-edge [--cut-line:var(--line-2)] [--cut-tag:10px] absolute right-0 top-full z-[70] min-w-[8rem] border border-solid border-line-2 border-t-accent bg-panel p-1.5 shadow-[0_24px_54px_-22px_rgba(0,0,0,0.75)] animate-[bm-nd-pop_0.14s_ease-out] motion-reduce:animate-none"
        >
          {LOCALES.map((l, index) => (
            <button
              key={l.code}
              ref={(element) => { optionRefs.current[index] = element }}
              type="button"
              role="menuitemradio"
              aria-checked={locale === l.code}
              disabled={isPending}
              onClick={() => change(l.code)}
              onKeyDown={(event) => onOptionKeyDown(event, index)}
              className={cn(
                "flex w-full items-center justify-between gap-4 px-2.5 py-2 font-body text-[0.875rem] font-medium leading-[1.2] text-txt-muted transition-colors duration-[140ms] hover:bg-accent-soft hover:text-txt focus-visible:bg-accent-soft focus-visible:text-txt focus-visible:outline-none",
                locale === l.code ? "text-accent" : "text-txt-muted",
                isPending && "cursor-wait",
              )}
            >
              <span className="flex items-center gap-2">
                <LocaleFlag region={l.region} />
                <span>{l.label}</span>
              </span>
              {locale === l.code && <Icon name="check" size={12} aria-hidden="true" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
