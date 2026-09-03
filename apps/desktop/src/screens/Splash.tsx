// The window is created hidden and revealed on first paint (main.tsx), so this
// is the FIRST thing a player ever sees. It exists for one reason: silent
// sign-in is a four-hop network chain, and until it settles the launcher does
// not know whether the correct screen is the pack list or "Entrar con
// Microsoft". Showing either one early is a lie; showing this is not.
//
// Nothing here is FETCHED — every mark is either generated (CSS + inline SVG)
// or base64'd into the bundle (`?inline`), so nothing can arrive a frame late
// and make the splash itself flash. All motion is defined in index.css under
// `.splash-*` and parks safely under prefers-reduced-motion.

import markUrl from "../../src-tauri/icons/128x128.png?inline"

export function Splash({ step }: { step: string }) {
  return (
    <div className="relative grid h-full place-items-center overflow-hidden bg-base px-8">
      {/* Faint drifting stripe wash — depth without drawing the eye. */}
      <div className="splash-backdrop pointer-events-none absolute inset-0 opacity-60" />

      <div className="relative flex w-full max-w-[22.5rem] flex-col items-center">
        {/* Brand mark: chamfered seal, rotating glow ring, breathing halo, and
            broadcast corner brackets that frame it. */}
        <div className="splash-mark relative grid h-28 w-28 place-items-center [--cut:14px]">
          {/* Rotating conic glow, sitting behind the seal. */}
          <span
            className="splash-ring pointer-events-none absolute -inset-2 rounded-full opacity-70 blur-md"
            style={{
              background:
                "conic-gradient(from 0deg, transparent 0deg, var(--accent-bright) 90deg, transparent 200deg)",
            }}
          />
          {/* Soft breathing halo. */}
          <span className="splash-halo pointer-events-none absolute inset-1 rounded-full bg-accent-soft blur-lg" />

          {/* Corner brackets. */}
          <span className="splash-bracket-tl pointer-events-none absolute left-0 top-0 h-4 w-4 border-l-2 border-t-2 border-solid border-accent" />
          <span className="splash-bracket-br pointer-events-none absolute bottom-0 right-0 h-4 w-4 border-b-2 border-r-2 border-solid border-accent" />

          {/* The seal. The mark used to be a generated PLAY TRIANGLE — right
              when this was a launcher and pressing Play was the only thing it
              did, wrong now that Tools is a first-class section. It is the real
              Boffmedia mark instead.
              `?inline` is what keeps the promise at the top of this file: Vite
              base64s the file INTO the bundle rather than emitting a URL, so
              there is no second request that can land a frame late and make the
              splash flash. It is also why the seal turned dark — the mark is
              orange, and orange-on-accent is an invisible logo. */}
          <span className="cut-seal relative grid h-20 w-20 place-items-center border-2 border-solid border-accent bg-base-deep shadow-[0_10px_30px_rgba(255,92,10,0.35)]">
            <img
              src={markUrl}
              width={44}
              height={44}
              alt=""
              draggable={false}
              className="splash-glyph-fade select-none"
            />
          </span>
        </div>

        <h1 className="splash-word mt-7 font-display text-[2.125rem]/none font-bold uppercase tracking-[0.14em] text-txt">
          Boffmedia<span className="text-accent"> App</span>
        </h1>

        <p className="splash-tag mt-1.5 font-display text-[0.6875rem] uppercase tracking-[0.42em] text-txt-dim">
          Ficus Labs
        </p>

        {/* Indeterminate on purpose: boot has no honest percentage, and a fake
            one that jumps to 90% and waits is worse than a moving stripe. */}
        <div className="splash-bar relative mt-8 h-1.5 w-full overflow-hidden border border-solid border-line bg-panel-2">
          <i className="splash-sweep absolute inset-y-0 w-2/5 [background:repeating-linear-gradient(-55deg,var(--accent)_0_8px,var(--accent-bright)_8px_16px)]" />
        </div>

        {/* aria-live so a screen reader follows boot instead of sitting on a
            silent screen; the text swaps in place rather than stacking. */}
        <p aria-live="polite" className="splash-bar mt-3 h-4 text-xs text-txt-dim">
          {step}
        </p>
      </div>
    </div>
  )
}
