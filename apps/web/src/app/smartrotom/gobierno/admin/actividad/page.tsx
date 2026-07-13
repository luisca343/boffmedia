"use client"

import { useEffect, useState } from "react"
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
        e.actor.username.toLowerCase().includes(q)
      )
    }
    return true
  })

  const exportTxt = () => {
    const text = filtered
      .map((e) => `${fmtDateTime(e.createdAt)} [${e.source}] [${e.dep}] ${e.actor.username} · ${e.action} · ${e.target}`)
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
        kicker="Administración · Auditoría técnica"
        dep="hacienda"
        title="Actividad del sistema"
        sub="El mismo registro de auditoría de la Auditoría cívica, en vista operativa: filtrable por fuente, con todos los departamentos a la vez."
      />
      <ConsolaHero
        title="Registro de actividad"
        code="actividad"
        icon="list"
        dep="hacienda"
        status={live ? "en vivo" : "en pausa"}
        statusTone={live ? "ok" : "default"}
      />

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-2.5 border-b border-gt-line p-3">
          <div className="w-[170px]">
            <Select
              value={source}
              onChange={setSource}
              options={[{ value: "all", label: "Todas las fuentes" }, ...sources.map((s) => ({ value: s, label: s }))]}
            />
          </div>
          <div className="min-w-[160px] flex-1">
            <Field icon="search" value={query} onChange={setQuery} placeholder="Buscar en la actividad…" />
          </div>
          <Button size="sm" tone={live ? "danger" : "ghost"} icon={live ? "minus" : "chevronRight"} onClick={() => setLive((v) => !v)}>
            {live ? "Detener" : "En vivo"}
          </Button>
          <Button size="sm" tone="ghost" icon="download" onClick={exportTxt} aria-label="Exportar actividad" />
        </div>

        {isLoading ? (
          <TableSkeleton cols={6} />
        ) : filtered.length ? (
          <Table>
            <THead>
              <TR>
                <TH>Hora</TH>
                <TH>Actor</TH>
                <TH>Acción</TH>
                <TH>Objetivo</TH>
                <TH>Departamento</TH>
                <TH>Fuente</TH>
              </TR>
            </THead>
            <TBody>
              {filtered.map((e) => {
                const depInfo = DEPARTMENTS[e.dep as Department]
                return (
                  <TR key={e.id}>
                    <TD className="whitespace-nowrap font-gt-mono text-[11px] tabular-nums text-gt-ink-500">
                      {fmtDateTime(e.createdAt)}
                    </TD>
                    <TD>
                      <div className="flex items-center gap-2">
                        <Avatar user={e.actor.username} size={22} />
                        <span className="text-[12.5px] font-bold text-gt-ink-900">{e.actor.username}</span>
                      </div>
                    </TD>
                    <TD className="text-[12.5px]">{e.action}</TD>
                    <TD className="max-w-[220px] truncate text-[12.5px] text-gt-ink-500">{e.target}</TD>
                    <TD>
                      <Badge tone={depInfo?.tone ?? "default"}>{depInfo?.label ?? e.dep}</Badge>
                    </TD>
                    <TD className="font-gt-mono text-[11px] text-gt-ink-500">{e.source}</TD>
                  </TR>
                )
              })}
            </TBody>
          </Table>
        ) : (
          <Empty icon="list" title="Sin entradas" sub="Ningún evento coincide con estos filtros." />
        )}
      </Card>
    </>
  )
}
