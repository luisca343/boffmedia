"use client"

import type { ReactNode } from "react"
import { useTranslations } from "next-intl"
import { Modal, Button } from "../ui"

// A generic yes/no confirmation for a money-moving or otherwise irreversible action —
// Cobrar and Anular both route through this so the citizen never sees an optimistic
// "paid" before the treasury actually confirms the transfer (the mutation itself only
// updates the cache on success, so there is nothing extra to undo here on failure).
export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  kicker,
  title,
  body,
  confirmLabel,
  tone = "primary",
  pending = false,
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  kicker?: string
  title: string
  body: ReactNode
  confirmLabel: string
  tone?: "primary" | "danger" | "gold"
  pending?: boolean
}) {
  const t = useTranslations("gobierno")
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      kicker={kicker}
      width={440}
      footer={
        <>
          <Button tone="ghost" onClick={onClose} disabled={pending}>
            {t("common.cancel")}
          </Button>
          <Button tone={tone} onClick={onConfirm} disabled={pending}>
            {pending ? t("common.processing") : confirmLabel}
          </Button>
        </>
      }
    >
      <div className="text-[0.84375rem] leading-relaxed text-gt-ink-700">{body}</div>
    </Modal>
  )
}
