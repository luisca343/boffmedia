import Link from "next/link"
import type { ComponentProps, ReactNode } from "react"
import { cn } from "@/lib/utils"

const base =
  "inline-flex items-center gap-1.5 h-9 text-[13px] font-semibold rounded-mw-pill text-mw-fg " +
  "transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 " +
  "focus-visible:ring-mw-accent focus-visible:ring-offset-2 focus-visible:ring-offset-mw-bg " +
  "bg-[color-mix(in_srgb,rgb(var(--mw-accent))_8%,rgb(var(--mw-800)))] " +
  "border border-[color-mix(in_srgb,rgb(var(--mw-accent))_22%,var(--mw-hairline))] " +
  "hover:bg-[color-mix(in_srgb,rgb(var(--mw-accent))_16%,rgb(var(--mw-700)))] " +
  "hover:border-[color-mix(in_srgb,rgb(var(--mw-accent))_45%,transparent)]"

const on =
  "!bg-[color-mix(in_srgb,rgb(var(--mw-accent))_18%,rgb(var(--mw-800)))] " +
  "!border-[color-mix(in_srgb,rgb(var(--mw-accent))_50%,transparent)] !text-mw-accent"

type CommonProps = {
  active?: boolean
  iconOnly?: boolean
  className?: string
  children: ReactNode
}
type BtnProps = CommonProps & Omit<ComponentProps<"button">, "className" | "children">
type AProps = CommonProps & { href: string } & Omit<ComponentProps<typeof Link>, "className" | "children" | "href">

export function PillBtn(props: BtnProps | AProps) {
  const { active, iconOnly, className, children } = props
  const classes = cn(base, iconOnly ? "w-9 justify-center px-0" : "px-[14px]", active && on, className)

  if ("href" in props && props.href != null) {
    const { href, active: _a, iconOnly: _i, className: _c, children: _ch, ...rest } = props
    return (
      <Link href={href} className={classes} {...rest}>
        {children}
      </Link>
    )
  }
  const { active: _a, iconOnly: _i, className: _c, children: _ch, ...rest } = props as BtnProps
  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  )
}
