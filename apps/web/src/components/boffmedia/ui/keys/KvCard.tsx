"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { Icon } from "@/components/boffmedia/primitives"
import { KvArt, KvStatus, KvTags, KvVia } from "./KvAtoms"
import { kvReviewColor, type KvKey } from "./keys-util"

// The catalogue card. Steam art with status · review · discount · stock overlaid,
// name, price, tags and the delivery via at the foot. Delivered keys dim.
export function KvCard({ item, onOpen }: { item: KvKey; onOpen?: (item: KvKey) => void }) {
  const t = useTranslations("common.keys")
  const review = item.info.review
  return (
    <button
      type="button"
      aria-label={item.name}
      onClick={() => onOpen?.(item)}
      className={cn(
        "group relative flex cursor-pointer flex-col overflow-hidden border border-solid border-line bg-panel p-0 text-left transition-[border-color,transform,background] duration-[140ms] cut-tag [--cut-tag:14px]",
        "hover:-translate-y-[3px] hover:border-[color-mix(in_srgb,var(--accent)_45%,var(--line))] hover:bg-panel-2",
        item.given && "opacity-[0.72]",
      )}
    >
      <div className="relative aspect-[460/200] border-b border-solid border-line">
        <KvArt appid={item.appid} name={item.name} kind="header" />
        <div aria-hidden className="pointer-events-none absolute inset-0 [background:linear-gradient(to_top,color-mix(in_srgb,var(--panel)_80%,transparent),transparent_45%)]" />
        <div className="absolute inset-x-2.5 top-2.5 z-[2] flex items-start justify-between gap-2">
          <KvStatus given={item.given} />
          <span className="inline-flex items-center gap-[5px] border border-solid border-line-2 bg-[color-mix(in_srgb,var(--bg)_82%,transparent)] px-2 py-[5px] font-display text-[13px]/none font-extrabold italic backdrop-blur-[4px]" style={{ color: kvReviewColor(review) }}>
            <Icon name="star" size={12} />
            {review}%
          </span>
        </div>
        {item.price.discount > 0 && <span className="absolute bottom-2.5 left-2.5 z-[2] border border-solid border-[color-mix(in_srgb,var(--ok)_45%,transparent)] bg-ok-soft px-2 py-[5px] font-display text-[13px]/none font-extrabold italic text-ok backdrop-blur-[4px]">-{item.price.discount}%</span>}
        {!item.given && item.stock > 1 && (
          <span className="absolute bottom-2.5 right-2.5 z-[2] inline-flex items-center gap-1.5 border border-solid border-line-2 bg-[color-mix(in_srgb,var(--bg)_82%,transparent)] px-2 py-[5px] font-mono text-[10px]/none font-bold uppercase tracking-[0.06em] text-txt backdrop-blur-[4px]">
            <Icon name="layers" size={12} className="text-accent" />
            {item.stock} {t("keysCount", { count: item.stock })}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2.5 px-4 pb-4 pt-3.5">
        <div className="flex items-baseline justify-between gap-3">
          <span className="min-w-0 truncate font-display text-[19px]/[1.1] font-bold">{item.name}</span>
          <span className="flex-none font-display text-[18px]/none font-extrabold italic text-accent">{item.price.final}</span>
        </div>
        <KvTags tags={item.tags} max={3} />
        <div className="mt-auto flex items-center gap-2.5 border-t border-dashed border-line pt-3">
          <KvVia via={item.via} sm />
          <Icon name="arrow" size={17} className="ml-auto text-txt-muted transition-[color,transform] duration-[140ms] group-hover:translate-x-1 group-hover:text-accent-bright" />
        </div>
      </div>
    </button>
  )
}
