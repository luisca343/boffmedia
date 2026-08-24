import { cn } from "@/lib/utils"
import { STAT_META, STAT_ORDER, NATURE_CHANGES } from "../_lib/meta-types"

/** The datakit's type badge under the Meta kit's name — this used to be a
 *  byte-identical copy of it. */
export { DkType as MvType } from "@/components/boffmedia/ui/tools/datakit"

/** EV spread: coloured nature (+/− arrows) and the invested-stat line. */
export function MvSpread({ nature, ev }: { nature: string; ev: number[] }) {
  const change = NATURE_CHANGES[nature] ?? null
  const parts = STAT_ORDER.map((k, i) => ({ k, v: ev[i] || 0 })).filter((p) => p.v > 0)
  return (
    <div className="grid min-w-0 flex-1 gap-[2px]">
      <span className="font-body text-[12px] font-bold leading-[1.2]">
        {nature}
        {change && (
          <span className="ml-1 font-mono text-[10px] leading-none">
            {" "}
            <b style={{ color: STAT_META[change.plus].color }}>+{STAT_META[change.plus].label}</b>{" "}
            <b className="text-bad">−{STAT_META[change.minus].label}</b>
          </span>
        )}
      </span>
      <span className="font-mono text-[11px] leading-[1.3] text-txt-muted">
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
    <div className="grid gap-[6px]">
      {STAT_ORDER.map((k) => (
        <div key={k} className="flex items-center gap-[9px]">
          <span className="w-[26px] flex-none font-mono text-[10px] font-bold leading-none" style={{ color: STAT_META[k].color }}>
            {STAT_META[k].label}
          </span>
          <span className="w-[30px] flex-none text-right font-mono text-[11px] font-semibold leading-none text-txt-muted">
            {base[k] ?? 0}
          </span>
          <span className="h-[7px] flex-1 overflow-hidden border border-solid border-line bg-base">
            <i className="block h-full opacity-[0.85]" style={{ width: `${Math.min(100, ((base[k] || 0) / 200) * 100)}%`, background: STAT_META[k].color }} />
          </span>
        </div>
      ))}
      <div className="mt-[2px] flex justify-between border-t border-dashed border-line pt-[7px] font-mono text-[11px] font-semibold leading-none">
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
      <header className="flex items-baseline gap-[10px] border-b border-solid border-line px-[14px] py-[10px]">
        <h3 className="m-0 font-display text-[13px] font-bold uppercase leading-none tracking-[0.06em]">
          <span className="align-[2px] text-[9px] text-accent">◆ </span>
          {title}
        </h3>
        {aside && (
          <span className="ml-auto font-mono text-[9.5px] font-medium uppercase leading-none tracking-[0.08em] text-txt-dim">
            {aside}
          </span>
        )}
      </header>
      <div className="grid gap-2 px-[14px] pb-3 pt-[10px]">{children}</div>
    </section>
  )
}
