/**
 * Telemetry integration — wire events into real app flow.
 *
 * This module bridges the app's state management with the telemetry sender,
 * calling sendTelemetryEvent at the moments the four tracked events occur.
 * Every call checks the opt-in toggle; opted-out users send nothing.
 */

import { sendTelemetryEvent } from './telemetry';
import type { Settings, GameState } from './types';

/**
 * Map GameState.crashed CrashKind to telemetry code.
 * Mirrors CrashKind from crash.rs so the two cannot drift.
 */
export function crashKindToTelemetryCode(crashKind: string): string {
  const mapping: Record<string, string> = {
    'missing-dependency': 'missing-dependency',
    'loader-mismatch': 'loader-mismatch',
    'mixin-failure': 'mixin-failure',
    'out-of-memory': 'out-of-memory',
    'wrong-java': 'wrong-java',
    'corrupt-mod-jar': 'corrupt-mod-jar',
    'duplicate-mod': 'duplicate-mod',
  };
  return mapping[crashKind] || 'unclassified';
}

/**
 * Emit install-done event when an installation completes.
 * Call this from onInstallDone handler in app.tsx state setup.
 */
export async function emitInstallComplete(
  settings: Settings,
  installId: string,
  success: boolean,
): Promise<void> {
  await sendTelemetryEvent(
    settings.telemetry,
    installId,
    'install-done',
    success ? 'success' : 'failed',
  );
}

/**
 * Emit launch event when game launches.
 * Call this from launchPack in app.tsx state setup, after successful launch.
 */
export async function emitGameLaunch(
  settings: Settings,
  installId: string,
): Promise<void> {
  await sendTelemetryEvent(
    settings.telemetry,
    installId,
    'launch',
    'launch',
  );
}

/**
 * Emit crash-code event when game crashes.
 * Call this from onGameState handler in app.tsx when game.kind === 'crashed'.
 */
export async function emitGameCrash(
  settings: Settings,
  installId: string,
  crashKind: string,
): Promise<void> {
  const code = crashKindToTelemetryCode(crashKind);
  await sendTelemetryEvent(
    settings.telemetry,
    installId,
    'crash-code',
    code as any, // code is one of the valid crash codes
  );
}

/**
 * Emit tool-open event when a tool is opened.
 * Call this from tool open handlers when a tool is activated/displayed.
 * toolId should be the tool's id from @boffmedia/tool-kit (e.g. 'vgc', 'battlesim').
 */
export async function emitToolOpen(
  settings: Settings,
  installId: string,
  toolId: string,
): Promise<void> {
  await sendTelemetryEvent(
    settings.telemetry,
    installId,
    'tool-open',
    toolId as any, // toolId is one of the valid tool ids
  );
}
