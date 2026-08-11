import plugin from "tailwindcss/plugin"

// The Boffmedia v3 design-system layer, shared by apps/web and any other host
// that renders @boffmedia/ui. Everything here is token→var() mapping only; the
// values live in `base.css`, which the host must also load.
//
// SCOPE RULE: only tokens the v3 primitives actually reference belong here.
// The 14 app namespaces (sb, ca, nt, sr, pk, mw, ar, pc, ms, ft, gt, wp, rk,
// ps) stay in apps/web — @boffmedia/ui references none of them.

export const fontFamily = {
  display: ["Saira Condensed", "Arial Narrow", "sans-serif"],
  body: ["Saira", "ui-sans-serif", "system-ui", "sans-serif"],
  mono: ["IBM Plex Mono", "ui-monospace", "monospace"],
}

export const colors = {
  // ── Surfaces ──────────────────────────────────────────────────────────────
  // bg-base, bg-base-2, bg-base-deep
  base: "var(--bg)",
  "base-2": "var(--bg-2)",
  "base-deep": "var(--bg-deep)",
  panel: {
    DEFAULT: "var(--panel)",
    2: "var(--panel-2)",
  },

  // ── Hairlines / borders ───────────────────────────────────────────────────
  // border-line, border-line-2
  line: {
    DEFAULT: "var(--line)",
    2: "var(--line-2)",
  },

  // ── Text ──────────────────────────────────────────────────────────────────
  // text-txt, text-txt-muted, text-txt-dim
  txt: {
    DEFAULT: "var(--text)",
    muted: "var(--muted)",
    dim: "var(--dim)",
  },

  // ── Brand accent (orange) ─────────────────────────────────────────────────
  // bg-accent, text-accent, bg-accent-soft, border-accent-line
  accent: {
    DEFAULT: "var(--accent)",
    bright: "var(--accent-bright)",
    soft: "var(--accent-soft)",
    line: "var(--accent-line)",
    ink: "var(--naranja-ink)",
  },

  // ── Status ────────────────────────────────────────────────────────────────
  ok: {
    DEFAULT: "var(--ok)",
    soft: "var(--ok-soft)",
  },
  warn: {
    DEFAULT: "var(--warn)",
    soft: "var(--warn-soft)",
  },
  bad: {
    DEFAULT: "var(--bad)",
    soft: "var(--bad-soft)",
  },
  signal: {
    DEFAULT: "var(--info)",
    soft: "var(--info-soft)",
  },
}

/** The shared geometry. SmartRotom's `sr-*` chrome uses these too — they are
 *  design-system-neutral, which is why they sit in base rather than a
 *  Boffmedia-only layer. Size via --cut/--cut-lg/--cut-tag; override
 *  per-instance with e.g. `[--cut:4px]`. */
export const geometry = plugin(({ addComponents }) => {
  /** A 1px band along one diagonal of a square, painted as a gradient so the
   *  colour can come from a custom property. `dir` is the gradient direction,
   *  which CSS defines as perpendicular to the diagonal joining the two corners
   *  it does NOT point at — so `to top right` bands the main (TL→BR) diagonal
   *  and `to bottom right` bands the anti-diagonal (BL→TR). */
  const band = (dir: string) =>
    `linear-gradient(${dir}, transparent calc(50% - var(--cut-w, 1px) / 2), var(--cut-line, var(--line)) 0 calc(50% + var(--cut-w, 1px) / 2), transparent 0)`
  /** Places a chamfer stroke over one corner. Sized off the shape's own token
   *  and pulled out by --cut-w, because an absolutely positioned pseudo is laid
   *  out against the PADDING box while clip-path cuts the BORDER box — without
   *  the offset the stroke lands one border-width inside its own chamfer. */
  const edge = (size: string, dir: string, corner: Record<string, string>) => ({
    content: '""',
    position: "absolute" as const,
    width: size,
    height: size,
    background: band(dir),
    // Above in-flow content, so a card whose child media reaches the corner
    // cannot paint over the stroke. Inert, so it never eats a click.
    zIndex: "2",
    pointerEvents: "none" as const,
    ...corner,
  })
  const out = "calc(var(--cut-w, 1px) * -1)"

  addComponents({
    ".cut": {
      clipPath: "polygon(var(--cut) 0, 100% 0, calc(100% - var(--cut)) 100%, 0 100%)",
    },
    // Chamfered box: top-left + bottom-right corners cut, straight edges (seals,
    // avatars, icon glyphs, game logos). Unlike `.cut` (a slanted parallelogram
    // for pills/buttons), this keeps all four sides square.
    ".cut-seal": {
      clipPath:
        "polygon(var(--cut) 0, 100% 0, 100% calc(100% - var(--cut)), calc(100% - var(--cut)) 100%, 0 100%, 0 var(--cut))",
    },
    ".cut-corner": {
      clipPath: "polygon(0 0, calc(100% - var(--cut-lg)) 0, 100% var(--cut-lg), 100% 100%, 0 100%)",
    },
    ".cut-tag": {
      clipPath:
        "polygon(0 0, 100% 0, 100% calc(100% - var(--cut-tag, 8px)), calc(100% - var(--cut-tag, 8px)) 100%, 0 100%)",
    },
    // Bordered `.cut`. A CSS `border` cannot survive a clip-path: the clip slices
    // the left/right borders off entirely and leaves the two diagonals unstroked,
    // so an outline shape collapses into two loose horizontal rules. This draws
    // the stroke as geometry instead — the element itself is a solid slab in the
    // line colour, and `::before` re-cuts the same parallelogram inset by
    // --cut-w, leaving a stroke that follows all four edges including the slants.
    //
    // Use INSTEAD of `border` + `.cut`, never alongside them. Set the colours via
    // --cut-line / --cut-fill (utilities: `[--cut-line:var(--accent)]`), which
    // also makes hover/active variants a one-token swap. Because the fill is a
    // real paint, --cut-fill must name the surface the element sits on; a
    // genuinely transparent shape is not expressible here.
    //
    // The inner clip reuses --cut over a box shortened by 2*--cut-w, so the slant
    // is a hair steeper than the outer one: at the sizes the primitives use
    // (--cut 3-10px, height 20-56px) the stroke drifts well under half a pixel.
    //
    // The shape lives in --cut-path so the `.cut-frame-*` variants below can
    // restroke every other cut geometry off one implementation.
    ".cut-frame": {
      "--cut-path": "polygon(var(--cut) 0, 100% 0, calc(100% - var(--cut)) 100%, 0 100%)",
      position: "relative",
      border: "0",
      background: "transparent",
      clipPath: "var(--cut-path)",
      // Both layers sit at a negative z-index so they paint above the element's
      // own background but below its content — otherwise the fill would cover
      // bare text nodes, which cannot be raised with z-index.
      "&::after": {
        content: '""',
        position: "absolute",
        inset: "0",
        zIndex: "-2",
        background: "var(--cut-line, var(--line-2))",
        pointerEvents: "none",
      },
      "&::before": {
        content: '""',
        position: "absolute",
        inset: "var(--cut-w, 1px)",
        zIndex: "-1",
        background: "var(--cut-fill, var(--panel))",
        clipPath: "var(--cut-path)",
        pointerEvents: "none",
      },
    },
    // Chamfer variants of `.cut-frame` — same stroke-as-geometry machinery, one
    // per shape. Use with `.cut-frame`: `class="cut-frame cut-frame-corner"`.
    // The inner clip is the outer one inset by --cut-w, so on a 45° chamfer the
    // diagonal reads ~1.41x the width of the straight edges; at 1px strokes that
    // is the same optical weight a mitred CSS border has.
    ".cut-frame-corner": {
      "--cut-path": "polygon(0 0, calc(100% - var(--cut-lg)) 0, 100% var(--cut-lg), 100% 100%, 0 100%)",
    },
    ".cut-frame-seal": {
      "--cut-path":
        "polygon(var(--cut) 0, 100% 0, 100% calc(100% - var(--cut)), calc(100% - var(--cut)) 100%, 0 100%, 0 var(--cut))",
    },
    ".cut-frame-tag": {
      "--cut-path":
        "polygon(0 0, 100% 0, 100% calc(100% - var(--cut-tag, 8px)), calc(100% - var(--cut-tag, 8px)) 100%, 0 100%)",
    },
    // Both corners of the leading edge chamfered (banners, heroes).
    ".cut-frame-notch": {
      "--cut-path":
        "polygon(0 0, calc(100% - var(--cut-lg)) 0, 100% var(--cut-lg), 100% 100%, var(--cut-lg) 100%, 0 calc(100% - var(--cut-lg)))",
    },
    // Escape hatch for a card whose children paint edge to edge (media, split
    // panels): the stroke is a paint layer under the content, so a child that
    // reaches the outer edge would cover it. Padding keeps children off the
    // stroke; the pseudo insets shift because an absolutely positioned child
    // resolves against the PADDING box, which the padding has just shrunk.
    ".cut-frame-inset": {
      padding: "var(--cut-w, 1px)",
      "&::after": { inset: "calc(var(--cut-w, 1px) * -1)" },
      "&::before": { inset: "0" },
    },
    // ── chamfer strokes ────────────────────────────────────────────────────
    // The chamfer shapes (`.cut-corner`, `.cut-tag`, `.cut-seal`) only lose the
    // diagonal to the clip — every axis-aligned edge survives, so a real CSS
    // `border` still draws them correctly. These add just the missing diagonal
    // and are therefore a one-class drop-in: unlike `.cut-frame`, the element
    // keeps its own border, background, hover transitions and per-side accents.
    //
    // Pair each with its shape and set --cut-line to the border colour (default
    // --line); bump --cut-w to match a thicker border on the chamfered corner.
    ".cut-corner-edge": {
      position: "relative",
      "&::after": edge("var(--cut-lg)", "to top right", { top: out, right: out }),
    },
    ".cut-tag-edge": {
      position: "relative",
      "&::after": edge("var(--cut-tag, 8px)", "to bottom right", { bottom: out, right: out }),
    },
    // One-off chamfers that do not match a named shape: pick the corner and
    // size it with --cut-e (e.g. `cut-edge-bl [--cut-e:10px]`).
    ".cut-edge-tr": {
      position: "relative",
      "&::after": edge("var(--cut-e, var(--cut-lg))", "to top right", { top: out, right: out }),
    },
    ".cut-edge-bl": {
      position: "relative",
      "&::after": edge("var(--cut-e, var(--cut-lg))", "to top right", { bottom: out, left: out }),
    },
    ".cut-edge-tl": {
      position: "relative",
      "&::after": edge("var(--cut-e, var(--cut-lg))", "to bottom right", { top: out, left: out }),
    },
    ".cut-edge-br": {
      position: "relative",
      "&::after": edge("var(--cut-e, var(--cut-lg))", "to bottom right", { bottom: out, right: out }),
    },
    // Opposite-corner pairs. Both spend ::before as well as ::after — do not use
    // them on an element that already carries a ::before.
    ".cut-edge-notch": {
      position: "relative",
      "&::before": edge("var(--cut-e, var(--cut-lg))", "to top right", { top: out, right: out }),
      "&::after": edge("var(--cut-e, var(--cut-lg))", "to top right", { bottom: out, left: out }),
    },
    ".cut-seal-edge": {
      position: "relative",
      "&::before": edge("var(--cut)", "to bottom right", { top: out, left: out }),
      "&::after": edge("var(--cut)", "to bottom right", { bottom: out, right: out }),
    },
    // The parallelogram is the one shape whose left and right edges ARE the
    // diagonals, so the clip is right to discard those two borders — but then
    // nothing strokes the slants. Each is the anti-diagonal of a --cut-wide,
    // full-height box, so the same gradient band draws it at any height.
    ".cut-edge-slant": {
      position: "relative",
      "&::before": {
        ...edge("var(--cut)", "to bottom right", { top: out, left: out }),
        height: "calc(100% + var(--cut-w, 1px) * 2)",
      },
      "&::after": {
        ...edge("var(--cut)", "to bottom right", { top: out, right: out }),
        height: "calc(100% + var(--cut-w, 1px) * 2)",
      },
    },
    // Half-parallelograms: only one side is slanted, the other stays square.
    ".cut-edge-slant-l": {
      position: "relative",
      "&::after": {
        ...edge("var(--cut)", "to bottom right", { top: out, left: out }),
        height: "calc(100% + var(--cut-w, 1px) * 2)",
      },
    },
    ".cut-edge-slant-r": {
      position: "relative",
      "&::after": {
        ...edge("var(--cut)", "to bottom right", { top: out, right: out }),
        height: "calc(100% + var(--cut-w, 1px) * 2)",
      },
    },
  })
})

/** Content globs for the shared primitives. A host that renders @boffmedia/ui
 *  must include these or every class the package owns is purged. */
export const uiContent = ["../../packages/ui/src/**/*.{ts,tsx}"]
