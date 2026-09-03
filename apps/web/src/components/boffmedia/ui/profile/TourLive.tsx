import * as React from "react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { Button, Icon } from "@boffmedia/ui"
import type { TourData } from "./profile-data"

export interface TourLiveProps extends TourData {
  liveLabel?: string
  hue?: number // game hue for the left bar + format tint; defaults to the accent orange (28)
  action?: { label: React.ReactNode; href: string } // "Entrar a mi partida" — links to the live match
  className?: string
}

export function TourLive({ name, where, format, stats, roundLabel, vs, liveLabel, hue, action, className }: TourLiveProps) {
  const t = useTranslations("common.profile")
  const tint = hue != null ? `hsl(${hue} 65% 62%)` : undefined
  return (
    <div
      className={cn(
        "border border-solid border-line border-l-[3px] border-l-[hsl(28_60%_50%)] bg-panel cut-corner cut-corner-edge",
        className,
      )}
      style={hue != null ? { borderLeftColor: `hsl(${hue} 60% 50%)` } : undefined}
    >
      <div className="flex items-center justify-between gap-3 border-b border-solid border-line bg-panel-2 px-[1.125rem] py-[0.6875rem]">
        <span className="inline-flex items-center gap-2 font-mono text-[0.625rem]/none font-bold uppercase tracking-[0.12em] text-bad">
          <i className="h-[0.4375rem] w-[0.4375rem] rounded-full bg-bad animate-[bm-pulse_1.8s_ease-in-out_infinite] motion-reduce:animate-none" />
          {liveLabel ?? t("live")}
        </span>
        <span
          className="inline-flex items-center gap-1.5 font-mono text-[0.65625rem]/none font-semibold text-[hsl(28_65%_62%)]"
          style={tint ? { color: tint } : undefined}
        >
          <Icon name="trophy" size={12} className="text-[hsl(28_65%_62%)]" style={tint ? { color: tint } : undefined} />
          {format}
        </span>
      </div>

      <div className="grid items-center gap-5 p-[16px_18px] [grid-template-columns:1fr_auto] max-[720px]:grid-cols-1">
        <div>
          <h3 className="mb-1 font-display text-[1.25rem]/[1.05] font-bold uppercase tracking-[0.02em] text-txt">{name}</h3>
          {where && <p className="mb-3 font-mono text-[0.75rem]/[1.3] font-medium text-txt-muted">{where}</p>}
          {stats && stats.length > 0 && (
            <div className="flex flex-wrap gap-0 [row-gap:14px]">
              {stats.map((s) => (
                <div key={s.k} className="grid gap-1.5 border-l border-solid border-line px-[1.375rem] py-0.5 first:border-l-0 first:pl-0">
                  <span className="font-mono text-[0.5625rem]/none font-bold uppercase tracking-[0.15em] text-txt-dim">{s.k}</span>
                  <span className="font-display text-[1.625rem]/none font-bold italic text-txt [&_em]:font-bold [&_em]:not-italic [&_em]:text-txt-dim">
                    {s.v}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {(roundLabel || vs || action) && (
          <div className="grid min-w-[13.75rem] justify-items-start gap-[0.5625rem] border-l border-solid border-line pl-5 max-[720px]:border-l-0 max-[720px]:border-t max-[720px]:pl-0 max-[720px]:pt-4">
            {roundLabel && (
              <span className="inline-flex items-center gap-[0.4375rem] font-mono text-[0.59375rem]/none font-bold uppercase tracking-[0.12em] text-ok">
                <i className="h-1.5 w-1.5 rounded-full bg-ok" />
                {roundLabel}
              </span>
            )}
            {vs && (
              <p className="font-body text-[0.875rem]/[1.4] text-txt-muted [&_b]:inline-flex [&_b]:items-center [&_b]:gap-[0.3125rem] [&_b]:font-bold [&_b]:text-txt">
                {vs}
              </p>
            )}
            {action && (
              <Button href={action.href} variant="pri" size="sm" icon="arrow">
                {action.label}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
