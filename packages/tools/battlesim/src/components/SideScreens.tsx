'use client';

/**
 * Screens and Tailwind, as a tint over the owning side's half of the field.
 *
 * PURE CSS, ON PURPOSE. The previous `Hazard` drew `fx/${id}.png` for every
 * entry in `sideConditions`, and only four of those ids have art — so Reflect,
 * Light Screen, Aurora Veil, Safeguard, Mist, Lucky Chant and Tailwind each
 * produced a broken image on the field. A gradient cannot 404, so the failure
 * mode this replaces is structurally impossible here.
 *
 * `safeguard` / `mist` / `luckychant` deliberately draw NOTHING: three more
 * translucent washes over the same half of the field stop reading as anything.
 * They stay visible as chips in `FieldConditions`, which is where the exact
 * remaining-turn counts live for all of them anyway.
 *
 * Sides are named by where they are DRAWN, not by player: `side="ally"` is the
 * viewer's half (bottom), `side="foe"` the far half (top). The caller passes
 * the pov-swapped side object, exactly as it does for hazards.
 */

import * as React from 'react';

/** Which half of the 16:9 field a side owns. The split follows the hazard rows
 *  (foe caltrops sit around 20-30% down, the viewer's around 46-56%), not a
 *  naive 50/50, so the tint lands under the Pokémon rather than behind them. */
const HALF: Record<'ally' | 'foe', React.CSSProperties> = {
  foe: { top: 0, left: 0, right: 0, bottom: '55%' },
  ally: { top: '45%', left: 0, right: 0, bottom: 0 },
};

/** A side condition id → the wash that stands for it, or `null` for chip-only. */
function paintFor(id: string): React.CSSProperties | null {
  switch (id) {
    case 'reflect':
      // Physical: rose. Reads as a solid pane of coloured glass.
      return { background: 'linear-gradient(to top, rgba(244,114,182,0.26), rgba(244,114,182,0.10))' };
    case 'lightscreen':
      // Special: amber.
      return { background: 'linear-gradient(to top, rgba(250,204,21,0.24), rgba(250,204,21,0.09))' };
    case 'auroraveil':
      // Both at once: the aurora gradient, cyan into blue.
      return { background: 'linear-gradient(to top, rgba(34,211,238,0.24), rgba(99,102,241,0.20) 55%, rgba(34,211,238,0.08))' };
    case 'tailwind':
      // Not a pane — moving air. Faint diagonal streaks, no colour of its own
      // beyond a wisp of the accent, so it composes over a screen instead of
      // replacing it.
      return {
        backgroundImage:
          'repeating-linear-gradient(115deg, rgba(255,255,255,0.16) 0px, rgba(255,255,255,0.16) 3px, rgba(255,255,255,0) 3px, rgba(255,255,255,0) 22px)',
        backgroundSize: '160% 100%',
        animation: 'bsim-screen-streak 3.2s linear infinite',
      };
    default:
      return null;
  }
}

const SCREEN_CSS = `
@keyframes bsim-screen-streak { from { background-position: 0% 0% } to { background-position: 160% 0% } }
@media (prefers-reduced-motion: reduce) { .bsim-screen-motion { animation: none !important } }
`;

export interface SideScreensProps {
  /** `sideConditions` of the side that owns this half of the field. */
  conditions: Record<string, unknown> | null | undefined;
  /** Which half to paint. Already pov-swapped by the caller. */
  side: 'ally' | 'foe';
}

/**
 * Screens for one side. Renders no `<img>` at all — asserted by the tests,
 * because "a screen produced a broken image" is the bug this exists to close.
 */
export function SideScreens({ conditions, side }: SideScreensProps) {
  const ids = Object.keys(conditions ?? {});
  const painted = ids.map((id) => [id, paintFor(id)] as const).filter((e): e is readonly [string, React.CSSProperties] => e[1] !== null);
  if (painted.length === 0) return null;

  return (
    <div aria-hidden data-bsim-screens={side} className="pointer-events-none absolute" style={{ ...HALF[side], zIndex: 2 }}>
      <style>{SCREEN_CSS}</style>
      {painted.map(([id, paint]) => (
        <div
          key={id}
          data-screen={id}
          className="bsim-screen-motion absolute inset-0"
          style={{ ...paint, transition: 'opacity 400ms ease', mixBlendMode: 'screen' }}
        />
      ))}
    </div>
  );
}
