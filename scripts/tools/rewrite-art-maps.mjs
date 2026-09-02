/**
 * rewrite-art-maps.mjs — shape-agnostic rewriter for the Mewgenics art maps.
 *
 * The seven art maps (icon_map.json, sprite_map.json, ui_map.json,
 * media_map.json, map_assets.json, portraits.json, class_assets.json) have
 * five different value shapes between them: icon_map is category -> id ->
 * path, sprite_map is id -> {svg,frames}, media_map mixes cursors ->
 * {src,hotspot} with sfx -> {opus,m4a}, map_assets has plain strings, arrays
 * of strings and a nested "chrome" object, portraits is token ->
 * {asset, records[]}, class_assets is name -> {bg}.
 *
 * Rather than seven writers, this walks ANY JSON value and replaces a string
 * only when it is an EXACT match for a key in `renameMap` (built by the build
 * script from the files it actually rasterised). That is what makes it:
 *   - idempotent by construction: once a path reads "…/Foo.webp" it no longer
 *     matches any ".svg" key in renameMap, so a second pass changes nothing
 *     (map_assets.json can already hold rewritten .webp entries and survive a
 *     re-run without double-rewriting)
 *   - safe on bare stems and non-path strings: map_assets' unmatched-
 *     background stems have no extension and portraits' records[].type/id are
 *     values like "character", neither of which is ever a key in renameMap
 *   - free for a new map file: no shape-specific code is needed, only a
 *     JSON.parse + rewriteArtMaps + JSON.stringify at the call site
 */

/**
 * Deep-walks `value`, replacing every string that is an exact key in
 * `renameMap` with its mapped value. Returns a NEW value (no mutation of the
 * input) so callers can freely re-run it on either the original or the
 * already-rewritten data to prove idempotence.
 *
 * @param {unknown} value
 * @param {Map<string, string>} renameMap
 * @param {{ changes: number }} [stats] optional counter, incremented once per
 *   string actually replaced
 */
export function rewriteArtMaps(value, renameMap, stats = { changes: 0 }) {
  if (typeof value === "string") {
    const next = renameMap.get(value)
    if (next !== undefined && next !== value) {
      stats.changes++
      return next
    }
    return value
  }
  if (Array.isArray(value)) {
    return value.map((v) => rewriteArtMaps(v, renameMap, stats))
  }
  if (value && typeof value === "object") {
    const out = {}
    for (const [k, v] of Object.entries(value)) out[k] = rewriteArtMaps(v, renameMap, stats)
    return out
  }
  return value
}

/**
 * Rewrites one art-map JSON string and returns the new JSON text plus how
 * many string values changed. Formatting matches the extractor's own style
 * (1-space indent, trailing newline) so a re-run without any actual renames
 * produces byte-identical output.
 *
 * @param {string} json
 * @param {Map<string, string>} renameMap
 */
export function rewriteArtMapJson(json, renameMap) {
  const data = JSON.parse(json)
  const stats = { changes: 0 }
  const rewritten = rewriteArtMaps(data, renameMap, stats)
  return { json: `${JSON.stringify(rewritten, null, 1)}\n`, changes: stats.changes, value: rewritten }
}

/** The seven files this rewriter is meant for. Exported so the build script
 *  and any future one share a single list. */
export const ART_MAP_FILES = [
  "icon_map.json",
  "sprite_map.json",
  "ui_map.json",
  "media_map.json",
  "map_assets.json",
  "portraits.json",
  "class_assets.json",
]
