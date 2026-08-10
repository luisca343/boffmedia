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
    ".cut-frame": {
      position: "relative",
      border: "0",
      background: "transparent",
      clipPath: "polygon(var(--cut) 0, 100% 0, calc(100% - var(--cut)) 100%, 0 100%)",
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
        clipPath: "polygon(var(--cut) 0, 100% 0, calc(100% - var(--cut)) 100%, 0 100%)",
        pointerEvents: "none",
      },
    },
  })
})

/** Content globs for the shared primitives. A host that renders @boffmedia/ui
 *  must include these or every class the package owns is purged. */
export const uiContent = ["../../packages/ui/src/**/*.{ts,tsx}"]
