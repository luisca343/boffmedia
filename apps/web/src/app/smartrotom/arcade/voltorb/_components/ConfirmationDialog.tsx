"use client"

import { useTranslations } from "next-intl"
import { Button, Icon, Modal } from "../../_components/ui"

interface ConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  titleKey: string
  descriptionKey: string
  confirmKey: string
  cancelKey: string
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
  titleKey,
  descriptionKey,
  confirmKey,
  cancelKey,
  variant,
}: ConfirmationDialogProps) {
  const t = useTranslations("arcade")
  const skin = VARIANT[variant]
  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      size="sm"
      tone={skin.tone}
      kicker={t("common.confirm")}
      title={t(titleKey)}
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>
            {t(cancelKey)}
          </Button>
          <Button
            variant={skin.button}
            size="sm"
            icon={variant === "quit" ? <Icon.X s={12} /> : <Icon.Coin s={14} />}
            onClick={onConfirm}
          >
            {t(confirmKey)}
          </Button>
        </>
      }
    >
      <p className="text-center font-ar text-[13px] leading-relaxed text-ar-ink-dim">
        {t(descriptionKey)}
      </p>
    </Modal>
  )
}
