"use client"

import * as React from "react"
import { cn, Icon, type IconName } from "@boffmedia/ui"

/**
 * Small, host-agnostic primitives shared by the Codex and the builder.
 *
 * Mewgenics intentionally has a stronger visual language than the global
 * primitives, but it still needs one vocabulary for focus rings, actions and
 * paper tags. Keeping those decisions here prevents every view from growing a
 * slightly different Tailwind recipe.
 */

export const MEW_FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--mwp-red)] focus-visible:ring-offset-0"

type ButtonVariant = "paper" | "ghost" | "danger"

export interface MewButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: IconName
  variant?: ButtonVariant
}

export function MewButton({
  icon,
  variant = "paper",
  className,
  children,
  ...props
}: MewButtonProps) {
  return (
    <button
      type="button"
      {...props}
      className={cn("mew-button", `mew-button--${variant}`, MEW_FOCUS, className)}
    >
      {icon && <Icon name={icon} size={15} aria-hidden />}
      {children && <span>{children}</span>}
    </button>
  )
}

export interface MewIconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: IconName
  label: string
  active?: boolean
}

export function MewIconButton({
  icon,
  label,
  active = false,
  className,
  ...props
}: MewIconButtonProps) {
  return (
    <button
      type="button"
      {...props}
      aria-label={props["aria-label"] ?? label}
      title={props.title ?? label}
      aria-pressed={props["aria-pressed"] ?? (active || undefined)}
      className={cn("mew-icon-button", active && "mew-icon-button--active", MEW_FOCUS, className)}
    >
      <Icon name={icon} size={16} aria-hidden />
    </button>
  )
}

export function MewTag({
  icon,
  tone = "neutral",
  children,
  className,
}: {
  icon?: IconName
  tone?: "neutral" | "good" | "warn" | "bad" | "hue"
  children: React.ReactNode
  className?: string
}) {
  return (
    <span className={cn("mew-tag", `mew-tag--${tone}`, className)}>
      {icon && <Icon name={icon} size={11} aria-hidden />}
      {children}
    </span>
  )
}

export function MewLoading({ label }: { label: string }) {
  return (
    <div className="mew-loading" role="status" aria-live="polite">
      <span className="mew-loading__spinner" aria-hidden />
      <span>{label}</span>
    </div>
  )
}
