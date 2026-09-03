import * as React from "react"
import { cn } from "../cn"

export interface FieldProps {
  label?: React.ReactNode
  hint?: React.ReactNode
  error?: React.ReactNode
  className?: string
  children: React.ReactNode
}

/** Props a control might already carry. The first three give it an accessible
 *  name: if any is present the child is left alone — an explicit name at the
 *  call site is a deliberate choice and outranks the one derived here. The last
 *  two are merged with (description) or yield to (invalid state) what is set. */
type ControlProps = {
  "aria-label"?: unknown
  "aria-labelledby"?: unknown
  label?: unknown
  "aria-describedby"?: string
  "aria-invalid"?: boolean | "true" | "false" | "grammar" | "spelling"
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
 * **Why `aria-label` and not `htmlFor`.** `htmlFor` needs an `id` on the
 * control's ROOT element. Children here range from bare `<input>`s to
 * composites that spread props onto a wrapper, and an id that lands on a
 * wrapper associates the label with nothing — silently, the exact failure this
 * component exists to prevent — and ~150 call sites are too much blast radius
 * to audit for it. `Select` already solved naming exactly this way (it derives
 * its own `aria-label` from its `label` prop before delegating here), so this is
 * the codebase's existing answer rather than a new one. (`useId` itself is fine
 * in Server Components; the hint/error id below relies on that.)
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
  const child = React.isValidElement<ControlProps>(only) ? only : null
  const alreadyNamed =
    child != null &&
    (child.props["aria-label"] !== undefined ||
      child.props["aria-labelledby"] !== undefined ||
      child.props.label !== undefined)

  // Only when `label` is a string: a ReactNode cannot become an `aria-label`,
  // and those call sites keep exactly today's behaviour rather than being handed
  // a wrong name.
  const applied = child != null && typeof label === "string" && !alreadyNamed

  const hintId = React.useId()
  const described = Boolean(hint || error)

  // One clone carrying everything the wrapper knows about its control: the
  // derived name (when it applies), the hint/error text as its description and
  // the invalid state. Each is merged with, never written over, what the call
  // site already set — an explicit `aria-describedby` keeps its own ids too.
  const labelled =
    child != null && (applied || described)
      ? React.cloneElement(child, {
          ...(applied && { "aria-label": label as string }),
          ...(described && {
            "aria-describedby": [child.props["aria-describedby"], hintId].filter(Boolean).join(" "),
          }),
          ...(error && child.props["aria-invalid"] === undefined && { "aria-invalid": true }),
        })
      : children

  return (
    <div
      className={cn(
        "grid gap-2",
        // The cut stroke is painted from --cut-line, not from the border, so an
        // invalid control has to recolour both or its corner stays grey.
        error &&
          "[&_input]:border-bad [&_textarea]:border-bad [&_select]:border-bad [&_input]:[--cut-line:var(--bad)] [&_textarea]:[--cut-line:var(--bad)] [&_select]:[--cut-line:var(--bad)]",
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
          className="font-mono text-[0.6875rem] font-semibold leading-none uppercase tracking-[0.12em] text-txt-muted"
        >
          {label}
        </label>
      )}
      {labelled}
      {described && (
        <span id={hintId} className={cn("font-body text-[0.75rem] leading-[1.4]", error ? "text-bad" : "text-txt-dim")}>
          {error || hint}
        </span>
      )}
    </div>
  )
}
