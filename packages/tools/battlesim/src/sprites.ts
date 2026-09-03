/**
 * Where a sprite, an avatar or a cry comes from.
 *
 * Two sources for Pokémon sprites: the animated set streamed from the Showdown
 * CDN when there is a network, and the static gen-5 set mirrored into this
 * tool's asset pack when there is not. Avatars and cries are ALWAYS local —
 * they are small, and a battle that cannot play its own cries offline is not
 * really offline-capable.
 *
 * THE ONE RULE HERE: never build a Showdown sprite path by hand. Ask `@pkmn/img`
 * for the URL and swap the origin. It owns two things that are easy to get
 * wrong and silent when you do — the species-to-sprite-id mapping (formes,
 * genders, cosmetic variants) and the directory naming, where back and shiny
 * compose as `gen5-back-shiny`, in that order. Hand-assembling `-shiny` before
 * `-back` yields `gen5-shiny-back`, a directory that does not exist, and the
 * result is a broken image for exactly the shiny back sprites nobody tests.
 * The local mirror is keyed by the CDN's own paths precisely so this swap is
 * all that is needed.
 */

import type * as React from "react";
import { useToolOnline } from "@boffmedia/tool-kit";
import { Sprites } from "@pkmn/img";
import { battlesimAssetUrl } from "./asset";

/** The origin `@pkmn/img` builds its URLs against. */
const PS_ORIGIN = "https://play.pokemonshowdown.com";

export type SpriteSource = "ani-cdn" | "static";

/** Which source this render should use. Animated when online, static when not. */
export function useSpriteSource(): SpriteSource {
  return useToolOnline() ? "ani-cdn" : "static";
}

/** Rewrites a play.pokemonshowdown.com URL onto the local asset tree. */
function toLocal(url: string): string {
  return url.startsWith(PS_ORIGIN) ? battlesimAssetUrl(url.slice(PS_ORIGIN.length + 1)) : url;
}

export interface SpriteOptions {
  shiny?: boolean;
  /** `p1` is the near side, and therefore the BACK sprite. */
  side?: "p1" | "p2";
  source?: SpriteSource;
}

/**
 * A Pokémon sprite URL.
 *
 * `static` resolves the gen-5 still through the same `@pkmn/img` call and then
 * points it at the pack, so the id and the directory are identical to what the
 * mirror downloaded.
 */
export function spriteUrl(species: string, options: SpriteOptions = {}): string {
  const { shiny = false, side = "p2", source = "ani-cdn" } = options;
  const common = { shiny, side } as const;

  if (source === "ani-cdn") {
    return Sprites.getPokemon(species, { gen: "ani", ...common }).url;
  }
  return toLocal(Sprites.getPokemon(species, { gen: 5, ...common }).url);
}

/** The static sprite for the same Pokémon — the first fallback for an animated one. */
export function staticSpriteUrl(species: string, options: SpriteOptions = {}): string {
  return spriteUrl(species, { ...options, source: "static" });
}

/** Trainer avatar. Always local: mirrored into the pack, and tiny. */
export function avatarUrl(id: string | number): string {
  return toLocal(Sprites.getAvatar(String(id)));
}

/**
 * A Pokémon's cry. Always local.
 *
 * Replaces the hardcoded `play.pokemonshowdown.com/audio/cries/...` the engine
 * used to build: the desktop CSP allows `media-src` from the asset scheme and
 * not from the CDN, so the streamed version was silent in the launcher.
 */
export function cryUrl(id: string): string {
  return battlesimAssetUrl(`audio/cries/${id.toLowerCase()}.mp3`);
}

/** Custom Teras forme art, copied into the pack by the asset build. */
export function terasFormeUrl(id: string | number): string {
  return battlesimAssetUrl(`sprites/teras/${id}.png`);
}

/** Last resort when even the static sprite is missing. */
export const FALLBACK_SPRITE = () => battlesimAssetUrl("img/pokeball.png");

/**
 * The fallback chain, as an `onError` handler: animated → static → pokéball.
 *
 * Load-bearing rather than decorative. The pack is an optimisation and may not
 * be installed yet, the network may be gone mid-battle, and a handful of
 * cosmetic formes have no gen-5 sprite at all. Each step has to degrade to
 * something that renders.
 */
export function handleSpriteError(event: React.SyntheticEvent<HTMLImageElement>): void {
  const img = event.currentTarget;

  // Animated CDN sprite failed -> the mirrored still of the same Pokémon.
  // `ani` and `ani-back` map to `gen5` and `gen5-back`; shiny rides along as
  // its own suffix in both.
  const ani = img.src.match(/\/sprites\/ani(-back)?(-shiny)?\/([^/.]+)\./);
  if (ani) {
    const [, back = "", shiny = "", id] = ani;
    img.src = battlesimAssetUrl(`sprites/gen5${back}${shiny}/${id}.png`);
    return;
  }

  // Already static (or unparseable) -> the glyph, which always exists.
  const pokeball = FALLBACK_SPRITE();
  if (img.src !== pokeball) img.src = pokeball;
}
