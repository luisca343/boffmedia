import { cn } from "@boffmedia/ui/cn"
import { STAT_META, STAT_ORDER, NATURE_CHANGES } from "../_lib/meta-types"

/** The datakit's type badge under the Meta kit's name — this used to be a
 *  byte-identical copy of it. */
export { DkType as MvType } from "@boffmedia/ui/datakit"

/** EV spread: coloured nature (+/− arrows) and the invested-stat line. */
export function MvSpread({ nature, ev }: { nature: string; ev: number[] }) {
  const change = NATURE_CHANGES[nature] ?? null
  const parts = STAT_ORDER.map((k, i) => ({ k, v: ev[i] || 0 })).filter((p) => p.v > 0)
  return (
    <div className="grid min-w-0 flex-1 gap-[2px]">
      <span className="font-body text-[0.75rem] font-bold leading-[1.2]">
        {nature}
        {change && (
          <span className="ml-1 font-mono text-[0.625rem] leading-none">
            {" "}
            <b style={{ color: STAT_META[change.plus].color }}>+{STAT_META[change.plus].label}</b>{" "}
            <b className="text-bad">−{STAT_META[change.minus].label}</b>
          </span>
        )}
      </span>
      <span className="font-mono text-[0.6875rem] leading-[1.3] text-txt-muted">
        {parts.map((p, i) => (
          <span key={p.k}>
            {i > 0 && <i className="not-italic text-txt-dim"> / </i>}
            {p.v} <b className="font-bold" style={{ color: STAT_META[p.k].color }}>{STAT_META[p.k].label}</b>
          </span>
        ))}
      </span>
    </div>
  )
}

/** Base-stat bars with a BST total. */
export function MvBaseStats({ base }: { base: Record<string, number> }) {
  const total = STAT_ORDER.reduce((a, k) => a + (base[k] || 0), 0)
  return (
    <div className="grid gap-[0.375rem]">
      {STAT_ORDER.map((k) => (
        <div key={k} className="flex items-center gap-[0.5625rem]">
          <span className="w-[1.625rem] flex-none font-mono text-[0.625rem] font-bold leading-none" style={{ color: STAT_META[k].color }}>
            {STAT_META[k].label}
          </span>
          <span className="w-[1.875rem] flex-none text-right font-mono text-[0.6875rem] font-semibold leading-none text-txt-muted">
            {base[k] ?? 0}
          </span>
          <span className="h-[0.4375rem] flex-1 overflow-hidden border border-solid border-line bg-base">
            <i className="block h-full opacity-[0.85]" style={{ width: `${Math.min(100, ((base[k] || 0) / 200) * 100)}%`, background: STAT_META[k].color }} />
          </span>
        </div>
      ))}
      <div className="mt-[2px] flex justify-between border-t border-dashed border-line pt-[0.4375rem] font-mono text-[0.6875rem] font-semibold leading-none">
        <span className="tracking-[0.12em] text-txt-dim">BST</span>
        <b>{total}</b>
      </div>
    </div>
  )
}

/** Titled detail card (◆ heading + optional right-aligned aside). */
export function MvCard({
  title,
  aside,
  wide,
  children,
}: {
  title: React.ReactNode
  aside?: React.ReactNode
  wide?: boolean
  children: React.ReactNode
}) {
  return (
    <section className={cn("min-w-0 border border-solid border-line bg-panel", wide && "mt-3")}>
      <header className="flex items-baseline gap-[0.625rem] border-b border-solid border-line px-[0.875rem] py-[0.625rem]">
        <h3 className="m-0 font-display text-[0.8125rem] font-bold uppercase leading-none tracking-[0.06em]">
          <span className="align-[2px] text-[0.5625rem] text-accent">◆ </span>
          {title}
        </h3>
        {aside && (
          <span className="ml-auto font-mono text-[0.59375rem] font-medium uppercase leading-none tracking-[0.08em] text-txt-dim">
            {aside}
          </span>
        )}
      </header>
      <div className="grid gap-2 px-[0.875rem] pb-3 pt-[0.625rem]">{children}</div>
    </section>
  )
}
