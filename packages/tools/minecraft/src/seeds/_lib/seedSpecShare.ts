/**
 * seedSpecShare — encode/decode seed specs as compact, shareable URL-safe strings.
 *
 * A share link encodes the full UiSpec into a query parameter. The format:
 *   [VERSION byte] + [compressed JSON] → base64url
 *
 * VERSION ensures forward compatibility: if the encoding format changes, old
 * links fail cleanly with a user-visible message rather than silently producing
 * a corrupted spec. The same UiSpec must round-trip through encode→decode
 * identically to the path the product uses (serialize→eval→deserialize).
 *
 * Corruption handling: any decoding failure (truncation, checksum mismatch,
 * version mismatch, invalid JSON) yields a descriptive error, never a
 * half-populated spec.
 */

import * as pakoModule from "pako";
import type { UiSpec } from "../_spec/model";

// Handle both ESM and CommonJS imports of pako
const pako = (pakoModule as { default?: typeof pakoModule } & typeof pakoModule).default || pakoModule;

/** Current encoding version. Bump this if the format changes. */
const SHARE_LINK_VERSION = 1;

/** Error thrown when decoding fails. */
export class SpecShareError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SpecShareError";
  }
}

/**
 * Encode a UiSpec into a compact, URL-safe string suitable for a query parameter.
 *
 * The format:
 *   - 1 byte: version
 *   - N bytes: pako-compressed JSON
 *   → base64url encoded
 *
 * Returns a string safe to include in URLs (no special chars).
 */
export function encodeSpec(spec: UiSpec): string {
  try {
    const json = JSON.stringify(spec);
    const jsonBytes = new TextEncoder().encode(json);
    const compressed = pako.deflate(jsonBytes);

    // Prepend version byte
    const withVersion = new Uint8Array(1 + compressed.length);
    withVersion[0] = SHARE_LINK_VERSION;
    withVersion.set(compressed, 1);

    // Convert to base64url
    const base64 = typeof btoa !== "undefined"
      ? btoa(String.fromCharCode(...withVersion))
      : Buffer.from(withVersion).toString("base64");
    return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  } catch (err) {
    throw new SpecShareError(`Failed to encode spec: ${err instanceof Error ? err.message : String(err)}`);
  }
}

/**
 * Decode a spec from a share link string.
 *
 * Throws SpecShareError if:
 *   - The string is not valid base64url
 *   - The version byte is unsupported
 *   - The data is truncated or corrupted
 *   - The JSON is invalid
 *   - The decoded object is not a valid UiSpec
 *
 * @param encoded The base64url-encoded spec string
 * @returns The decoded UiSpec
 * @throws SpecShareError if decoding fails
 */
export function decodeSpec(encoded: string): UiSpec {
  if (!encoded || typeof encoded !== "string") {
    throw new SpecShareError("Spec string is empty or invalid.");
  }

  try {
    // Convert from base64url to base64
    const base64 = encoded
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      // Restore padding if needed
      .padEnd(encoded.length + ((4 - (encoded.length % 4)) % 4), "=");

    let bytes: Uint8Array;
    try {
      if (typeof atob !== "undefined") {
        const binaryStr = atob(base64);
        bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }
      } else {
        // Node.js environment
        bytes = new Uint8Array(Buffer.from(base64, "base64"));
      }
    } catch (err) {
      throw new SpecShareError(
        "The share link is corrupted or truncated. Please verify the link and try again."
      );
    }

    if (bytes.length < 1) {
      throw new SpecShareError("The share link is empty.");
    }

    const version = bytes[0];
    if (version !== SHARE_LINK_VERSION) {
      throw new SpecShareError(
        `This share link uses an unsupported format version (${version}). ` +
        `Please generate a new share link from the current tool version.`
      );
    }

    const compressed = bytes.slice(1);

    let jsonBytes: Uint8Array;
    try {
      jsonBytes = pako.inflate(compressed);
    } catch (err) {
      throw new SpecShareError(
        "The share link data is corrupted. Please verify the link and try again."
      );
    }

    const json = new TextDecoder().decode(jsonBytes);
    let spec: unknown;
    try {
      spec = JSON.parse(json);
    } catch (err) {
      throw new SpecShareError("The share link contains invalid data.");
    }

    // Validate that we got a UiSpec-like object
    if (!isValidUiSpec(spec)) {
      throw new SpecShareError("The share link does not contain a valid seed spec.");
    }

    return spec;
  } catch (err) {
    if (err instanceof SpecShareError) throw err;
    throw new SpecShareError(`Failed to decode spec: ${err instanceof Error ? err.message : String(err)}`);
  }
}

/**
 * Lightweight validation that an object looks like a UiSpec.
 * Ensures the object has the required top-level structure without being too strict.
 */
function isValidUiSpec(obj: unknown): obj is UiSpec {
  if (typeof obj !== "object" || obj === null) return false;
  const spec = obj as Record<string, unknown>;
  return (
    typeof spec.origin === "object" &&
    spec.origin !== null &&
    "x" in spec.origin &&
    "z" in spec.origin &&
    typeof spec.scan === "object" &&
    spec.scan !== null &&
    Array.isArray(spec.locations)
  );
}
