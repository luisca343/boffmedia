import * as React from "react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { Icon, Spinner } from "@boffmedia/ui"
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
  coverUrl?: string | null
  bio?: React.ReactNode
  tags?: React.ReactNode
  statusBadge?: React.ReactNode
  metrics?: ProfileMetric[]
  live?: boolean
  liveLabel?: string
  editable?: boolean
  uploading?: boolean
  coverUploading?: boolean
  avatarLabel?: string
  coverLabel?: string
  onAvatarClick?: () => void
  onCoverClick?: () => void
  className?: string
}

const CAM_BTN = cn(
  "grid place-items-center border border-solid border-line-2 bg-[rgba(11,13,17,0.7)] text-txt cut-tag cut-tag-edge [--cut-line:var(--line-2)]",
  "transition-[background,color,border-color] duration-[140ms] hover:border-accent hover:bg-accent hover:text-accent-ink",
)

export function ProfileHero({
  name,
  handle,
  initial,
  avatarUrl,
  coverUrl,
  bio,
  tags,
  statusBadge,
  metrics,
  live,
  liveLabel,
  editable,
  uploading,
  coverUploading,
  avatarLabel,
  coverLabel,
  onAvatarClick,
  onCoverClick,
  className,
}: ProfileHeroProps) {
  const t = useTranslations("common.profile")
  return (
    <div className={cn("relative mb-[1.375rem] border border-solid border-line bg-panel cut-corner cut-corner-edge", className)}>
      {/* cover band */}
      <div className="relative h-[14.75rem] overflow-hidden bg-panel-2">
        {coverUrl && (
          <ArtImage
            src={coverUrl}
            alt=""
            sizes="100vw"
            className="absolute inset-0 z-[1] h-full w-full object-cover"
            fallback={<span className="absolute inset-0 bg-panel-2" />}
          />
        )}
        {coverUploading && (
          <span className="absolute inset-0 z-[5] grid place-items-center bg-black/60">
            <Spinner />
          </span>
        )}
        <div className="pointer-events-none absolute inset-0 z-[2] bg-[repeating-linear-gradient(0deg,rgba(0,0,0,0.16)_0_1px,transparent_1px_3px)] opacity-50 mix-blend-multiply" />
        <div
          className="pointer-events-none absolute inset-0 z-[2] bg-[radial-gradient(var(--line-2)_1px,transparent_1px)] opacity-[0.22] [background-size:22px_22px]"
          style={{ maskImage: "linear-gradient(180deg, transparent, #000 70%)", WebkitMaskImage: "linear-gradient(180deg, transparent, #000 70%)" }}
        />
        <div className="pointer-events-none absolute inset-0 z-[3] bg-[linear-gradient(180deg,rgba(0,0,0,0.28)_0%,rgba(0,0,0,0)_34%,var(--panel)_98%)]" />

        {live && (
          <span className="absolute left-0 top-4 z-[4] inline-flex items-center gap-2 bg-accent py-[0.4375rem] pl-5 pr-3.5 font-mono text-[0.6875rem]/none font-bold uppercase tracking-[0.16em] text-accent-ink cut-slant-r [--cut:9px]">
            <i className="h-[0.4375rem] w-[0.4375rem] rounded-full bg-accent-ink animate-[bm-pulse_1.6s_ease-in-out_infinite] motion-reduce:animate-none" />
            {liveLabel ?? t("live")}
          </span>
        )}

        {editable && (
          <button
            type="button"
            aria-label={coverLabel ?? t("changeCover")}
            title={coverLabel ?? t("changeCover")}
            onClick={onCoverClick}
            className={cn(CAM_BTN, "absolute right-4 top-4 z-[6] h-[2.375rem] w-[2.375rem]")}
          >
            <Icon name="camera" size={18} />
          </button>
        )}
      </div>

      {/* lower-third identity */}
      <div className="relative z-[4] -mt-[4.25rem] flex items-end gap-[1.625rem] px-[1.875rem] pb-[1.625rem] max-[720px]:flex-wrap max-[720px]:gap-[1.125rem] max-[720px]:px-5 max-[720px]:pb-[1.375rem]">
        {/* positioning wrapper is NOT clipped, so the camera badge escapes the
            avatar's diagonal cut instead of being sheared off by it */}
        <div className="relative h-[8.5rem] w-[8.5rem] flex-none">
          <div
            className={cn(
              "absolute inset-0 border-4 border-solid border-accent bg-panel-2 cut-seal cut-seal-edge [--cut-w:4px] [--cut-line:var(--accent)] [--cut:16px] shadow-[0_16px_38px_-12px_rgba(255,92,10,0.55)]",
              editable && "cursor-pointer",
            )}
            onClick={editable ? onAvatarClick : undefined}
          >
            <ArtImage
              src={avatarUrl}
              alt={name}
              sizes="136px"
              fallback={
                <span className="absolute inset-0 grid place-items-center bg-panel-2 font-display text-[3.25rem]/none font-extrabold italic text-accent">
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
              aria-label={avatarLabel ?? t("changePhoto")}
              onClick={(e) => {
                e.stopPropagation()
                onAvatarClick?.()
              }}
              className={cn(CAM_BTN, "absolute -bottom-1 -right-1 z-[5] h-[2.125rem] w-[2.125rem]")}
            >
              <Icon name="camera" size={16} />
            </button>
          )}
        </div>

        <div className="min-w-0 flex-1 pb-1.5">
          <div className="flex flex-wrap items-center gap-[0.875rem]">
            <h2 className="font-display text-[clamp(2.125rem,4vw,2.875rem)]/[0.94] font-extrabold italic uppercase text-txt">{name}</h2>
            {statusBadge}
          </div>
          <div className="mt-2.5 font-mono text-[0.75rem]/none font-medium uppercase tracking-[0.1em] text-txt-muted [&_b]:font-semibold [&_b]:text-txt">
            {handle}
          </div>
          {tags && <div className="mt-[0.9375rem] flex flex-wrap gap-2">{tags}</div>}
          {bio && (
            <p className="mt-3 max-w-[62ch] font-body text-[0.875rem]/[1.55] text-pretty text-txt-muted">
              {bio}
            </p>
          )}
        </div>

        {metrics && metrics.length > 0 && (
          <div className="flex flex-none self-end border border-solid border-line bg-base max-[720px]:w-full max-[720px]:self-stretch">
            {metrics.map((m, i) => (
              <div key={i} className="border-l border-solid border-line px-6 py-3 text-right first:border-l-0 max-[720px]:flex-1">
                <div className="font-display text-[1.875rem]/none font-extrabold italic text-accent">{m.v}</div>
                <span className="mt-[0.4375rem] block font-mono text-[0.5625rem]/none font-medium uppercase tracking-[0.14em] text-txt-muted">
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
