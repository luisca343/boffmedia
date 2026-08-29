import * as React from "react"
import { cn } from "../cn"
import { BTN_BASE, BTN_BOX, BTN_VARIANTS, type ButtonSize, type ButtonVariant } from "./button"
import { Icon, type IconName } from "./icon"

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  name: IconName
  label: string
  variant?: ButtonVariant
  size?: ButtonSize
}

/** The glyph fills more of the box than a label-adjacent icon does: there is no
 *  text beside it to set the optical weight. */
const GLYPH_PX: Record<ButtonSize, number> = { sm: 15, md: 18, lg: 20 }

export function IconButton({ name, label, variant = "default", size = "md", className, ...props }: IconButtonProps) {
  const glyph = GLYPH_PX[size]

  return (
    <button
      className={cn(
        BTN_BASE,
        BTN_VARIANTS[variant] || BTN_VARIANTS.default,
        // Square: the shared box class carries the height and the chamfer token,
        // the horizontal padding it also carries is replaced by a matching width.
        BTN_BOX[size] || BTN_BOX.md,
        size === "sm" ? "w-8 px-0" : size === "lg" ? "w-12 px-0" : "w-10 px-0",
        // An icon-only control is chrome — it carries no label to justify full
        // text weight — so the resting glyph stays muted. Any explicit variant
        // other than `default` means the caller wants the emphasis, and keeps it.
        variant === "default" && "text-txt-muted",
        className,
      )}
      aria-label={label}
      title={label}
      {...props}
    >
      <Icon name={name} size={glyph} />
    </button>
  )
}
