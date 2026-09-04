'use client';

/**
 * Weather / terrain / room overlays, drawn from `battle.field`.
 *
 * STATE-DRIVEN, NOT EVENT-DRIVEN. Every render derives the whole set of
 * overlays from the field object, so an overlay whose state has expired cannot
 * survive: there is no "add on `|-weather|`, remove on `|-weather|none`" pair
 * to get out of sync, and a resync that rebuilds the Battle from scratch is
 * reflected for free. The fade below is presentation only — it never decides
 * WHETHER a layer exists, only how it arrives and leaves.
 *
 * The layer sits between the field background and the hazards/sprites (z 0),
 * which is why the art is drawn at partial opacity rather than composited over
 * everything: a Pokémon must never be tinted by the weather it stands in.
 */

import * as React from 'react';
import type { Battle } from '@pkmn/client';
import { battlesimAssetUrl } from '../asset';

/** How long an overlay takes to arrive or leave. */
const FADE_MS = 400;

type Motion = 'drift' | 'pulse';

interface Overlay {
  /** Stable across renders — it is the React key, so a stable key = a stable node. */
  key: string;
  url: string;
  opacity: number;
  motion: Motion;
  /** Over-scan for drifting art (so the drift never exposes an edge); exact fit for the room grids. */
  size: string;
}

/**
 * `weatherState.id` → art. Opacities are tuned per weather the way the official
 * client does it: rain is the heaviest, sun and sand the lightest, because the
 * sun art is a bright wash that eats the background at anything higher.
 */
const WEATHER: Record<string, { file: string; opacity: number }> = {
  sun: { file: 'fx/weather-sunnyday.jpg', opacity: 0.55 },
  harshsunshine: { file: 'fx/weather-sunnyday.jpg', opacity: 0.6 },
  rain: { file: 'fx/weather-raindance.jpg', opacity: 0.7 },
  heavyrain: { file: 'fx/weather-raindance.jpg', opacity: 0.75 },
  sand: { file: 'fx/weather-sandstorm.png', opacity: 0.55 },
  hail: { file: 'fx/weather-hail.png', opacity: 0.6 },
  snow: { file: 'fx/weather-hail.png', opacity: 0.6 },
  strongwinds: { file: 'fx/weather-strongwind.png', opacity: 0.6 },
};

/** `terrainState.id` → `fx/weather-<id>terrain.png`. */
const TERRAIN = new Set(['electric', 'grassy', 'misty', 'psychic']);

/**
 * `field.pseudoWeather` keys that have art. Trick Room is the reference case:
 * `fx/weather-trickroom.png` is a 700x500 grid, stretched over the whole field
 * and given a slow opacity pulse rather than a drift (a moving grid reads as a
 * rendering bug).
 */
const ROOMS: Record<string, number> = {
  trickroom: 0.5,
  wonderroom: 0.45,
  magicroom: 0.45,
  gravity: 0.45,
};

/** Everything the field currently says is on, in paint order. Pure — testable. */
export function fieldOverlays(battle: Battle | null | undefined): Overlay[] {
  const field = (battle as any)?.field;
  if (!field) return [];
  const out: Overlay[] = [];

  const weatherId = String(field.weatherState?.id ?? '');
  const weather = WEATHER[weatherId];
  if (weather) {
    out.push({ key: `weather:${weatherId}`, url: battlesimAssetUrl(weather.file), opacity: weather.opacity, motion: 'drift', size: '120% 120%' });
  }

  const terrainId = String(field.terrainState?.id ?? '');
  if (TERRAIN.has(terrainId)) {
    out.push({ key: `terrain:${terrainId}`, url: battlesimAssetUrl(`fx/weather-${terrainId}terrain.png`), opacity: 0.6, motion: 'drift', size: '120% 120%' });
  }

  for (const id of Object.keys(field.pseudoWeather ?? {})) {
    const opacity = ROOMS[id];
    if (opacity === undefined) continue;
    out.push({ key: `room:${id}`, url: battlesimAssetUrl(`fx/weather-${id}.png`), opacity, motion: 'pulse', size: '100% 100%' });
  }

  return out;
}

type Rendered = Overlay & { on: boolean };

/**
 * The overlays to RENDER: everything currently on, plus the ones that have just
 * left, kept mounted at opacity 0 for the length of the fade so they can
 * transition out instead of vanishing.
 *
 * The departed ones have to come from STATE rather than be derived during
 * render, because a fade-out needs the same DOM node the fade-in used: an
 * overlay dropped straight out of the derived list unmounts on that render and
 * there is nothing left to animate. They are invisible and removed 440 ms
 * later, so nothing expired is ever actually shown.
 */
function useFadingOverlays(target: Overlay[]): Rendered[] {
  const signature = target.map((o) => o.key).join('|');
  const [rendered, setRendered] = React.useState<Rendered[]>(() => target.map((o) => ({ ...o, on: true })));

  // The effect keys on the signature, so it needs the CURRENT list, not the one
  // captured by the render that happened to change it.
  const targetRef = React.useRef(target);
  targetRef.current = target;

  React.useLayoutEffect(() => {
    const now = targetRef.current;
    const live = new Set(now.map((o) => o.key));
    setRendered((prev) => [
      ...now.map((o) => ({ ...o, on: true })),
      ...prev.filter((o) => o.on && !live.has(o.key)).map((o) => ({ ...o, on: false })),
    ]);
  }, [signature]);

  React.useEffect(() => {
    if (!rendered.some((o) => !o.on)) return;
    const id = setTimeout(() => setRendered((prev) => (prev.some((o) => !o.on) ? prev.filter((o) => o.on) : prev)), FADE_MS + 40);
    return () => clearTimeout(id);
  }, [rendered]);

  return rendered;
}

/**
 * The keyframes, inlined rather than pulled from a stylesheet: this package is
 * host-agnostic and cannot assume a Tailwind config or a global CSS file came
 * along with it.
 *
 * `bsim-fx-in` deliberately has NO fill mode. An animation only overrides the
 * inline `opacity` while it is running; once it ends the inline value takes
 * over again, which is what lets one element fade IN by animation and OUT by
 * transition without the two fighting. The motion animations live on an inner
 * element for the same reason — an infinite `pulse` on the outer div would own
 * `opacity` forever and the exit transition would never be seen.
 */
const FX_CSS = `
@keyframes bsim-fx-in { from { opacity: 0 } to { opacity: var(--bsim-fx-op, .6) } }
@keyframes bsim-fx-drift { from { background-position: 0% 0% } to { background-position: 100% 100% } }
@keyframes bsim-fx-pulse { 0%, 100% { opacity: 1 } 50% { opacity: .62 } }
@media (prefers-reduced-motion: reduce) { .bsim-fx-motion { animation: none !important } }
`;

export function FieldLayer({ battle, className }: { battle: Battle | null | undefined; className?: string }) {
  const layers = useFadingOverlays(fieldOverlays(battle));

  return (
    <div aria-hidden data-bsim-field-layer className={`pointer-events-none absolute inset-0 z-0 overflow-hidden ${className ?? ''}`}>
      <style>{FX_CSS}</style>
      {layers.map((layer) => (
        <div
          key={layer.key}
          data-fx={layer.key}
          className="absolute inset-0"
          style={{
            opacity: layer.on ? layer.opacity : 0,
            transition: `opacity ${FADE_MS}ms ease`,
            animation: layer.on ? `bsim-fx-in ${FADE_MS}ms ease-out` : undefined,
            ['--bsim-fx-op' as string]: layer.opacity,
          } as React.CSSProperties}
        >
          <div
            className="bsim-fx-motion absolute inset-0"
            style={{
              backgroundImage: `url(${layer.url})`,
              backgroundSize: layer.size,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center',
              animation:
                layer.motion === 'drift'
                  ? 'bsim-fx-drift 26s linear infinite alternate'
                  : 'bsim-fx-pulse 4.5s ease-in-out infinite',
            }}
          />
        </div>
      ))}
    </div>
  );
}
