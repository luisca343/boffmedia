"use client"

import { useTranslations } from "next-intl"
import { Stat } from "../ui"
import type { Apelacion } from "../../_types"

export function ApelacionesStats({ apelaciones }: { apelaciones: Apelacion[] }) {
  const t = useTranslations("gobierno")
  const open = apelaciones.filter((a) => a.status === "pending" || a.status === "reviewing")
  const upheld = apelaciones.filter((a) => a.status === "upheld")
  const overturned = apelaciones.filter((a) => a.status === "overturned")

  return (
    <div className="mb-4 grid grid-cols-3 gap-3">
      <Stat label={t("justicia.enTramite")} value={open.length} tone="warn" icon="clock" />
      <Stat label={t("justicia.desestimadas")} value={upheld.length} tone="default" icon="scale" />
      <Stat label={t("justicia.estimadas")} value={overturned.length} tone="ok" icon="checkCircle" />
    </div>
  )
}
