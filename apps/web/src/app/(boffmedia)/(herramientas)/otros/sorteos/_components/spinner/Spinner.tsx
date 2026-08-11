"use client"

import { useTranslations } from "next-intl"
import SpinnerItem from "./SpinnerItem"

interface SpinnerProps {
  spinItems: string[]
  scrollPosition: number
  isSpinning: boolean
  spinComplete: boolean
  winnerIndex: number | null
  spinnerRef: React.RefObject<HTMLDivElement | null>
  itemsContainerRef: React.RefObject<HTMLDivElement | null>
  ITEM_WIDTH: number
}

export default function Spinner({
  spinItems,
  scrollPosition,
  isSpinning,
  spinComplete,
  winnerIndex,
  spinnerRef,
  itemsContainerRef,
}: SpinnerProps) {
  const t = useTranslations("otros.sorteosApp")
  const live = isSpinning && !spinComplete
  return (
    <div className="relative w-full">
      <div
        className="cut-corner cut-corner-edge [--cut-lg:14px] border border-line bg-panel transition-all duration-500"
        style={{
          
          boxShadow: spinComplete
            ? "0 8px 40px rgba(0,0,0,0.5), 0 0 60px color-mix(in srgb, var(--accent) 16%, transparent)"
            : "0 8px 40px rgba(0,0,0,0.5)",
        }}
      >
        {/* accent signal bar */}
        <div className="h-[3px] bg-gradient-to-r from-accent-bright to-accent" />

        <div className="p-4">
          {/* header row — REC/LIVE indicator + status title */}
          <div className="mb-4 flex items-center gap-2 px-1">
            <span
              className={
                "h-2 w-2 flex-none rounded-full " +
                (live ? "animate-[bm-pulse_0.8s_ease-in-out_infinite] bg-bad motion-reduce:animate-none" : "bg-accent")
              }
              style={{
                boxShadow: live
                  ? "0 0 8px color-mix(in srgb, var(--bad) 80%, transparent)"
                  : "0 0 8px color-mix(in srgb, var(--accent) 60%, transparent)",
              }}
            />
            <h3
              className={
                "font-display text-sm font-bold not-italic uppercase tracking-[0.06em] transition-colors " +
                (spinComplete ? "text-accent" : "text-txt")
              }
            >
              {spinComplete ? t("spinnerWinnerSelected") : live ? t("spinnerSpinning") : t("spinnerRuleta")}
            </h3>
          </div>

          {/* viewport */}
          <div
            ref={spinnerRef}
            className="relative h-72 overflow-hidden border border-line-2 bg-base-deep transition-all duration-500"
            style={{
              boxShadow: spinComplete
                ? "inset 0 0 50px color-mix(in srgb, var(--accent) 12%, transparent)"
                : "inset 0 0 30px rgba(0,0,0,0.55)",
              borderColor: spinComplete ? "var(--accent-line)" : undefined,
            }}
          >
            {/* items strip */}
            <div
              ref={itemsContainerRef}
              className="absolute inset-y-0 left-0 flex h-full items-center"
              style={{
                transform: `translateX(${-scrollPosition}px)`,
                transition: spinComplete ? "transform 0.5s ease-out" : "none",
              }}
            >
              {spinItems.map((name, index) => (
                <SpinnerItem
                  key={`${name}-${index}`}
                  name={name}
                  index={index}
                  isWinningItem={winnerIndex === index}
                  spinComplete={spinComplete}
                />
              ))}
            </div>

            {/* broadcast scanlines */}
            <div
              className="pointer-events-none absolute inset-0 z-20 opacity-60"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.18) 3px, rgba(0,0,0,0.18) 4px)",
              }}
            />

            {/* edge fade masks */}
            <div className="pointer-events-none absolute inset-y-0 left-0 z-30 w-36" style={{ background: "linear-gradient(to right, var(--bg-deep) 40%, transparent)" }} />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-30 w-36" style={{ background: "linear-gradient(to left, var(--bg-deep) 40%, transparent)" }} />

            {/* center selection reticle */}
            <div className="pointer-events-none absolute inset-y-0 left-1/2 z-40 flex -translate-x-[1px] flex-col items-center">
              <span
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: "10px solid transparent",
                  borderRight: "10px solid transparent",
                  borderTop: "14px solid var(--accent)",
                  filter: "drop-shadow(0 0 6px color-mix(in srgb, var(--accent) 60%, transparent))",
                }}
              />
              <span className="w-[2px] flex-1" style={{ background: "linear-gradient(to bottom, var(--accent), color-mix(in srgb, var(--accent) 8%, transparent))" }} />
              <span
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: "10px solid transparent",
                  borderRight: "10px solid transparent",
                  borderBottom: "14px solid var(--accent)",
                  filter: "drop-shadow(0 0 6px color-mix(in srgb, var(--accent) 60%, transparent))",
                }}
              />
            </div>
          </div>

          {/* status row */}
          <div className="mt-3 flex min-h-[20px] items-center justify-center gap-2">
            {!spinComplete ? (
              <div className="flex gap-1.5">
                {[0, 0.16, 0.32].map((delay, i) => (
                  <span key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent opacity-70 motion-reduce:animate-none" style={{ animationDelay: `${delay}s` }} />
                ))}
              </div>
            ) : (
              <span className="inline-flex items-center gap-[6px] font-mono text-xs font-bold uppercase tracking-[0.18em] text-accent">
                <span aria-hidden="true">✓</span> {t("spinnerGanadorConfirmado")}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
