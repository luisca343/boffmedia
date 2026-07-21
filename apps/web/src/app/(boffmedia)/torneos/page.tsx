"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { Spinner } from "@/components/boffmedia/primitives"
import { DkSeg } from "@/components/boffmedia/ui/tools/datakit"
import { TnFormatBadge } from "@/components/boffmedia/ui/tournaments"
import { useTournaments } from "@/hooks/tournaments/useTournaments"
import type { TournamentSummaryApi } from "@/services/api/boffmedia/tournamentsService"

type Filter = "all" | "live" | "registration" | "completed"

const DOT_TONE: Record<string, string> = {
  live: "bg-accent",
  registration: "bg-ok",
  completed: "bg-txt-dim",
  draft: "bg-line-2",
  cancelled: "bg-bad",
}

export default function TorneosPage() {
  const t = useTranslations("torneos")
  const { tournaments, isLoading } = useTournaments()
  const [filter, setFilter] = useState<Filter>("all")
  const [query, setQuery] = useState("")

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase()
    return tournaments
      .filter((t) => t.status !== "draft" && t.status !== "cancelled")
      .filter((t) => (filter === "all" ? true : t.status === filter))
      .filter(
        (t) =>
          q === "" ||
          t.name.toLowerCase().includes(q) ||
          (t.gameTitle?.toLowerCase().includes(q) ?? false),
      )
  }, [tournaments, filter, query])

  return (
    <main className="wrap py-10">
      <header className="mb-6 grid gap-3">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-txt-dim">
          {t("listing.section")}
        </span>
        <h1 className="text-[clamp(34px,5vw,56px)]">{t("listing.title")}</h1>
        <p className="max-w-xl font-body text-[14px] leading-[1.55] text-txt-muted">
          {t("listing.subtitle")}
        </p>
      </header>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <DkSeg
          size="sm"
          value={filter}
          onChange={(v) => setFilter(v as Filter)}
          ariaLabel={t("listing.filterAriaLabel")}
          options={[
            { value: "all", label: t("listing.filterAll") },
            { value: "live", label: t("listing.filterLive") },
            { value: "registration", label: t("listing.filterRegistration") },
            { value: "completed", label: t("listing.filterCompleted") },
          ]}
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("listing.searchPlaceholder")}
          aria-label={t("listing.searchAriaLabel")}
          className="min-w-[180px] flex-1 border border-solid border-line bg-panel px-3 py-1.5 font-body text-[13px] placeholder:text-txt-dim sm:max-w-xs"
        />
      </div>

      {isLoading ? (
        <div className="grid place-items-center py-24">
          <Spinner />
        </div>
      ) : shown.length === 0 ? (
        <div className="border border-dashed border-line-2 bg-panel px-6 py-16 text-center">
          <p className="font-mono text-[12px] uppercase tracking-[0.08em] text-txt-dim">
            {t("listing.empty")}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((t) => (
            <TorneoCard key={t.id} t={t} />
          ))}
        </div>
      )}
    </main>
  )
}

function TorneoCard({ t }: { t: TournamentSummaryApi }) {
  const intl = useTranslations("torneos")
  return (
    <Link
      href={`/torneos/${t.slug}`}
      className="cut-corner group grid content-start gap-3 border border-solid border-line bg-panel p-4 transition-colors hover:border-line-2"
    >
      <div className="flex items-center justify-between">
        <TnFormatBadge format={t.format} size="sm" />
        <span className={cn("h-2 w-2 rounded-full", DOT_TONE[t.status] ?? "bg-line-2")} />
      </div>
      <h2 className="font-display text-[18px] font-bold uppercase not-italic leading-[1.05] tracking-[0.01em] transition-colors group-hover:text-accent-bright">
        {t.name}
      </h2>
      <div className="flex flex-wrap gap-x-3 gap-y-1 font-mono text-[10.5px] text-txt-dim">
        {t.gameTitle && <span>{t.gameTitle}</span>}
        <span>{intl("listing.players", { count: t.participantCount })}</span>
        {t.championName && <span className="text-accent">🏆 {t.championName}</span>}
      </div>
    </Link>
  )
}
