/**
 * Desktop telemetry service — opt-in, PII-scrubbed event sending.
 *
 * This service is responsible for:
 *   1. Checking if telemetry is enabled in app settings (default: false/OFF)
 *   2. If OFF, NEVER send anything — not even a heartbeat
 *   3. If ON, read the install_id and send events to the self-hosted API
 *
 * Events sent carry NO personal data: no username, no email, no UUID, no file paths,
 * no free-text crash messages. Every field is enumerated and bounded.
 *
 * Rate limiting and validation are enforced by the API; the client respects its
 * 429 responses and stops sending if rejected.
 */

import type {
  DesktopTelemetryEventName,
  DesktopTelemetryEventCode,
} from '@boffmedia/pack-schema';

const API_ENDPOINT = '/desktop/telemetry';
const REQUEST_TIMEOUT_MS = 5000;

/**
 * Send a telemetry event to the self-hosted API endpoint.
 *
 * CRITICAL:
 *   1. The caller MUST check if telemetry is enabled in settings BEFORE calling.
 *      If disabled, this function will NOT send anything.
 *   2. installId must be passed explicitly (from Rust via install_id::get_or_create).
 *   3. Event fields must be enumerated: event_name and code are bounded sets.
 *
 * Returns: true if the event was sent successfully (2xx status).
 *          false if the network failed, the API rejected the payload, or
 *          the timeout expired.
 *
 * Errors are logged to console but not thrown — the app must not crash
 * if telemetry fails.
 */
export async function sendTelemetryEvent(
  telemetryEnabled: boolean,
  installId: string,
  eventName: DesktopTelemetryEventName,
  code: DesktopTelemetryEventCode,
): Promise<boolean> {
  // CRITICAL: if telemetry is disabled, do not send anything.
  if (!telemetryEnabled) {
    return false;
  }

  try {
    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        installId,
        eventName,
        code,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutHandle);

    if (!response.ok) {
      if (response.status === 429) {
        console.warn('Telemetry rate limit exceeded (429)');
      } else {
        console.warn(`Telemetry request failed: ${response.status} ${response.statusText}`);
      }
      return false;
    }

    return true;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      console.warn('Telemetry request timed out');
    } else {
      console.warn('Telemetry request failed:', error);
    }
    return false;
  }
}
