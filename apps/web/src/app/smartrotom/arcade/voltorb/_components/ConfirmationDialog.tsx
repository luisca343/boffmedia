"use client"

import { Button, Icon, Modal } from "../../_components/ui"

interface ConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmText: string
  cancelText: string
  variant: "quit" | "new"
}

// Leaving the cabinet is the destructive one; starting a round is not.
const VARIANT = {
  quit: { tone: "danger", button: "danger" },
  new: { tone: "cyan", button: "amber" },
} as const

export default function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText,
  cancelText,
  variant,
}: ConfirmationDialogProps) {
  const skin = VARIANT[variant]
  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      size="sm"
      tone={skin.tone}
      kicker="Confirmar"
      title={title}
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>
            {cancelText}
          </Button>
          <Button
            variant={skin.button}
            size="sm"
            icon={variant === "quit" ? <Icon.X s={12} /> : <Icon.Coin s={14} />}
            onClick={onConfirm}
          >
            {confirmText}
          </Button>
        </>
      }
    >
      <p className="text-center font-ar text-[13px] leading-relaxed text-ar-ink-dim">
        {description}
      </p>
    </Modal>
  )
}
