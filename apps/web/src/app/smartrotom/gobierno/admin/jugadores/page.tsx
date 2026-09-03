"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { GOBIERNO_RANKS } from "@boffmedia/shared/roles"
import { useFormat } from "@boffmedia/ui/useFormat"
import {
  Avatar,
  Badge,
  Button,
  Card,
  Empty,
  Field,
  Icon,
  PageHead,
  Select,
  Sunken,
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
  TableSkeleton,
} from "../../_components/ui"
import { ConsolaHero } from "../../_components/admin/ConsolaHero"
import { useAdminUsers } from "../../_components/admin/adminApi"
import { rankMeta } from "../../_components/poblacion/officerRoles"
import { useGrantRole, useOficiales, useRevokeRole } from "../../_hooks/queries"
import { useGobiernoUi } from "../../_stores/useGobiernoUi"
import { fmtDateTime } from "../../_utils/format"

export default function JugadoresPage() {
  const t = useTranslations("gobierno")
  const { intlLocale } = useFormat()
  const router = useRouter()
  const openDossier = useGobiernoUi((s) => s.openDossier)
  const { data: users, isLoading } = useAdminUsers()
  const { data: oficiales } = useOficiales()
  const grantRole = useGrantRole()
  const revokeRole = useRevokeRole()

  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<"all" | "online" | "offline">("all")
  const [selUuid, setSelUuid] = useState<string | null>(null)
  const [roleToGrant, setRoleToGrant] = useState("")

  const selUser = users?.find((u) => u.uuid === selUuid) ?? null
  const selOficial = oficiales?.find((o) => o.uuid === selUuid) ?? null
  const availableRanks = GOBIERNO_RANKS.filter((r) => !(selOficial?.roles ?? []).includes(r.role))

  useEffect(() => {
    setRoleToGrant(availableRanks[0]?.role ?? "")
     
  }, [selUuid])

  const onlineCount = users?.filter((u) => !!u.world).length ?? 0
  const rows = (users ?? []).filter((u) => {
    if (filter === "online" && !u.world) return false
    if (filter === "offline" && !!u.world) return false
    if (query) {
      const q = query.toLowerCase()
      return u.username.toLowerCase().includes(q) || u.uuid.toLowerCase().includes(q)
    }
    return true
  })

  return (
    <>
      <PageHead
        kicker={t("jugadores.kicker")}
        dep="poblacion"
        title={t("jugadores.title")}
        sub={t("jugadores.sub")}
      />
      <ConsolaHero
        title={t("jugadores.heroTitle")}
        code="jugadores"
        icon="users"
        dep="poblacion"
        status={t("jugadores.enLinea", { count: onlineCount })}
        statusTone="ok"
      />

      <div className={`grid gap-4 ${selUser ? "md:grid-cols-[1fr_20.625rem]" : ""}`}>
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center gap-3 border-b border-gt-line p-3.5">
            <div className="flex gap-1">
              {(
                [
                  ["all", t("jugadores.todos")],
                  ["online", t("jugadores.enLineaFilter")],
                  ["offline", t("jugadores.desconectados")],
                ] as const
              ).map(([v, label]) => (
                <Button key={v} size="sm" tone={filter === v ? "soft" : "plain"} onClick={() => setFilter(v)}>
                  {label}
                </Button>
              ))}
            </div>
            <div className="min-w-[11.25rem] flex-1">
              <Field icon="search" value={query} onChange={setQuery} placeholder={t("jugadores.buscarPlaceholder")} />
            </div>
          </div>

          {isLoading ? (
            <TableSkeleton cols={6} />
          ) : rows.length ? (
            <Table>
              <THead>
                <TR>
                  <TH></TH>
                  <TH>{t("jugadores.jugadorCol")}</TH>
                  <TH>{t("jugadores.mundo")}</TH>
                  <TH>{t("jugadores.energiaCol")}</TH>
                  <TH>{t("jugadores.ultActividadCol")}</TH>
                  <TH>{t("jugadores.rol")}</TH>
                  <TH></TH>
                </TR>
              </THead>
              <TBody>
                {rows.map((u) => (
                  <TR key={u.uuid} onClick={() => setSelUuid(u.uuid)} className={selUuid === u.uuid ? "bg-gt-accent-tint" : ""}>
                    <TD className="w-px">
                      <span className={`block h-2 w-2 rounded-full ${u.world ? "bg-gt-ok" : "bg-gt-ink-300"}`} />
                    </TD>
                    <TD>
                      <div className="flex items-center gap-2.5">
                        <Avatar user={u.username} size={26} />
                        <span className="font-gt-display text-[0.84375rem] font-bold text-gt-ink-900">{u.username}</span>
                      </div>
                    </TD>
                    <TD className="text-[0.75rem]">{u.world ?? "—"}</TD>
                    <TD className="font-gt-mono text-xs tabular-nums">{u.energy ?? "—"}</TD>
                    <TD className="font-gt-mono text-xs tabular-nums text-gt-ink-500">{fmtDateTime(u.lastCharge, intlLocale)}</TD>
                    <TD>
                      {(() => {
                        const o = oficiales?.find((x) => x.uuid === u.uuid)
                        if (!o) return <span className="text-gt-ink-300">—</span>
                        const meta = rankMeta(o.rank?.role)
                        return <Badge tone="gold">{meta.labelKey ? t(meta.labelKey) : meta.label}</Badge>
                      })()}
                    </TD>
                    <TD className="w-px">
                      <Icon name="chevronRight" size={15} className="text-gt-ink-300" />
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          ) : (
            <Empty icon="users" title={t("jugadores.emptyTitle")} sub={t("jugadores.emptySub")} />
          )}
        </Card>

        {selUser && (
          <Card edgeGold className="h-fit overflow-hidden">
            <div className="flex items-center justify-between gap-2.5 border-b border-gt-line px-4 py-[0.6875rem]">
              <span className="font-gt-display text-base font-bold text-gt-ink-900">{t("jugadores.ficha")}</span>
              <button
                type="button"
                onClick={() => setSelUuid(null)}
                aria-label={t("jugadores.cerrarFicha")}
                className="text-gt-ink-400 transition-colors hover:text-gt-ink-900"
              >
                <Icon name="x" size={16} />
              </button>
            </div>

            <div className="p-4">
              <div className="mb-3.5 flex items-center gap-3">
                <Avatar user={selUser.username} size={52} />
                <div>
                  <div className="font-gt-display text-lg font-bold text-gt-ink-900">{selUser.username}</div>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className={`h-2 w-2 rounded-full ${selUser.world ? "bg-gt-ok" : "bg-gt-ink-300"}`} />
                    <span className="font-gt-mono text-[0.6875rem] text-gt-ink-500">
                      {selUser.world ?? t("jugadores.desconectado")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mb-3 grid grid-cols-2 gap-2">
                {[
                  [t("jugadores.energia"), String(selUser.energy ?? "—")],
                  [t("jugadores.ultActividad"), fmtDateTime(selUser.lastCharge, intlLocale)],
                ].map(([k, v]) => (
                  <Sunken key={k} className="px-[0.6875rem] py-2">
                    <div className="font-gt-mono text-[0.53125rem] uppercase tracking-[.12em] text-gt-ink-400">{k}</div>
                    <div className="mt-[3px] font-gt-display text-[0.9375rem] font-bold tabular-nums text-gt-ink-900">{v}</div>
                  </Sunken>
                ))}
              </div>

              <Sunken className="mb-3.5 px-[0.6875rem] py-2">
                <div className="font-gt-mono text-[0.53125rem] uppercase tracking-[.12em] text-gt-ink-400">{t("jugadores.uuid")}</div>
                <div className="mt-[3px] break-all font-gt-mono text-[0.71875rem] text-gt-ink-700">{selUser.uuid}</div>
              </Sunken>

              <div className="mb-3.5">
                <div className="mb-1.5 font-gt-mono text-[0.5625rem] font-bold uppercase tracking-[.14em] text-gt-ink-400">
                  {t("jugadores.nombramientos")}
                </div>
                {selOficial && selOficial.roles.length ? (
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    {selOficial.roles.map((role) => {
                      const meta = rankMeta(role)
                      return (
                        <button
                          key={role}
                          type="button"
                          onClick={() => revokeRole.mutate({ uuid: selUser.uuid, role })}
                          disabled={revokeRole.isPending}
                          title={t("jugadores.cesarNombramiento")}
                          className="rounded-[4px] disabled:opacity-50"
                        >
                          <Badge tone="gold" icon="x">
                            {meta.labelKey ? t(meta.labelKey) : meta.label}
                          </Badge>
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <div className="mb-2 text-[0.75rem] italic text-gt-ink-400">{t("jugadores.sinNombramientos")}</div>
                )}

                {availableRanks.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <div className="flex-1">
                      <Select
                        value={roleToGrant}
                        onChange={setRoleToGrant}
                        options={availableRanks.map((r) => ({ value: r.role, label: r.label }))}
                      />
                    </div>
                    <Button
                      size="sm"
                      tone="gold"
                      icon="badge"
                      disabled={!roleToGrant || grantRole.isPending}
                      onClick={() => grantRole.mutate({ uuid: selUser.uuid, role: roleToGrant })}
                    >
                      {t("jugadores.nombrar")}
                    </Button>
                  </div>
                )}
              </div>

              <div className="grid gap-1.5">
                <Button tone="ghost" icon="fileText" className="w-full justify-start" onClick={() => openDossier(selUser.uuid)}>
                  {t("jugadores.verExpediente")}
                </Button>
                <Button
                  tone="ghost"
                  icon="command"
                  className="w-full justify-start"
                  onClick={() => router.push(`/smartrotom/gobierno/admin/apps?uuid=${selUser.uuid}`)}
                >
                  {t("jugadores.gestionarApps")}
                </Button>
                <Button
                  tone="soft"
                  icon="bell"
                  className="w-full justify-start"
                  onClick={() => router.push(`/smartrotom/gobierno/admin/notificaciones?uuid=${selUser.uuid}`)}
                >
                  {t("jugadores.enviarNotificacion")}
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </>
  )
}
