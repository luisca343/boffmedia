"use client"

import { useLocale, useTranslations } from "next-intl"
import { intlLocale as resolveIntlLocale } from "@/lib/locale"

/** Locale-aware number/date formatting for the timeline (`rooker.format` messages). */
export function useFormat() {
  const t = useTranslations("rooker")
  const locale = useLocale()
  const decimal = locale === "es" ? "," : "."
  const intlLocale = resolveIntlLocale(locale)

  function fmt(n: number | undefined | null): string {
    if (n == null) return "0"
    if (n < 1000) return String(n)
    if (n < 1e6) {
      const v = n / 1000
      const s = v >= 100 ? String(Math.round(v)) : v.toFixed(1).replace(".0", "").replace(".", decimal)
      return t("format.thousand", { value: s })
    }
    return t("format.million", { value: (n / 1e6).toFixed(1).replace(".0", "").replace(".", decimal) })
  }

  function exact(n: number | undefined | null): string {
    return (n ?? 0).toLocaleString(intlLocale)
  }

  function relTime(iso: string | Date | null | undefined): string {
    if (!iso) return ""
    const then = new Date(iso).getTime()
    if (Number.isNaN(then)) return ""
    const secs = Math.max(0, Math.floor((Date.now() - then) / 1000))

    if (secs < 60) return t("format.now")
    const mins = Math.floor(secs / 60)
    if (mins < 60) return t("format.minutes", { count: mins })
    const hours = Math.floor(mins / 60)
    if (hours < 24) return t("format.hours", { count: hours })
    const days = Math.floor(hours / 24)
    if (days < 7) return t("format.days", { count: days })

    const d = new Date(then)
    const sameYear = d.getFullYear() === new Date().getFullYear()
    return d.toLocaleDateString(intlLocale, {
      day: "numeric",
      month: "short",
      ...(sameYear ? null : { year: "numeric" }),
    })
  }

  function fullTime(iso: string | Date | null | undefined): string {
    if (!iso) return ""
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return ""
    const date = d.toLocaleDateString(intlLocale, { day: "numeric", month: "short", year: "numeric" })
    const time = d.toLocaleTimeString(intlLocale, { hour: "2-digit", minute: "2-digit" })
    return `${date} · ${time}`
  }

  function joinedAt(iso: string | Date | null | undefined): string {
    if (!iso) return ""
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return ""
    return t("format.joined", { date: d.toLocaleDateString(intlLocale, { month: "short", year: "numeric" }) })
  }

  return { fmt, exact, relTime, fullTime, joinedAt }
}
