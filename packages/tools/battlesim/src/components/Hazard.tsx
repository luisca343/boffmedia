import { battlesimAssetUrl } from '../asset';
import { useBattleScale } from '../lib/battle-layout';
import { warnSpriteFallback } from './PokemonImage';

type HazardOffset = { top: number; left: number; width: number; z?: number };

/**
 * The four side conditions that have ground art, and the size that art actually
 * is on disk. Everything else in `sideConditions` — every screen, Tailwind,
 * Safeguard, Mist, Lucky Chant — used to be fed to `fx/${id}.png` too, which
 * meant seven guaranteed 404s the moment anyone set up a screen. Screens are a
 * CSS tint now (`SideScreens`); this list is a whitelist rather than a
 * fallback, so a side condition added by a future generation draws nothing
 * instead of drawing a broken image.
 */
const HAZARD_ART: Record<string, { file: string; w: number; h: number; maxLevel: number }> = {
  stealthrock: { file: 'fx/stealthrock.png', w: 32, h: 40, maxLevel: 1 },
  spikes: { file: 'fx/spikes.png', w: 40, h: 40, maxLevel: 3 },
  toxicspikes: { file: 'fx/toxicspikes.png', w: 40, h: 40, maxLevel: 2 },
  stickyweb: { file: 'fx/stickyweb.png', w: 120, h: 122, maxLevel: 1 },
};

// Field-space (960 wide) positions. Every entry is scaled at render time; the
// p2 stealth-rock and spikes rows used to forget the multiplier and sat at
// desktop pixels on a phone-sized canvas.
//
// `p1` is the NEAR half (the viewer's), `p2` the far one — which is why the
// canvas passes its pov-swapped side objects rather than `battle.p1`/`battle.p2`
// directly: on pov 1 the viewer is p2 and the hazards laid on the player must
// still be drawn at the bottom of the screen.
const HAZARD_OFFSETS: { [side: string]: { [key: string]: HazardOffset } } = {
    p1: {
        stickyweb1: { top: 250, left: 420, width: 100 },
        toxicspikes1: { top: 250, left: 420, width: 50 },
        toxicspikes2: { top: 270, left: 520, width: 50 },
        spikes1: { top: 300, left: 470, width: 50 },
        spikes2: { top: 280, left: 400, width: 50 },
        spikes3: { top: 250, left: 480, width: 50 },
        stealthrock1: { top: 280, left: 350, width: 50 },
        stealthrock2: { top: 295, left: 520, width: 50 },
        default: { top: 0, left: 0, width: 50 },
    },
    p2: {
        stickyweb1: { top: 110, left: 560, width: 75 },
        toxicspikes1: { top: 150, left: 520, width: 30 },
        toxicspikes2: { top: 160, left: 620, width: 30 },
        stealthrock1: { top: 160, left: 600, width: 30 },
        stealthrock2: { top: 140, left: 540, width: 30 },
        spikes1: { top: 160, left: 570, width: 30 },
        spikes2: { top: 160, left: 540, width: 30 },
        spikes3: { top: 140, left: 620, width: 30 },
        default: { top: 0, left: 0, width: 50, z: 1 },
    },
};

export type HazardEntry = [string, { name?: string; level?: number; minDuration?: number; maxDuration?: number; remove?: boolean }];

/**
 * One side condition's ground art, one node per layer (Spikes ×3 draws three).
 *
 * Decorative: the readable, translated, turn-counted version of the same state
 * is the chip row (`FieldConditions`), so these carry `alt=""` rather than an
 * untranslated protocol id. `z-index` stays at 1-2, below the sprites' own 50.
 */
export function Hazard({ hazard, side }: { hazard: HazardEntry; side: string }) {
    const { scale } = useBattleScale();
    const [name, value] = hazard;
    const art = HAZARD_ART[name];
    if (!art) return null;

    // Clamped: `level` comes off the wire, and a bad one used to become that
    // many DOM nodes.
    const level = Math.max(1, Math.min(art.maxLevel, Number(value?.level) || 1));
    const levels = Array.from({ length: level }, (_, i) => level - i);

    return (
        <>
            {levels.map(level => {
                const offset = HAZARD_OFFSETS[side]?.[name + level] || HAZARD_OFFSETS[side]?.default || HAZARD_OFFSETS.p1.default;
                // The authored `width` is the box on the field; the art's own
                // aspect ratio decides the height, so Sticky Web (120x122) is
                // no longer squashed into a square.
                const w = offset.width * scale;
                const h = w * (art.h / art.w);
                return (
                    <img key={level}
                        src={battlesimAssetUrl(art.file)}
                        alt=""
                        aria-hidden
                        width={Math.round(w)}
                        height={Math.round(h)}
                        // A pack that shipped without this file must not leave a
                        // broken-image glyph sitting on the field: warn once and
                        // step aside. Never a throw.
                        onError={(e) => { warnSpriteFallback(e.currentTarget.src); e.currentTarget.style.visibility = 'hidden'; }}
                        className="pointer-events-none absolute opacity-80"
                        style={{ top: offset.top * scale, left: offset.left * scale, zIndex: 1 + (offset.z || 0) }}
                    />
                );
            })}
        </>
    );
}
