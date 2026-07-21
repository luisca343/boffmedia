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

const STATUS_OPTIONS = [
  { value: "resolved", label: DENUNCIA_STATUS.resolved.label },
  { value: "dismissed", label: DENUNCIA_STATUS.dismissed.label },
]

export function DenunciaActionModal({
  kind,
  denuncia,
  onClose,
}: {
  kind: DenunciaActionKind | null
  denuncia: Denuncia | null
  onClose: () => void
}) {
  const officer = useOfficer()
  const router = useRouter()
  const createMulta = useCreateMulta()
  const createBuscado = useCreateBuscado()
  const resolveDenuncia = useResolveDenuncia()

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
    setReason([DENUNCIA_CATEGORY[denuncia.category] ?? denuncia.category, where].filter(Boolean).join(" · "))
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
    multa: { kicker: "Hacienda · Sanción económica", title: `Emitir multa — ${denuncia.code}` },
    buscado: { kicker: "Seguridad · Orden pública", title: `Escalar a busca y captura — ${denuncia.code}` },
    resolver: { kicker: "Seguridad · Cierre de expediente", title: `Resolver — ${denuncia.code}` },
  }[kind]

  return (
    <Modal open onClose={onClose} title={meta.title} kicker={meta.kicker}>
      {!accused && kind !== "resolver" ? (
        <p className="text-[13px] text-gt-ink-500">
          Esta denuncia no tiene un infractor identificado, así que no se puede multar ni escalar. Puedes
          resolverla o archivarla desde su ficha.
        </p>
      ) : (
        <div className="space-y-3.5">
          {kind === "multa" && (
            <>
              <Field label="Importe (₽)" value={amount} onChange={setAmount} type="number" mono />
              <TextArea label="Motivo" value={reason} onChange={setReason} rows={3} />
            </>
          )}

          {kind === "buscado" && (
            <>
              <Select label="Gravedad" value={severity} onChange={setSeverity} options={SEVERITY_CREATE_OPTIONS} />
              <Field label="Recompensa (₽)" value={bounty} onChange={setBounty} type="number" mono />
              <TextArea label="Delito" value={offense} onChange={setOffense} rows={3} />
              <Field label="Última localización" value={lastSeen} onChange={setLastSeen} placeholder="Pueblo Mizu, cerca del puerto" />
            </>
          )}

          {kind === "resolver" && (
            <>
              <Select label="Resultado" value={status} onChange={(v) => setStatus(v as "resolved" | "dismissed")} options={STATUS_OPTIONS} />
              <TextArea label="Resolución" value={resolution} onChange={setResolution} rows={3} placeholder="Qué se decidió y por qué…" />
            </>
          )}
        </div>
      )}

      <div className="mt-4 flex items-center justify-end gap-2">
        <Button tone="ghost" onClick={onClose} disabled={busy}>
          Cancelar
        </Button>
        {accused && kind === "multa" && (
          <Button tone="gold" icon="gavel" onClick={submitMulta} disabled={busy || !reason.trim()}>
            Emitir multa
          </Button>
        )}
        {accused && kind === "buscado" && (
          <Button tone="danger" icon="alert" onClick={submitBuscado} disabled={busy || !offense.trim()}>
            Escalar
          </Button>
        )}
        {kind === "resolver" && (
          <Button tone="primary" icon="check" onClick={submitResolver} disabled={busy || !resolution.trim()}>
            Confirmar
          </Button>
        )}
      </div>
    </Modal>
  )
}
