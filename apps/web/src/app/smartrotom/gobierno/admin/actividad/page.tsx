"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { useFormat } from "@boffmedia/ui/useFormat"
import {
  Avatar,
  Badge,
  Button,
  Card,
  Empty,
  Field,
  PageHead,
  Select,
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
  TableSkeleton,
} from "../../_components/ui"
import { ConsolaHero } from "../../_components/admin/ConsolaHero"
import { useAuditoria } from "../../_hooks/queries"
import { DEPARTMENTS, type Department } from "../../_utils/tones"
import { fmtDateTime } from "../../_utils/format"

const POLL_MS = 5000

export default function ActividadPage() {
  const t = useTranslations("gobierno")
  const { intlLocale } = useFormat()
  const { data, isLoading, refetch } = useAuditoria({ pageSize: 200 })
  const entries = data?.items ?? []

  const [source, setSource] = useState("all")
  const [query, setQuery] = useState("")
  const [live, setLive] = useState(false)

  useEffect(() => {
    if (!live) return
    const iv = setInterval(() => refetch(), POLL_MS)
    return () => clearInterval(iv)
  }, [live, refetch])

  const sources = Array.from(new Set(entries.map((e) => e.source))).sort()
  const filtered = entries.filter((e) => {
    if (source !== "all" && e.source !== source) return false
    if (query) {
      const q = query.toLowerCase()
      return (
        e.action.toLowerCase().includes(q) ||
        e.target.toLowerCase().includes(q) ||
        (e.actor?.username ?? "").toLowerCase().includes(q)
      )
    }
    return true
  })

  const exportTxt = () => {
    const text = filtered
      .map((e) => `${fmtDateTime(e.createdAt, intlLocale)} [${e.source}] [${e.dep}] ${e.actor?.username ?? t("actividad.sistema")} · ${e.action} · ${e.target}`)
      .join("\n")
    const blob = new Blob([text], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "teras-actividad.txt"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <PageHead
        kicker={t("actividad.kicker")}
        dep="hacienda"
        title={t("actividad.title")}
        sub={t("actividad.sub")}
      />
      <ConsolaHero
        title={t("actividad.heroTitle")}
        code="actividad"
        icon="list"
        dep="hacienda"
        status={live ? t("actividad.enVivo") : t("actividad.enPausa")}
        statusTone={live ? "ok" : "default"}
      />

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-2.5 border-b border-gt-line p-3">
          <div className="w-[10.625rem]">
            <Select
              value={source}
              onChange={setSource}
              options={[{ value: "all", label: t("actividad.todasFuentes") }, ...sources.map((s) => ({ value: s, label: s }))]}
            />
          </div>
          <div className="min-w-[10rem] flex-1">
            <Field icon="search" value={query} onChange={setQuery} placeholder={t("actividad.buscarPlaceholder")} />
          </div>
          <Button size="sm" tone={live ? "danger" : "ghost"} icon={live ? "minus" : "chevronRight"} onClick={() => setLive((v) => !v)}>
            {live ? t("actividad.detener") : t("actividad.enVivoBtn")}
          </Button>
          <Button size="sm" tone="ghost" icon="download" onClick={exportTxt} aria-label={t("actividad.exportar")} />
        </div>

        {isLoading ? (
          <TableSkeleton cols={6} />
        ) : filtered.length ? (
          <Table>
            <THead>
              <TR>
                <TH>{t("actividad.hora")}</TH>
                <TH>{t("actividad.actor")}</TH>
                <TH>{t("actividad.accion")}</TH>
                <TH>{t("actividad.objetivo")}</TH>
                <TH>{t("actividad.departamento")}</TH>
                <TH>{t("actividad.fuente")}</TH>
              </TR>
            </THead>
            <TBody>
              {filtered.map((e) => {
                const depInfo = DEPARTMENTS[e.dep as Department]
                return (
                  <TR key={e.id}>
                    <TD className="whitespace-nowrap font-gt-mono text-[0.6875rem] tabular-nums text-gt-ink-500">
                      {fmtDateTime(e.createdAt, intlLocale)}
                    </TD>
                    <TD>
                      <div className="flex items-center gap-2">
                        <Avatar user={e.actor?.username} size={22} />
                        <span className="text-[0.78125rem] font-bold text-gt-ink-900">{e.actor?.username ?? t("actividad.sistema")}</span>
                      </div>
                    </TD>
                    <TD className="text-[0.78125rem]">{e.action}</TD>
                    <TD className="max-w-[13.75rem] truncate text-[0.78125rem] text-gt-ink-500">{e.target}</TD>
                    <TD>
                      <Badge tone={depInfo?.tone ?? "default"}>{depInfo ? t(depInfo.labelKey) : e.dep}</Badge>
                    </TD>
                    <TD className="font-gt-mono text-[0.6875rem] text-gt-ink-500">{e.source}</TD>
                  </TR>
                )
              })}
            </TBody>
          </Table>
        ) : (
          <Empty icon="list" title={t("actividad.emptyTitle")} sub={t("actividad.emptySub")} />
        )}
      </Card>
    </>
  )
}
