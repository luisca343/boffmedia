"use client"

import Link from "next/link"
import { Badge, Bar, Card, Empty, Skeleton, Sunken } from "../ui"
import { useAnuncios } from "../../_hooks/queries"
import { fmtDate } from "../../_utils/format"
import { hrefOf } from "../../_utils/nav"
import type { Tone } from "../../_utils/tones"

const KIND_TONE: Record<string, Tone> = { evento: "gold", anuncio: "civic", alerta: "danger" }

export function AnunciosCard() {
  const { data, isLoading } = useAnuncios({ pinned: true, pageSize: 2 })
  const items = data?.items ?? []

  return (
    <Card>
      <Bar
        icon="megaphone"
        dep="gold"
        right={
          <Link href={hrefOf("anuncios")} className="text-xs font-bold text-gt-ink-600 hover:text-gt-ink-900">
            Más
          </Link>
        }
      >
        Anuncios
      </Bar>
      <div className="grid gap-2.5 p-3">
        {isLoading ? (
          Array.from({ length: 2 }, (_, i) => <Skeleton key={i} className="h-[92px]" />)
        ) : items.length === 0 ? (
          <Empty icon="megaphone" title="Sin anuncios fijados" sub="El gobierno no ha publicado avisos destacados." />
        ) : (
          items.map((e) => (
            <Link key={e.id} href={hrefOf("anuncios")} className="block">
              <Sunken className="p-3 transition-colors hover:bg-gt-paper-1">
                <div className="mb-[5px] flex items-center gap-[7px]">
                  <Badge tone={KIND_TONE[e.kind] ?? "default"}>{e.kind}</Badge>
                  <span className="font-gt-mono text-[10px] text-gt-ink-400">{fmtDate(e.publishedAt)}</span>
                </div>
                <div className="mb-[3px] font-gt-display text-[14.5px] text-gt-ink-900">{e.title}</div>
                <div className="line-clamp-2 text-[11.5px] leading-relaxed text-gt-ink-500">{e.body}</div>
              </Sunken>
            </Link>
          ))
        )}
      </div>
    </Card>
  )
}
