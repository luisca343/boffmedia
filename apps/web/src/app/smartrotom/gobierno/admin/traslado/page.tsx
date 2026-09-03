"use client"

import { useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import { useStops } from "@/app/smartrotom/taxi/_hooks/queries"
import { Bar, Button, Card, Field, PageHead, Select, Skeleton, Sunken } from "../../_components/ui"
import { ConsolaHero } from "../../_components/admin/ConsolaHero"
import { useAdminTeleport, useAdminUsers } from "../../_components/admin/adminApi"

/**
 * «Traslado» — move a player to a taxi stop.
 *
 * Destinations are the taxi's own stops rather than free coordinates: they are already an
 * admin-curated list the mod safety-checks at arrival, so there is no way to drop somebody into
 * bedrock. This is deliberately not the taxi flow — no fare, nothing in the ledger, nothing in
 * the player's passport.
 */
export default function TrasladoPage() {
  const t = useTranslations("gobierno")
  const { data: users, isLoading: usersLoading } = useAdminUsers()
  const { data: stops, isLoading: stopsLoading } = useStops()
  const teleport = useAdminTeleport()

  const [uuid, setUuid] = useState("")
  const [stopId, setStopId] = useState("")
  const [reason, setReason] = useState("")

  const userOptions = useMemo(
    () =>
      (users ?? [])
        .filter((u) => u.uuid)
        .map((u) => ({ value: u.uuid, label: u.username ?? u.uuid }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [users],
  )

  const stopOptions = useMemo(
    () => (stops ?? []).map((s) => ({ value: s.id, label: s.id })).sort((a, b) => a.label.localeCompare(b.label)),
    [stops],
  )

  const submit = () => {
    if (!uuid || !stopId || teleport.isPending) return
    teleport.mutate(
      { uuid, stopId, reason: reason.trim() || undefined },
      { onSuccess: () => setReason("") },
    )
  }

  return (
    <>
      <PageHead
        kicker={t("traslado.kicker")}
        dep="seguridad"
        title={t("traslado.title")}
        sub={t("traslado.sub")}
      />
      <ConsolaHero title={t("traslado.heroTitle")} code="traslado" icon="mapPin" dep="seguridad" />

      <Card className="h-fit max-w-2xl overflow-hidden">
        <Bar icon="mapPin" dep="seguridad">
          {t("traslado.orden")}
        </Bar>
        <div className="p-4">
          <div className="mb-1.5 font-gt-mono text-[0.5625rem] font-bold uppercase tracking-[.12em] text-gt-ink-400">
            {t("traslado.jugador")}
          </div>
          <div className="mb-3.5">
            {usersLoading ? (
              <Skeleton className="h-9" />
            ) : (
              <Select value={uuid} onChange={setUuid} options={userOptions} />
            )}
          </div>

          <div className="mb-1.5 font-gt-mono text-[0.5625rem] font-bold uppercase tracking-[.12em] text-gt-ink-400">
            {t("traslado.destino")}
          </div>
          <div className="mb-3.5">
            {stopsLoading ? (
              <Skeleton className="h-9" />
            ) : (
              <Select value={stopId} onChange={setStopId} options={stopOptions} />
            )}
          </div>

          <div className="mb-1.5 font-gt-mono text-[0.5625rem] font-bold uppercase tracking-[.12em] text-gt-ink-400">
            {t("traslado.motivo")}
          </div>
          <div className="mb-3.5">
            <Field value={reason} onChange={setReason} placeholder={t("traslado.motivoPlaceholder")} />
          </div>

          <Sunken className="mb-3.5 px-[0.8125rem] py-[0.6875rem]">
            <div className="font-gt-mono text-[0.53125rem] uppercase tracking-[.14em] text-gt-ink-400">
              {t("traslado.aviso")}
            </div>
            <div className="mt-1 text-[0.78125rem] leading-normal text-gt-ink-800">{t("traslado.avisoTexto")}</div>
          </Sunken>

          <Button
            icon="send"
            className="w-full"
            disabled={!uuid || !stopId || teleport.isPending}
            onClick={submit}
          >
            {teleport.isPending ? t("traslado.trasladando") : t("traslado.trasladar")}
          </Button>
        </div>
      </Card>
    </>
  )
}
