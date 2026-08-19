"use client"

import * as React from "react"
import { Icon, Button, IconButton, Seg, Badge } from "@boffmedia/ui"
import { cn } from "@/lib/utils"
import { SteamArt, SteamGallery, SteamFact, platformList } from "../../../_components/steam-media"
import type { SteamGame } from "../../../_hooks/useFetchSteamData"
import type { SteamFreeGame } from "../../_hooks/useSteamFreeGames"
import { countdownFrom, type Countdown } from "../../_lib/useSteamFreeV3"

export interface SfStrings {
  claim: string
  details: string
  close: string
  endsIn: string
  endsUnknown: string
  ended: string
  deadline: string
  keep: string
  keepNote: string
  weekend: string
  weekendNote: string
  saves: string
  reviews: string
  noReviews: string
  developer: string
  publisher: string
  release: string
  platforms: string
  genres: string
  officialSite: string
  tabInfo: string
  tabMedia: string
  detailLoading: string
  viewSteam: string
  mediaN: (n: number) => string
}

/* ── countdown ────────────────────────────────────────────────────────────── */

function pad(n: number) {
  return String(n).padStart(2, "0")
}

/** Days only show while there are any; below 24 h the clock switches to
 *  HH:MM:SS, which is what makes the last day read as a last day. */
export function formatCountdown(c: Countdown): string {
  if (c.expired) return "00:00:00"
  if (c.days > 0) return `${c.days}d ${pad(c.hours)}h ${pad(c.minutes)}m`
  return `${pad(c.hours)}:${pad(c.minutes)}:${pad(c.seconds)}`
}

export function SfCountdown({
  endsUnix,
  now,
  t,
  size = "sm",
}: {
  endsUnix: number | null
  now: number
  t: SfStrings
  size?: "sm" | "lg"
}) {
  const c = countdownFrom(endsUnix, now)
  const lg = size === "lg"

  if (!c) {
    return (
      <span
        className={cn(
          "cut cut-edge-slant [--cut:4px] inline-flex items-center gap-[7px] border border-line-2 bg-panel-2 font-mono font-semibold uppercase leading-none text-txt-muted",
          lg ? "px-[12px] py-[9px] text-[11px] tracking-[0.06em]" : "px-[9px] py-[6px] text-[9.5px] tracking-[0.08em]",
        )}
      >
        <Icon name="clock" size={lg ? 14 : 11} />
        {t.endsUnknown}
      </span>
    )
  }

  const tone = c.expired
    ? "border-line-2 bg-panel-2 text-txt-dim"
    : c.urgent
      ? "border-[color-mix(in_srgb,var(--bad)_45%,transparent)] bg-bad-soft text-bad"
      : "border-[color-mix(in_srgb,var(--ok)_40%,transparent)] bg-ok-soft text-ok"

  return (
    <span
      title={t.deadline}
      className={cn(
        "cut cut-edge-slant [--cut:4px] inline-flex items-center gap-[7px] border font-mono font-bold uppercase leading-none",
        lg ? "px-[12px] py-[9px] text-[13px] tracking-[0.04em]" : "px-[9px] py-[6px] text-[10px] tracking-[0.06em]",
        tone,
      )}
    >
      <Icon
        name="clock"
        size={lg ? 15 : 11}
        className={c.urgent && !c.expired ? "animate-pulse motion-reduce:animate-none" : ""}
      />
      {c.expired ? t.ended : `${t.endsIn} ${formatCountdown(c)}`}
    </span>
  )
}

/* ── review score ─────────────────────────────────────────────────────────── */

export function SfReview({ game, t }: { game: SteamFreeGame; t: SfStrings }) {
  if (game.reviewPercentPositive == null || !game.reviewCount) {
    return <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-txt-dim">{t.noReviews}</span>
  }
  const pct = game.reviewPercentPositive
  const tone = pct >= 70 ? "text-ok" : pct >= 40 ? "text-warn" : "text-bad"
  return (
    <span className="inline-flex flex-wrap items-center gap-[7px] font-mono text-[10px] font-semibold uppercase leading-none tracking-[0.06em] text-txt-muted">
      <Icon name="star" size={12} className={tone} />
      <b className={"font-display text-[13px] font-extrabold italic leading-none " + tone}>{pct}%</b>
      {game.reviewLabel || t.reviews}
      <span className="text-txt-dim">({game.reviewCount.toLocaleString()})</span>
    </span>
  )
}

/* ── grid card ────────────────────────────────────────────────────────────── */

export function SfCard({
  game,
  now,
  t,
  onOpen,
}: {
  game: SteamFreeGame
  now: number
  t: SfStrings
  onOpen: (game: SteamFreeGame) => void
}) {
  const hasPrice = game.originalPriceCents > 0 && !!game.normalPrice
  return (
    <article
      className={cn(
        "cut-tag cut-tag-edge [--cut-tag:14px]",
        "group relative flex flex-col border border-line bg-panel",
        "transition-[border-color,transform,background] duration-[140ms] hover:-translate-y-[3px] hover:bg-panel-2",
        "hover:border-[color-mix(in_srgb,var(--accent)_45%,var(--line))]",
      )}
    >
      <button
        type="button"
        onClick={() => onOpen(game)}
        aria-label={game.name}
        className="relative block aspect-[460/215] w-full cursor-pointer border-0 border-b border-line bg-transparent p-0"
      >
        <SteamArt src={game.headerImage || game.capsuleImage} name={game.name} />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,color-mix(in_srgb,var(--panel)_82%,transparent),transparent_48%)]" />
        <span className="absolute left-[10px] top-[10px] z-[2] inline-flex items-center border border-[color-mix(in_srgb,var(--ok)_40%,transparent)] bg-ok-soft px-[9px] py-[6px] font-display text-[15px] font-extrabold italic leading-none text-ok">
          -100%
        </span>
        <span className="absolute right-[10px] top-[10px] z-[2]">
          <SfCountdown endsUnix={game.freeToKeepEnds} now={now} t={t} />
        </span>
      </button>

      <div className="flex flex-1 flex-col gap-[11px] px-[16px] pb-[16px] pt-[14px]">
        <div className="flex items-start justify-between gap-[10px]">
          <h3 className="min-w-0 truncate font-display text-[19px] font-bold leading-[1.1] text-txt">{game.name}</h3>
          <Badge tone={game.isFreeToKeep ? "ok" : "warn"}>{game.isFreeToKeep ? t.keep : t.weekend}</Badge>
        </div>

        <SfReview game={game} t={t} />

        {hasPrice && (
          <div className="flex flex-wrap items-baseline gap-[10px]">
            <span className="font-display text-[26px] font-extrabold italic leading-none text-ok">{game.currentPrice}</span>
            <span className="font-mono text-[13px] leading-none text-txt-dim line-through">{game.normalPrice}</span>
            <span className="ml-auto font-mono text-[9.5px] uppercase leading-none tracking-[0.08em] text-txt-dim">{t.saves}</span>
          </div>
        )}

        <div className="mt-auto flex flex-wrap gap-[8px] border-t border-dashed border-line pt-[12px]">
          <Button variant="pri" size="sm" icon="steam" href={game.storeUrl} className="flex-1">
            {t.claim}
          </Button>
          <Button variant="ghost" size="sm" icon="info" onClick={() => onOpen(game)}>
            {t.details}
          </Button>
        </div>
      </div>
    </article>
  )
}

/* ── detail modal ─────────────────────────────────────────────────────────── */

export function SfModal({
  game,
  detail,
  loading,
  now,
  t,
  onClose,
}: {
  game: SteamFreeGame
  /** The richer `/steamdata/:id` payload — genres and media only live there. */
  detail: SteamGame | null
  loading: boolean
  now: number
  t: SfStrings
  onClose: () => void
}) {
  const [tab, setTab] = React.useState("info")

  React.useEffect(() => {
    setTab("info")
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = prev
    }
  }, [game.steamID, onClose])

  const desc = (game.shortDescription || detail?.shortDescription || "").trim()
  const release = game.releaseDate ? new Date(game.releaseDate).toLocaleDateString() : detail?.releaseDate || "—"
  const genres = detail?.genres ?? []

  return (
    <div className="fixed inset-0 z-[200] grid place-items-center p-[20px]" role="dialog" aria-modal="true" aria-label={game.name}>
      <button
        type="button"
        aria-label={t.close}
        onClick={onClose}
        className="absolute inset-0 cursor-default border-0 bg-[rgba(0,0,0,0.62)] p-0 backdrop-blur-[3px]"
      />
      <div className="cut-corner cut-corner-edge [--cut-line:var(--line-2)] [--cut-lg:18px] bm-scroll relative max-h-[92vh] w-[min(620px,100%)] animate-[bm-modal-in_var(--t-med,180ms)] overflow-y-auto border border-line-2 border-t-[3px] border-t-accent bg-panel motion-reduce:animate-none">
        <IconButton name="x" label={t.close} onClick={onClose} className="absolute right-[14px] top-[14px] z-[3]" />

        <div className="relative aspect-[460/172] border-b border-line">
          <SteamArt src={detail?.headerImage || game.headerImage} name={game.name} />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,var(--panel),transparent_55%)]" />
        </div>

        <div className="grid gap-[14px] px-[22px] pt-[16px]">
          <div className="min-w-0">
            <h3 className="font-display text-[26px] font-extrabold not-italic uppercase leading-none tracking-[-0.005em] text-txt">
              {game.name}
            </h3>
            <div className="mt-[10px] flex flex-wrap items-center gap-[8px]">
              <SfCountdown endsUnix={game.freeToKeepEnds} now={now} t={t} size="lg" />
              <Badge tone={game.isFreeToKeep ? "ok" : "warn"}>{game.isFreeToKeep ? t.keep : t.weekend}</Badge>
            </div>
            <p className="mt-[10px] font-mono text-[10.5px] leading-[1.5] text-txt-dim">
              {game.isFreeToKeep ? t.keepNote : t.weekendNote}
            </p>
          </div>

          {game.originalPriceCents > 0 && (
            <div className="flex items-center gap-[14px] border border-line bg-panel-2 px-[18px] py-[14px]">
              <span className="font-display text-[36px] font-extrabold italic leading-none text-ok">{game.currentPrice}</span>
              <div className="flex flex-col gap-[4px]">
                <span className="font-mono text-[13px] leading-none text-txt-dim line-through">{game.normalPrice}</span>
                <span className="font-mono text-[9.5px] uppercase leading-none tracking-[0.08em] text-txt-muted">{t.saves}</span>
              </div>
              <span className="ml-auto border border-[color-mix(in_srgb,var(--ok)_40%,transparent)] bg-ok-soft px-[10px] py-[7px] font-display text-[17px] font-extrabold italic leading-none text-ok">
                -100%
              </span>
            </div>
          )}

          <Seg
            className="w-full [&>button]:flex-1 [&>button]:justify-center"
            value={tab}
            onChange={setTab}
            options={[
              { value: "info", label: t.tabInfo },
              { value: "media", label: t.tabMedia },
            ]}
          />
        </div>

        <div className="grid min-h-[200px] gap-[16px] px-[22px] pb-[22px] pt-[16px]">
          {tab === "info" ? (
            <div className="grid gap-[16px]">
              {desc && <p className="text-pretty text-[14px] leading-[1.55] text-txt-muted">{desc}</p>}
              <div className="grid grid-cols-2 gap-px border border-line bg-line max-[600px]:grid-cols-1">
                <SteamFact k={t.developer}>{game.developers.join(", ") || "—"}</SteamFact>
                <SteamFact k={t.publisher}>{game.publishers.join(", ") || "—"}</SteamFact>
                <SteamFact k={t.release}>{release}</SteamFact>
                <SteamFact k={t.platforms}>{platformList(game.platforms)}</SteamFact>
              </div>
              <SfReview game={game} t={t} />
              {genres.length > 0 && (
                <div className="grid gap-[8px]">
                  <span className="font-mono text-[9.5px] font-semibold uppercase leading-none tracking-[0.1em] text-txt-dim">
                    {t.genres}
                  </span>
                  <div className="flex flex-wrap gap-[6px]">
                    {genres.map((g) => (
                      <span
                        key={g}
                        className="border border-line-2 bg-panel-2 px-[8px] py-[5px] font-mono text-[9.5px] font-semibold uppercase leading-none tracking-[0.05em] text-txt-muted"
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {detail?.website && (
                <Button variant="ghost" icon="external" href={detail.website}>
                  {t.officialSite}
                </Button>
              )}
            </div>
          ) : loading || !detail ? (
            <div className="grid place-items-center py-[60px] text-txt-dim">
              <Icon name="refresh" size={28} className="animate-spin" />
              <span className="mt-3 font-mono text-[11px] uppercase tracking-[0.1em]">{t.detailLoading}</span>
            </div>
          ) : (
            <SteamGallery media={detail.media} name={detail.name} thumbLabel={t.mediaN} />
          )}

          <div className="mt-[4px] flex flex-wrap gap-[10px] border-t border-line pt-[16px]">
            <Button variant="pri" icon="steam" href={game.storeUrl} className="flex-1">
              {t.claim}
            </Button>
            <Button variant="ghost" icon="external" href={`https://store.steampowered.com/app/${game.steamID}`}>
              {t.viewSteam}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
