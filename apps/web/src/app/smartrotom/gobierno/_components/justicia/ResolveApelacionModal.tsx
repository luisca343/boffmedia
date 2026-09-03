"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { useFormat } from "@boffmedia/ui/useFormat"
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
  const t = useTranslations("gobierno")
  const { intlLocale } = useFormat()
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
      kicker={t("justicia.resolverApelacion", { code: target.code })}
      title={overturning ? t("justicia.anularTitle") : t("justicia.mantenerTitle")}
      footer={
        <>
          <Button tone="ghost" onClick={close} disabled={resolve.isPending}>
            {t("common.cancel")}
          </Button>
          <Button
            tone={overturning ? "primary" : "danger"}
            disabled={!decision.trim() || resolve.isPending}
            onClick={() => resolve.mutate({ id: target.id, outcome, decision: decision.trim() }, { onSuccess: close })}
          >
            {resolve.isPending
              ? t("justicia.resolviendo")
              : overturning
                ? t("justicia.confirmarAnulacion")
                : t("justicia.confirmarResolucion")}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <p className="text-[0.8125rem] leading-relaxed text-gt-ink-700">
          {overturning
            ? t("justicia.anularDescription", {
                username: target.player.username,
                amount: money(target.multa?.amount ?? 0, intlLocale),
              })
            : t("justicia.mantenerDescription", { username: target.player.username })}
        </p>
        <TextArea
          label={t("justicia.motivacion")}
          value={decision}
          onChange={setDecision}
          placeholder={t("justicia.motivacionPlaceholder")}
          rows={3}
        />
      </div>
    </Modal>
  )
}
