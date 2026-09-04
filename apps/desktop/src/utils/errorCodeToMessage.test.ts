import { describe, it, expect } from "vitest";
import { mapErrorCodeToI18nKey, getErrorMessage, getDiagnosticTitle } from "./errorCodeToMessage";

describe("mapErrorCodeToI18nKey", () => {
  it("maps dns_failed to correct key", () => {
    expect(mapErrorCodeToI18nKey("dns_failed")).toBe("shell.dnsFailed");
  });

  it("maps connection_refused to correct key", () => {
    expect(mapErrorCodeToI18nKey("connection_refused")).toBe("shell.connectionRefused");
  });

  it("maps connection_timeout to correct key", () => {
    expect(mapErrorCodeToI18nKey("connection_timeout")).toBe("shell.connectionTimeout");
  });

  it("maps http_protocol_error to correct key", () => {
    expect(mapErrorCodeToI18nKey("http_protocol_error")).toBe("shell.httpProtocolError");
  });

  it("maps server_5xx_error to correct key", () => {
    expect(mapErrorCodeToI18nKey("server_5xx_error")).toBe("shell.server5xxError");
  });

  it("maps auth_failed to correct key", () => {
    expect(mapErrorCodeToI18nKey("auth_failed")).toBe("shell.authFailed");
  });

  it("maps store_error to correct key", () => {
    expect(mapErrorCodeToI18nKey("store_error")).toBe("shell.storeError");
  });

  it("maintains backwards compat for server_down", () => {
    expect(mapErrorCodeToI18nKey("server_down")).toBe("shell.serverDownShort");
  });

  it("maintains backwards compat for server_unreachable", () => {
    expect(mapErrorCodeToI18nKey("server_unreachable")).toBe("shell.serverUnreachableShort");
  });

  it("falls back to generic for unknown code", () => {
    expect(mapErrorCodeToI18nKey("unknown_code")).toBe("shell.serverUnreachableShort");
  });

  it("falls back to generic for null code", () => {
    expect(mapErrorCodeToI18nKey(null)).toBe("shell.serverUnreachableShort");
  });

  it("falls back to generic for undefined code", () => {
    expect(mapErrorCodeToI18nKey(undefined)).toBe("shell.serverUnreachableShort");
  });

  it("falls back to generic for empty string", () => {
    expect(mapErrorCodeToI18nKey("")).toBe("shell.serverUnreachableShort");
  });
});

describe("getErrorMessage", () => {
  it("calls translator with mapped key", () => {
    const mockT = (key: string) => {
      const messages: Record<string, string> = {
        "shell.dnsFailed": "DNS resolution failed",
      };
      return messages[key] ?? key;
    };

    expect(getErrorMessage("dns_failed", mockT)).toBe("DNS resolution failed");
  });

  it("falls back to generic message for unknown code", () => {
    const mockT = (key: string) => {
      const messages: Record<string, string> = {
        "shell.serverUnreachableShort": "Cannot reach the server",
      };
      return messages[key] ?? key;
    };

    expect(getErrorMessage("unknown_code", mockT)).toBe("Cannot reach the server");
  });

  it("falls back to generic message for null code", () => {
    const mockT = (key: string) => {
      const messages: Record<string, string> = {
        "shell.serverUnreachableShort": "Cannot reach the server",
      };
      return messages[key] ?? key;
    };

    expect(getErrorMessage(null, mockT)).toBe("Cannot reach the server");
  });
});

describe("getDiagnosticTitle", () => {
  it("maps dns_failed to diagnostic title", () => {
    const mockT = (key: string) => {
      const messages: Record<string, string> = {
        "shell.diagnosticDNS": "DNS check failed",
      };
      return messages[key] ?? key;
    };

    expect(getDiagnosticTitle("dns_failed", mockT)).toBe("DNS check failed");
  });

  it("maps connection_refused to diagnostic title", () => {
    const mockT = (key: string) => {
      const messages: Record<string, string> = {
        "shell.diagnosticRefused": "Connection refused",
      };
      return messages[key] ?? key;
    };

    expect(getDiagnosticTitle("connection_refused", mockT)).toBe("Connection refused");
  });

  it("falls back to unreachable title for unknown code", () => {
    const mockT = (key: string) => {
      const messages: Record<string, string> = {
        "shell.serverUnreachableTitle": "Cannot reach the server",
      };
      return messages[key] ?? key;
    };

    expect(getDiagnosticTitle("unknown_code", mockT)).toBe("Cannot reach the server");
  });

  it("falls back to unreachable title for null code", () => {
    const mockT = (key: string) => {
      const messages: Record<string, string> = {
        "shell.serverUnreachableTitle": "Cannot reach the server",
      };
      return messages[key] ?? key;
    };

    expect(getDiagnosticTitle(null, mockT)).toBe("Cannot reach the server");
  });
});
