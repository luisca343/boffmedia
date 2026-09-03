import Link from "next/link"
import type { ComponentProps, ReactNode } from "react"
import { cn } from "@/lib/utils"

const base =
  "inline-flex items-center text-[0.6875rem] font-semibold px-2 py-[3px] rounded-mw-pill no-underline " +
  "text-mw-accent bg-mw-accent/[.14] border border-mw-accent/25"

const interactive =
  "transition-colors duration-150 hover:bg-mw-accent/20 hover:border-mw-accent/40 " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mw-accent " +
  "focus-visible:ring-offset-2 focus-visible:ring-offset-mw-bg"

type CommonProps = { className?: string; children: ReactNode }

export function Tag({
  href,
  className,
  children,
  ...rest
}: CommonProps &
  ({ href: string } | { href?: undefined }) &
  Omit<ComponentProps<"span">, "className" | "children">) {
  if (href) {
    return (
      <Link href={href} className={cn(base, interactive, className)}>
        {children}
      </Link>
    )
  }
  return (
    <span className={cn(base, className)} {...rest}>
      {children}
    </span>
  )
}
