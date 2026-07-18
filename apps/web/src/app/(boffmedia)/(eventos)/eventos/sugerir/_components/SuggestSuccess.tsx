"use client"

import { useTranslations } from "next-intl"
import { Empty, Button } from "@/components/boffmedia/primitives"

export function SuggestSuccess({ onReset }: { onReset: () => void }) {
  const t = useTranslations("sugerir.success")
  return (
    <Empty icon="check" title={t("title")} lead={t("lead")}>
      <Button variant="pri" icon="plus" onClick={onReset}>
        {t("another")}
      </Button>
      <Button href="/eventos">{t("back")}</Button>
    </Empty>
  )
}
