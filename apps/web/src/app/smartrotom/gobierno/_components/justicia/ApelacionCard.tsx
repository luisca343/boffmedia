"use client"

import { useTranslations } from "next-intl"
import { useFormat } from "@/lib/useFormat"
import { Avatar, Badge, Button, Card, Icon, Sunken } from "../ui"
import { APELACION_STATUS } from "../../_utils/tones"
import { money, fmtDateTime } from "../../_utils/format"
import { useGobiernoUi } from "../../_stores/useGobiernoUi"
import type { Apelacion } from "../../_types"

export function ApelacionCard({
  apelacion: a,
  onResolve,
}: {
  apelacion: Apelacion
  onResolve: (a: Apelacion, outcome: "upheld" | "overturned") => void
}) {
  const t = useTranslations("gobierno")
  const { intlLocale } = useFormat()
  const openDossier = useGobiernoUi((s) => s.openDossier)
  const st = APELACION_STATUS[a.status]
  const label = st ? t(st.labelKey) : a.status
  const tone = st?.tone ?? ("default" as const)
  const open = a.status === "pending" || a.status === "reviewing"

  return (
    <Card dep="justicia" className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <button
            type="button"
            onClick={() => openDossier(a.player.uuid)}
            aria-label={t("expedientes.verExpedienteCiudadano", { username: a.player.username })}
            className="flex-none"
          >
            <Avatar user={a.player.username} size={42} />
          </button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-gt-mono text-[11px] text-gt-ink-400">{a.code}</span>
              <span className="font-gt-display text-[15px] font-bold text-gt-ink-900">{a.player.username}</span>
              <Badge>{t("justicia.impugna", { code: a.multa?.code ?? `#${a.multaId}` })}</Badge>
            </div>
            <div className="mt-1.5 text-[13px] italic leading-relaxed text-gt-ink-700">«{a.grounds}»</div>
            {a.multa && (
              <Sunken className="mt-2.5 px-[11px] py-2 text-[12px] text-gt-ink-600">
                <Icon name="gavel" size={12} className="mb-px inline-block text-gt-ink-400" /> {t("justicia.multaOriginal")}{" "}
                {a.multa.reason} · <strong className="tabular-nums">{money(a.multa.amount, intlLocale)} ₽</strong>
              </Sunken>
            )}
            {a.decision && (
              <div
                className={`mt-2.5 text-[12.5px] font-semibold ${
                  a.status === "overturned" ? "text-gt-ok" : "text-gt-danger"
                }`}
              >
                <Icon name="scale" size={13} className="mb-px inline-block" /> {a.decision}
              </div>
            )}
            <div className="mt-2 font-gt-mono text-[10.5px] text-gt-ink-400">
              {t("justicia.presentada", { date: fmtDateTime(a.createdAt, intlLocale) })}
              {a.reviewer ? t("justicia.revisa", { username: a.reviewer.username }) : ""}
            </div>
          </div>
        </div>
        <Badge tone={tone}>{label}</Badge>
      </div>

      {open && (
        <div className="mt-3.5 flex justify-end gap-2 border-t border-gt-line-soft pt-3.5">
          <Button size="sm" tone="danger" onClick={() => onResolve(a, "upheld")}>
            {t("justicia.mantenerMulta")}
          </Button>
          <Button size="sm" icon="check" onClick={() => onResolve(a, "overturned")}>
            {t("justicia.anularMulta")}
          </Button>
        </div>
      )}
    </Card>
  )
}
