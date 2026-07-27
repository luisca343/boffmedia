"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { Modal, Button, Field, TextArea, Select } from "../ui"
import { useCreateMulta, useCreateBuscado, useResolveDenuncia } from "../../_hooks/queries"
import { useOfficer } from "../../_hooks/useOfficer"
import { DENUNCIA_CATEGORY, DENUNCIA_STATUS } from "../../_utils/tones"
import { townName } from "../../_utils/format"
import { SEVERITY_CREATE_OPTIONS } from "./severity"
import type { Denuncia } from "../../_types"

export type DenunciaActionKind = "multa" | "buscado" | "resolver"

export function DenunciaActionModal({
  kind,
  denuncia,
  onClose,
}: {
  kind: DenunciaActionKind | null
  denuncia: Denuncia | null
  onClose: () => void
}) {
  const t = useTranslations("gobierno")
  const officer = useOfficer()
  const router = useRouter()
  const createMulta = useCreateMulta()
  const createBuscado = useCreateBuscado()
  const resolveDenuncia = useResolveDenuncia()

  const STATUS_OPTIONS = [
    { value: "resolved", label: t(DENUNCIA_STATUS.resolved.labelKey) },
    { value: "dismissed", label: t(DENUNCIA_STATUS.dismissed.labelKey) },
  ]

  const [amount, setAmount] = useState("1000")
  const [reason, setReason] = useState("")
  const [severity, setSeverity] = useState("media")
  const [bounty, setBounty] = useState("1000")
  const [offense, setOffense] = useState("")
  const [lastSeen, setLastSeen] = useState("")
  const [status, setStatus] = useState<"resolved" | "dismissed">("resolved")
  const [resolution, setResolution] = useState("")

  useEffect(() => {
    if (!denuncia || !kind) return
    const where = denuncia.town
      ? `${townName(denuncia.town)}${denuncia.plotNumber != null ? ` #${denuncia.plotNumber}` : ""}`
      : ""
    setAmount("1000")
    const catKey = DENUNCIA_CATEGORY[denuncia.category]
    setReason([catKey ? t(catKey) : denuncia.category, where].filter(Boolean).join(" · "))
    setSeverity("media")
    setBounty("1000")
    setOffense(denuncia.description)
    setLastSeen(where)
    setStatus("resolved")
    setResolution("")
  }, [denuncia, kind])

  if (!kind || !denuncia) return null

  const accused = denuncia.accused
  const busy = createMulta.isPending || createBuscado.isPending || resolveDenuncia.isPending

  const resolve = (resolutionText: string) => {
    const payload = { id: denuncia.id, status: "resolved" as const, resolution: resolutionText, resolvedBy: officer.uuid }
    resolveDenuncia.mutate(payload)
  }

  const submitMulta = () => {
    if (!accused) return
    const value = Math.max(0, Math.round(Number(amount) || 0))
    createMulta.mutate(
      { playerUuid: accused.uuid, amount: value, reason, issuedBy: officer.uuid, denunciaId: denuncia.id },
      {
        onSuccess: (multa) => {
          const code = (multa as { code?: string } | undefined)?.code
          resolve(`Multa${code ? ` ${code}` : ""} emitida · ${reason}`)
          onClose()
        },
      },
    )
  }

  const submitBuscado = () => {
    if (!accused) return
    const value = Math.max(0, Math.round(Number(bounty) || 0))
    createBuscado.mutate(
      { playerUuid: accused.uuid, severity, bounty: value, offense, reportedBy: officer.uuid, lastSeen: lastSeen || undefined },
      {
        onSuccess: (buscado) => {
          const code = (buscado as { code?: string } | undefined)?.code
          resolve(`Escalada a busca y captura${code ? ` (${code})` : ""}`)
          onClose()
          router.push("/smartrotom/gobierno/buscados")
        },
      },
    )
  }

  const submitResolver = () => {
    if (!resolution.trim()) return
    const payload = { id: denuncia.id, status, resolution, resolvedBy: officer.uuid }
    resolveDenuncia.mutate(payload, { onSuccess: () => onClose() })
  }

  const meta = {
    multa: { kicker: t("denuncias.action.multaTitle"), title: `${t("denuncias.emitirMulta")} — ${denuncia.code}` },
    buscado: { kicker: t("denuncias.action.buscadoTitle"), title: `${t("denuncias.escalarBuscado")} — ${denuncia.code}` },
    resolver: { kicker: t("denuncias.action.resolverTitle"), title: `${t("denuncias.resolver")} — ${denuncia.code}` },
  }[kind]

  return (
    <Modal open onClose={onClose} title={meta.title} kicker={meta.kicker}>
      {!accused && kind !== "resolver" ? (
        <p className="text-[13px] text-gt-ink-500">{t("denuncias.action.noInfractor")}</p>
      ) : (
        <div className="space-y-3.5">
          {kind === "multa" && (
            <>
              <Field label={t("denuncias.action.importe")} value={amount} onChange={setAmount} type="number" mono />
              <TextArea label={t("denuncias.action.motivo")} value={reason} onChange={setReason} rows={3} />
            </>
          )}

          {kind === "buscado" && (
            <>
              <Select label={t("denuncias.action.gravedad")} value={severity} onChange={setSeverity} options={SEVERITY_CREATE_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) }))} />
              <Field label={t("denuncias.action.recompensa")} value={bounty} onChange={setBounty} type="number" mono />
              <TextArea label={t("denuncias.action.delito")} value={offense} onChange={setOffense} rows={3} />
              <Field
                label={t("denuncias.action.ultimaLocalizacion")}
                value={lastSeen}
                onChange={setLastSeen}
                placeholder={t("denuncias.action.ultimaLocalizacionPlaceholder")}
              />
            </>
          )}

          {kind === "resolver" && (
            <>
              <Select label={t("denuncias.action.resultado")} value={status} onChange={(v) => setStatus(v as "resolved" | "dismissed")} options={STATUS_OPTIONS} />
              <TextArea
                label={t("denuncias.resolucion")}
                value={resolution}
                onChange={setResolution}
                rows={3}
                placeholder={t("denuncias.action.resolucionPlaceholder")}
              />
            </>
          )}
        </div>
      )}

      <div className="mt-4 flex items-center justify-end gap-2">
        <Button tone="ghost" onClick={onClose} disabled={busy}>
          {t("common.cancel")}
        </Button>
        {accused && kind === "multa" && (
          <Button tone="gold" icon="gavel" onClick={submitMulta} disabled={busy || !reason.trim()}>
            {t("denuncias.emitirMulta")}
          </Button>
        )}
        {accused && kind === "buscado" && (
          <Button tone="danger" icon="alert" onClick={submitBuscado} disabled={busy || !offense.trim()}>
            {t("denuncias.action.escalar")}
          </Button>
        )}
        {kind === "resolver" && (
          <Button tone="primary" icon="check" onClick={submitResolver} disabled={busy || !resolution.trim()}>
            {t("denuncias.action.confirmar")}
          </Button>
        )}
      </div>
    </Modal>
  )
}
