// DESK. Everything here is chrome: it sits on the walnut, never on the paper.

/**
 * The document's letterhead, and nothing else.
 *
 * No row of controls for ornament level, motion or inspection: those are design-harness
 * knobs, not features of a passport. What they drove still exists — the ornament sits at
 * its designed level, motion follows the reader's OS preference, and Inspección is
 * reachable with the `I` key (the Rotom note on the carné says so, which is the only place
 * it needs to be said).
 */
export function TopBar() {
  return (
    <header className="z-40 flex items-center gap-3 px-[1.375rem] py-3.5">
      <span
        aria-hidden="true"
        className="grid h-[2.125rem] w-[2.125rem] flex-none place-items-center rounded-[5px] border border-ps-gild/45 bg-gradient-to-br from-ps-navy to-ps-navy-deep font-ps-display text-[0.9375rem] font-bold text-ps-gild-hi shadow-[0_1px_4px_rgba(0,0,0,.4),inset_0_1px_0_rgba(255,255,255,.12)]"
      >
        T
      </span>
      <span className="truncate font-ps-ceremony text-[1rem] font-semibold tracking-[.03em] text-ps-chrome-fg">
        <b className="font-bold text-ps-gild">Gobierno</b> de Teras
      </span>
      <span className="hidden font-ps-mono text-[0.6875rem] uppercase tracking-[.2em] text-ps-chrome-subtle sm:inline">
        Pasaporte
      </span>
    </header>
  )
}
