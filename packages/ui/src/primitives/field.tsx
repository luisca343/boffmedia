import * as React from "react"
import { cn } from "../cn"

export interface FieldProps {
  label?: React.ReactNode
  hint?: React.ReactNode
  error?: React.ReactNode
  className?: string
  children: React.ReactNode
}

/** Props a control might already carry that give it an accessible name. If any
 *  is present the child is left alone — an explicit name at the call site is a
 *  deliberate choice and outranks the one derived here. */
type NameableProps = {
  "aria-label"?: unknown
  "aria-labelledby"?: unknown
  label?: unknown
}

/**
 * A labelled form control.
 *
 * The label is applied to the CHILD as `aria-label` rather than rendered as a
 * floating `<label>` and hoped for. That distinction is the whole point of this
 * component, and getting it wrong is invisible: a `<label>` with no `htmlFor`,
 * rendered as a SIBLING of its control rather than wrapping it, is associated
 * with nothing at all. The text appears on screen, review passes, and the input
 * is announced as unnamed. There were 153 of those before this changed.
 *
 * **Why `aria-label` and not `htmlFor`.** A real `htmlFor` needs a unique id,
 * which needs `useId`, which is a hook — and this file has no `"use client"`.
 * Adding one would push ~150 call sites' worth of consumers across the
 * server/client boundary to fix a naming bug, which is far too much blast radius
 * for the problem. `Select` already solved it exactly this way (it derives its
 * own `aria-label` from its `label` prop before delegating here), so this is the
 * codebase's existing answer rather than a new one.
 *
 * What that trades away: clicking the label text does not focus the control.
 * That is a convenience rather than the defect — and it never worked here
 * anyway, for the same reason the label named nothing.
 */
export function Field({ label, hint, error, className, children }: FieldProps) {
  // Exactly one element child, or there is nothing to clone: a Field wrapping
  // several controls has no single thing the label belongs to, and guessing
  // would name the wrong one.
  const only = React.Children.count(children) === 1 ? children : null
  const child = React.isValidElement<NameableProps>(only) ? only : null
  const alreadyNamed =
    child != null &&
    (child.props["aria-label"] !== undefined ||
      child.props["aria-labelledby"] !== undefined ||
      child.props.label !== undefined)

  // Only when `label` is a string: a ReactNode cannot become an `aria-label`,
  // and those call sites keep exactly today's behaviour rather than being handed
  // a wrong name.
  const applied = child != null && typeof label === "string" && !alreadyNamed
  const labelled = applied
    ? React.cloneElement(child, { "aria-label": label as string })
    : children

  return (
    <div
      className={cn(
        "grid gap-2",
        error && "[&_input]:border-bad [&_textarea]:border-bad [&_select]:border-bad",
        className,
      )}
    >
      {label && (
        // Kept as a `<label>` rather than demoted to a `<span>`: it is still the
        // element this text is meant to be, and nothing is gained by changing
        // the tag under 150 call sites.
        //
        // `aria-hidden` ONLY when the text was actually applied to the control
        // above, or this would hide the one thing naming the field. Where it was
        // applied, leaving it exposed announces the same words twice.
        <label
          aria-hidden={applied || undefined}
          className="font-mono text-[11px] font-semibold leading-none uppercase tracking-[0.12em] text-txt-muted"
        >
          {label}
        </label>
      )}
      {labelled}
      {(hint || error) && (
        <span className={cn("font-body text-[12px] leading-[1.4]", error ? "text-bad" : "text-txt-dim")}>
          {error || hint}
        </span>
      )}
    </div>
  )
}
