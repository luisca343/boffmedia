"use client"

import { useTranslations } from "next-intl"
import { useBoard } from "../_hooks/useBoard"
import { Button, Divider, Icon, Label, Paper } from "./ui"

/** The board while the encargos are still being taken down. */
export function BoardLoading({ children }: { children?: string }) {
  const t = useTranslations("misiones.board")
  return (
    <div className="grid flex-1 place-items-center py-24">
      <p className="text-center font-ms-display text-lg italic text-ms-paper-2">{children || t("loading")}</p>
    </div>
  )
}

/**
 * The board when the quest system cannot be reached. The encargos live on the
 * Minecraft server (the API only proxies it), so this is usually the game being
 * down rather than anything wrong here — say so, and offer to knock again.
 */
export function BoardError({ message }: { message: string }) {
  const t = useTranslations("misiones.board")
  const { refetch } = useBoard()

  return (
    <div className="grid flex-1 place-items-center py-16">
      <Paper tilt={-0.6} className="max-w-[32.5rem] px-9 py-8 text-center">
        <Label className="justify-center text-ms-seal-available">{t("closedTitle")}</Label>
        <h2 className="mb-1 mt-2 font-ms-display text-2xl text-ms-ink-1">{t("closedHeading")}</h2>
        <Divider glyph="❦" />
        <p className="mx-auto mb-1 mt-3 max-w-[42ch] text-[0.9375rem] italic leading-relaxed text-ms-ink-2">
          {t("closedDescription")}
        </p>
        <p className="mb-5 font-ms-mono text-[0.6875rem] text-ms-ink-3">{message}</p>
        <Button variant="primary" onClick={() => refetch()}>
          <Icon.Scroll size={13} /> {t("retry")}
        </Button>
      </Paper>
    </div>
  )
}
