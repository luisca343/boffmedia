"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Icon, type IconName } from "@boffmedia/ui"
import { cn } from "@/lib/utils"
import { MewTile, MewRarity } from "../../MewAtoms"
import { select } from "../../mew-store"
import { mewHuman, type MewRec } from "../../mew-util"
import type { NavFn } from "../MewRefs"

// "Where to find" source chip. The container's contents used to live in a
// native `title=""` — a comma-joined wall of names, unstyled, keyboard-invisible
// and impossible to scan. This shows the actual item art instead, in the same
// paper card the rest of the codex hovers with.

const MAX_ITEMS = 24

/** Anchored popover panel: opens on hover AND on focus, closes on Escape. */
function SourcePanel({ title, icon, ids, currentId, onNav, count }: { title: string; icon: IconName; ids: string[]; currentId: string; onNav: NavFn; count: number }) {
  const t = useTranslations("mewgenics")
  const items = React.useMemo(
    () => ids.slice(0, MAX_ITEMS).map((id) => select.get("items", id)).filter((r): r is MewRec => !!r),
    [ids],
  )
  const more = count - items.length

  return (
    <div className="flex w-[min(420px,80vw)] flex-col gap-2.5 border-2 border-solid border-[color:var(--mwp-ink)] bg-[color:var(--mwp-paper)] p-3 text-[color:var(--mwp-ink)] mew-paper mew-rule [border-radius:var(--wob-c)] [box-shadow:0_5px_0_var(--mwp-shadow-lg)] [transform:rotate(-0.4deg)]">
      <div className="flex items-center gap-2 border-b-2 border-dashed border-[color:var(--mwp-ink-line)] pb-2">
        <Icon name={icon} size={13} className="flex-none text-[color:var(--mwp-red)]" />
        <span className="min-w-0 flex-1 truncate text-[13.5px]/none text-[color:var(--mwp-ink)] [font-family:var(--mwf-disp)]">{title}</span>
        <span className="flex-none bg-[color:var(--mwp-red-deep)] px-[7px] py-[3px] font-mono text-[10px]/none font-bold text-[color:var(--mwp-paper)] [border-radius:10px_8px_11px_9px]">{count}</span>
      </div>
      {items.length ? (
        <ul className="m-0 grid list-none gap-1.5 p-0 [grid-template-columns:repeat(auto-fill,minmax(76px,1fr))]">
          {items.map((it) => (
            <li key={it.id}>
              <button
                type="button"
                onClick={() => onNav("items", it.id)}
                title={it.name}
                className={cn(
                  "flex w-full cursor-pointer flex-col items-center gap-1 border-[1.5px] border-solid p-1 text-center transition-all [border-radius:var(--wob-sm)]",
                  "hover:-translate-y-[2px] hover:[box-shadow:0_3px_0_var(--mwp-shadow-md)] active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--mwp-red)] focus-visible:ring-offset-0",
                  it.id === currentId
                    ? "border-[color:var(--mwp-red)] bg-[color-mix(in_srgb,var(--mwp-red)_12%,var(--mwp-paper-2))]"
                    : "border-[color:var(--mwp-ink-line)] bg-[color:var(--mwp-paper-2)]",
                )}
              >
                <MewTile cat="items" rec={it} size={44} frame="slot" />
                <span className="line-clamp-2 text-[9.5px]/[1.2] font-semibold text-[color:var(--mwp-ink)] [font-family:var(--mwf-hand)]">{it.name}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <span className="text-[12px]/[1.4] italic text-[color:var(--mwp-ink-soft)] [font-family:var(--mwf-hand)]">{t("label.noData")}</span>
      )}
      {more > 0 && (
        <span className="text-[10.5px]/none text-[color:var(--mwp-ink-soft)] [font-family:var(--mwf-hand)]">{t("common.moreCount", { n: more })}</span>
      )}
    </div>
  )
}

/**
 * A source chip that reveals its contents. Hover opens it, so does keyboard
 * focus; Escape closes it. The trigger is a real button, so the whole thing is
 * reachable by Tab even though the reveal is hover-shaped.
 */
export function MewSourceChip({ label, icon, ids, count, currentId, onNav }: { label: string; icon: IconName; ids: string[]; count: number; currentId: string; onNav: NavFn }) {
  const [open, setOpen] = React.useState(false)
  const [above, setAbove] = React.useState(false)
  const showT = React.useRef(0)
  const hideT = React.useRef(0)
  const wrapRef = React.useRef<HTMLSpanElement>(null)
  const popRef = React.useRef<HTMLDivElement>(null)
  const id = React.useId()

  const openFn = React.useCallback(() => {
    clearTimeout(hideT.current)
    showT.current = window.setTimeout(() => setOpen(true), 80)
  }, [])
  const closeFn = React.useCallback(() => {
    clearTimeout(showT.current)
    hideT.current = window.setTimeout(() => setOpen(false), 120)
  }, [])

  React.useEffect(() => () => { clearTimeout(showT.current); clearTimeout(hideT.current) }, [])

  // Flip above the trigger when the panel would run off the bottom, and pull it
  // back inside the viewport horizontally.
  React.useLayoutEffect(() => {
    if (!open) return
    const place = () => {
      const el = popRef.current
      if (!el) return
      el.style.left = ""
      el.style.right = ""
      el.style.transform = ""
      const r = el.getBoundingClientRect()
      setAbove(r.bottom > window.innerHeight - 10)
      if (r.left < 10) el.style.left = `${10 - r.left}px`
      else if (r.right > window.innerWidth - 10) el.style.right = `${r.right - window.innerWidth + 10}px`
    }
    place()
    window.addEventListener("resize", place)
    window.addEventListener("scroll", place, true)
    return () => {
      window.removeEventListener("resize", place)
      window.removeEventListener("scroll", place, true)
    }
  }, [open])

  React.useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false) }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open])

  return (
    <span
      ref={wrapRef}
      className="relative inline-flex"
      onMouseEnter={openFn}
      onMouseLeave={closeFn}
      onFocus={openFn}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) closeFn() }}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-describedby={open ? id : undefined}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex cursor-pointer items-center gap-1.5 border-2 border-solid px-2.5 pb-1 pt-[5px] text-[11.5px]/none font-semibold [font-family:var(--mwf-hand)] [border-radius:var(--wob-sm)] transition-all",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--mwp-red)] focus-visible:ring-offset-0",
          open
            ? "-translate-y-[2px] border-[color:var(--mwp-ink)] bg-[color:var(--mwp-paper)] text-[color:var(--mwp-ink)] [box-shadow:0_3px_0_var(--mwp-shadow-md)]"
            : "border-[color:var(--mwp-ink-line)] bg-[color:var(--mwp-paper-2)] text-[color:var(--mwp-ink)] hover:border-[color:var(--mwp-ink)]",
        )}
      >
        <Icon name={icon} size={11} className="flex-none text-[color:var(--mwp-ink-soft)]" />
        {label}
        <span className="font-mono text-[10px] font-bold text-[color:var(--mwp-red-deep)]">{count}</span>
      </button>
      {open && (
        <div
          ref={popRef}
          id={id}
          role="tooltip"
          className={cn(
            "absolute left-0 z-[60] [animation:mew-fade-rise_140ms_ease-out]",
            above ? "bottom-full mb-2" : "top-full mt-2",
          )}
        >
          <SourcePanel title={label} icon={icon} ids={ids} currentId={currentId} onNav={onNav} count={count} />
        </div>
      )}
    </span>
  )
}
