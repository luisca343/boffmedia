import { rotomGET, rotomPUT, ApiResponse } from '@/services/boffAPI';
import type { PcMark } from '@boffmedia/shared';

/**
 * Marks (favourites + tags) for Pokémon stored in the SmartRotom PC.
 *
 * PC Pokémon come from the external Pixelmon server and have no id — their
 * (box, index) changes on every move — so marks are keyed on `pokemonKey`, an
 * opaque content hash the client computes from immutable fields
 * (dex|palette|nature|ability|ivs). The API never validates it.
 */
export class PcMarksService {
  /**
   * Get every mark of a user
   */
  static getMarks(uuid: string): Promise<ApiResponse<PcMark[]>> {
    return rotomGET<PcMark[]>(`/pc-marks/${uuid}`);
  }

  /**
   * Upsert a single mark. Omitted fields keep their stored value.
   */
  static upsertMark(
    uuid: string,
    pokemonKey: string,
    patch: { favorite?: boolean; tags?: string[] }
  ): Promise<ApiResponse<PcMark>> {
    return rotomPUT<PcMark>('/pc-marks', { uuid, pokemonKey, ...patch });
  }

  /**
   * Upsert many marks at once (bulk-select bar): one favourite flag for every
   * key, plus an additive/subtractive tag delta applied to each of them.
   */
  static bulkUpsert(
    uuid: string,
    pokemonKeys: string[],
    patch: { favorite?: boolean; addTags?: string[]; removeTags?: string[] }
  ): Promise<ApiResponse<PcMark[]>> {
    return rotomPUT<PcMark[]>('/pc-marks/bulk', { uuid, pokemonKeys, ...patch });
  }
}
