import Link from "next/link"
import type { ComponentProps, ReactNode } from "react"
import { cn } from "@/lib/utils"

type Variant = "solid" | "ghost" | "plain"
type Size = "sm" | "md" | "lg"

const base =
  "inline-flex items-center gap-1.5 font-semibold leading-none border border-transparent " +
  "transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 " +
  "focus-visible:ring-mw-accent focus-visible:ring-offset-2 focus-visible:ring-offset-mw-bg"

const sizes: Record<Size, string> = {
  sm: "px-2.5 py-1.5 text-xs rounded-mw-md",
  md: "px-[14px] py-2 text-[13px] rounded-mw-md",
  lg: "px-[18px] py-3 text-sm rounded-mw-lg",
}

const variants: Record<Variant, string> = {
  // accent gradient CTA (identical for both apps — accent switches per data-app)
  solid:
    "text-mw-accent-on bg-[linear-gradient(135deg,rgb(var(--mw-accent)),var(--mw-accent-dark))] " +
    "shadow-[0_8px_24px_-10px_rgb(var(--mw-accent)/.35)] hover:brightness-110 " +
    "hover:shadow-[0_12px_28px_-10px_rgb(var(--mw-accent)/.35)]",
  // glass tinted with the accent
  ghost:
    "text-mw-fg backdrop-blur-[6px] " +
    "bg-[color-mix(in_srgb,rgb(var(--mw-accent))_10%,rgba(255,255,255,.04))] " +
    "border-[color-mix(in_srgb,rgb(var(--mw-accent))_30%,var(--mw-hairline-strong))] " +
    "hover:bg-[color-mix(in_srgb,rgb(var(--mw-accent))_18%,rgba(255,255,255,.08))] " +
    "hover:border-[color-mix(in_srgb,rgb(var(--mw-accent))_55%,transparent)]",
  // neutral surface button
  plain: "text-mw-fg bg-mw-700 hover:bg-mw-700/80",
}

type CommonProps = {
  variant?: Variant
  size?: Size
  className?: string
  children: ReactNode
}

type ButtonProps = CommonProps &
  Omit<ComponentProps<"button">, "className" | "children">
type AnchorProps = CommonProps & { href: string } & Omit<
    ComponentProps<typeof Link>,
    "className" | "children" | "href"
  >

export function Button(props: ButtonProps | AnchorProps) {
  const { variant = "plain", size = "md", className, children } = props
  const classes = cn(base, sizes[size], variants[variant], className)

  if ("href" in props && props.href != null) {
    const { href, variant: _v, size: _s, className: _c, children: _ch, ...rest } = props
    return (
      <Link href={href} className={classes} {...rest}>
        {children}
      </Link>
    )
  }
  const { variant: _v, size: _s, className: _c, children: _ch, ...rest } =
    props as ButtonProps
  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  )
}
