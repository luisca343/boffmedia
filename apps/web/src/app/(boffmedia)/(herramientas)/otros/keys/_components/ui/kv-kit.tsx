"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Icon, Seg, Button, IconButton } from "@boffmedia/ui"
import { cn } from "@/lib/utils"
import type { SteamGame, MediaItem } from "../../../_hooks/useFetchSteamData"
import { SteamArt, SteamGallery, SteamFact, platformList } from "../../../_components/steam-media"

/* ── steam art — shared with the sibling steamfree tool ──────────────────── */
export const KvArt = SteamArt

/* ── status chip (disponible | entregada) ─────────────────────────────────── */
export function KvStatus({ given, label }: { given: boolean; label: string }) {
  const clip = {  }
  return (
    <span
      style={clip}
      className={cn("cut cut-edge-slant [--cut:4px]", 
        "inline-flex items-center gap-[7px] border px-[9px] py-[6px] font-mono text-[9.5px] font-bold uppercase leading-none tracking-[0.1em] " +
        (given
          ? "border-[color-mix(in_srgb,var(--warn)_28%,transparent)] bg-[color-mix(in_srgb,var(--warn)_8%,transparent)] text-txt-dim"
          : "border-[color-mix(in_srgb,var(--ok)_40%,transparent)] bg-ok-soft text-ok")
      )}
    >
      <Icon name={given ? "check" : "bookmark"} size={11} />
      {label}
    </span>
  )
}

/* ── via chip (source column — free text from the sheet) ──────────────────── */
type ViaMeta = { icon: "trophy" | "gift"; tone: "sorteo" | "manual" | "neutral" }
function viaMeta(source: string): ViaMeta {
  const s = source.trim().toLowerCase()
  if (!s) return { icon: "gift", tone: "neutral" }
  if (s.includes("sorteo") || s.includes("giveaway") || s.includes("raffle"))
    return { icon: "trophy", tone: "sorteo" }
  if (s.includes("manual") || s.includes("entrega") || s.includes("directo"))
    return { icon: "gift", tone: "manual" }
  return { icon: "gift", tone: "neutral" }
}

export function KvVia({ source, sm }: { source: string; sm?: boolean }) {
  if (!source.trim()) return null
  const m = viaMeta(source)
  const tone =
    m.tone === "sorteo"
      ? "border-accent-line bg-accent-soft text-accent"
      : m.tone === "manual"
        ? "border-[color-mix(in_srgb,var(--info)_30%,transparent)] bg-signal-soft text-signal"
        : "border-line-2 bg-panel-2 text-txt-muted"
  return (
    <span
      className={
        "inline-flex items-center gap-[7px] border font-mono font-semibold uppercase leading-none " +
        (sm ? "px-[7px] py-[5px] text-[9.5px] tracking-[0.06em]" : "px-[9px] py-[6px] text-[10px] tracking-[0.08em]") +
        " " +
        tone
      }
    >
      <Icon name={m.icon} size={12} className="flex-none" />
      {source}
    </span>
  )
}

/* ── grid card ────────────────────────────────────────────────────────────── */
export interface KvItem {
  name: string
  steamID: string
  imageUrl: string
  given: boolean
  source: string
  count: number
}

export function KvCard({
  item,
  cta,
  availableLabel,
  deliveredLabel,
  onOpen,
}: {
  item: KvItem
  cta: string
  availableLabel: string
  deliveredLabel: string
  onOpen: (item: KvItem) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(item)}
      aria-label={item.name}
      className={cn("cut-tag cut-tag-edge [--cut-tag:14px]", 
        "group relative flex cursor-pointer flex-col border border-line bg-panel p-0 text-left " +
        "transition-[border-color,transform,background] duration-[140ms] hover:-translate-y-[3px] hover:bg-panel-2 " +
        "hover:border-[color-mix(in_srgb,var(--accent)_45%,var(--line))] " +
        (item.given ? "opacity-[0.72]" : "")
      )}
    >
      <div className="relative aspect-[460/200] border-b border-line">
        <KvArt src={item.imageUrl} name={item.name} />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,color-mix(in_srgb,var(--panel)_80%,transparent),transparent_45%)]" />
        <div className="absolute inset-x-[10px] top-[10px] z-[2] flex items-start justify-between gap-2">
          <KvStatus given={item.given} label={item.given ? deliveredLabel : availableLabel} />
          <KvVia source={item.source} sm />
        </div>
        {!item.given && item.count > 1 && (
          <span className="absolute bottom-[10px] right-[10px] z-[2] inline-flex items-center gap-[6px] border border-line-2 bg-[color-mix(in_srgb,var(--bg)_82%,transparent)] px-[8px] py-[5px] font-mono text-[10px] font-bold uppercase leading-none tracking-[0.06em] text-txt backdrop-blur-[4px]">
            <Icon name="layers" size={12} className="text-accent" />
            {item.count}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-[10px] px-[16px] pb-[16px] pt-[14px]">
        <span className="min-w-0 truncate font-display text-[19px] font-bold leading-[1.1] text-txt">{item.name}</span>
        <div className="mt-auto flex items-center gap-[10px] border-t border-dashed border-line pt-[12px]">
          <span className="font-mono text-[11px] font-bold uppercase leading-none tracking-[0.08em] text-txt-muted">{cta}</span>
          <Icon
            name="arrow"
            size={17}
            className="ml-auto text-txt-muted transition-[color,transform] duration-[140ms] group-hover:translate-x-[4px] group-hover:text-accent-bright"
          />
        </div>
      </div>
    </button>
  )
}

/* ── modal · info section ─────────────────────────────────────────────────── */
export function KvInfo({ game, t }: { game: SteamGame; t: KvModalStrings }) {
  const desc = (game.shortDescription || "").trim()
  return (
    <div className="grid gap-[16px]">
      {desc && <p className="text-pretty text-[14px] leading-[1.55] text-txt-muted">{desc}</p>}
      <div className="grid grid-cols-2 gap-px border border-line bg-line max-[600px]:grid-cols-1">
        <SteamFact k={t.developer}>{game.developers?.join(", ") || "—"}</SteamFact>
        <SteamFact k={t.publisher}>{game.publishers?.join(", ") || "—"}</SteamFact>
        <SteamFact k={t.release}>{game.releaseDate || "—"}</SteamFact>
        <SteamFact k={t.platforms}>{platformList(game.platforms)}</SteamFact>
      </div>
      {game.genres?.length > 0 && (
        <div className="grid gap-[8px]">
          <span className="font-mono text-[9.5px] font-semibold uppercase leading-none tracking-[0.1em] text-txt-dim">{t.genres}</span>
          <div className="flex flex-wrap gap-[6px]">
            {game.genres.map((g) => (
              <span key={g} className="border border-line-2 bg-panel-2 px-[8px] py-[5px] font-mono text-[9.5px] font-semibold uppercase leading-none tracking-[0.05em] text-txt-muted">
                {g}
              </span>
            ))}
          </div>
        </div>
      )}
      {game.website && (
        <Button variant="ghost" icon="external" href={game.website}>
          {t.officialSite}
        </Button>
      )}
    </div>
  )
}

/* ── modal · price section ────────────────────────────────────────────────── */
function isMissing(p?: string) {
  return !p || p === "N/A"
}
function isFreePrice(p?: string) {
  if (!p) return false
  return /^0(?:[.,]0+)?\s*€?$/.test(p.trim())
}

export function KvPrice({ game, t }: { game: SteamGame; t: KvModalStrings }) {
  const free = isFreePrice(game.currentPrice) || isFreePrice(game.normalPrice)
  const hasDiscount = game.discountPercent > 0 && game.normalPrice !== game.currentPrice && !isMissing(game.currentPrice)
  const missing = isMissing(game.currentPrice) && !free
  return (
    <div className="flex flex-col items-start gap-[10px] border border-line bg-panel-2 p-[22px]">
      {hasDiscount && (
        <div className="inline-flex items-center gap-[12px]">
          <span className="border border-[color-mix(in_srgb,var(--ok)_40%,transparent)] bg-ok-soft px-[9px] py-[6px] font-display text-[16px] font-extrabold italic leading-none text-ok">
            -{game.discountPercent}%
          </span>
          <span className="font-mono text-[15px] leading-none text-txt-dim line-through">{game.normalPrice}</span>
        </div>
      )}
      <span className={"font-display text-[44px] font-extrabold italic leading-[0.9] " + (free ? "text-ok" : "text-accent")}>
        {free ? t.free : missing ? "—" : game.currentPrice}
      </span>
      <span className="font-mono text-[11px] font-medium uppercase leading-none tracking-[0.06em] text-txt-muted">
        {free ? t.freeNote : missing ? t.priceUnknown : hasDiscount ? t.priceNow : t.priceSteam}
      </span>
    </div>
  )
}

/* ── modal · media gallery (delegates to the shared Steam kit) ────────────── */
export function KvGallery({ media, name }: { media: MediaItem[]; name: string }) {
  const t = useTranslations("otros.keysApp")
  return <SteamGallery media={media} name={name} thumbLabel={(n) => t("mediaN", { n })} />
}

/* ── detail modal ─────────────────────────────────────────────────────────── */
export interface KvModalStrings {
  developer: string
  publisher: string
  release: string
  platforms: string
  genres: string
  officialSite: string
  free: string
  freeNote: string
  priceUnknown: string
  priceNow: string
  priceSteam: string
  tabInfo: string
  tabPrice: string
  tabMedia: string
  viewSteam: string
  loading: string
  stock: string
  available: string
  delivered: string
}

export function KeyModal({
  item,
  game,
  loading,
  onClose,
  t,
}: {
  item: KvItem
  game: SteamGame | null
  loading: boolean
  onClose: () => void
  t: KvModalStrings
}) {
  const tc = useTranslations("common.primitives")
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
  }, [item.steamID, onClose])

  const hero = game?.headerImage || item.imageUrl

  return (
    <div className="fixed inset-0 z-[200] grid place-items-center p-[20px]" role="dialog" aria-modal="true" aria-label={item.name}>
      <button type="button" aria-label={tc("close")} onClick={onClose} className="absolute inset-0 cursor-default border-0 bg-[rgba(0,0,0,0.62)] p-0 backdrop-blur-[3px]" />
      <div
        className="cut-corner cut-corner-edge [--cut-line:var(--line-2)] [--cut-lg:18px] relative max-h-[92vh] w-[min(600px,100%)] overflow-y-auto border border-line-2 border-t-[3px] border-t-accent bg-panel animate-[bm-modal-in_var(--t-med,180ms)] motion-reduce:animate-none bm-scroll"
      >
        <IconButton name="x" label={tc("close")} onClick={onClose} className="absolute right-[14px] top-[14px] z-[3]" />
        <div className="relative aspect-[460/172] border-b border-line">
          <KvArt src={hero} name={item.name} />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,var(--panel),transparent_55%)]" />
        </div>
        <div className="grid gap-[14px] px-[22px] pt-[16px]">
          <div className="flex items-start justify-between gap-[14px]">
            <div className="min-w-0">
              <h3 className="font-display text-[26px] font-extrabold not-italic uppercase leading-none tracking-[-0.005em] text-txt">{game?.name || item.name}</h3>
              <div className="mt-[10px] flex flex-wrap items-center gap-[8px]">
                <KvStatus given={item.given} label={item.given ? t.delivered : t.available} />
                <KvVia source={item.source} sm />
                {!item.given && item.count > 1 && (
                  <span className="inline-flex items-center gap-[6px] border border-line-2 px-[8px] py-[5px] font-mono text-[10px] font-semibold uppercase leading-none tracking-[0.06em] text-txt-muted">
                    <Icon name="layers" size={12} className="text-accent" />
                    {item.count} {t.stock}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div>
            <Seg
              className="w-full [&>button]:flex-1 [&>button]:justify-center"
              value={tab}
              onChange={setTab}
              options={[
                { value: "info", label: t.tabInfo },
                { value: "price", label: t.tabPrice },
                { value: "media", label: t.tabMedia },
              ]}
            />
          </div>
        </div>
        <div className="grid min-h-[200px] gap-[16px] px-[22px] pb-[22px] pt-[16px]">
          {loading || !game ? (
            <div className="grid place-items-center py-[60px] text-txt-dim">
              <Icon name="refresh" size={28} className="animate-spin" />
              <span className="mt-3 font-mono text-[11px] uppercase tracking-[0.1em]">{t.loading}</span>
            </div>
          ) : (
            <>
              {tab === "info" && <KvInfo game={game} t={t} />}
              {tab === "price" && <KvPrice game={game} t={t} />}
              {tab === "media" && <KvGallery media={game.media} name={game.name} />}
            </>
          )}
          <div className="mt-[4px] flex flex-wrap gap-[10px] border-t border-line pt-[16px]">
            <Button variant="ghost" icon="external" href={`https://store.steampowered.com/app/${item.steamID}`}>
              {t.viewSteam}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
