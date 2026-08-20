import { rotomAuthedGETOrThrow, rotomAuthedPUTOrThrow } from '@/services/boffAPI';
import type { PcMark } from '@boffmedia/shared';

/**
 * Marks (favourites + tags) for Pokémon stored in the SmartRotom PC.
 *
 * PC Pokémon come from the external Pixelmon server and have no id — their
 * (box, index) changes on every move — so marks are keyed on `pokemonKey`, an
 * opaque content hash the client computes from immutable fields
 * (dex|palette|nature|ability|ivs). The API never validates it.
 *
 * The owner is never passed by the caller: the API takes it from the session,
 * so these calls carry the Bearer instead of a uuid.
 */
export class PcMarksService {
  /**
   * Get every mark of a user
   */
  static getMarks(): Promise<PcMark[]> {
    return rotomAuthedGETOrThrow<PcMark[]>('/pc-marks');
  }

  /**
   * Upsert a single mark. Omitted fields keep their stored value.
   */
  static upsertMark(
    pokemonKey: string,
    patch: { favorite?: boolean; tags?: string[] }
  ): Promise<PcMark> {
    return rotomAuthedPUTOrThrow<PcMark>('/pc-marks', { pokemonKey, ...patch });
  }

  /**
   * Upsert many marks at once (bulk-select bar): one favourite flag for every
   * key, plus an additive/subtractive tag delta applied to each of them.
   */
  static bulkUpsert(
    pokemonKeys: string[],
    patch: { favorite?: boolean; addTags?: string[]; removeTags?: string[] }
  ): Promise<PcMark[]> {
    return rotomAuthedPUTOrThrow<PcMark[]>('/pc-marks/bulk', { pokemonKeys, ...patch });
  }
}
