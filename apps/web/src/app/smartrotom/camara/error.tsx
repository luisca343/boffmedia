"use client"

import { useTranslations } from "next-intl"

import { AppErrorFallback } from "@/components/smartrotom/behavior/AppErrorFallback"

export default function CamaraError({ error, reset }: { error: Error; reset: () => void }) {
  const t = useTranslations("camara")
  return <AppErrorFallback appName={t("error.appName")} error={error} reset={reset} />
}
