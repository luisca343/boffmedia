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
      <div className="pb-2 mb-2 border-b border-surface-700">
        <div className="flex items-center gap-3">
          <Globe className={`h-5 w-5 ${isPending ? 'text-primary-300 animate-spin' : 'text-primary-400'}`} />
          <span className="text-surface-300">Idioma:</span>
          {locales.map((loc) => (
            <button 
              key={loc.code}
              onClick={() => handleLocaleChange(loc.code)}
              className={`text-sm ${
                locale === loc.code 
                  ? 'text-primary-400' 
                  : isPending 
                    ? 'text-surface-400 cursor-wait' 
                    : 'text-surface-300 hover:text-primary-400'
              }`}
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
    <div className="flex items-center gap-2 border-l border-surface-700 pl-4">
      <Globe className={`h-4 w-4 ${isPending ? 'text-primary-300 animate-spin' : 'text-primary-400'}`} />
      {locales.map((loc) => (
        <button
          key={loc.code}
          onClick={() => handleLocaleChange(loc.code)}
          className={`text-sm ${
            locale === loc.code 
              ? 'text-primary-400' 
              : isPending 
                ? 'text-surface-400 cursor-wait' 
                : 'text-surface-300 hover:text-primary-400'
          }`}
          disabled={isPending}
        >
          {loc.label}
        </button>
      ))}
    </div>
  )
}