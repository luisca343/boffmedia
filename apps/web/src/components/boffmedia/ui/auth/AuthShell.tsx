"use client"

import * as React from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { Icon, Kicker } from "@/components/boffmedia/primitives"

const GRID_BG: React.CSSProperties = {
  backgroundImage: [
    "radial-gradient(120% 80% at 50% -10%, var(--accent-soft), transparent 60%)",
    "linear-gradient(var(--line) 1px, transparent 1px)",
    "linear-gradient(90deg, var(--line) 1px, transparent 1px)",
  ].join(","),
  backgroundSize: "100% 100%, 100% 48px, 48px 100%",
  WebkitMaskImage: "radial-gradient(90% 70% at 50% 30%, #000 30%, transparent 78%)",
  maskImage: "radial-gradient(90% 70% at 50% 30%, #000 30%, transparent 78%)",
}

/**
 * The framed auth card (grid backdrop + logo + heading + back link) shared by
 * the recover / reset / verify screens. Mirrors the AuthScreen shell so the
 * flows read as one surface.
 */
export function AuthShell({
  kicker,
  title,
  subtitle,
  children,
}: {
  kicker: string
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  const t = useTranslations("auth")

  return (
    <div
      data-ds="boffmedia"
      data-footer-flush
      style={{ minHeight: "calc(100dvh - var(--nav-h))" }}
      className="relative flex flex-col items-center justify-center overflow-hidden px-5 py-14"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0 opacity-50" style={GRID_BG} />

      <div className="relative z-[1] flex w-full max-w-[440px] flex-col gap-[18px] border border-line-2 border-t-[3px] border-t-accent bg-panel px-[34px] pb-[30px] pt-8 shadow-[0_40px_80px_-34px_rgba(0,0,0,0.75)] cut-tag [--cut-tag:16px] max-[480px]:px-5 max-[480px]:pt-[26px] max-[480px]:pb-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 font-display text-[20px]/none font-extrabold italic uppercase text-txt no-underline"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/img/boff-logo.webp" alt="" className="h-[26px] w-[26px] flex-none object-contain" />
          BOFF<b className="text-accent">MEDIA</b>
        </Link>

        <div className="flex flex-col gap-1.5">
          <Kicker>{kicker}</Kicker>
          <h1 className="text-[30px]/[1.02] tracking-[0.01em] max-[480px]:text-[25px]">{title}</h1>
          {subtitle && (
            <p className="font-body text-[14px]/[1.5] not-italic normal-case text-txt-muted">{subtitle}</p>
          )}
        </div>

        {children}
      </div>

      <Link
        href="/entrar"
        className="relative z-[1] mt-[22px] inline-flex items-center gap-[7px] font-mono text-[11px]/none font-semibold uppercase tracking-[0.1em] text-txt-dim no-underline transition-colors hover:text-txt"
      >
        <Icon name="back" size={14} /> {t("recover.backToLogin")}
      </Link>
    </div>
  )
}
