import * as React from "react"
import { cn } from "@/lib/utils"
import { Icon, Spinner } from "@/components/boffmedia/primitives"
import { ArtImage } from "@/components/boffmedia/ui/tools/ArtImage"

export interface ProfileMetric {
  v: React.ReactNode
  l: string
}

export interface ProfileHeroProps {
  name: string
  handle: React.ReactNode
  initial: string
  avatarUrl?: string | null
  tags?: React.ReactNode
  statusBadge?: React.ReactNode
  metrics?: ProfileMetric[]
  live?: boolean
  liveLabel?: string
  editable?: boolean
  uploading?: boolean
  avatarLabel?: string
  onAvatarClick?: () => void
  onCoverClick?: () => void
  className?: string
}

const CAM_BTN = cn(
  "grid place-items-center border border-solid border-line-2 bg-[rgba(11,13,17,0.7)] text-txt cut-tag",
  "transition-[background,color,border-color] duration-[140ms] hover:border-accent hover:bg-accent hover:text-accent-ink",
)

export function ProfileHero({
  name,
  handle,
  initial,
  avatarUrl,
  tags,
  statusBadge,
  metrics,
  live,
  liveLabel = "EN VIVO",
  editable,
  uploading,
  avatarLabel = "Cambiar foto",
  onAvatarClick,
  onCoverClick,
  className,
}: ProfileHeroProps) {
  return (
    <div className={cn("relative mb-[22px] border border-solid border-line bg-panel cut-corner", className)}>
      {/* cover band */}
      <div className="relative h-[236px] overflow-hidden bg-panel-2">
        <div className="pointer-events-none absolute inset-0 z-[2] bg-[repeating-linear-gradient(0deg,rgba(0,0,0,0.16)_0_1px,transparent_1px_3px)] opacity-50 mix-blend-multiply" />
        <div
          className="pointer-events-none absolute inset-0 z-[2] bg-[radial-gradient(var(--line-2)_1px,transparent_1px)] opacity-[0.22] [background-size:22px_22px]"
          style={{ maskImage: "linear-gradient(180deg, transparent, #000 70%)", WebkitMaskImage: "linear-gradient(180deg, transparent, #000 70%)" }}
        />
        <div className="pointer-events-none absolute inset-0 z-[3] bg-[linear-gradient(180deg,rgba(0,0,0,0.28)_0%,rgba(0,0,0,0)_34%,var(--panel)_98%)]" />

        {live && (
          <span className="absolute left-0 top-4 z-[4] inline-flex items-center gap-2 bg-accent py-[7px] pl-5 pr-3.5 font-mono text-[11px]/none font-bold uppercase tracking-[0.16em] text-accent-ink [clip-path:polygon(0_0,100%_0,calc(100%_-_9px)_100%,0_100%)]">
            <i className="h-[7px] w-[7px] rounded-full bg-accent-ink animate-[bm-pulse_1.6s_ease-in-out_infinite] motion-reduce:animate-none" />
            {liveLabel}
          </span>
        )}

        {editable && (
          <button type="button" aria-label={avatarLabel} onClick={onCoverClick} className={cn(CAM_BTN, "absolute right-4 top-4 z-[5] h-[38px] w-[38px]")}>
            <Icon name="camera" size={18} />
          </button>
        )}
      </div>

      {/* lower-third identity */}
      <div className="relative z-[4] -mt-[68px] flex items-end gap-[26px] px-[30px] pb-[26px] max-[720px]:flex-wrap max-[720px]:gap-[18px] max-[720px]:px-5 max-[720px]:pb-[22px]">
        {/* positioning wrapper is NOT clipped, so the camera badge escapes the
            avatar's diagonal cut instead of being sheared off by it */}
        <div className="relative h-[136px] w-[136px] flex-none">
          <div
            className={cn(
              "absolute inset-0 overflow-hidden border-4 border-solid border-accent bg-panel-2 cut [--cut:16px] shadow-[0_16px_38px_-12px_rgba(255,92,10,0.55)]",
              editable && "cursor-pointer",
            )}
            onClick={editable ? onAvatarClick : undefined}
          >
            <ArtImage
              src={avatarUrl}
              alt={name}
              sizes="136px"
              fallback={
                <span className="absolute inset-0 grid place-items-center bg-panel-2 font-display text-[52px]/none font-extrabold italic text-accent">
                  {initial}
                </span>
              }
            />
            {uploading && (
              <span className="absolute inset-0 z-[6] grid place-items-center bg-black/70">
                <Spinner />
              </span>
            )}
          </div>
          {editable && (
            <button
              type="button"
              aria-label={avatarLabel}
              onClick={(e) => {
                e.stopPropagation()
                onAvatarClick?.()
              }}
              className={cn(CAM_BTN, "absolute -bottom-1 -right-1 z-[5] h-[34px] w-[34px]")}
            >
              <Icon name="camera" size={16} />
            </button>
          )}
        </div>

        <div className="min-w-0 flex-1 pb-1.5">
          <div className="flex flex-wrap items-center gap-[14px]">
            <h2 className="font-display text-[clamp(34px,4vw,46px)]/[0.94] font-extrabold italic uppercase text-txt">{name}</h2>
            {statusBadge}
          </div>
          <div className="mt-2.5 font-mono text-[12px]/none font-medium uppercase tracking-[0.1em] text-txt-muted [&_b]:font-semibold [&_b]:text-txt">
            {handle}
          </div>
          {tags && <div className="mt-[15px] flex flex-wrap gap-2">{tags}</div>}
        </div>

        {metrics && metrics.length > 0 && (
          <div className="flex flex-none self-end border border-solid border-line bg-base max-[720px]:w-full max-[720px]:self-stretch">
            {metrics.map((m, i) => (
              <div key={i} className="border-l border-solid border-line px-6 py-3 text-right first:border-l-0 max-[720px]:flex-1">
                <div className="font-display text-[30px]/none font-extrabold italic text-accent">{m.v}</div>
                <span className="mt-[7px] block font-mono text-[9px]/none font-medium uppercase tracking-[0.14em] text-txt-muted">
                  {m.l}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
