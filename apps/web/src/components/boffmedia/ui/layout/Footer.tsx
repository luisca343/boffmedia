import { ASSET, staticAsset } from '@/lib/assets';
import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { useTranslations } from "next-intl"
import { Icon, Clock, type IconName } from "@boffmedia/ui"
import { FOOTER_COLS, FOOTER_SOCIAL } from "@/components/boffmedia/ui/navigation/nav-data"

/** A single footer link target (already resolved — label passed separately). */
type FooterAnchorTarget = { route?: string; href?: string; external?: boolean }

function FooterAnchor({ link, label }: { link: FooterAnchorTarget; label: string }) {
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

export interface FooterColLink extends FooterAnchorTarget {
  label: string
}

/** Reusable footer link column: display header + list with reveal-on-hover chevron. */
export function FooterCol({ title, links }: { title: string; links: FooterColLink[] }) {
  return (
    <nav aria-label={title}>
      <h6 className="mb-4 border-b border-line pb-[11px] font-display text-[12px] font-bold uppercase leading-none tracking-[0.16em] text-txt">
        {title}
      </h6>
      <ul className="grid list-none gap-[3px] p-0">
        {links.map((l) => (
          <li key={l.label}>
            <FooterAnchor link={l} label={l.label} />
          </li>
        ))}
      </ul>
    </nav>
  )
}

export interface FooterSocialItem {
  icon: IconName
  label: string
  href: string
}

/** Reusable social row: diagonal-cut boxes that fill with accent and lift on hover. */
export function FooterSocial({ items }: { items: FooterSocialItem[] }) {
  return (
    <div className="flex gap-[9px]">
      {items.map((s) => (
        <a
          key={s.label}
          href={s.href}
          aria-label={s.label}
          title={s.label}
          target={s.href.startsWith("http") ? "_blank" : undefined}
          rel={s.href.startsWith("http") ? "noopener noreferrer" : undefined}
          className="cut cut-edge-slant hover:[--cut-line:var(--accent)] [--cut:7px] grid h-[38px] w-[38px] place-items-center border border-solid border-line bg-panel text-txt-muted transition-[color,background,border-color,transform] duration-[140ms] hover:-translate-y-0.5 hover:border-accent hover:bg-accent hover:text-accent-ink"
        >
          <Icon name={s.icon} size={17} />
        </a>
      ))}
    </div>
  )
}

export function Footer() {
  const t = useTranslations("nav.v3.footer")
  return (
    // Full-height layouts opt out of the top gap by putting `data-footer-flush`
    // on their root (landing, tool shell) — the footer never needs to know them.
    <footer className="relative border-t-2 border-accent bg-base-2 text-txt-muted transition-[background,border-color] duration-[260ms] [body:has([data-footer-flush])_&]:mt-0">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-50 [background:repeating-linear-gradient(180deg,var(--stripe)_0_1px,transparent_1px_3px)]"
      />
      <div className="wrap relative px-5 min-[640px]:px-10">
        <div className="grid grid-cols-1 gap-[34px] pb-10 pt-[52px] min-[620px]:grid-cols-2 min-[900px]:grid-cols-[1.5fr_1fr_1fr_1fr] min-[900px]:gap-11">
          <div className="max-[899px]:col-span-full">
            <Link href="/" className="mb-[15px] inline-flex items-center gap-[11px] font-display text-[21px] font-extrabold italic uppercase leading-none text-txt no-underline">
              <Image src={staticAsset(ASSET.boffmedia.brand, 'boff-logo.webp')} alt="" width={26} height={26} className="h-[26px] w-[26px] object-contain" />
              <span>Boff<b className="text-accent">media</b></span>
            </Link>
            <p className="mb-5 max-w-[36ch] font-body text-[14px] leading-[1.65] text-txt-muted">{t("tagline")}</p>
            <FooterSocial items={FOOTER_SOCIAL.map((s) => ({ icon: s.icon, label: t(s.labelKey), href: s.href }))} />
          </div>

          {FOOTER_COLS.map((c) => (
            <FooterCol
              key={c.titleKey}
              title={t(c.titleKey)}
              links={c.links.map((l) => ({ label: t(l.labelKey), route: l.route, href: l.href, external: l.external }))}
            />
          ))}
        </div>

        {/* Right-aligned: with the clock block below commented out there is no
            `ml-auto` element left for the copyright to sit opposite, so the row
            justifies to the end instead. */}
        <div className="flex flex-wrap items-center justify-end gap-x-[18px] gap-y-2.5 border-t border-line pb-[22px] pt-[15px] font-mono text-[11px] font-medium leading-none tracking-[0.07em] text-txt-dim">
          <span className="text-txt-muted">© 2026 Boffmedia</span>
          <span className="inline-flex items-center gap-[7px] uppercase">
            <i aria-hidden="true" className="h-[5px] w-[5px] shrink-0 rotate-45 bg-accent" />
            Boffmedia v3.0
          </span>
          {/* 
          <div className="ml-auto flex items-center gap-[18px] uppercase max-[619px]:ml-0 max-[619px]:w-full">
            <span className="inline-flex items-center gap-[7px] tabular-nums text-txt-muted">
              <i aria-hidden="true" className="h-[7px] w-[7px] rounded-full bg-ok animate-[bm-livedot_2s_ease-in-out_infinite] motion-reduce:animate-none" />
              <Clock />
            </span>
            <span>Madrid · UTC+2</span>
          </div>
        */}
        </div>
      </div>
    </footer>
  )
}
