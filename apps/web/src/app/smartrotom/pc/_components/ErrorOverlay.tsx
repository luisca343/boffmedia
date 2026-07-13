"use client"

import { Button, Icon } from "./ui"

export interface ErrorOverlayProps {
  onRetry: () => void
  /** The real failure, when there is one worth showing. */
  message?: string
}

/** Shown when a PC query actually failed — never as a demo state. */
export function ErrorOverlay({ onRetry, message }: ErrorOverlayProps) {
  return (
    <div
      role="alert"
      className="fixed inset-0 z-[290] flex animate-pc-fade flex-col items-center justify-center gap-[18px] bg-[rgb(4_7_14_/_.9)] font-pc text-pc-fg backdrop-blur-sm motion-reduce:animate-none"
    >
      <div className="flex h-[84px] w-[84px] items-center justify-center rounded-[22px] border border-pc-rose/40 bg-pc-rose/[.12]">
        <Icon name="wifiOff" size={40} className="text-pc-rose" />
      </div>
      <div className="max-w-[320px] text-center">
        <h2 className="mb-1.5 font-pc-display text-[19px] font-bold">Conexión perdida con el PC</h2>
        <p className="text-[13.5px] text-pc-fg-muted">
          {message || "No se pudo contactar con el almacén de SmartRotom. Inténtalo de nuevo."}
        </p>
      </div>
      <Button variant="primary" onClick={onRetry}>
        <Icon name="refresh" size={15} />
        Reintentar
      </Button>
    </div>
  )
}
