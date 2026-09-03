import * as React from "react"
import { cn } from "../cn"
import { Avatar, Button, Icon } from "../index"
import { Countdown } from "../primitives/countdown"
import { useGiveawaysT } from "./i18n"
import { SrtPrizeTag, SrtSourceTag, SrtStatusChip } from "./SrtAtoms"
import { srtHue, srtNum, srtPrizeMeta, srtStatus, type Sorteo } from "./giveaways-util"

// The giveaway card (grid + list skins) and the featured banner. Prefix srt- in
// sorteos.css. The rail + glyph tint with the game hue when the sorteo is linked
// to one. [deferred] the <image-slot> prize art shows the tinted glyph until an
// image-upload flow exists.

export function SrtCard({ sorteo, layout, entered, onOpen }: { sorteo: Sorteo; layout?: "grid" | "list"; entered?: boolean; onOpen?: (href: string) => void }) {
  const t = useGiveawaysT()
  const status = srtStatus(sorteo)
  const hue = srtHue(sorteo)
  const pm = srtPrizeMeta(sorteo.prize.type)
  const row = layout === "list"
  const capPct = sorteo.cap ? Math.min(100, (sorteo.entrants / sorteo.cap) * 100) : 0
  const open = () => onOpen && onOpen("/sorteos?g=" + sorteo.slug)
  return (
    <button
      type="button"
      onClick={open}
      aria-label={sorteo.title}
      style={{ "--ghue": hue } as React.CSSProperties}
      className={cn(
        "group relative flex cursor-pointer flex-col border border-solid border-line border-l-4 border-l-[color:var(--ghue)] bg-panel text-left transition-[border-color,background,transform] duration-[140ms] cut-tag cut-tag-edge [--cut-tag:14px]",
        "hover:-translate-y-[3px] hover:border-[color-mix(in_srgb,var(--ghue)_45%,var(--line))] hover:bg-panel-2 hover:border-l-[color:var(--ghue)]",
        row && "sm:flex-row sm:items-stretch",
        status.key === "ended" && "opacity-[0.82]",
        status.key === "announced" && "border-l-accent",
      )}
    >
      <div className={cn("relative flex items-center gap-[0.875rem] overflow-hidden border-b border-solid border-line px-[1.125rem] py-[0.9375rem]", row && "sm:w-[13.125rem] sm:flex-none sm:flex-col sm:items-start sm:justify-center sm:gap-2.5 sm:border-b-0 sm:border-r")}>
        <div aria-hidden className="absolute inset-0 pointer-events-none [background:radial-gradient(120%_140%_at_100%_0,color-mix(in_srgb,var(--ghue)_14%,transparent),transparent_60%)]" />
        <span className="grid h-[2.875rem] w-[2.875rem] flex-none place-items-center border border-solid border-accent-line bg-accent-soft text-accent cut-seal cut-seal-edge [--cut-line:var(--accent-line)] [--cut:9px]">
          <Icon name={pm.icon} size={22} />
        </span>
        <div className="relative z-[1] min-w-0 flex-1">
          <span className="block truncate font-display text-[1rem]/[1.1] font-bold uppercase not-italic tracking-[0.01em]">{sorteo.prize.name}</span>
          <span className="mt-1.5 flex items-center gap-2 font-mono text-[0.625rem]/none font-medium uppercase tracking-[0.06em] text-txt-muted">
            <Icon name="user" size={11} />
            {sorteo.prize.winners} {t("winner", { count: sorteo.prize.winners })}
          </span>
        </div>
        <div className={cn("relative z-[1] ml-auto flex-none text-right", row && "sm:ml-0 sm:text-left")}>
          <b className="font-display text-[1.375rem]/none font-extrabold italic text-txt">{srtNum(sorteo.prize.value)}€</b>
          <small className="mt-[3px] block font-mono text-[0.53125rem]/none font-medium uppercase tracking-[0.1em] text-txt-muted">valor</small>
        </div>
      </div>

      <div className={cn("flex flex-1 flex-col px-[1.125rem] pb-4 pt-[0.9375rem]", row && "sm:px-5 sm:py-4")}>
        <div className="mb-[0.6875rem] flex items-center gap-2.5">
          <SrtStatusChip status={status} />
          <span className="ml-auto">
            <SrtSourceTag source={sorteo.source} />
          </span>
        </div>
        <h3 className="text-[1.3125rem]/[1.05]">{sorteo.title}</h3>
        <p className={cn("mt-[0.4375rem] text-[0.8125rem]/[1.5] text-txt-muted text-pretty", row ? "line-clamp-1" : "line-clamp-2")}>{sorteo.description}</p>

        {status.key === "active" && sorteo.cap && (
          <div className="mt-3">
            <div className="h-[0.3125rem] overflow-hidden border border-solid border-line bg-panel-2">
              <span className="block h-full bg-[color:var(--ghue)] opacity-[0.85] transition-[width] duration-[420ms]" style={{ width: capPct + "%" }} />
            </div>
          </div>
        )}

        <div className="mt-[0.875rem] flex flex-wrap items-center gap-[0.875rem] border-t border-dashed border-line pt-3">
          {status.key === "announced" && sorteo.winner ? (
            <span className="inline-flex items-center gap-2 font-mono text-[0.6875rem]/none font-semibold uppercase tracking-[0.05em] text-accent">
              <Icon name="trophy" size={14} />
              <Avatar accent className="h-[1.375rem] w-[1.375rem] text-[0.625rem]">{sorteo.winner.avatar}</Avatar>
              {sorteo.winner.name}
            </span>
          ) : status.key === "upcoming" ? (
            <span className="inline-flex items-center gap-1.5 font-mono text-[0.6875rem]/none font-medium uppercase tracking-[0.04em] text-txt-muted">
              <Icon name="clock" size={13} className="text-txt-dim" />
              {t("opensIn")} <Countdown date={sorteo.startDate} compact ns="common.giveaways.countdown" />
            </span>
          ) : status.key === "active" ? (
            <span className="inline-flex items-center gap-1.5 font-mono text-[0.6875rem]/none font-medium uppercase tracking-[0.04em] text-txt-muted">
              <Icon name="clock" size={13} className="text-txt-dim" />
              {t("closesIn")} <Countdown date={sorteo.endDate} compact ns="common.giveaways.countdown" />
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 font-mono text-[0.6875rem]/none font-medium uppercase tracking-[0.04em] text-txt-muted">
              <Icon name="clock" size={13} className="text-txt-dim" />
              {t("drawingNow")}
            </span>
          )}
          {entered && status.key === "active" ? (
            <span className="ml-auto inline-flex items-center gap-1.5 border border-solid border-[color-mix(in_srgb,var(--ok)_40%,transparent)] bg-ok-soft px-2 py-[0.3125rem] font-mono text-[0.625rem]/none font-semibold uppercase tracking-[0.08em] text-ok">
              <Icon name="check" size={12} />
              {t("youAreIn")}
            </span>
          ) : (
            <span className="ml-auto inline-flex items-center gap-1.5 font-mono text-[0.6875rem]/none font-medium uppercase tracking-[0.04em] text-txt-muted">
              <Icon name="users" size={13} className="text-txt-dim" />
              {srtNum(sorteo.entrants)}
            </span>
          )}
        </div>
      </div>
      <span className="absolute bottom-[0.875rem] right-4 text-txt-dim transition-[color,transform] duration-[140ms] group-hover:translate-x-1 group-hover:text-accent-bright">
        <Icon name="arrow" size={18} />
      </span>
    </button>
  )
}

export function SrtFeatured({ sorteo, entered, onOpen }: { sorteo: Sorteo; entered?: boolean; onOpen?: (href: string) => void }) {
  const t = useGiveawaysT()
  const status = srtStatus(sorteo)
  const pm = srtPrizeMeta(sorteo.prize.type)
  const open = () => onOpen && onOpen("/sorteos?g=" + sorteo.slug)
  const cta = status.key === "active" ? (entered ? t("youreInDotView") : t("participateNow")) : status.key === "announced" ? t("viewWinner") : status.key === "upcoming" ? t("viewDetails") : t("viewGiveaway")
  return (
    <div className="relative mb-[1.875rem] grid min-h-[21.25rem] grid-cols-1 border border-solid border-line border-t-[3px] border-t-accent bg-base-2 cut-corner cut-corner-edge [--cut-lg:20px] md:grid-cols-[1.15fr_0.85fr]">
      <div className="relative min-h-[13.75rem] border-b border-solid border-line md:border-b-0 md:border-r">
        <div aria-hidden className="absolute inset-0 z-0 bg-base" />
        <div aria-hidden className="pointer-events-none absolute inset-0 z-[1] [background:linear-gradient(105deg,transparent_40%,color-mix(in_srgb,var(--panel)_70%,transparent)_82%,var(--panel)_100%),radial-gradient(120%_120%_at_20%_20%,color-mix(in_srgb,var(--accent)_22%,transparent),transparent_55%)]" />
        <div aria-hidden className="pointer-events-none absolute inset-0 z-[1] opacity-[0.35] mix-blend-multiply [background:repeating-linear-gradient(to_bottom,transparent_0_3px,rgba(0,0,0,0.2)_3px_4px)]" />
        <Icon name={pm.icon} size={230} className="pointer-events-none absolute -bottom-[1.875rem] -left-6 z-[1] text-accent opacity-[0.16]" />
        <div className="absolute left-[1.375rem] top-5 z-[2] flex flex-col gap-0.5">
          <small className="font-mono text-[0.59375rem]/none font-semibold uppercase tracking-[0.14em] text-accent">{t("prizeValue")}</small>
          <b className="font-display text-[2.5rem]/[0.9] font-extrabold italic text-txt [text-shadow:0_2px_20px_rgba(0,0,0,0.5)]">{srtNum(sorteo.prize.value)} €</b>
        </div>
      </div>
      <div className="relative z-[2] flex flex-col px-[1.875rem] pb-6 pt-[1.625rem]">
        <div className="mb-[0.875rem] flex flex-wrap items-center gap-3">
          <span className="font-mono text-[0.625rem]/none font-semibold uppercase tracking-[0.16em] text-accent">{t("featuredGiveaway")}</span>
          <SrtStatusChip status={status} />
        </div>
        <h2 className="text-[clamp(1.875rem,3.4vw,2.875rem)]/[0.96]">{sorteo.title}</h2>
        <p className="mt-3 line-clamp-3 max-w-[52ch] text-[0.9375rem]/[1.55] text-txt-muted text-pretty">{sorteo.description}</p>
        <div className="mt-auto flex flex-wrap items-center gap-4 pt-[1.125rem]">
          <SrtPrizeTag type={sorteo.prize.type} winners={sorteo.prize.winners} />
          <span className="inline-flex items-center gap-2 whitespace-nowrap font-mono text-[0.6875rem]/none font-semibold uppercase tracking-[0.09em] text-txt-muted">
            <Icon name="users" size={14} className="text-accent" />
            <b className="text-txt">{srtNum(sorteo.entrants)}</b> {t("participants")}
          </span>
        </div>
        <div className="mt-4 flex flex-wrap gap-2.5">
          <Button variant="pri" iconRight="arrow" onClick={open}>
            {cta}
          </Button>
          {status.key === "active" && !entered && (
            <span className="border border-solid border-line bg-panel px-[0.875rem] py-2.5">
              <Countdown date={sorteo.endDate} ns="common.giveaways.countdown" />
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
