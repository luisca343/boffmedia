"use client"

import * as React from "react"
import { useT } from "../i18n"
import { Banner, type BannerTone } from "./banner"
import { Button } from "./button"
import { Modal } from "./modal"

export type ConfirmTone = "info" | "warning" | "error"

const BANNER_TONE: Record<ConfirmTone, BannerTone> = {
  info: "info",
  warning: "warn",
  error: "error",
}

export interface ConfirmDialogProps {
  open: boolean
  title: React.ReactNode
  /** What is about to happen and what it costs. Rendered inside a toned Banner. */
  body: React.ReactNode
  confirmLabel?: React.ReactNode
  cancelLabel?: React.ReactNode
  /** `error` paints the confirm button in the danger variant — for deletes and
   *  other things with no undo. `warning` (default) is for the merely
   *  consequential; `info` for a plain "are you sure". */
  tone?: ConfirmTone
  /** Disables the confirm button while the action runs. */
  busy?: boolean
  onConfirm: () => void
  onClose: () => void
}

/**
 * The one confirmation surface. Replaces `window.confirm()`, which cannot show
 * tone, cannot be styled, blocks the tab and makes a delete look exactly like
 * a routine step. The dialog stays open until `onClose` — a caller that awaits
 * its action closes on success and leaves it up on failure.
 */
export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel,
  tone = "warning",
  busy,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const t = useT()
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <div className="flex justify-end gap-2">
          <Button size="sm" onClick={onClose}>{cancelLabel ?? t("cancel")}</Button>
          <Button
            size="sm"
            variant={tone === "error" ? "danger" : "pri"}
            disabled={busy}
            onClick={onConfirm}
          >
            {confirmLabel ?? t("confirm")}
          </Button>
        </div>
      }
    >
      <Banner tone={BANNER_TONE[tone]}>{body}</Banner>
    </Modal>
  )
}
