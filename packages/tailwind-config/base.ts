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
  })
})

/** Content globs for the shared primitives. A host that renders @boffmedia/ui
 *  must include these or every class the package owns is purged. */
export const uiContent = ["../../packages/ui/src/**/*.{ts,tsx}"]
