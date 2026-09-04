/**
 * Pokemon identity resolution types.
 *
 * Every resolver returns a `Resolved<T>` result with both success and failure
 * paths, never a bare id or fallback guess. The bridge this replaced
 * (apps/api/.../pokemon-showdown.service.ts) fell back to `|| forms[0]` and
 * that is how `evos: ["Ninetales form:base"]` ended up inside a Showdown mod.
 */

/**
 * Kind indicates how much trust an identity mapping carries, and consumers
 * MUST branch on it. Generated from the override table in
 * `scripts/tools/lib-pokemon-identity.mjs`.
 *
 *   - derived        - mechanically resolved via normalization rules.
 *   - renamed        - same Pokémon, different spelling. Safe to map both ways.
 *   - differentBaseForm - BOTH sources have the form, but disagree about which
 *                      one is the base. The dangerous class. Never auto-derivable.
 *   - cosmeticOnly   - Pixelmon appearance variant with no Showdown counterpart.
 *                      Maps to the base species and must NEVER be emitted as a
 *                      distinct Showdown species.
 *   - pixelmonOnly   - mechanically real in Pixelmon, absent from Showdown
 *                      (Pixelmon ships Megas the official games never had).
 *   - sourceOnly     - custom content unique to one source (SmartRotom moves/abilities).
 *   - ambiguous      - maps to multiple Showdown entries; the correct one depends on context.
 *   - unmapped       - no Showdown counterpart could be derived or found.
 *   - ignore         - Pixelmon placeholder; deliberately unmapped.
 */
export type OverrideKind =
  | 'derived'
  | 'renamed'
  | 'differentBaseForm'
  | 'cosmeticOnly'
  | 'pixelmonOnly'
  | 'sourceOnly'
  | 'ambiguous'
  | 'unmapped'
  | 'ignore';

/**
 * A Pokemon identity resolution result. Always a RESULT, never a bare id.
 *
 * @template T - The ID type (usually `string`).
 */
export type Resolved<T> =
  | {
      ok: true;
      id: T;
      kind: OverrideKind;
      reason?: string;
    }
  | {
      ok: false;
      id: null;
      kind: OverrideKind;
      reason: string;
    };

/**
 * Pixelmon reference for identity mapping.
 *
 * Note: `palette` is Pixelmon-only and MUST NOT be part of any canonical key.
 * It is purely a rendering hint and should never participate in Showdown identity.
 */
export interface PixelmonRef {
  dex: number;
  form: string;
  palette?: string;
}
