/**
 * Desktop telemetry event types — shared between the API and the desktop client.
 *
 * Enumerated event names and codes ensure PII-scrubbed, bounded telemetry.
 * Every field is strictly validated; non-enumerated values are rejected.
 */

/** Event type: what happened. */
export const TELEMETRY_EVENT_NAMES = [
  'install-done', // Pack installation completed (code: success | failed)
  'launch', // Game launch attempted (code: launch)
  'crash-code', // Game crashed; classified by type
  'tool-open', // Tool opened in the app (code: tool name)
] as const;

export type DesktopTelemetryEventName = (typeof TELEMETRY_EVENT_NAMES)[number];

/** Event code: outcome or detail (enumerated per event type). */
export const TELEMETRY_EVENT_CODES = [
  // install-done codes
  'success',
  'failed',

  // launch code (placeholder; event itself is the fact)
  'launch',

  // crash-code codes (derived from CrashKind in crash.rs, so diagnosis and telemetry never drift)
  // Each variant of CrashKind must map to exactly one telemetry code
  'missing-dependency', // CrashKind::MissingDependency
  'loader-mismatch', // CrashKind::LoaderMismatch
  'mixin-failure', // CrashKind::MixinFailure
  'out-of-memory', // CrashKind::OutOfMemory
  'wrong-java', // CrashKind::WrongJava
  'corrupt-mod-jar', // CrashKind::CorruptModJar
  'duplicate-mod', // CrashKind::DuplicateMod
  'unclassified', // CrashKind not yet matched to a rule
] as const;

// tool-open codes are tool IDs (e.g. 'vgc', 'randomizer', 'battlesim', 'tcg', 'mhwilds')
// These come from @boffmedia/tool-kit, not free text

export type DesktopTelemetryEventCode = (typeof TELEMETRY_EVENT_CODES)[number];
