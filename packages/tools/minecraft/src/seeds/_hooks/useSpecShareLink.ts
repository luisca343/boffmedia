/**
 * useSpecShareLink — generate and consume share links for seed specs.
 *
 * Provides UI actions for "copy share link" (generates a URL-encoded spec)
 * and handles importing a spec from a share link in the URL query parameter.
 *
 * The hook stays host-agnostic:
 * - On web: uses window.location to build the full share URL
 * - On desktop: returns just the encoded spec (runtime.ts wires it into the address bar)
 */

import { useCallback, useEffect, useState } from "react";
import { decodeSpec, encodeSpec, type SpecShareError } from "../_lib/seedSpecShare";
import type { UiSpec } from "../_spec/model";

/**
 * Share link information returned by the hook.
 */
export interface ShareLinkState {
  /** The encoded spec string, ready for a URL query parameter. */
  encodedSpec: string | null;
  /** Error message if encoding failed. */
  encodeError: string | null;
  /** Imported spec from URL, or null if none or decoding failed. */
  importedSpec: UiSpec | null;
  /** Error message if decoding an imported spec failed. */
  importError: string | null;
  /** Generate a share link for the current spec. */
  generateShareLink: (spec: UiSpec) => void;
  /** Clear the import error. */
  clearImportError: () => void;
}

const SHARE_PARAM = "spec";

/**
 * Read the spec from the URL if present.
 * Returns null if no spec parameter or if we're not in a browser.
 */
function readSpecFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get(SHARE_PARAM);
  } catch {
    return null;
  }
}

/**
 * Generate a full share URL for the current page with the spec encoded.
 * Host-agnostic: on web, this is the full URL; on desktop, just the encoded spec.
 */
function buildShareUrl(encoded: string): string {
  if (typeof window === "undefined") {
    // In SSR or desktop context, return just the encoded spec
    return encoded;
  }
  // On web, build the full URL
  const url = new URL(window.location.href);
  url.searchParams.set(SHARE_PARAM, encoded);
  return url.toString();
}

/**
 * useSpecShareLink — manage share link generation and import.
 *
 * On mount, attempts to import a spec from the URL. Provides a function to
 * generate a share link for the current spec.
 */
export function useSpecShareLink(): ShareLinkState {
  const [encodedSpec, setEncodedSpec] = useState<string | null>(null);
  const [encodeError, setEncodeError] = useState<string | null>(null);
  const [importedSpec, setImportedSpec] = useState<UiSpec | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  // On mount, try to import a spec from the URL
  useEffect(() => {
    const encoded = readSpecFromUrl();
    if (!encoded) return;

    try {
      const spec = decodeSpec(encoded);
      setImportedSpec(spec);
      setImportError(null);
    } catch (err) {
      setImportError(
        err instanceof Error ? err.message : "Failed to import spec from share link."
      );
    }
  }, []);

  const generateShareLink = useCallback((spec: UiSpec) => {
    try {
      const encoded = encodeSpec(spec);
      setEncodedSpec(encoded);
      setEncodeError(null);
      // For debugging: log the full URL in web context
      if (typeof window !== "undefined") {
        console.debug("Share link generated:", buildShareUrl(encoded));
      }
    } catch (err) {
      setEncodeError(
        err instanceof Error ? err.message : "Failed to generate share link."
      );
      setEncodedSpec(null);
    }
  }, []);

  const clearImportError = useCallback(() => {
    setImportError(null);
  }, []);

  return {
    encodedSpec,
    encodeError,
    importedSpec,
    importError,
    generateShareLink,
    clearImportError,
  };
}
