/**
 * Vanilla Minecraft versions shipped as offline registry bundles.
 *
 * Deliberately dependency-free: the UI (environment picker) and the worker
 * (registry builder) both need this list, and importing it from
 * `registry/` would drag JSZip + Dexie into the main bundle.
 *
 * Keep in sync with the `VERSIONS` array in
 * `registry/vanilla/generate-vanilla.mjs`, then re-run that script.
 */
export const BUNDLED_VERSIONS = [
  "1.16.5",
  "1.17.1",
  "1.18",
  "1.18.2",
  "1.19.2",
  "1.19.4",
  "1.20",
  "1.20.4",
  "1.20.6",
  "1.21.1",
  "1.21.4",
  "1.21.8",
] as const;

export type BundledVersion = (typeof BUNDLED_VERSIONS)[number];

/** Pre-selected in the version picker — the newest bundled release. */
export const DEFAULT_VANILLA_VERSION: BundledVersion =
  BUNDLED_VERSIONS[BUNDLED_VERSIONS.length - 1];

export function isBundledVersion(v: string): v is BundledVersion {
  return (BUNDLED_VERSIONS as readonly string[]).includes(v);
}
