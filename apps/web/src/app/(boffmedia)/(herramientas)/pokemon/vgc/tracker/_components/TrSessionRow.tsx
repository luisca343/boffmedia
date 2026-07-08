"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { Icon } from "@/components/boffmedia/primitives/icon"
import { TrSprite, trFmtDate } from "./ui/tr-ui"
import type { Session, TeamPreset } from "@/features/vgc-tracker/types"
import type { SessionSummary } from "./useSessionSummaries"

const ICON_CUT = "polygon(0 0,100% 0,100% calc(100% - 7px),calc(100% - 7px) 100%,0 100%)"

function Chip({ children, tone }: { children: React.ReactNode; tone?: "tour" | "ghost" }) {
  return (
    <span
      className={cn(
        "whitespace-nowrap border border-solid px-[6px] py-[3px] font-mono text-[9px] font-semibold uppercase leading-none tracking-[0.08em]",
        tone === "tour"
          ? "border-[color-mix(in_srgb,var(--warn)_40%,transparent)] bg-warn-soft text-warn"
          : tone === "ghost"
            ? "border-dashed border-line-2 text-txt-dim"
            : "border-line-2 text-txt-muted",
      )}
    >
      {children}
    </span>
  )
}

export function TrSessionRow({
  session,
  summary,
  preset,
  onDuplicate,
  onArchive,
  onUnarchive,
  onDelete,
}: {
  session: Session
  summary?: SessionSummary
  preset?: TeamPreset
  onDuplicate: () => void
  onArchive?: () => void
  onUnarchive?: () => void
  onDelete: () => void
}) {
  const t = useTranslations("vgc.tracker")
  const router = useRouter()
  const isTour = session.type === "tournament"
  const archived = !!session.archivedAt
  const href = `/pokemon/vgc/tracker/${session.id}`
  const go = () => router.push(href)

  const leftBorder = archived ? "border-l-line-2" : isTour ? "border-l-warn" : "border-l-accent"

  return (
    <div className="group relative">
      <div
        role="link"
        tabIndex={0}
        onClick={go}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), go())}
        className={cn(
          "flex w-full min-w-0 cursor-pointer items-center gap-[13px] border border-solid border-line border-l-[3px] bg-panel px-[14px] py-[11px] text-left transition-[border-color,background]",
          "hover:border-line-2 hover:bg-panel-2 focus-visible:outline-2 focus-visible:outline-accent-line",
          leftBorder,
          archived && "opacity-65",
        )}
      >
        <span
          style={{ clipPath: ICON_CUT }}
          className={cn(
            "grid h-8 w-8 flex-none place-items-center border border-solid",
            isTour
              ? "border-[color-mix(in_srgb,var(--warn)_45%,transparent)] bg-warn-soft text-warn"
              : "border-accent-line bg-accent-soft text-accent-bright",
          )}
        >
          <Icon name={isTour ? "trophy" : "sword"} size={15} />
        </span>

        <span className="grid min-w-0 flex-1 gap-[3px]">
          <span className="flex min-w-0 flex-wrap items-center gap-2">
            <b className="font-display text-[14.5px] font-bold uppercase leading-[1.1] tracking-[0.03em]">{session.label}</b>
            <Chip>{session.format}</Chip>
            {isTour && <Chip tone="tour">{t("sessionType.tournament")}</Chip>}
            {archived && <Chip tone="ghost">{t("archive.badge")}</Chip>}
          </span>
          <span className="flex flex-wrap items-center gap-2 font-mono text-[10.5px] font-medium leading-[1.3] text-txt-dim">
            {trFmtDate(session.startedAt)} · {session.regulationId}
            {preset && (
              <span className="inline-flex items-center gap-1 text-txt-muted">
                <Icon name="layers" size={10} />
                {preset.name}
              </span>
            )}
          </span>
        </span>

        {preset && (
          <span className="hidden flex-none gap-px sm:flex">
            {preset.slots.slice(0, 6).map((s) => (
              <TrSprite key={s.slotIndex} name={s.speciesName} size={24} />
            ))}
          </span>
        )}

        <Record session={session} summary={summary} />
        <Icon name="chevronRight" size={16} className="flex-none text-txt-dim" />
      </div>

      {/* Hover actions — kept out of the click target */}
      <div className="absolute right-[42px] top-1/2 flex -translate-y-1/2 items-center gap-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
        <ActionBtn icon="copy" label={t("buttons.duplicate")} onClick={onDuplicate} />
        {archived ? (
          <ActionBtn icon="refresh" label={t("buttons.unarchive")} onClick={onUnarchive} />
        ) : (
          <ActionBtn icon="inbox" label={t("buttons.archive")} onClick={onArchive} />
        )}
        <ActionBtn icon="trash" label={t("buttons.delete")} danger onClick={onDelete} />
      </div>
    </div>
  )
}

function ActionBtn({ icon, label, onClick, danger }: { icon: "copy" | "inbox" | "refresh" | "trash"; label: string; onClick?: () => void; danger?: boolean }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onClick?.()
      }}
      className={cn(
        "grid h-7 w-7 place-items-center border border-solid border-line-2 bg-base text-txt-muted transition-colors hover:text-txt",
        danger && "hover:border-bad hover:text-bad",
      )}
    >
      <Icon name={icon} size={13} />
    </button>
  )
}

function Record({ session, summary }: { session: Session; summary?: SessionSummary }) {
  const t = useTranslations("vgc.tracker")
  if (!summary) return <span className="w-10 flex-none" />
  if (summary.type === "tournament") {
    return (
      <span className="flex flex-none items-baseline gap-[3px] font-mono text-[16px] font-bold leading-none">
        <b className="text-ok">{summary.seriesWins}</b>–<b className="text-bad">{summary.seriesLosses}</b>
        <i className="font-mono text-[9px] font-medium not-italic uppercase leading-none tracking-[0.08em] text-txt-dim">
          {t("tournament.seriesUnit")}
        </i>
      </span>
    )
  }
  return (
    <span className="flex flex-none items-baseline gap-[3px] font-mono text-[16px] font-bold leading-none">
      <b className="text-ok">{summary.wins}</b>–<b className="text-bad">{summary.losses}</b>
      {summary.draws > 0 && (
        <i className="font-mono text-[9px] font-medium not-italic uppercase leading-none tracking-[0.08em] text-txt-dim">
          ·{summary.draws}{t("result.drawShort")}
        </i>
      )}
      {summary.eloCurrent != null && (
        <span className="ml-[7px] inline-flex items-center gap-[3px] font-mono text-[10.5px] font-semibold leading-none text-accent-bright">
          <Icon name="trending" size={11} />
          {summary.eloCurrent}
        </span>
      )}
    </span>
  )
}
