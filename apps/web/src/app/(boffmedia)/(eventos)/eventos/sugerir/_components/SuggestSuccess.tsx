"use client"

import { useTranslations } from "next-intl"
import { Empty } from "@/components/boffmedia/primitives/empty"
import { Button } from "@/components/boffmedia/primitives/button"

export function SuggestSuccess({ onReset }: { onReset: () => void }) {
  const t = useTranslations("events.sugerir.success")
  return (
    <Empty icon="check" title={t("title")} lead={t("lead")}>
      <Button variant="pri" icon="plus" onClick={onReset}>
        {t("another")}
      </Button>
      <Button href="/eventos">{t("back")}</Button>
    </Empty>
  )
}
