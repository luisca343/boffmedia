"use client"

import { Chip, Modal } from "./ui"

/** Only the shortcuts that actually exist. There is no undo, so ⌘Z is not listed. */
const SHORTCUTS: [string, string][] = [
  ["⌘ / Ctrl + K", "Paleta de comandos"],
  ["/", "Buscar"],
  ["F", "Filtros"],
  ["M", "Selección múltiple"],
  ["D", "Doble caja"],
  ["G", "Vista general de cajas"],
  ["← →", "Navegar Pokémon (en detalle)"],
  ["Clic der.", "Marcar favorito"],
  ["Esc", "Cerrar"],
]

export interface HelpModalProps {
  onClose: () => void
}

export function HelpModal({ onClose }: HelpModalProps) {
  return (
    <Modal onClose={onClose} title="Atajos de teclado" icon="keyboard" width={460}>
      <div className="flex flex-col gap-[7px] p-4">
        {SHORTCUTS.map(([k, label]) => (
          <div key={label} className="flex items-center justify-between px-1 py-1.5">
            <span className="text-[13px] text-pc-fg-muted">{label}</span>
            <Chip className="font-pc-mono text-[11px]">{k}</Chip>
          </div>
        ))}
      </div>
    </Modal>
  )
}
