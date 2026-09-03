"use client"

// The public bounty wall: a view over active Buscados, not its own register. Same query
// params as BuscadosSection so TanStack Query serves both pages from one cached fetch.
import { useMemo } from "react"
import { useTranslations } from "next-intl"
import { userMessageFrom } from "@/services/boffAPI"
import { useFormat } from "@boffmedia/ui/useFormat"
import { Avatar, Badge, Empty, Icon, Seal, Skeleton } from "../ui"
import { useBuscados } from "../../_hooks/queries"
import { useGobiernoUi } from "../../_stores/useGobiernoUi"
import { money } from "../../_utils/format"
import { severityTone } from "./severity"

export function RecompensasSection() {
  const t = useTranslations("gobierno")
  const { intlLocale } = useFormat()
  // Same query params as BuscadosSection (`limit`/`page`, per ListBuscadosQueryDto) so the
  // two pages share one cached fetch instead of issuing two different requests.
  const { data, isLoading, isError, error } = useBuscados({ limit: 100 })
  const openDossier = useGobiernoUi((s) => s.openDossier)

  const active = useMemo(
    () => (data?.items ?? []).filter((b) => b.status === "active").sort((a, b) => b.bounty - a.bounty),
    [data],
  )
  const total = active.reduce((sum, b) => sum + b.bounty, 0)

  return (
    <div className="mx-auto max-w-[62.5rem]">
      <div className="mb-2 text-center">
        <Badge tone="seguridad" className="mb-3.5">
          {t("recompensas.publicBadge")}
        </Badge>
        <div className="mb-2.5 flex justify-center">
          <Seal size={66} />
        </div>
        <h1 className="font-gt-display text-[2.75rem] leading-[0.95] text-gt-ink-900">{t("recompensas.title")}</h1>
        <p className="mx-auto mt-2.5 max-w-[35rem] text-[0.875rem] leading-relaxed text-gt-ink-500">
          {t("recompensas.description")}
        </p>
        {active.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
            <Badge tone="danger" icon="coins" className="px-3.5 py-[0.4375rem] text-[0.8125rem]">
              {t("recompensas.bolsaTotal", { amount: money(total, intlLocale) })}
            </Badge>
            <Badge tone="default" icon="users" className="px-3.5 py-[0.4375rem] text-[0.8125rem]">
              {t("recompensas.reclamados", { count: active.length })}
            </Badge>
          </div>
        )}
      </div>

      <div className="my-6 h-px bg-gt-line-strong" />

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[13.125rem] w-full" />
          ))}
        </div>
      ) : isError ? (
        <Empty
          icon="alert"
          title={t("recompensas.errorTitle")}
          sub={error ? userMessageFrom(error, t("common.retry")) : undefined}
        />
      ) : active.length === 0 ? (
        <Empty
          icon="scroll"
          title={t("recompensas.emptyTitle")}
          sub={t("recompensas.emptySub")}
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {active.map((b, i) => {
            const sev = severityTone(b.severity)
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => openDossier(b.player.uuid)}
                className={`overflow-hidden rounded-gt border bg-gt-paper-0 text-center shadow-gt transition-transform hover:-translate-y-0.5 motion-reduce:hover:translate-y-0 ${
                  i === 0 ? "border-gt-gold" : "border-gt-line-strong"
                }`}
              >
                {i === 0 && (
                  <div className="flex items-center justify-center gap-1.5 bg-gt-gold py-1 font-gt-mono text-[0.59375rem] font-bold uppercase tracking-[.14em] text-white">
                    <Icon name="star" size={11} fill="#fff" />
                    {t("recompensas.masBuscado")}
                  </div>
                )}
                <div className="p-4">
                  <Avatar user={b.player.username} size={80} />
                  <div className="mt-2.5 font-gt-display text-[1.0625rem] font-bold text-gt-ink-900">{b.player.username}</div>
                  <div className="mt-1">
                    <Badge tone={sev.tone}>{t(sev.labelKey)}</Badge>
                  </div>
                  <div className="mt-2.5 font-gt-display text-[1.5625rem] font-bold tabular-nums text-gt-danger">
                    {money(b.bounty, intlLocale)} ₽
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
