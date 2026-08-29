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

/**
 * A design token, with working `/opacity` modifiers.
 *
 * Every token here is a `var(--x)` holding a hex or rgba. Tailwind cannot apply
 * an opacity modifier to that: `parseColor("var(--bad)")` returns null and the
 * utility is dropped from the build ENTIRELY — silently. `border-bad/40` emitted
 * no CSS at all, and because tailwind-merge treats it as a border-color class it
 * also stripped whatever real colour it replaced, leaving `border-color` to fall
 * back to `currentColor`. That is how a danger panel got a white border.
 *
 * A function token gets called by Tailwind with the alpha it wants, so we can
 * answer with `color-mix`. Base utilities are deliberately left byte-identical:
 * for those Tailwind passes its own `var(--tw-*-opacity)` variable, and wrapping
 * every colour in the codebase in a `color-mix` to support a modifier nobody
 * used there would be a much larger change than the bug warrants.
 */
/** Tailwind passes the alpha as a CSS string for most utilities, but the
 *  gradient plugin's `transparentTo()` passes the NUMBER 0 — so this is not
 *  always a string, and must never be treated as one without coercing. */
type Alpha = { opacityValue?: string | number }

/** Tailwind calls a colour function at build time with the alpha it wants, but
 *  its published types only model plain strings — so the return is cast. The
 *  cast is contained here so both consuming configs stay type-clean. */
const tok = (value: string): string =>
  (({ opacityValue }: Alpha = {}) => {
    if (opacityValue === undefined) return value
    const alpha = String(opacityValue)
    // A base utility: Tailwind hands us its own `--tw-*-opacity` variable and
    // sets it to 1. Answer with the plain token so every existing colour
    // utility in the codebase keeps byte-identical output.
    if (alpha.startsWith("var(--tw-")) return value
    return `color-mix(in srgb, ${value} calc(${alpha} * 100%), transparent)`
  }) as unknown as string

export const colors = {
  // ── Surfaces ──────────────────────────────────────────────────────────────
  // bg-base, bg-base-2, bg-base-deep
  base: tok("var(--bg)"),
  "base-2": tok("var(--bg-2)"),
  "base-deep": tok("var(--bg-deep)"),
  panel: {
    DEFAULT: tok("var(--panel)"),
    2: tok("var(--panel-2)"),
  },

  // ── Hairlines / borders ───────────────────────────────────────────────────
  // border-line, border-line-2
  line: {
    DEFAULT: tok("var(--line)"),
    2: tok("var(--line-2)"),
  },

  // ── Text ──────────────────────────────────────────────────────────────────
  // text-txt, text-txt-muted, text-txt-dim
  txt: {
    DEFAULT: tok("var(--text)"),
    muted: tok("var(--muted)"),
    dim: tok("var(--dim)"),
  },

  // ── Brand accent (orange) ─────────────────────────────────────────────────
  // bg-accent, text-accent, bg-accent-soft, border-accent-line
  accent: {
    DEFAULT: tok("var(--accent)"),
    bright: tok("var(--accent-bright)"),
    soft: tok("var(--accent-soft)"),
    line: tok("var(--accent-line)"),
    ink: tok("var(--naranja-ink)"),
  },

  // ── Status ────────────────────────────────────────────────────────────────
  ok: {
    DEFAULT: tok("var(--ok)"),
    soft: tok("var(--ok-soft)"),
  },
  warn: {
    DEFAULT: tok("var(--warn)"),
    soft: tok("var(--warn-soft)"),
  },
  bad: {
    DEFAULT: tok("var(--bad)"),
    soft: tok("var(--bad-soft)"),
  },
  signal: {
    DEFAULT: tok("var(--info)"),
    soft: tok("var(--info-soft)"),
  },
}

/** The shared geometry. SmartRotom's `sr-*` chrome uses these too — they are
 *  design-system-neutral, which is why they sit in base rather than a
 *  Boffmedia-only layer. Size via --cut/--cut-lg/--cut-tag; override
 *  per-instance with e.g. `[--cut:4px]`. */
export const geometry = plugin(({ addComponents }) => {
  /** Every diagonal stroke is drawn DIAG times the axis stroke. Two things
   *  thin a non-axis-aligned line that the borders it continues never suffer:
   *  it cannot sit on the pixel grid, so a 1px line is spread across two
   *  pixel columns at ~50% each, and its outer edge lies exactly on the
   *  clip-path, whose antialiasing fades the outer half-pixel. At 1px that
   *  rendered as a dotted line beside solid borders. The target weight is √2,
   *  the chamfer weight `.cut-frame` already has by construction (an inner
   *  box inset by --cut-w on both axes puts its 45° edge --cut-w·√2 from the
   *  outer one), so the `-edge` utilities and the frames share one optical
   *  weight — but exactly √2 is a knife edge: on a 45° chamfer it puts the
   *  band's inner edge on the pixel-centre lattice and a 1x screen rounds it
   *  back to one pixel per row. 1.5 sits just past that and renders the same
   *  two pixels per row a frame's chamfer does. */
  const DIAG = "1.5"
  const wd = `calc(var(--cut-w, 1px) * ${DIAG})`
  /** A wd-wide band along one diagonal of a box, painted as a gradient so
   *  the colour can come from a custom property. `dir` is the gradient direction,
   *  which CSS defines as perpendicular to the diagonal joining the two corners
   *  it does NOT point at — so `to top right` bands the main (TL→BR) diagonal
   *  and `to bottom right` bands the anti-diagonal (BL→TR).
   *
   *  `side` says which half of the box the shape KEEPS, in gradient-axis terms:
   *  `lo` = the low-percentage side (toward the gradient's origin corner), `hi`
   *  = the high side. The band is laid entirely on that side, never centred on
   *  the diagonal — the diagonal is exactly where the clip-path cuts, so a
   *  centred band loses its outer half and renders at half width. A CSS
   *  border sits inside the border box; so does this.
   *
   *  Each utility below passes its own `side` rather than deriving one: the
   *  answer depends on the shape, not just on which corner the pseudo is
   *  anchored to (`.cut-edge-slant`'s two halves sit on opposite sides while
   *  sharing a direction). */
  const band = (dir: string, side: "lo" | "hi") => {
    const c = "var(--cut-line, var(--line))"
    return side === "lo"
      ? `linear-gradient(${dir}, transparent calc(50% - ${wd}), ${c} 0 50%, transparent 0)`
      : `linear-gradient(${dir}, transparent 50%, ${c} 0 calc(50% + ${wd}), transparent 0)`
  }
  /** Places a chamfer stroke over one corner. Sized off the shape's own token
   *  and pulled out by --cut-w, because an absolutely positioned pseudo is laid
   *  out against the PADDING box while clip-path cuts the BORDER box — without
   *  the offset the stroke lands one border-width inside its own chamfer. */
  const edge = (size: string, dir: string, side: "lo" | "hi", corner: Record<string, string>) => ({
    content: '""',
    position: "absolute" as const,
    width: size,
    height: size,
    background: band(dir, side),
    // Above in-flow content, so a card whose child media reaches the corner
    // cannot paint over the stroke. Inert, so it never eats a click.
    zIndex: "2",
    pointerEvents: "none" as const,
    ...corner,
  })
  const out = "calc(var(--cut-w, 1px) * -1)"
  /** One slanted side of a `.cut` parallelogram: the border box, clipped to a
   *  strip straddling the slant line. Both slants lean the same way — left
   *  runs (--cut, 0)→(0, 100%), right runs (100%, 0)→(100% − --cut, 100%) —
   *  which is what makes the shape a parallelogram rather than a trapezoid.
   *  The strip's outer points sit past the
   *  edge (negative / >100% coordinates are fine in a polygon) so the shape's
   *  clip, not this one, decides where the stroke ends. */
  const slant = (side: "l" | "r") => ({
    content: '""',
    position: "absolute" as const,
    inset: out,
    background: "var(--cut-line, var(--line))",
    clipPath:
      side === "l"
        ? `polygon(calc(var(--cut) - ${wd}) 0, calc(var(--cut) + ${wd}) 0, ${wd} 100%, calc(${wd} * -1) 100%)`
        : `polygon(calc(100% - ${wd}) 0, calc(100% + ${wd}) 0, calc(100% - var(--cut) + ${wd}) 100%, calc(100% - var(--cut) - ${wd}) 100%)`,
    zIndex: "2",
    pointerEvents: "none" as const,
  })

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
    // Bottom-left chamfer alone, and the two-corner notch. Like the slants
    // below, these had `-edge` strokes but no clip, so call sites hand-wrote the
    // polygon. Both size off --cut-e to match the stroke that draws them.
    ".cut-bl": {
      clipPath: "polygon(0 0, 100% 0, 100% 100%, var(--cut-e, var(--cut-lg)) 100%, 0 calc(100% - var(--cut-e, var(--cut-lg))))",
    },
    ".cut-notch": {
      clipPath:
        "polygon(0 0, calc(100% - var(--cut-e, var(--cut-lg))) 0, 100% var(--cut-e, var(--cut-lg)), 100% 100%, var(--cut-e, var(--cut-lg)) 100%, 0 calc(100% - var(--cut-e, var(--cut-lg))))",
    },
    // Half-parallelograms: one slanted side, the other square. The `-edge`
    // strokes for these already existed; the clips did not, so call sites that
    // wanted the shape hand-wrote the polygon inline.
    ".cut-slant-l": {
      clipPath: "polygon(var(--cut) 0, 100% 0, 100% 100%, 0 100%)",
    },
    ".cut-slant-r": {
      clipPath: "polygon(0 0, 100% 0, calc(100% - var(--cut)) 100%, 0 100%)",
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
    // The inner clip reuses --cut over a box shortened by 2*--cut-w vertically
    // and 2*--cut-ix horizontally, so the slant is a hair steeper than the
    // outer one: at the sizes the primitives use (--cut 3-10px, height 20-56px)
    // the stroke drifts well under half a pixel. --cut-ix is the horizontal
    // inset, and so the slant's horizontal thickness: DIAG·--cut-w here, because
    // the slant's outer edge is antialiased by the clip and a 1px diagonal
    // reads thinner than the 1px rules above and below it (see DIAG). The
    // chamfer variants reset it — their diagonals already come out at √2 from
    // the plain inset, the weight DIAG is matched to.
    //
    // The shape lives in --cut-path so the `.cut-frame-*` variants below can
    // restroke every other cut geometry off one implementation.
    ".cut-frame": {
      "--cut-path": "polygon(var(--cut) 0, 100% 0, calc(100% - var(--cut)) 100%, 0 100%)",
      "--cut-ix": wd,
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
        inset: "var(--cut-w, 1px) var(--cut-ix, var(--cut-w, 1px))",
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
      "--cut-ix": "var(--cut-w, 1px)",
    },
    ".cut-frame-seal": {
      "--cut-ix": "var(--cut-w, 1px)",
      "--cut-path":
        "polygon(var(--cut) 0, 100% 0, 100% calc(100% - var(--cut)), calc(100% - var(--cut)) 100%, 0 100%, 0 var(--cut))",
    },
    ".cut-frame-tag": {
      "--cut-ix": "var(--cut-w, 1px)",
      "--cut-path":
        "polygon(0 0, 100% 0, 100% calc(100% - var(--cut-tag, 8px)), calc(100% - var(--cut-tag, 8px)) 100%, 0 100%)",
    },
    // Both corners of the leading edge chamfered (banners, heroes).
    ".cut-frame-notch": {
      "--cut-ix": "var(--cut-w, 1px)",
      "--cut-path":
        "polygon(0 0, calc(100% - var(--cut-lg)) 0, 100% var(--cut-lg), 100% 100%, var(--cut-lg) 100%, 0 calc(100% - var(--cut-lg)))",
    },
    // Escape hatch for a card whose children paint edge to edge (media, split
    // panels): the stroke is a paint layer under the content, so a child that
    // reaches the outer edge would cover it. Padding keeps children off the
    // stroke; the pseudo insets shift because an absolutely positioned child
    // resolves against the PADDING box, which the padding has just shrunk.
    ".cut-frame-inset": {
      padding: "var(--cut-w, 1px) var(--cut-ix, var(--cut-w, 1px))",
      "&::after": { inset: "calc(var(--cut-w, 1px) * -1) calc(var(--cut-ix, var(--cut-w, 1px)) * -1)" },
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
    // The `side` argument is the half the CLIP KEEPS. A chamfer removes the
    // triangle at its own corner, so a pseudo whose gradient points AT that
    // corner keeps the low side, and one pointing away keeps the high side.
    ".cut-corner-edge": {
      position: "relative",
      "&::after": edge("var(--cut-lg)", "to top right", "lo", { top: out, right: out }),
    },
    ".cut-tag-edge": {
      position: "relative",
      "&::after": edge("var(--cut-tag, 8px)", "to bottom right", "lo", { bottom: out, right: out }),
    },
    // Replaced elements (<input>, <select>, <textarea>) never render ::after, so
    // the stroke above silently vanishes on every native form control while the
    // clip-path still cuts the corner. Paint the same band as a background tile
    // instead, anchored to the border box (where clip-path measures from) so the
    // tile's diagonal lands exactly on the cut. `bg-*` utilities only set
    // background-color, so the image layers on top of them without a fight.
    //
    // A control that needs its own image layers (Select's caret) must not set
    // `background-image` itself — that would replace this one. It hands them
    // over through --ctl-bg / --ctl-bg-size / --ctl-bg-pos instead and they are
    // stacked above the band; `none` is a valid (empty) image layer, so the
    // defaults cost nothing.
    "input.cut-tag-edge, select.cut-tag-edge, textarea.cut-tag-edge": {
      backgroundImage: `var(--ctl-bg, none), ${band("to bottom right", "lo")}`,
      backgroundSize: "var(--ctl-bg-size, auto), var(--cut-tag, 8px) var(--cut-tag, 8px)",
      backgroundPosition: "var(--ctl-bg-pos, 0 0), right bottom",
      backgroundRepeat: "no-repeat",
      backgroundOrigin: "border-box",
      backgroundClip: "border-box",
    },
    // One-off chamfers that do not match a named shape: pick the corner and
    // size it with --cut-e (e.g. `cut-edge-bl [--cut-e:10px]`).
    ".cut-edge-tr": {
      position: "relative",
      "&::after": edge("var(--cut-e, var(--cut-lg))", "to top right", "lo", { top: out, right: out }),
    },
    ".cut-edge-bl": {
      position: "relative",
      "&::after": edge("var(--cut-e, var(--cut-lg))", "to top right", "hi", { bottom: out, left: out }),
    },
    ".cut-edge-tl": {
      position: "relative",
      "&::after": edge("var(--cut-e, var(--cut-lg))", "to bottom right", "hi", { top: out, left: out }),
    },
    ".cut-edge-br": {
      position: "relative",
      "&::after": edge("var(--cut-e, var(--cut-lg))", "to bottom right", "lo", { bottom: out, right: out }),
    },
    // Opposite-corner pairs. Both spend ::before as well as ::after — do not use
    // them on an element that already carries a ::before.
    ".cut-edge-notch": {
      position: "relative",
      "&::before": edge("var(--cut-e, var(--cut-lg))", "to top right", "lo", { top: out, right: out }),
      "&::after": edge("var(--cut-e, var(--cut-lg))", "to top right", "hi", { bottom: out, left: out }),
    },
    ".cut-seal-edge": {
      position: "relative",
      "&::before": edge("var(--cut)", "to bottom right", "hi", { top: out, left: out }),
      "&::after": edge("var(--cut)", "to bottom right", "lo", { bottom: out, right: out }),
    },
    // The parallelogram is the one shape whose left and right edges ARE the
    // diagonals, so the clip is right to discard those two borders — but then
    // nothing strokes the slants. Each slant is a pseudo covering the whole
    // border box (the same box the element's clip-path measures from, so
    // --cut means the same thing in both), clipped to a strip 2·wd wide
    // centred on the slant line. The element's clip discards the outer half,
    // leaving a stroke wd wide (measured horizontally) inside the shape whose
    // only antialiased edge is the clip's own.
    //
    // Not a gradient band like the chamfers above: a band lives inside a
    // --cut-wide box whose anti-diagonal is the slant, and where that
    // diagonal meets the box's top or bottom the interior side of the stroke
    // falls OUTSIDE the box, so the top rows of a left slant (and the bottom
    // rows of a right one) went unpainted — the stroke stopped short of the
    // horizontal rule it was meant to meet. A strip starts where the rule
    // does.
    ".cut-edge-slant": {
      position: "relative",
      "&::before": slant("l"),
      "&::after": slant("r"),
    },
    // Half-parallelograms: only one side is slanted, the other stays square.
    ".cut-edge-slant-l": {
      position: "relative",
      "&::after": slant("l"),
    },
    ".cut-edge-slant-r": {
      position: "relative",
      "&::after": slant("r"),
    },
  })
})

/** Content globs for the shared primitives. A host that renders @boffmedia/ui
 *  must include these or every class the package owns is purged. */
export const uiContent = ["../../packages/ui/src/**/*.{ts,tsx}"]

/** Content globs for the workspace tool packages (@boffmedia/tools-*). Same
 *  deal as `uiContent`: a host rendering a tool must include these or the
 *  tool's classes are purged out of that host's build. One glob covers every
 *  domain package, so porting tool #2..N needs no host config change. */
export const toolsContent = ["../../packages/tools/*/src/**/*.{ts,tsx}"]
