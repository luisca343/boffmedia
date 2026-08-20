"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import { Avatar, Badge, Bar, Card, Empty, Skeleton } from "../ui"
import { useDenuncias } from "../../_hooks/queries"
import { DENUNCIA_STATUS } from "../../_utils/tones"
import { hrefOf } from "../../_utils/nav"
import { useGobiernoUi } from "../../_stores/useGobiernoUi"

export function DenunciasCard() {
  const t = useTranslations("gobierno")
  const { data, isLoading } = useDenuncias({ pageSize: 5 })
  const openDossier = useGobiernoUi((s) => s.openDossier)

  // The API's own ordering is undocumented, so most-recent-first is enforced
  // client-side rather than assumed.
  const recientes = [...(data?.items ?? [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )

  return (
    <Card>
      <Bar
        icon="fileText"
        dep="seguridad"
        right={
          <Link
            href={hrefOf("denuncias")}
            className="inline-flex items-center gap-1.5 rounded-gt-sm px-2 py-1 text-xs font-bold text-gt-ink-600 transition-colors hover:bg-gt-paper-1 hover:text-gt-ink-900"
          >
            {t("denuncias.verTodas")}
          </Link>
        }
      >
        {t("denuncias.recentTitle")}
      </Bar>

      {isLoading ? (
        <div className="space-y-2 p-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-[52px]" />
          ))}
        </div>
      ) : recientes.length === 0 ? (
        <Empty
          icon="fileText"
          title={t("denuncias.emptyTitle")}
          sub={t("denuncias.emptyBody")}
        />
      ) : (
        <div>
          {recientes.map((d) => {
            const status = DENUNCIA_STATUS[d.status]
            return (
              <div
                key={d.id}
                className="flex items-center gap-3 border-b border-gt-line-soft px-4 py-[11px] last:border-b-0"
              >
                <button
                  type="button"
                  onClick={() => d.accused && openDossier(d.accused.uuid)}
                  disabled={!d.accused}
                  className="flex min-w-0 flex-1 items-center gap-3 rounded-gt-sm text-left transition-colors hover:bg-gt-paper-1 disabled:cursor-default disabled:hover:bg-transparent"
                >
                  <Avatar user={d.accused?.username} size={34} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-gt-mono text-[11px] text-gt-ink-400">{d.code}</span>
                      <span className="truncate text-[13px] font-bold text-gt-ink-900">
                        {d.accused?.username ?? t("denuncias.sinIdentificar")}
                      </span>
                    </div>
                    <div className="mt-0.5 truncate text-[12px] text-gt-ink-500">{d.description}</div>
                  </div>
                </button>
                {status && <Badge tone={status.tone}>{t(status.labelKey)}</Badge>}
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}
