/**
 * @boffmedia/battle-core
 *
 * Headless battle engine for AI and PvP battles. Consumed by @boffmedia/tools-battlesim
 * and apps/api as compiled CJS; never aliased to src/ by any consumer.
 *
 * Dual build: dist/cjs (CommonJS for Node) and dist/esm (ES Modules).
 */

// Formats
export {
  BSIM_FORMATS,
  BSIM_CUSTOM_FORMAT_IDS,
  formatsFor,
  getFormat,
  isRandomFormat,
  isKnownFormat,
  statLimitsFor,
  calcStat,
  EV_PER_STAT,
  EV_TOTAL,
} from './formats.js';
export type { BsimFormat, BsimFormatKind, BsimStatSystem, BsimStatLimits, BsimStatId } from './formats.js';

// Engine
export { BattleEngine } from './engine/BattleEngine.js';
export type { BattleEngineMode, PlayerSpec, BattleEndResult, BattleEngineCallbacks } from './engine/BattleEngine.js';

export { TimerManager } from './engine/TimerManager.js';
export type { TimerConfig, TimerState, TimerManagerCallbacks } from './engine/TimerManager.js';

// Teams
export { getRandomTeam } from './teams/random.js';
export { importPaste, exportPaste, packTeam, unpackTeam } from './teams/paste.js';
export { validateTeam } from './teams/validate.js';
export type { ValidationResult } from './teams/validate.js';
export { legalMovesFor } from './teams/learnset.js';
export type { LegalMoves } from './teams/learnset.js';
export { legalSpeciesFor } from './teams/species-pool.js';
export type { LegalSpecies } from './teams/species-pool.js';

// Replay
export type { ReplayRecord, TeamRecord } from './replay/types.js';

// Mod registration
export { registerBattleMods, isRegistered } from './mods/register.js';

// Champions mod (re-exported for API convenience)
export { initChampionsMod, listChampionsFormatIds } from './mods/champions/index.js';

// Champions Stat Points — the numbers the UI and the format rule share.
export {
  CHAMPIONS_SP_PER_STAT,
  CHAMPIONS_SP_TOTAL,
  CHAMPIONS_EVS_PER_SP,
  CHAMPIONS_FIXED_LEVEL,
  CHAMPIONS_FIXED_IV,
  CHAMPIONS_SP_RULE_NAME,
  CHAMPIONS_SP_RULE_ID,
} from './mods/champions/sp.js';

// Bundled sample teams (D13): what the bot plays when the player has no second
// team of their own in a team format. Validated by samples.spec.ts.
export { SAMPLE_TEAMS, sampleTeamFor } from './samples/index.js';
