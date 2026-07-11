import * as React from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { Icon, Badge } from "@/components/boffmedia/primitives"
import { hueStyle, type ToolCardData } from "./tools-data"

// bottom-right diagonal cut (señal) / bottom-left (fila) — one-off clips.
const SENAL_CLIP = "cut-tag [--cut-tag:14px]"
const FILA_CLIP = "[clip-path:polygon(0_0,100%_0,100%_100%,10px_100%,0_calc(100%_-_10px))]"

const ICON_BOX =
  "cut-seal [--cut:7px] grid flex-none place-items-center border border-solid text-[var(--ghue)] border-[color-mix(in_srgb,var(--ghue)_45%,var(--line-2))] bg-[color-mix(in_srgb,var(--ghue)_10%,transparent)] transition-[background,border-color] duration-[140ms] group-hover:bg-[color-mix(in_srgb,var(--ghue)_18%,transparent)] group-hover:border-[color-mix(in_srgb,var(--ghue)_65%,var(--line-2))]"

/**
 * Tool card — one component, two skins. «señal» (default, rich vertical card
 * with head icon · category · badges · arrow) and «fila» (compact horizontal
 * row). Mirrors `.tx-card` + `[data-cardvariant]` from tools.css.
 */
export function ToolCard({ tool, variant = "senal" }: { tool: ToolCardData; variant?: "senal" | "fila" }) {
  const tCard = useTranslations("toolsUi.card")
  const soon = !!tool.soon

  const badges = (
    <>
      {tool.isNew && !soon && <Badge tone="new">{tCard("new")}</Badge>}
      {soon && <Badge>{tCard("soon")}</Badge>}
    </>
  )

  if (variant === "fila") {
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
        <span aria-hidden className="absolute left-0 top-0 h-full w-[3px] bg-[var(--ghue)]" />
        <span className={cn(ICON_BOX, "h-11 w-11")}>
          <Icon name={tool.icon} size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <h4 className="text-[18px] leading-[1.02]">{tool.title}</h4>
          <p className="mt-1 line-clamp-1 text-[13.5px] leading-[1.5] text-txt-muted">{tool.desc}</p>
        </div>
        <div className="ml-auto flex flex-none items-center gap-2">
          {badges}
          {tool.popularity === "high" && !soon && (
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

  // señal (default) — rich vertical card
  return (
    <Link
      href={soon ? "#" : tool.href}
      aria-label={tool.title}
      aria-disabled={soon || undefined}
      style={hueStyle(tool.hueColor)}
      className={cn(
        "group relative flex h-full flex-col overflow-hidden border border-solid border-line bg-panel px-5 pb-[18px] pt-5 text-left no-underline",
        "transition-[border-color,background,transform,box-shadow] duration-[140ms]",
        SENAL_CLIP,
        soon
          ? "cursor-default"
          : "hover:-translate-y-[3px] hover:bg-panel-2 hover:border-[color-mix(in_srgb,var(--ghue)_45%,var(--line))] hover:shadow-[0_16px_34px_rgba(0,0,0,0.28)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[color-mix(in_srgb,var(--ghue)_75%,var(--text))]",
      )}
    >
      {/* top rail in the game hue — extends to full width on hover */}
      <span aria-hidden className={cn("absolute left-0 top-0 h-[3px] w-[38px] bg-[var(--ghue)] transition-[width] duration-[320ms] ease-[cubic-bezier(0.2,0.7,0.3,1)]", !soon && "group-hover:w-full")} />

      <div className="mb-4 flex items-center gap-[11px]">
        <span className={cn(ICON_BOX, "h-[38px] w-[38px]", soon && "border-line-2 bg-transparent text-txt-dim")}>
          <Icon name={tool.icon} size={20} />
        </span>
        {tool.cat && <span className="min-w-0 font-mono text-[10px]/[1.3] font-semibold uppercase tracking-[0.12em] text-txt-dim">{tool.cat}</span>}
        <span className="ml-auto flex flex-none gap-1.5">{badges}</span>
        {!soon && (
          <span className="ml-1.5 flex-none text-txt-dim transition-[color,transform] duration-[140ms] group-hover:translate-x-1 group-hover:text-accent-bright">
            <Icon name="arrow" size={18} />
          </span>
        )}
      </div>

      <h4 className={cn("text-[22px] leading-[1.02]", soon && "text-txt-muted")}>{tool.title}</h4>
      <p className="mb-0.5 mt-2 text-pretty text-[13.5px] leading-[1.5] text-txt-muted">{tool.desc}</p>
    </Link>
  )
}
