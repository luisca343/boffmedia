"use client"

import { useTranslations } from "next-intl"
import { Chip, Modal } from "./ui"

/** Only the shortcuts that actually exist. There is no undo, so ⌘Z is not listed. */
const SHORTCUT_KEYS: [string, string][] = [
  ["⌘ / Ctrl + K", "help.shortcuts.commands"],
  ["/", "help.shortcuts.search"],
  ["F", "help.shortcuts.filters"],
  ["M", "help.shortcuts.multiSelect"],
  ["D", "help.shortcuts.dualBox"],
  ["G", "help.shortcuts.overview"],
  ["← →", "detail.stats"],
  ["Clic der.", "filters.statusToggles.favorite"],
  ["Esc", "common.close"],
]

export interface HelpModalProps {
  onClose: () => void
}

export function HelpModal({ onClose }: HelpModalProps) {
  const t = useTranslations("pc")
  return (
    <Modal onClose={onClose} title={t("help.title")} icon="keyboard" width={460}>
      <div className="flex flex-col gap-[0.4375rem] p-4">
        {SHORTCUT_KEYS.map(([k, key]) => (
          <div key={key} className="flex items-center justify-between px-1 py-1.5">
            <span className="text-[0.8125rem] text-pc-fg-muted">{t(key)}</span>
            <Chip className="font-pc-mono text-[0.6875rem]">{k}</Chip>
          </div>
        ))}
      </div>
    </Modal>
  )
}
