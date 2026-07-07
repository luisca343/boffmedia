import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { useTranslations } from "next-intl"
import { Icon } from "@/components/boffmedia/primitives/icon"
import { Clock } from "@/components/boffmedia/primitives/clock"
import { FOOTER_COLS, FOOTER_SOCIAL, type FooterLink } from "@/components/boffmedia/ui/navigation/nav-data"

function FooterAnchor({ link, label }: { link: FooterLink; label: string }) {
  const inner = (
    <>
      <span>{label}</span>
      <Icon
        name={link.external ? "external" : "chevronRight"}
        size={13}
        className="shrink-0 -translate-x-1 opacity-0 transition-all duration-[140ms] group-hover/fl:translate-x-0 group-hover/fl:opacity-100"
      />
    </>
  )
  const cls =
    "group/fl flex items-center justify-between gap-2 py-[5px] font-body text-[14px] font-medium leading-[1.2] text-txt-muted no-underline transition-[color,padding] duration-[140ms] hover:pl-1.5 hover:text-accent"
  if (link.external || link.href) {
    return (
      <a href={link.href} target={link.external ? "_blank" : undefined} rel={link.external ? "noopener noreferrer" : undefined} className={cls}>
        {inner}
      </a>
    )
  }
  return (
    <Link href={link.route || "/"} className={cls}>
      {inner}
    </Link>
  )
}

export function Footer() {
  const t = useTranslations("nav.v3.footer")
  return (
    // Full-height layouts opt out of the top gap by putting `data-footer-flush`
    // on their root (landing, tool shell) — the footer never needs to know them.
    <footer className="relative mt-[90px] border-t-2 border-accent bg-base-2 text-txt-muted transition-[background,border-color] duration-[260ms] [body:has([data-footer-flush])_&]:mt-0">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-50 [background:repeating-linear-gradient(180deg,var(--stripe)_0_1px,transparent_1px_3px)]"
      />
      <div className="wrap relative px-5 min-[640px]:px-10">
        <div className="grid grid-cols-1 gap-11 pb-10 pt-[52px] min-[620px]:grid-cols-2 min-[900px]:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div className="max-[899px]:col-span-full">
            <Link href="/" className="mb-[15px] inline-flex items-center gap-[11px] font-display text-[21px] font-extrabold italic uppercase leading-none text-txt no-underline">
              <Image src="/img/boff-logo.webp" alt="" width={26} height={26} className="h-[26px] w-[26px] object-contain" />
              <span>Boff<b className="text-accent">media</b></span>
            </Link>
            <p className="mb-5 max-w-[36ch] font-body text-[14px] leading-[1.65] text-txt-muted">{t("tagline")}</p>
            <div className="flex gap-[9px]">
              {FOOTER_SOCIAL.map((s) => (
                <a
                  key={s.labelKey}
                  href={s.href}
                  aria-label={t(s.labelKey)}
                  title={t(s.labelKey)}
                  target={s.href.startsWith("http") ? "_blank" : undefined}
                  rel={s.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="cut [--cut:7px] grid h-[38px] w-[38px] place-items-center border border-solid border-line bg-panel text-txt-muted transition-[color,background,border-color,transform] duration-[140ms] hover:-translate-y-0.5 hover:border-accent hover:bg-accent hover:text-accent-ink"
                >
                  <Icon name={s.icon} size={17} />
                </a>
              ))}
            </div>
          </div>

          {FOOTER_COLS.map((c) => (
            <nav key={c.titleKey} aria-label={t(c.titleKey)}>
              <h6 className="mb-4 border-b border-line pb-[11px] font-display text-[12px] font-bold uppercase leading-none tracking-[0.16em] text-txt">
                {t(c.titleKey)}
              </h6>
              <ul className="grid list-none gap-[3px] p-0">
                {c.links.map((l) => (
                  <li key={l.labelKey}>
                    <FooterAnchor link={l} label={t(l.labelKey)} />
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-x-[18px] gap-y-2.5 border-t border-line pb-[22px] pt-[15px] font-mono text-[11px] font-medium leading-none tracking-[0.07em] text-txt-dim">
          <span className="text-txt-muted">© 2026 Boffmedia</span>
          <span className="inline-flex items-center gap-[7px] uppercase">
            <i aria-hidden="true" className="h-[5px] w-[5px] shrink-0 rotate-45 bg-accent" />
            Boffmedia v3.0
          </span>
          <div className="ml-auto flex items-center gap-[18px] uppercase max-[619px]:ml-0 max-[619px]:w-full">
            <span className="inline-flex items-center gap-[7px] tabular-nums text-txt-muted">
              <i aria-hidden="true" className="h-[7px] w-[7px] rounded-full bg-ok animate-[bm-livedot_2s_ease-in-out_infinite]" />
              <Clock />
            </span>
            <span>Madrid · UTC+2</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
