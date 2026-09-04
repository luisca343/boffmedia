import { BSIM_FORMATS } from '@boffmedia/battle-core';

/**
 * The `format` allowlist for the sync upserts (teams and replays).
 *
 * DERIVED, never hand-copied: `BSIM_FORMATS` is the one format table (D11) that
 * the worker, the teambuilder and the battle gateway already read, and the
 * gateway's `isKnownFormat()` guards `createBattle` off the very same list. The
 * upserts used to write `dto.format` verbatim, so a typo'd or retired id
 * persisted happily and only blew up much later — when a team was loaded into a
 * builder, or a replay was opened against a format the simulator has never
 * heard of. Rejecting at the door turns that into a 400 the outbox can report.
 *
 * A `custom: true` id (the Champions mods) is in here without
 * `registerBattleMods()` having run: the table is static, so this list is safe
 * to evaluate at decorator time, before any Nest provider exists.
 */
export const BSIM_FORMAT_IDS: readonly string[] = BSIM_FORMATS.map((f) => f.id);
