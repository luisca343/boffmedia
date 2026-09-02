/**
 * svgo-profiles.mjs — the two svgo configs the Mewgenics asset build uses.
 *
 * Every SVG in the raw extractor tree carries FFDec's own namespace and
 * per-element `ffdec:*` attributes (frame/shape ids from the SWF decompiler).
 * Neither profile needs them, so both strip that namespace and its attributes
 * via a small custom plugin — svgo's own `removeUnusedNS` only clears the
 * `xmlns:ffdec` declaration once the attributes referencing it are gone, so
 * doing both here in one pass is simpler than relying on plugin ordering.
 *
 * `generic` is for anything svgo is free to restructure: preset-default (svgo
 * 4.x no longer includes `removeViewBox` in that preset at all, so viewBox
 * already survives untouched with no override needed) with numeric precision
 * rounded to 2 decimals.
 *
 * `catparts` is deliberately conservative. packages/tools/mewgenics/src/cat/
 * MewCat.tsx:228-250 parses two things out of the raw markup with literal
 * regexes: the `viewBox` attribute, and the FIRST `transform` in the document
 * (either `translate(x y)` or a 6-arg `matrix(...)`), then relies on
 * `<use xlink:href="#shapeN">` pointing into `<defs>`. Any of the following
 * default preset-default plugins can shift, fuse or delete one of those:
 *   - convertTransform        — can rewrite/merge the first transform
 *   - collapseGroups          — can fold the wrapping <g transform=...> away
 *   - moveGroupAttrsToElems   — can relocate the transform onto a child
 *   - mergePaths              — can fuse the shapes the transform positions
 *   - cleanupIds               — can rename the ids `<use xlink:href="#id">` needs
 *   - removeUselessDefs        — can drop `<defs>` the `<use>` elements reference
 * All six are switched off here. `cleanupNumericValues` is switched off
 * entirely too (not just tuned down) — it would round the very viewBox and
 * transform numbers the regexes read verbatim. The one real win left is
 * path-data precision on `d`/`points` only, via `convertPathData`, which
 * never touches viewBox or transform.
 */

/** Removes FFDec's own namespace and every `ffdec:*` attribute. Shared by
 *  both profiles — neither reads FFDec metadata. */
const stripFfdecPlugin = {
  name: "stripFfdec",
  fn: () => ({
    element: {
      enter: (node) => {
        for (const name of Object.keys(node.attributes)) {
          if (name === "xmlns:ffdec" || name.startsWith("ffdec:")) {
            delete node.attributes[name]
          }
        }
      },
    },
  }),
}

/** preset-default (viewBox already survives it), precision 2, ffdec stripped. */
export function genericConfig() {
  return {
    multipass: true,
    js2svg: { indent: 2, pretty: false },
    plugins: [
      {
        name: "preset-default",
        params: {
          overrides: {
            cleanupNumericValues: { floatPrecision: 2 },
            convertPathData: { floatPrecision: 2 },
          },
        },
      },
      stripFfdecPlugin,
    ],
  }
}

/** Conservative profile forced on everything under assets/catparts/. See the
 *  file header for exactly which plugins are off and why. */
export function catpartsConfig() {
  return {
    multipass: false,
    js2svg: { indent: 2, pretty: false },
    plugins: [
      {
        name: "preset-default",
        params: {
          overrides: {
            convertTransform: false,
            collapseGroups: false,
            moveGroupAttrsToElems: false,
            mergePaths: false,
            cleanupIds: false,
            removeUselessDefs: false,
            cleanupNumericValues: false,
            convertPathData: { floatPrecision: 3 },
          },
        },
      },
      stripFfdecPlugin,
    ],
  }
}
