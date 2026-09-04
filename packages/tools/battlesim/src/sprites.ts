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
import { Dex, toID } from "@pkmn/dex";
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
  /**
   * Only relevant in gen 4+, and only for the handful of species (Unfezant,
   * Frillish, Pyroar, Meowstic, …) whose sprite actually differs by gender.
   * Optional and additive — every existing caller that omits it keeps the
   * genderless/male art it always got.
   */
  gender?: "M" | "F" | "N";
}

/**
 * A Pokémon sprite URL.
 *
 * `static` resolves the gen-5 still through the same `@pkmn/img` call and then
 * points it at the pack, so the id and the directory are identical to what the
 * mirror downloaded.
 */
export function spriteUrl(species: string, options: SpriteOptions = {}): string {
  const { shiny = false, side = "p2", source = "ani-cdn", gender } = options;
  const common = { shiny, side, ...(gender ? { gender } : {}) } as const;

  if (source === "ani-cdn") {
    return Sprites.getPokemon(species, { gen: "ani", ...common }).url;
  }
  return toLocal(Sprites.getPokemon(species, { gen: 5, ...common }).url);
}

/** Input shared by `battleSpriteUrl` and `spriteIdentityKey`. */
export interface BattleSpriteInput {
  speciesForme: string;
  shiny?: boolean;
  gender?: "M" | "F" | "N" | "";
  /** `p1` is the near side (back sprite), `p2` the far side (front sprite). */
  side: "p1" | "p2";
  source: SpriteSource;
  /**
   * Set while the Pokémon is Transformed/Illusioned — the species whose art
   * should render instead of `speciesForme`. `null`/`undefined` means "not
   * transformed", not "unknown"; do not treat them differently.
   */
  transformedInto?: string | null;
}

/** The species that actually gets drawn: `transformedInto` wins when present. */
function renderedSpecies({ speciesForme, transformedInto }: BattleSpriteInput): string {
  return transformedInto || speciesForme;
}

/**
 * The sprite for a Pokémon ON THE FIELD during a battle.
 *
 * A thin, opinionated wrapper over `spriteUrl` for the one call site that has
 * all of side/gender/transform in hand at once (the battle scene) — every
 * other caller (teambuilder rows, previews, avatars) keeps using `spriteUrl`
 * directly since it never needs to reason about transform.
 */
export function battleSpriteUrl(input: BattleSpriteInput): string {
  const { shiny, side, source, gender } = input;
  return spriteUrl(renderedSpecies(input), {
    shiny,
    side,
    source,
    ...(gender ? { gender } : {}),
  });
}

/**
 * A stable identity for a battle sprite, for use as a React `key`.
 *
 * Folds in every field that should force a fresh DOM node — species (as
 * actually rendered, so a Transform swaps identity too), shiny, gender and
 * side — so React unmounts/remounts instead of patching an `<img>` in place
 * across a change that a decoded GIF/canvas element cannot animate through.
 */
export function spriteIdentityKey(input: BattleSpriteInput): string {
  const species = renderedSpecies(input);
  return `${input.side}|${species}|${input.shiny ? "shiny" : "normal"}|${input.gender || ""}`;
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
 * A Pokémon's cry candidates, most specific first. Always local.
 *
 * Cry files are `{baseid}.mp3`, and a forme that got its own recording is
 * `{baseid}-{formesuffix}.mp3` (`zacian-crowned`, `urshifu-rapidstrike`,
 * `toxtricity-lowkey`, `necrozma-dawnwings`, `calyrex-ice`,
 * `tatsugiri-droopy`, …) — most formes do NOT get one and just reuse the base
 * cry. `speciesId` may be any form Showdown hands the engine (a display name,
 * an id, already-hyphenated or not); `Dex.species.get` is what actually knows
 * the base/forme split, so this must not hand-parse the string the way the
 * old `id.toLowerCase()` version did (that stripped the hyphen along with
 * everything else and 404'd on every forme cry).
 *
 * Returns `[formeUrl, baseUrl]` when there is a forme, so playback can try the
 * forme recording and fall back to the base cry on a 404; returns a single
 * `[baseUrl]` for a plain species (the fallback would just be itself).
 */
export function cryCandidates(speciesId: string): string[] {
  const species = Dex.species.get(speciesId);
  const base = toID(species.exists ? species.baseSpecies : speciesId);
  const forme = species.exists ? toID(species.forme) : "";
  const baseUrl = battlesimAssetUrl(`audio/cries/${base}.mp3`);
  if (!forme) return [baseUrl];
  return [battlesimAssetUrl(`audio/cries/${base}-${forme}.mp3`), baseUrl];
}

/**
 * A Pokémon's cry. Always local. See `cryCandidates` for the forme handling —
 * this is just its first (most specific) candidate.
 */
export function cryUrl(speciesId: string): string {
  return cryCandidates(speciesId)[0];
}

/** Custom Teras forme art, copied into the pack by the asset build. */
export function terasFormeUrl(id: string | number): string {
  return battlesimAssetUrl(`sprites/teras/${id}.png`);
}

/** Last resort when even the static sprite is missing. */
export const FALLBACK_SPRITE = () => battlesimAssetUrl("img/pokeball.png");

/**
 * The fallback chain, as an `onError` handler: animated → static gen5 → the
 * pokéball glyph, which always exists locally.
 *
 * Load-bearing rather than decorative. The pack is an optimisation and may not
 * be installed yet, the network may be gone mid-battle, and a handful of
 * cosmetic formes have no gen-5 sprite at all. Each step has to degrade to
 * something that renders.
 *
 * The current stage is stamped onto the element (`data-sprite-fallback`)
 * rather than re-derived from the URL on every call: it is what makes the
 * chain terminate. Without it, a URL this code fails to recognise (some other
 * page's `<img>`, a future sprite path shape) would fall through to the
 * "unparseable -> pokéball" branch every single time it errors, and if THAT
 * request itself somehow errored there would be nothing left distinguishing
 * "just arrived at pokéball" from "already tried pokéball" — this makes that
 * distinction explicit instead of relying on a URL string comparison.
 */
export function handleSpriteError(event: React.SyntheticEvent<HTMLImageElement>): void {
  const img = event.currentTarget;
  const stage = img.dataset.spriteFallback;

  if (stage === "pokeball") return; // already at the end of the chain; do not loop

  if (!stage) {
    // Animated sprite failed -> the mirrored gen-5 still of the same Pokémon.
    // `ani` and `ani-back` map to `gen5` and `gen5-back`; shiny rides along as
    // its own suffix in both.
    const ani = img.src.match(/\/sprites\/ani(-back)?(-shiny)?\/([^/.]+)\./);
    if (ani) {
      const [, back = "", shiny = "", id] = ani;
      img.dataset.spriteFallback = "static";
      img.src = battlesimAssetUrl(`sprites/gen5${back}${shiny}/${id}.png`);
      return;
    }
    // Not a recognised animated url (already static, or something else) ->
    // fall through to the glyph below.
  }

  img.dataset.spriteFallback = "pokeball";
  const pokeball = FALLBACK_SPRITE();
  if (img.src !== pokeball) img.src = pokeball;
}
