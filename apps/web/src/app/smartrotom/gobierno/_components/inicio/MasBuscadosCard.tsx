"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import { Bar, Card, Empty, Skeleton } from "../ui"
import { useBuscados } from "../../_hooks/queries"
import { money } from "../../_utils/format"
import { hrefOf } from "../../_utils/nav"
import { useGobiernoUi } from "../../_stores/useGobiernoUi"
import { useFormat } from "@boffmedia/ui/useFormat"
import { CitizenRow } from "./CitizenRow"

export function MasBuscadosCard() {
  const t = useTranslations("gobierno")
  const { intlLocale } = useFormat()
  const { data, isLoading } = useBuscados({ status: "active", pageSize: 3 })
  const openDossier = useGobiernoUi((s) => s.openDossier)

  const top = [...(data?.items ?? [])].sort((a, b) => b.bounty - a.bounty).slice(0, 3)

  return (
    <Card edgeGold>
      <Bar
        icon="alert"
        dep="danger"
        right={
          <Link href={hrefOf("buscados")} className="text-xs font-bold text-gt-ink-600 hover:text-gt-ink-900">
            {t("buscados.tablon")}
          </Link>
        }
      >
        {t("buscados.title")}
      </Bar>
      <div className="p-1.5">
        {isLoading ? (
          <div className="space-y-2 p-2">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-[2.625rem]" />
            ))}
          </div>
        ) : top.length === 0 ? (
          <Empty icon="alert" title={t("buscados.emptyTitle")} sub={t("buscados.emptyBody")} />
        ) : (
          top.map((b) => (
            <CitizenRow
              key={b.id}
              username={b.player.username}
              sub={`${b.code}${b.lastSeen ? ` · ${b.lastSeen}` : ""}`}
              onClick={() => openDossier(b.player.uuid)}
              right={
                <span className="font-gt-display text-sm font-bold tabular-nums text-gt-danger">
                  {money(b.bounty, intlLocale)} ₽
                </span>
              }
            />
          ))
        )}
      </div>
    </Card>
  )
}
