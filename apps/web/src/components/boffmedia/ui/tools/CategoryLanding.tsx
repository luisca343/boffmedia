"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Kicker, Icon, Button, Chip } from "@boffmedia/ui"
import { GameLogo } from "./GameLogo"
import { ToolGrid } from "./ToolGrid"
import { TxSection } from "./TxSection"
import { ArtImage } from "./ArtImage"
import { Bleed } from "./ToolShell"
import { buildCategory, hueStyle, type CategoryData, type ExtLinkData } from "./tools-data"

// ── full-bleed game banner (real key-art image) ──────────────────────────────
export function GameBanner({ cat }: { cat: CategoryData }) {
  return (
    <Bleed top className="mb-10">
      <div style={hueStyle(cat.hueColor)} className="relative flex min-h-[380px] flex-col items-stretch overflow-hidden md:min-h-[460px]">
        <div className="absolute inset-0 z-0 bg-base-2">
          <ArtImage src={cat.banner.image} priority sizes="100vw" />
        </div>
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[1] opacity-40 mix-blend-multiply [background:repeating-linear-gradient(to_bottom,transparent_0_3px,rgba(0,0,0,0.2)_3px_4px)]" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-[1] [background:linear-gradient(to_top,var(--bg)_0%,color-mix(in_srgb,var(--bg)_62%,transparent)_40%,transparent_78%),linear-gradient(102deg,color-mix(in_srgb,var(--bg)_82%,transparent)_4%,color-mix(in_srgb,var(--bg)_20%,transparent)_46%,transparent_66%),radial-gradient(120%_120%_at_92%_8%,color-mix(in_srgb,var(--ghue)_16%,transparent),transparent_52%)]"
        />
        <div className="relative z-[2] flex flex-1 items-end gap-[26px] px-[var(--pad-x,22px)] pb-[30px] pt-[34px]">
          <GameLogo label={cat.logoLabel} hueColor={cat.hueColor} size="lg" imageSrc={cat.iconImg} className="max-sm:hidden" />
          <div className="min-w-0">
            <Kicker>{cat.banner.prefix}</Kicker>
            <h1 className="text-[clamp(40px,5.4vw,82px)] leading-[0.9]">{cat.banner.highlight}</h1>
            <p className="mt-[10px] max-w-[66ch] text-[17px] leading-[1.5] text-txt-muted">{cat.banner.subtitle}</p>
          </div>
        </div>
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 z-[3] h-[3px] [background:linear-gradient(90deg,var(--ghue)_0%,color-mix(in_srgb,var(--ghue)_30%,transparent)_46%,transparent_78%)]" />
      </div>
    </Bleed>
  )
}

// ── featured tool with real art ──────────────────────────────────────────────
export function FeaturedTool({ cat }: { cat: CategoryData }) {
  const tCat = useTranslations("toolsUi.category")
  const f = cat.featuredTool
  if (!f) return null
  const art = f.heroImage || f.iconSrc
  return (
    <div
      style={hueStyle(cat.hueColor)}
      className="group relative mb-[34px] grid grid-cols-1 overflow-hidden border border-solid bg-panel md:grid-cols-[0.82fr_1.18fr] border-[color-mix(in_srgb,var(--ghue)_32%,var(--line))] [background:radial-gradient(130%_150%_at_100%_0%,color-mix(in_srgb,var(--ghue)_13%,transparent),transparent_52%),var(--panel)] [clip-path:polygon(0_0,calc(100%_-_22px)_0,100%_22px,100%_100%,22px_100%,0_calc(100%_-_22px))] transition-[border-color,box-shadow] duration-300 hover:border-[color-mix(in_srgb,var(--ghue)_52%,var(--line))] hover:shadow-[0_22px_54px_rgba(0,0,0,0.32)]"
    >
      <span aria-hidden="true" className="absolute inset-x-0 top-0 z-[3] h-[3px] [background:linear-gradient(90deg,var(--ghue)_0%,color-mix(in_srgb,var(--ghue)_40%,transparent)_42%,transparent_72%)]" />
      <span className="absolute left-0 top-0 z-[4] inline-flex items-center gap-[7px] whitespace-nowrap py-2 pl-[14px] pr-[18px] font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--bg)] bg-[var(--ghue)] [clip-path:polygon(0_0,100%_0,calc(100%_-_13px)_100%,0_100%)]">
        <Icon name="star" size={13} />
        {f.isNew ? tCat("featuredNew") : tCat("featured")}
      </span>

      <div className="relative min-h-[220px] border-b border-solid bg-base-2 md:min-h-[300px] md:border-b-0 md:border-r border-[color-mix(in_srgb,var(--ghue)_28%,var(--line))]">
        <ArtImage src={art} sizes="(min-width: 768px) 40vw, 100vw" />
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 z-[2] hidden md:block [background:linear-gradient(to_right,transparent_52%,color-mix(in_srgb,var(--panel)_55%,transparent)_88%,var(--panel))]" />
        <span className="absolute bottom-8 right-[26px] z-[3] grid h-16 w-16 place-items-center border-2 border-solid text-[var(--ghue)] bg-[color-mix(in_srgb,var(--ghue)_16%,var(--bg))] border-[color-mix(in_srgb,var(--ghue)_55%,var(--line-2))] shadow-[0_10px_34px_rgba(0,0,0,0.45)] cut-seal [--cut:13px] transition-transform duration-300 group-hover:-translate-y-1 max-md:right-6 max-md:-bottom-[30px]">
          <Icon name={f.icon} size={26} />
        </span>
      </div>

      <div className="flex flex-col px-[38px] pb-8 pt-[34px]">
        <div className="mb-4 flex items-center gap-3">
          <GameLogo label={cat.logoLabel} hueColor={cat.hueColor} size="sm" />
          <Kicker>{tCat("featuredOf", { game: cat.short })}</Kicker>
        </div>
        <h3 className="mb-[14px] text-[clamp(30px,3.2vw,48px)] leading-[0.98]">{f.title}</h3>
        <p className="max-w-[50ch] text-[15.5px] leading-[1.55] text-txt-muted">{f.desc}</p>
        <div className="my-[20px] mb-[26px] flex flex-wrap gap-2">
          {f.features.map((x) => (
            <Chip key={x}>{x}</Chip>
          ))}
        </div>
        <div className="mt-auto flex flex-wrap gap-3">
          <Button variant="pri" iconRight="arrow" href={f.href}>
            {tCat("openTool")}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── external links ───────────────────────────────────────────────────────────
function extDomain(href: string) {
  try {
    return new URL(href).hostname.replace(/^www\./, "")
  } catch {
    return null
  }
}

export function ExtLinks({ items }: { items: ExtLinkData[] }) {
  const tCat = useTranslations("toolsUi.category")
  if (!items.length) return null
  return (
    <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-[repeat(auto-fill,minmax(240px,1fr))]">
      {items.map((item) => {
        const domain = extDomain(item.href) ?? tCat("externalFallbackDomain")
        return (
          <a
            key={item.href}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={tCat("externalAria", { title: item.title, domain })}
            className="group/ext relative flex flex-col gap-[11px] border border-dashed border-line-2 bg-panel px-4 pb-[13px] pt-[14px] no-underline transition-[border-color,background,transform] duration-[140ms] hover:-translate-y-[2px] hover:border-[color-mix(in_srgb,var(--info)_55%,var(--line-2))] hover:bg-panel-2 cut-corner [--cut-lg:16px]"
          >
            <span aria-hidden="true" className="absolute right-0 top-0 h-4 w-4 [background:color-mix(in_srgb,var(--info)_30%,var(--panel))] [clip-path:polygon(0_0,100%_100%,0_100%)] transition-colors group-hover/ext:[background:color-mix(in_srgb,var(--info)_60%,var(--panel))]" />
            <span className="flex items-center gap-2">
              <span className="border border-solid px-[7px] py-1 font-mono text-[9.5px] font-bold uppercase tracking-[0.14em] text-[var(--info)] bg-[color-mix(in_srgb,var(--info)_13%,transparent)] border-[color-mix(in_srgb,var(--info)_38%,transparent)]">
                {tCat("externalTag")}
              </span>
              <span className="ml-auto mr-2 text-txt-dim transition-transform duration-200 group-hover/ext:-translate-y-0.5 group-hover/ext:translate-x-0.5 group-hover/ext:text-[var(--info)]">
                <Icon name="external" size={15} />
              </span>
            </span>
            <span className="min-w-0">
              <b className="block font-display text-[16px] font-bold uppercase leading-[1.1] tracking-[0.01em] text-txt">{item.title}</b>
              {item.desc && <span className="mt-1 block text-[12.5px] leading-[1.45] text-txt-muted">{item.desc}</span>}
            </span>
            <span className="mt-auto flex items-center gap-[6px] overflow-hidden text-ellipsis whitespace-nowrap border-t border-dashed border-line pt-[10px] font-mono text-[10.5px] tracking-[0.06em] text-txt-dim">
              <Icon name="globe" size={12} />
              {domain}
            </span>
          </a>
        )
      })}
    </div>
  )
}

/** Game/category landing page body — renders inside the ToolShell. */
export function CategoryLanding({ slug }: { slug: string }) {
  const t = useTranslations()
  const tCat = useTranslations("toolsUi.category")
  const tHub = useTranslations("toolsUi.hub")
  const cat = React.useMemo(() => buildCategory(slug, t), [slug, t])
  if (!cat) return null

  return (
    <div data-ds="boffmedia">
      <GameBanner cat={cat} />
      <div className="mt-1">
        <FeaturedTool cat={cat} />
        <TxSection title={tCat("allTools")} count={tHub("toolCount", { count: cat.otherTools.length })}>
          <ToolGrid tools={cat.otherTools} />
        </TxSection>
        {cat.ext.length > 0 && (
          <TxSection
            title={tCat("externalResources")}
            hint={
              <>
                <Icon name="external" size={12} />
                {tCat("externalHint")}
              </>
            }
          >
            <ExtLinks items={cat.ext} />
          </TxSection>
        )}
      </div>
    </div>
  )
}
