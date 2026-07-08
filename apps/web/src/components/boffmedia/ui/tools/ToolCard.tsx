import * as React from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { Icon } from "@/components/boffmedia/primitives/icon"
import { Badge } from "@/components/boffmedia/primitives/badge"
import { hueStyle, type ToolCardData } from "./tools-data"

// bottom-left diagonal cut — a one-off (not cut/cut-corner/cut-tag)
const FILA_CLIP = "[clip-path:polygon(0_0,100%_0,100%_100%,10px_100%,0_calc(100%_-_10px))]"

/** Compact horizontal tool card («fila» skin): left rail · icon · title/desc · tail. */
export function ToolCard({ tool }: { tool: ToolCardData }) {
  const tCard = useTranslations("toolsUi.card")
  return (
    <Link
      href={tool.href}
      aria-label={tool.title}
      style={hueStyle(tool.hueColor)}
      className={cn(
        "group relative flex w-full items-center gap-[15px] overflow-hidden border border-solid border-line bg-panel px-[18px] py-[15px] text-left no-underline",
        "transition-[border-color,background,transform,box-shadow] duration-[140ms]",
        "hover:-translate-y-[3px] hover:bg-panel-2 hover:border-[color-mix(in_srgb,var(--ghue)_45%,var(--line))] hover:shadow-[0_16px_34px_rgba(0,0,0,0.28)]",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[color-mix(in_srgb,var(--ghue)_75%,var(--text))]",
        FILA_CLIP,
      )}
    >
      {/* left rail in the game hue */}
      <span aria-hidden="true" className="absolute left-0 top-0 h-full w-[3px] bg-[var(--ghue)]" />

      <span className="cut-seal [--cut:7px] grid h-11 w-11 flex-none place-items-center border border-solid text-[var(--ghue)] border-[color-mix(in_srgb,var(--ghue)_45%,var(--line-2))] bg-[color-mix(in_srgb,var(--ghue)_10%,transparent)] transition-[background,border-color] duration-[140ms] group-hover:bg-[color-mix(in_srgb,var(--ghue)_18%,transparent)] group-hover:border-[color-mix(in_srgb,var(--ghue)_65%,var(--line-2))]">
        <Icon name={tool.icon} size={20} />
      </span>

      <div className="min-w-0 flex-1">
        <h4 className="text-[18px] leading-[1.02]">{tool.title}</h4>
        <p className="mt-1 line-clamp-1 text-[13.5px] leading-[1.5] text-txt-muted">{tool.desc}</p>
      </div>

      <div className="ml-auto flex flex-none items-center gap-2">
        {tool.isNew && <Badge tone="new">{tCard("new")}</Badge>}
        {tool.popularity === "high" && (
          <span className="inline-flex items-center text-accent" title={tCard("popular")}>
            <Icon name="trending" size={12} />
          </span>
        )}
        <span className="text-txt-dim transition-[color,transform] duration-[140ms] group-hover:translate-x-1 group-hover:text-accent-bright">
          <Icon name="arrow" size={18} />
        </span>
      </div>
    </Link>
  )
}
