import { Icon } from "@boffmedia/ui"

/**
 * The one in-section back affordance. PackDetail and ToolView are the same
 * shape — a depth-one view inside a section the rail is still highlighting —
 * and each had hand-rolled its own back link, in different type, at different
 * weights, in different positions. One component so "go up one level" looks and
 * behaves identically wherever it appears.
 *
 * `bordered` is the only variant: a view that owns the full height (a tool)
 * needs the header to read as a fixed bar, while one that scrolls with its page
 * (a pack) does not want a rule cutting across its own heading.
 */
export function SectionHeader({
  label,
  onBack,
  title,
  actions,
  bordered = false,
}: {
  label: string
  onBack: () => void
  title?: React.ReactNode
  actions?: React.ReactNode
  bordered?: boolean
}) {
  return (
    <div
      className={
        bordered
          ? "flex shrink-0 items-center gap-3 border-b border-line px-4 py-2"
          : "mb-4 flex items-center gap-3"
      }
    >
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs uppercase tracking-[0.1em] text-txt-muted transition-colors hover:text-accent-bright"
      >
        <Icon name="back" size={13} /> {label}
      </button>
      {title && (
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-txt">{title}</span>
      )}
      {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
    </div>
  )
}
