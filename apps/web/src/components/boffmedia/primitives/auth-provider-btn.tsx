"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Icon, type IconName } from "./icon"

export type AuthProvider = "google" | "discord" | "steam" | "twitch"

// Brand fills for providers that carry a strong identity colour. Google stays
// neutral (panel surface, brand lives only in the glyph). Values are one-off
// brand hexes, so they ride inline rather than living in the token vocabulary.
const BRAND: Record<AuthProvider, { bg?: string; ink?: string } | null> = {
  google: null,
  discord: { bg: "#5865F2", ink: "#ffffff" },
  steam: { bg: "#1b2838", ink: "#c7d5e0" },
  twitch: { bg: "#9146FF", ink: "#ffffff" },
}

export interface AuthProviderBtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  provider: AuthProvider
  icon?: IconName
  block?: boolean
  /** Renders the button disabled (e.g. a provider that isn't wired yet). */
  soon?: boolean
  children: React.ReactNode
}

export function AuthProviderBtn({
  provider,
  icon,
  block,
  soon,
  disabled,
  className,
  children,
  style,
  ...props
}: AuthProviderBtnProps) {
  const brand = BRAND[provider]
  // `soon` mutes the button but keeps it clickable (so it can surface a
  // "coming soon" hint); `disabled` fully blocks interaction.
  const muted = disabled || soon
  return (
    <button
      type="button"
      disabled={disabled}
      data-btn
      aria-disabled={muted || undefined}
      className={cn(
        "cut [--cut:7px] relative inline-flex items-center justify-center gap-2.5 select-none",
        "px-[18px] py-3 border border-solid",
        "font-display font-bold not-italic text-[13.5px]/none tracking-[0.05em]",
        "transition-[border-color,background,color,transform,filter] duration-[140ms] active:translate-y-px",
        brand
          ? "text-[color:var(--pvink)] border-[color:var(--pv)] bg-[color:var(--pv)] hover:brightness-110"
          : "text-txt border-line-2 bg-panel hover:border-[color-mix(in_srgb,var(--panel-2)_60%,var(--line-2))] hover:bg-[color-mix(in_srgb,var(--panel-2)_12%,var(--panel))]",
        block && "w-full",
        muted && "opacity-50",
        soon && "cursor-not-allowed active:translate-y-0",
        disabled && "pointer-events-none",
        className,
      )}
      style={
        brand
          ? ({ ["--pv" as string]: brand.bg, ["--pvink" as string]: brand.ink, ...style } as React.CSSProperties)
          : style
      }
      {...props}
    >
      <Icon name={icon ?? provider} size={17} className={cn(!brand && provider === "google" && "text-txt-muted")} />
      {children}
    </button>
  )
}
