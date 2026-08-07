/**
 * Port for the settings encoding/decoding shim. Translates between JSON
 * settings objects and .rnqs binary format. Also provides capabilities.
 *
 * Phase 0 spike implementation is a stub that throws ServiceUnavailableException.
 * Real implementation will call the dedicated settings service (TBD).
 */
export interface ISettingsShim {
  /**
   * Encode settings JSON to .rnqs binary format.
   * @param json Settings object
   * @returns Binary .rnqs buffer
   */
  encode(json: Record<string, unknown>): Promise<Buffer>;

  /**
   * Decode .rnqs binary format to settings JSON.
   * @param rnqs Binary .rnqs buffer
   * @returns Settings object
   */
  decode(rnqs: Buffer): Promise<Record<string, unknown>>;

  /**
   * Get capabilities/schema for a game.
   * @param gameId Game identifier (e.g., 'pokered')
   * @returns Capabilities object (structure TBD)
   */
  caps(gameId: string): Promise<unknown>;
}

export const SETTINGS_SHIM_TOKEN = 'SETTINGS_SHIM_TOKEN';
