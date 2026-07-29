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
  // 1.12.2 is the pre-flattening floor and is built differently from the rest:
  // its registry is the set of modern blockstates a 1.12 world can hold (see
  // generate-vanilla.mjs), because that is what the legacy loader emits. It is a
  // source/viewing environment — no exporter writes pre-flattening files.
  "1.12.2",
  "1.13.2",
  "1.14.4",
  "1.15.2",
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
