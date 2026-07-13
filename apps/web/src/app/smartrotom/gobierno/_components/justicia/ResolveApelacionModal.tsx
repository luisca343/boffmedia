"use client"

import { useState } from "react"
import { Modal, TextArea, Button } from "../ui"
import { money } from "../../_utils/format"
import { useResolveApelacion } from "../../_hooks/queries"
import type { Apelacion } from "../../_types"

// Overturning is a real refund out of the treasury and cancels the multa — the copy
// says so explicitly, and the officer must type a motivación before the button unlocks.
export function ResolveApelacionModal({
  target,
  outcome,
  onClose,
}: {
  target: Apelacion | null
  outcome: "upheld" | "overturned" | null
  onClose: () => void
}) {
  const [decision, setDecision] = useState("")
  const resolve = useResolveApelacion()

  const close = () => {
    onClose()
    setDecision("")
  }

  if (!target || !outcome) return null

  const overturning = outcome === "overturned"

  return (
    <Modal
      open
      onClose={close}
      kicker={`Resolución · ${target.code}`}
      title={overturning ? "Anular multa" : "Mantener multa"}
      footer={
        <>
          <Button tone="ghost" onClick={close} disabled={resolve.isPending}>
            Cancelar
          </Button>
          <Button
            tone={overturning ? "primary" : "danger"}
            disabled={!decision.trim() || resolve.isPending}
            onClick={() => resolve.mutate({ id: target.id, outcome, decision: decision.trim() }, { onSuccess: close })}
          >
            {resolve.isPending ? "Resolviendo…" : overturning ? "Confirmar anulación" : "Confirmar resolución"}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <p className="text-[13px] leading-relaxed text-gt-ink-700">
          {overturning ? (
            <>
              La apelación de <strong>{target.player.username}</strong> quedará <strong>estimada</strong>: la multa
              se anulará y, si ya estaba pagada, se reembolsarán{" "}
              <strong className="tabular-nums">{money(target.multa?.amount ?? 0)} ₽</strong> desde la Tesorería de
              Teras a su cuenta StarBank.
            </>
          ) : (
            <>
              La apelación de <strong>{target.player.username}</strong> quedará <strong>desestimada</strong>: la
              multa se mantiene vigente y sigue siendo exigible.
            </>
          )}
        </p>
        <TextArea
          label="Motivación de la resolución"
          value={decision}
          onChange={setDecision}
          placeholder="Explica el fundamento de la decisión…"
          rows={3}
        />
      </div>
    </Modal>
  )
}
