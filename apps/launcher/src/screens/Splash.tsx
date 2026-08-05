import { Icon } from "@boffmedia/ui"

// The window is created hidden and revealed on first paint (main.tsx), so this
// is the FIRST thing a player ever sees. It exists for one reason: silent
// sign-in is a four-hop network chain, and until it settles the launcher does
// not know whether the correct screen is the pack list or "Entrar con
// Microsoft". Showing either one early is a lie; showing this is not.
//
// Deliberately asset-free — no logo file to load means nothing can arrive a
// frame late and make the splash itself flash.

export function Splash({ step }: { step: string }) {
  return (
    <div className="grid h-full place-items-center bg-base px-8">
      <div className="flex w-full max-w-[340px] flex-col items-center">
        <span className="cut-seal grid h-20 w-20 place-items-center bg-accent text-accent-ink">
          <Icon name="play" size={34} />
        </span>

        <h1 className="mt-6 font-display text-[30px]/none font-bold uppercase tracking-[0.16em] text-txt">
          Boff Launcher
        </h1>

        {/* Indeterminate on purpose: boot has no honest percentage, and a fake
            one that jumps to 90% and waits is worse than a moving stripe. */}
        <div className="relative mt-7 h-1.5 w-full overflow-hidden border border-solid border-line bg-panel-2">
          <i className="splash-sweep absolute inset-y-0 w-2/5 [background:repeating-linear-gradient(-55deg,var(--accent)_0_8px,var(--accent-bright)_8px_16px)]" />
        </div>

        {/* aria-live so a screen reader follows boot instead of sitting on a
            silent screen; the text swaps in place rather than stacking. */}
        <p aria-live="polite" className="mt-3 h-4 text-xs text-txt-dim">
          {step}
        </p>
      </div>
    </div>
  )
}
