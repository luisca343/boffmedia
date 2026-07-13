"use client"

import { useRouter } from "next/navigation"
import { useLocale } from "next-intl"
import { useTransition } from "react"
import { Globe } from "lucide-react"

interface LanguageSwitcherProps {
  variant?: "default" | "mobile"
}

export default function LanguageSwitcher({ variant = "default" }: LanguageSwitcherProps) {
  const locale = useLocale()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const locales = [
    { code: 'es', label: 'ES', fullLabel: 'Español' },
    { code: 'en', label: 'EN', fullLabel: 'English' }
  ]

  const handleLocaleChange = (newLocale: string) => {
    if (newLocale === locale) return;

    document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=31536000`;

    startTransition(() => {
      router.refresh();
    });
  }

  if (variant === "mobile") {
    return (
      <div className="pb-2 mb-2" style={{ borderBottom: "var(--hairline) solid var(--border)" }}>
        <div className="flex items-center gap-3">
          <Globe size={20} className={isPending ? "text-[var(--orange-500)] animate-spin" : "text-ink-dim"} />
          <span className="text-ink-muted">Idioma:</span>
          {locales.map((loc) => (
            <button
              key={loc.code}
              onClick={() => handleLocaleChange(loc.code)}
              className={`text-[length:var(--t-sm)] ${
                locale === loc.code
                  ? 'text-[var(--orange-500)] font-semibold'
                  : isPending
                    ? 'text-ink-dim cursor-wait'
                    : 'text-ink-muted hover:text-[var(--orange-500)]'
              } transition-colors duration-[var(--dur)]`}
              disabled={isPending}
            >
              {loc.fullLabel}
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Globe size={17} className={isPending ? "text-[var(--orange-500)] animate-spin" : "text-ink-dim"} />
      {locales.map((loc) => (
        <button
          key={loc.code}
          onClick={() => handleLocaleChange(loc.code)}
          className={`text-[length:var(--t-sm)] font-medium px-1.5 py-0.5 rounded transition-colors duration-[var(--dur)] ${
            locale === loc.code
              ? 'text-[var(--orange-500)] font-semibold'
              : isPending
                ? 'text-ink-dim cursor-wait'
                : 'text-ink-muted hover:text-[var(--orange-500)]'
          }`}
          disabled={isPending}
        >
          {loc.label}
        </button>
      ))}
    </div>
  )
}
