"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { cn } from "../cn"
import { useT } from "../i18n"
import { useDismiss } from "../hooks/use-dismiss"
import { Icon, type IconName } from "./icon"
import { Button } from "./button"
import { Kbd } from "./kbd"

export interface MenuItem {
  label?: React.ReactNode
  icon?: IconName
  onSelect?: () => void
  danger?: boolean
  disabled?: boolean
  sep?: boolean
  header?: React.ReactNode
  shortcut?: React.ReactNode
  node?: React.ReactNode | ((ctx: { close: () => void }) => React.ReactNode)
}

export interface MenuProps {
  trigger?: React.ReactNode
  label?: React.ReactNode
  icon?: IconName
  variant?: "default" | "pri" | "ghost" | "danger"
  size?: "sm" | "lg"
  items: MenuItem[]
  align?: "start" | "end"
  ariaLabel?: string
}

const POP_SHADOW = "0 1px 0 var(--accent-line), 0 18px 40px -18px rgba(0,0,0,0.7)"

// Position before paint on the client (no flash at 0,0); degrade to a passive
// effect on the server, where useLayoutEffect warns and the popup never renders
// open anyway.
const useIsoLayoutEffect = typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect

export function Menu({
  trigger,
  label,
  icon = "chevronDown",
  variant = "default",
  size,
  items,
  align = "start",
  ariaLabel,
}: MenuProps) {
  const t = useT()
  const resolvedLabel = label ?? t("actions")
  const [open, setOpen] = React.useState(false)
  const [active, setActive] = React.useState(-1)
  const rootRef = React.useRef<HTMLSpanElement>(null)
  // The popup is rendered in a portal (below), so it escapes any ancestor's
  // clip-path or overflow — a card whose `.cut-corner` clip used to swallow the
  // menu whole no longer can. Its own ref keeps outside-click dismissal from
  // treating a click on a menu item as a click "outside" the menu.
  const menuRef = React.useRef<HTMLDivElement>(null)
  const itemRefs = React.useRef<(HTMLButtonElement | null)[]>([])
  const [coords, setCoords] = React.useState<{ top?: number; bottom?: number; left?: number; right?: number }>({})
  const acting = items
    .map((it, i) => (it.sep || it.node || it.header || it.disabled ? null : i))
    .filter((i): i is number => i != null)

  const focusTrigger = () => rootRef.current?.querySelector<HTMLElement>("[data-menu-trigger]")?.focus()

  useDismiss(
    rootRef,
    (reason) => {
      setOpen(false)
      if (reason === "escape") focusTrigger()
    },
    open,
    menuRef,
  )

  // Anchor the fixed popup to the trigger, and re-anchor as the page scrolls (a
  // menu opened from a card in a scrolling grid must track its trigger). Flips
  // above the trigger when there is not enough room below.
  useIsoLayoutEffect(() => {
    if (!open) return
    const place = () => {
      const trig = rootRef.current?.querySelector<HTMLElement>("[data-menu-trigger]")
      if (!trig) return
      const r = trig.getBoundingClientRect()
      const estHeight = acting.length * 40 + 24
      const openUp = r.bottom + estHeight > window.innerHeight - 8 && r.top - estHeight > 8
      setCoords({
        top: openUp ? undefined : r.bottom + 6,
        bottom: openUp ? window.innerHeight - r.top + 6 : undefined,
        ...(align === "end"
          ? { right: Math.max(8, window.innerWidth - r.right) }
          : { left: Math.max(8, r.left) }),
      })
    }
    place()
    window.addEventListener("resize", place)
    window.addEventListener("scroll", place, true)
    return () => {
      window.removeEventListener("resize", place)
      window.removeEventListener("scroll", place, true)
    }
  }, [open, align, acting.length])

  React.useEffect(() => {
    if (open && active >= 0) itemRefs.current[active]?.focus()
  }, [open, active])

  const openWith = (idx: number) => {
    setOpen(true)
    setActive(idx)
  }
  const onTrigKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      openWith(acting.length ? acting[0] : -1)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      openWith(acting.length ? acting[acting.length - 1] : -1)
    }
  }
  const step = (dir: number) => {
    const pos = acting.indexOf(active)
    setActive(acting[(pos + dir + acting.length) % acting.length])
  }
  const onItemKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      step(1)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      step(-1)
    } else if (e.key === "Home") {
      e.preventDefault()
      setActive(acting[0])
    } else if (e.key === "End") {
      e.preventDefault()
      setActive(acting[acting.length - 1])
    } else if (e.key === "Tab") {
      setOpen(false)
    }
  }
  const choose = (it: MenuItem) => {
    setOpen(false)
    focusTrigger()
    it.onSelect?.()
  }

  return (
    <span ref={rootRef} className="relative inline-flex">
      {trigger ? (
        <span
          data-menu-trigger
          tabIndex={0}
          role="button"
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => (open ? setOpen(false) : openWith(-1))}
          onKeyDown={onTrigKey}
        >
          {trigger}
        </span>
      ) : (
        <Button
          data-menu-trigger
          variant={variant}
          size={size}
          iconRight={icon}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label={typeof ariaLabel === "string" ? ariaLabel : undefined}
          className={cn(open && "border-accent text-accent-bright")}
          onClick={() => (open ? setOpen(false) : openWith(-1))}
          onKeyDown={onTrigKey}
        >
          {resolvedLabel}
        </Button>
      )}
      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            aria-label={typeof (ariaLabel || resolvedLabel) === "string" ? (ariaLabel as string) || (resolvedLabel as string) : undefined}
            onKeyDown={onItemKey}
            style={{ boxShadow: POP_SHADOW, position: "fixed", top: coords.top, bottom: coords.bottom, left: coords.left, right: coords.right }}
            className={cn(
              "z-[500] min-w-[216px] flex flex-col p-[6px] bg-panel border border-solid border-line-2",
              "cut-tag [--cut-tag:9px] animate-[bm-menu-in_0.12s_ease-out] motion-reduce:animate-none",
            )}
          >
          {items.map((it, i) =>
            it.sep ? (
              <span key={"s" + i} role="separator" className="h-px my-[5px] mx-1 bg-line" />
            ) : it.header ? (
              <span key={"h" + i} className="pt-2 px-[11px] pb-1 font-mono text-[9.5px] font-bold leading-none uppercase tracking-[0.14em] text-txt-dim">
                {it.header}
              </span>
            ) : it.node ? (
              <div key={"n" + i} className="p-[2px]">
                {typeof it.node === "function" ? it.node({ close: () => setOpen(false) }) : it.node}
              </div>
            ) : (
              <button
                key={i}
                type="button"
                role="menuitem"
                disabled={it.disabled}
                ref={(el) => {
                  itemRefs.current[i] = el
                }}
                tabIndex={active === i ? 0 : -1}
                onMouseEnter={() => setActive(i)}
                onClick={() => choose(it)}
                className={cn(
                  "group/mi flex items-center gap-[11px] w-full text-left py-[9px] px-[11px] border-0 bg-transparent cursor-pointer",
                  "font-body text-[14px] font-medium leading-[1.2] transition-[background,color] duration-[140ms] outline-none",
                  "disabled:opacity-40 disabled:cursor-not-allowed",
                  it.danger
                    ? "text-bad hover:bg-bad-soft focus-visible:bg-bad-soft"
                    : "text-txt hover:bg-accent-soft hover:text-accent-bright focus-visible:bg-accent-soft focus-visible:text-accent-bright",
                )}
              >
                {it.icon && (
                  <Icon
                    name={it.icon}
                    size={15}
                    className={cn("flex-none", it.danger ? "text-bad" : "text-txt-muted group-hover/mi:text-accent group-focus-visible/mi:text-accent")}
                  />
                )}
                <span className="flex-1">{it.label}</span>
                {it.shortcut && <Kbd>{it.shortcut}</Kbd>}
              </button>
            ),
          )}
          </div>,
          document.body,
        )}
    </span>
  )
}

export const Dropdown = Menu
