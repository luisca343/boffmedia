import type { HTMLAttributes } from "react"

/**
 * The frosted panel every surface in the PC is made of. `pc-glass` is a component
 * class rather than utilities because the backdrop-filter has to be one declaration —
 * the box wallpaper bleeds through the chrome sitting on top of it.
 */
export function Panel({ className = "", ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`pc-glass rounded-pc-lg ${className}`} {...rest} />
}
