import * as React from "react"
import { cn } from "../cn"
import { Icon } from "./icon"

export interface DragCardProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  dragging?: boolean
  dropTarget?: boolean
  /** Optional visual grip; whole-card activation works without it. Defaults to false. */
  showGrip?: boolean
  /** Keep the click action available while the host disables drag activation. */
  dragDisabled?: boolean
  /** Non-interactive status, such as a lock or assignment marker. */
  status?: React.ReactNode
}

/** Presentation only: bind the host's drag listeners/ref to the whole button.
 * A tap/Enter can still open actions. Children must be non-interactive content. */
export const DragCard = React.forwardRef<HTMLButtonElement, DragCardProps>(function DragCard({
  dragging = false, dropTarget = false, showGrip = false, dragDisabled = false, status, children, className, type = "button", ...props
}, ref) {
  return <button {...props} ref={ref} type={type} data-dragging={dragging || undefined} data-drop-target={dropTarget || undefined}
    className={cn(
      "group relative block w-[var(--drag-card-size,5rem)] shrink-0 select-none self-start border border-line bg-base p-0 text-left",
      "touch-manipulation outline-none transition-[border-color,box-shadow,opacity] duration-150",
      "hover:border-accent hover:shadow-md focus-visible:ring-2 focus-visible:ring-accent",
      dragDisabled ? "cursor-pointer" : "cursor-grab active:cursor-grabbing",
      "disabled:cursor-not-allowed disabled:opacity-[0.42]",
      dragging && "border-dashed border-accent opacity-30",
      dropTarget && "border-accent ring-2 ring-accent before:absolute before:-left-1.5 before:inset-y-0 before:w-1 before:bg-accent before:content-['']",
      className,
    )}>
    {children}
    {status && <span data-drag-status className="pointer-events-none absolute right-1 top-1 grid min-h-6 min-w-6 place-items-center border border-line bg-panel px-1 text-txt">{status}</span>}
    {showGrip && !status && !dragDisabled && <span data-drag-grip aria-hidden="true" className="pointer-events-none absolute right-0 top-0 grid h-6 w-6 place-items-center bg-base/85 text-txt-muted group-hover:text-accent">
      <Icon name="grip" size={14} />
    </span>}
  </button>
})

/** Lifted artwork for a host's drag overlay. No DnD, domain or host dependency. */
export function DragPreview({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props} aria-hidden="true" className={cn(
    "pointer-events-none relative w-[var(--drag-card-size,5rem)] rotate-3 scale-110 select-none border-2 border-accent bg-panel",
    "shadow-[0_12px_32px_rgba(0,0,0,0.4)] ring-4 ring-accent/20 motion-reduce:transform-none",
    className,
  )}>{children}</div>
}

/** In-flow destination slot: the host projects order without committing it.
 * Forward a drop ref so hovering the new gap keeps the insertion stable. */
export const DragPlaceholder = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(function DragPlaceholder({ children, className, ...props }, ref) {
  return <div {...props} ref={ref} aria-hidden="true" className={cn(
    "relative w-[var(--drag-card-size,5rem)] shrink-0 select-none self-start border-2 border-dashed border-accent bg-accent-soft ring-2 ring-inset ring-accent/25",
    "pointer-events-none [&>*]:opacity-40",
    className,
  )}>{children}</div>
})

export interface DragTargetProps extends React.HTMLAttributes<HTMLDivElement> {
  dragging?: boolean
  active?: boolean
}

/** Drop-area states. The host decides whether an item or its container is over
 * this target, so nested insertion targets can highlight the full destination. */
export const DragTarget = React.forwardRef<HTMLDivElement, DragTargetProps>(function DragTarget({
  dragging = false, active = false, children, className, ...props
}, ref) {
  return <div {...props} ref={ref} data-drop-state={active ? "active" : dragging ? "available" : "idle"}
    className={cn(
      "flex min-h-32 min-w-0 flex-1 flex-wrap content-start gap-2 p-3 transition-[background-color,box-shadow] duration-150",
      dragging && "bg-panel-2 outline outline-1 -outline-offset-1 outline-dashed outline-line-2",
      active && "bg-accent-soft ring-2 ring-inset ring-accent outline-accent",
      className,
    )}>{children}</div>
})
