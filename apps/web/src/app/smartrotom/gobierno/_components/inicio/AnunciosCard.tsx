"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import { Badge, Bar, Card, Empty, Skeleton, Sunken } from "../ui"
import { useAnuncios } from "../../_hooks/queries"
import { fmtDate } from "../../_utils/format"
import { hrefOf } from "../../_utils/nav"
import { useFormat } from "@boffmedia/ui/useFormat"
import type { Tone } from "../../_utils/tones"

const KIND_TONE: Record<string, Tone> = { evento: "gold", anuncio: "civic", alerta: "danger" }
const KIND_KEY: Record<string, string> = {
  evento: "anuncios.kindEvento",
  anuncio: "anuncios.kindAnuncio",
  alerta: "anuncios.kindAlerta",
}

export function AnunciosCard() {
  const t = useTranslations("gobierno")
  const { intlLocale } = useFormat()
  const { data, isLoading } = useAnuncios({ pinned: true, pageSize: 2 })
  const items = data?.items ?? []

  return (
    <Card>
      <Bar
        icon="megaphone"
        dep="gold"
        right={
          <Link href={hrefOf("anuncios")} className="text-xs font-bold text-gt-ink-600 hover:text-gt-ink-900">
            {t("common.more")}
          </Link>
        }
      >
        {t("anuncios.title")}
      </Bar>
      <div className="grid gap-2.5 p-3">
        {isLoading ? (
          Array.from({ length: 2 }, (_, i) => <Skeleton key={i} className="h-[5.75rem]" />)
        ) : items.length === 0 ? (
          <Empty icon="megaphone" title={t("anuncios.emptyTitle")} sub={t("anuncios.emptyBody")} />
        ) : (
          items.map((e) => (
            <Link key={e.id} href={hrefOf("anuncios")} className="block">
              <Sunken className="p-3 transition-colors hover:bg-gt-paper-1">
                <div className="mb-[0.3125rem] flex items-center gap-[0.4375rem]">
                  <Badge tone={KIND_TONE[e.kind] ?? "default"}>{KIND_KEY[e.kind] ? t(KIND_KEY[e.kind]) : e.kind}</Badge>
                  <span className="font-gt-mono text-[0.625rem] text-gt-ink-400">{fmtDate(e.publishedAt, intlLocale)}</span>
                </div>
                <div className="mb-[3px] font-gt-display text-[0.90625rem] text-gt-ink-900">{e.title}</div>
                <div className="line-clamp-2 text-[0.71875rem] leading-relaxed text-gt-ink-500">{e.body}</div>
              </Sunken>
            </Link>
          ))
        )}
      </div>
    </Card>
  )
}
