"use client"

import { Suspense, useEffect, useState, type ReactNode } from "react"
import { useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { ASSET, staticAsset } from '@/lib/assets'
import { Bar, Button, Card, Empty, PageHead, Select, Skeleton } from "../../_components/ui"
import { ConsolaHero } from "../../_components/admin/ConsolaHero"
import {
  useAdminAddApp,
  useAdminApps,
  useAdminPlayerApps,
  useAdminRemoveApp,
  useAdminUsers,
  type SmartRotomApp,
} from "../../_components/admin/adminApi"
import { useGobiernoUi } from "../../_stores/useGobiernoUi"
import { useOfficer } from "../../_hooks/useOfficer"

function AppTile({ app, action }: { app: SmartRotomApp; action: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-gt-sm border border-gt-line bg-gt-paper-0 p-3 text-center">
      <div className="h-[46px] w-[46px] overflow-hidden rounded-[11px] border border-gt-line-strong bg-gt-paper-2">
        { }
        <img src={staticAsset(ASSET.smartrotom.img, 'apps', `${app.url}.webp`)} alt={app.name} className="h-full w-full object-cover" />
      </div>
      <div className="text-[12px] font-bold text-gt-ink-900">{app.name}</div>
      {action}
    </div>
  )
}

// `useSearchParams` opts its subtree into Suspense at build time — without this boundary
// `next build` fails even though the route is fully client-rendered.
export default function AppsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-14 w-2/3" />}>
      <AppsScreen />
    </Suspense>
  )
}

function AppsScreen() {
  const t = useTranslations("gobierno")
  const searchParams = useSearchParams()
  const presetUuid = searchParams.get("uuid")
  const openDossier = useGobiernoUi((s) => s.openDossier)
  const { uuid: ownUuid } = useOfficer()

  const { data: users, isLoading: usersLoading } = useAdminUsers()
  const { data: allApps, isLoading: appsLoading } = useAdminApps()
  const [uuid, setUuid] = useState("")

  useEffect(() => {
    if (uuid || !users?.length) return
    if (presetUuid && users.some((u) => u.uuid === presetUuid)) setUuid(presetUuid)
    else if (ownUuid && users.some((u) => u.uuid === ownUuid)) setUuid(ownUuid)
    else setUuid(users[0].uuid)
  }, [uuid, users, presetUuid, ownUuid])

  const { data: playerApps, isLoading: playerAppsLoading } = useAdminPlayerApps(uuid || null)
  const addApp = useAdminAddApp()
  const removeApp = useAdminRemoveApp()

  const activeApps = (allApps ?? []).filter((a) => Boolean(a.active))
  const assignedIds = new Set((playerApps ?? []).map((a) => a.id))
  const assigned = activeApps.filter((a) => assignedIds.has(a.id))
  const available = activeApps.filter((a) => !assignedIds.has(a.id))
  const selectedUser = users?.find((u) => u.uuid === uuid)

  return (
    <>
      <PageHead
        kicker={t("apps.kicker")}
        dep="poblacion"
        title={t("apps.title")}
        sub={t("apps.sub")}
      />
      <ConsolaHero title={t("apps.heroTitle")} code="apps" icon="smartphone" dep="poblacion" />

      <Card className="mb-4">
        <div className="flex flex-wrap items-center gap-3 p-3.5">
          <span className="font-gt-mono text-[9.5px] font-bold uppercase tracking-[.12em] text-gt-ink-400">
            {t("apps.jugador")}
          </span>
          <div className="w-[260px]">
            {usersLoading ? (
              <Skeleton className="h-9" />
            ) : (
              <Select value={uuid} onChange={setUuid} options={(users ?? []).map((u) => ({ value: u.uuid, label: u.username }))} />
            )}
          </div>
          {selectedUser && (
            <Button tone="ghost" size="sm" icon="fileText" className="ml-auto" onClick={() => openDossier(selectedUser.uuid)}>
              {t("apps.verExpediente")}
            </Button>
          )}
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="overflow-hidden">
          <Bar icon="star" dep="gold">
            {t("apps.appsAsignadas")} {assigned.length > 0 && <span className="font-gt-mono text-[11px] text-gt-ink-400"> · {assigned.length}</span>}
          </Bar>
          {appsLoading || playerAppsLoading ? (
            <div className="grid grid-cols-4 gap-2.5 p-3.5">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="h-[92px]" />
              ))}
            </div>
          ) : assigned.length ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-2.5 p-3.5">
              {assigned.map((a) => (
                <AppTile
                  key={a.id}
                  app={a}
                  action={
                    <Button size="sm" tone="ghost" icon="minus" disabled={removeApp.isPending} onClick={() => removeApp.mutate({ uuid, id: a.id })}>
                      {t("apps.quitar")}
                    </Button>
                  }
                />
              ))}
            </div>
          ) : (
            <Empty icon="badge" title={t("apps.emptyAsignadas")} sub={t("apps.emptyAsignadasSub")} />
          )}
        </Card>

        <Card className="overflow-hidden">
          <Bar icon="plus" dep="poblacion">
            {t("apps.disponibles")}
          </Bar>
          {appsLoading || playerAppsLoading ? (
            <div className="grid grid-cols-4 gap-2.5 p-3.5">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="h-[92px]" />
              ))}
            </div>
          ) : available.length ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-2.5 p-3.5">
              {available.map((a) => (
                <AppTile
                  key={a.id}
                  app={a}
                  action={
                    <Button size="sm" tone="soft" icon="plus" disabled={addApp.isPending} onClick={() => addApp.mutate({ uuid, id: a.id })}>
                      {t("apps.anadir")}
                    </Button>
                  }
                />
              ))}
            </div>
          ) : (
            <Empty icon="checkCircle" title={t("apps.emptyDisponibles")} sub={t("apps.emptyDisponiblesSub")} />
          )}
        </Card>
      </div>
    </>
  )
}
