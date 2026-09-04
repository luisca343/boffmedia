/**
 * Maps diagnostic error codes to localized i18n keys for user-facing messages.
 * This is a pure function that takes the translator as an argument.
 *
 * The mapping allows the UI to display localized error messages based on the
 * specific type of network/server failure (DNS, connection refused, timeout,
 * protocol error, server 5xx, auth failure, or credential store error).
 *
 * Unknown codes fall back to a generic "could not reach server" message.
 */

type TranslatorFunction = (key: string) => string;

/**
 * Maps an error code to an i18n message key.
 * Unknown or missing codes return a generic fallback key.
 */
export function mapErrorCodeToI18nKey(code: string | null | undefined): string {
  if (!code) {
    return "shell.serverUnreachableShort"; // Generic fallback for unknown code
  }

  const mapping: Record<string, string> = {
    dns_failed: "shell.dnsFailed",
    connection_refused: "shell.connectionRefused",
    connection_timeout: "shell.connectionTimeout",
    http_protocol_error: "shell.httpProtocolError",
    server_5xx_error: "shell.server5xxError",
    server_down: "shell.serverDownShort", // Backwards compat
    server_unreachable: "shell.serverUnreachableShort", // Backwards compat
    auth_failed: "shell.authFailed",
    store_error: "shell.storeError",
  };

  return mapping[code] ?? "shell.serverUnreachableShort"; // Unknown code → generic
}

/**
 * Gets the localized error message for a code.
 */
export function getErrorMessage(code: string | null | undefined, t: TranslatorFunction): string {
  const key = mapErrorCodeToI18nKey(code);
  return t(key);
}

/**
 * Gets a diagnostic title that explains which check failed (DNS, connection, etc).
 */
export function getDiagnosticTitle(code: string | null | undefined, t: TranslatorFunction): string {
  // Maps codes to diagnostic titles that explain what check failed
  const titleMapping: Record<string, string> = {
    dns_failed: "shell.diagnosticDNS",
    connection_refused: "shell.diagnosticRefused",
    connection_timeout: "shell.diagnosticTimeout",
    http_protocol_error: "shell.diagnosticProtocol",
    server_5xx_error: "shell.diagnosticServerError",
    auth_failed: "shell.diagnosticAuth",
    store_error: "shell.diagnosticStore",
  };

  if (!code || !titleMapping[code]) {
    return t("shell.serverUnreachableTitle");
  }

  return t(titleMapping[code]);
}
