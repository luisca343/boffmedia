"use client"

import { useTranslations } from "next-intl"
import { Icon } from "@boffmedia/ui"
import {
  TM_CARD,
  TM_CARD_HEAD,
  TM_CARD_H3,
} from "@/components/boffmedia/ui/tournaments"
import type { TnMonApi } from "@/services/api/boffmedia/tournamentsService"
import { TeamsheetGrid } from "@/app/(boffmedia)/torneos/_components/TeamsheetEditor"

/**
 * The player's own teamsheet, read-only.
 *
 * Teamsheets freeze when the tournament goes live, which is exactly when the
 * first match appears — so from this page the sheet can only ever be read.
 * Editing lives on the tournament page, up to the moment it starts.
 */
export function MyTeamsheetCard({ mons }: { mons: TnMonApi[] | null }) {
  const t = useTranslations("torneos.teamsheet")
  if (!mons?.length) return null

  return (
    <section className={TM_CARD}>
      <div className={TM_CARD_HEAD}>
        <h3 className={TM_CARD_H3}>{t("title")}</h3>
        <span className="font-mono text-[0.65625rem] uppercase tracking-[0.08em] text-txt-dim">
          {t("locked")}
        </span>
      </div>
      <div className="p-4">
        <TeamsheetGrid mons={mons} />
      </div>
      <p className="m-0 flex items-center gap-2 px-4 pb-4 font-body text-[0.71875rem]/[1.5] text-txt-muted">
        <Icon name="info" size={12} className="flex-none" />
        {t("lockedHint")}
      </p>
    </section>
  )
}
