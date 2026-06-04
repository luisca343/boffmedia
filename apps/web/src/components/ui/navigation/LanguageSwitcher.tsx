"use client"

import { useRouter } from "next/navigation"
import { useLocale } from "next-intl"
import { useTransition } from "react"
import { Icon } from "@/components/ui/primitives/boffmedia/icon"

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
          <Icon name="globe" size={20} className={isPending ? "text-[var(--orange-500)] animate-spin" : "text-[var(--text-dim)]"} />
          <span className="text-[var(--text-muted)]">Idioma:</span>
          {locales.map((loc) => (
            <button
              key={loc.code}
              onClick={() => handleLocaleChange(loc.code)}
              className={`text-[length:var(--t-sm)] ${
                locale === loc.code
                  ? 'text-[var(--orange-500)] font-semibold'
                  : isPending
                    ? 'text-[var(--text-dim)] cursor-wait'
                    : 'text-[var(--text-muted)] hover:text-[var(--orange-500)]'
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
      <Icon name="globe" size={17} className={isPending ? "text-[var(--orange-500)] animate-spin" : "text-[var(--text-dim)]"} />
      {locales.map((loc) => (
        <button
          key={loc.code}
          onClick={() => handleLocaleChange(loc.code)}
          className={`text-[length:var(--t-sm)] font-medium px-1.5 py-0.5 rounded transition-colors duration-[var(--dur)] ${
            locale === loc.code
              ? 'text-[var(--orange-500)] font-semibold'
              : isPending
                ? 'text-[var(--text-dim)] cursor-wait'
                : 'text-[var(--text-muted)] hover:text-[var(--orange-500)]'
          }`}
          disabled={isPending}
        >
          {loc.label}
        </button>
      ))}
    </div>
  )
}
