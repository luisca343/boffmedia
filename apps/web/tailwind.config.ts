import type { Config } from "tailwindcss"
import plugin from "tailwindcss/plugin"

const config: Config = {
  darkMode: ["selector", '[data-theme="dark"]'],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  prefix: "",
  theme: {
    extend: {
      fontFamily: {
        vinque: ["Vinque", "sans-serif"],
        roboto: ["Roboto", "sans-serif"],
        bebas: ["Bebas Neue", "sans-serif"],
        // Boffmedia type system (default)
        display: ["Saira Condensed", "Arial Narrow", "sans-serif"],
        body: ["Saira", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "ui-monospace", "monospace"],
        // Legacy family retained for not-yet-migrated components
        orbitron: ["Orbitron", "sans-serif"],
        // Starbank (SmartRotom) — fintech dual type system (self-hosted)
        sb: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        "sb-display": ["Space Grotesk", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        // ChatApp (SmartRotom) — native system UI stack, no external fonts.
        ca: ["-apple-system", "BlinkMacSystemFont", "Segoe UI", "Helvetica Neue", "Helvetica", "Arial", "sans-serif"],
        "ca-mono": ["ui-monospace", "SF Mono", "Roboto Mono", "Menlo", "Consolas", "monospace"],
        // Pokédex (SmartRotom) — dark/gaming dual type system (self-hosted).
        // IBM Plex Mono stands in for the handoff's JetBrains Mono (already hosted).
        pk: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        "pk-display": ["Orbitron", "ui-sans-serif", "system-ui", "sans-serif"],
        "pk-mono": ["IBM Plex Mono", "ui-monospace", "monospace"],
        // Mewtube + Mewtwitch (SmartRotom) — media dual type system (self-hosted).
        // Orbitron for screen/section titles, Inter for UI/body, Lexend Mega for
        // the wordmark only.
        mw: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        "mw-display": ["Orbitron", "ui-sans-serif", "system-ui", "sans-serif"],
        "mw-wide": ["Lexend Mega", "ui-sans-serif", "system-ui", "sans-serif"],
        // Notes (SmartRotom) — linked-notes quad type system (self-hosted).
        // IBM Plex Mono stands in for the handoff's Roboto Mono; the optional
        // serif reading mode uses a system serif stack (no new font added).
        nt: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        "nt-display": ["Orbitron", "ui-sans-serif", "system-ui", "sans-serif"],
        "nt-mono": ["IBM Plex Mono", "ui-monospace", "monospace"],
        "nt-read": ["Georgia", "Cambria", "Times New Roman", "serif"],
        // Arcade (SmartRotom) — synthwave triple type system (self-hosted).
        // Press Start 2P is the pixel display face: it ships a single 400 weight
        // and each glyph is a full em square, so it is only ever used at small
        // sizes for kickers, titles and score readouts — never for body copy.
        ar: ["Space Grotesk", "ui-sans-serif", "system-ui", "sans-serif"],
        "ar-display": ["Press Start 2P", "ui-monospace", "monospace"],
        "ar-mono": ["JetBrains Mono", "ui-monospace", "monospace"],
        // Taxi (SmartRotom) — mobility triple type system (self-hosted).
        // Orbitron carries the wordmark and the rider tier only; every figure
        // (fares, coords, distances) is JetBrains Mono with tabular numerals.
        tx: ["Plus Jakarta Sans", "ui-sans-serif", "system-ui", "sans-serif"],
        "tx-display": ["Orbitron", "ui-sans-serif", "system-ui", "sans-serif"],
        "tx-mono": ["JetBrains Mono", "ui-monospace", "monospace"],
        // Misiones (SmartRotom) — the tavern quest board. Five self-hosted
        // faces, all serif or hand: display carves the titles, body is the
        // manuscript, uppercase is a true small-caps face used for every label,
        // mono carries the figures (n/total), hand is the pinned post-its.
        ms: ["EB Garamond", "Iowan Old Style", "Georgia", "serif"],
        "ms-display": ["Cinzel Decorative", "Cinzel", "Georgia", "serif"],
        "ms-uppercase": ["IM Fell English SC", "Cinzel", "Georgia", "serif"],
        "ms-mono": ["IM Fell DW Pica", "ui-monospace", "monospace"],
        "ms-hand": ["Patrick Hand", "Segoe Print", "cursive"],
      },
      fontSize: {
        "4xl": ["2.25rem", { lineHeight: "normal" }],
        "5xl": ["3rem", { lineHeight: "normal" }],
        "6xl": ["3.75rem", { lineHeight: "normal" }],
        "t-4xs": ["0.54rem", { lineHeight: "1" }],
        "t-3xs": ["0.6rem", { lineHeight: "1" }],
        "t-2xs": ["0.7rem", { lineHeight: "1" }],
        "t-xs": ["0.75rem", { lineHeight: "1" }],
        "t-sm": ["0.875rem", { lineHeight: "1.4" }],
        "t-base": ["1rem", { lineHeight: "1.6" }],
        "t-lg": ["1.125rem", { lineHeight: "1.5" }],
        "t-xl": ["1.375rem", { lineHeight: "1.3" }],
        "t-2xl": ["1.75rem", { lineHeight: "1.2" }],
        "t-3xl": ["2.25rem", { lineHeight: "1.1" }],
        "t-4xl": ["3rem", { lineHeight: "1.08" }],
        "t-5xl": ["3.9rem", { lineHeight: "1.05" }],
        "t-6xl": ["5rem", { lineHeight: "1" }],
      },
      fontWeight: {
        light: "300",
        normal: "400",
        medium: "500",
        semibold: "600",
        bold: "700",
        extrabold: "800",
        black: "900",
      },
      textShadow: {
        // Black outline effects — pure black strokes at increasing radii.
        // Use on white/light text over photographic or colourful backgrounds.
        // text-shadow-border05 → text-shadow-border1 → border2 → border3 (thicker each step)
        border05:
          "rgb(0,0,0) 0.5px 0px 0px, rgb(0,0,0) 0.270151px 0.420735px 0px, rgb(0,0,0) -0.208073px 0.454649px 0px, rgb(0,0,0) -0.494996px 0.07056px 0px, rgb(0,0,0) -0.326822px -0.378401px 0px, rgb(0,0,0) 0.141831px -0.479462px 0px, rgb(0,0,0) 0.480085px -0.139708px 0px",
        border1:
          "rgb(0, 0, 0) 1px 0px 0px, rgb(0, 0, 0) 0.540302px 0.841471px 0px, rgb(0, 0, 0) -0.416147px 0.909297px 0px, rgb(0, 0, 0) -0.989992px 0.14112px 0px, rgb(0, 0, 0) -0.653644px -0.756802px 0px, rgb(0, 0, 0) 0.283662px -0.958924px 0px, rgb(0, 0, 0) 0.96017px -0.279415px 0px",
        border2:
          "rgb(0, 0, 0) 2px 0px 0px, rgb(0, 0, 0) 1.75517px 0.958851px 0px, rgb(0, 0, 0) 1.0806px 1.68294px 0px, rgb(0, 0, 0) 0.141474px 1.99499px 0px, rgb(0, 0, 0) -0.832294px 1.81859px 0px, rgb(0, 0, 0) -1.60229px 1.19694px 0px, rgb(0, 0, 0) -1.97998px 0.28224px 0px, rgb(0, 0, 0) -1.87291px -0.701566px 0px, rgb(0, 0, 0) -1.30729px -1.5136px 0px, rgb(0, 0, 0) -0.421592px -1.95506px 0px, rgb(0, 0, 0) 0.567324px -1.91785px 0px, rgb(0, 0, 0) 1.41734px -1.41108px 0px, rgb(0, 0, 0) 1.92034px -0.558831px 0px",
        border3:
          "rgb(0, 0, 0) 3px 0px 0px, rgb(0, 0, 0) 2.83487px 0.981584px 0px, rgb(0, 0, 0) 2.35766px 1.85511px 0px, rgb(0, 0, 0) 1.62091px 2.52441px 0px, rgb(0, 0, 0) 0.705713px 2.91581px 0px, rgb(0, 0, 0) -0.287171px 2.98622px 0px, rgb(0, 0, 0) -1.24844px 2.72789px 0px, rgb(0, 0, 0) -2.07227px 2.16926px 0px, rgb(0, 0, 0) -2.66798px 1.37182px 0px, rgb(0, 0, 0) -2.96998px 0.42336px 0px, rgb(0, 0, 0) -2.94502px -0.571704px 0px, rgb(0, 0, 0) -2.59586px -1.50383px 0px, rgb(0, 0, 0) -1.96093px -2.27041px 0px, rgb(0, 0, 0) -1.11013px -2.78704px 0px, rgb(0, 0, 0) -0.137119px -2.99686px 0px, rgb(0, 0, 0) 0.850987px -2.87677px 0px, rgb(0, 0, 0) 1.74541px -2.43999px 0px, rgb(0, 0, 0) 2.44769px -1.73459px 0px, rgb(0, 0, 0) 2.88051px -0.838247px 0px",
        glow: "0 0 10px var(--primary-soft, rgba(249,115,22,0.5))",
        "glow-lg": "0 0 20px var(--primary-soft, rgba(249,115,22,0.4))",
      },
      boxShadow: {
        // ── Taxi (SmartRotom) elevation — theme-dependent, see `.tx-app` ────
        "tx-1": "var(--tx-shadow-1)",
        "tx-2": "var(--tx-shadow-2)",
        "tx-glow": "0 8px 22px var(--tx-accent-glow)",
        left: "-5px 0px 10px 2px rgba(33, 33, 33, 0.3)",
        right: "5px 0px 10px 2px rgba(33, 33, 33, 0.3)",
        light: "4px 4px 0px 0px #000",
        dark: "4px 4px 0px 2px #000",
        glow: "0 0 20px var(--primary-soft, rgba(249,115,22,0.3))",
        "glow-lg": "0 0 40px var(--primary-soft, rgba(249,115,22,0.2))",
        "inner-glow": "inset 0 0 20px var(--primary-soft, rgba(249,115,22,0.1))",
        elevated: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        "elevated-lg": "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        // Neon direction shadows
        "neon-card": "0 24px 60px -28px var(--shadow-color, rgba(0,0,0,0.55)), inset 0 1px 0 rgba(255,255,255,0.05)",
        "neon-card-hover": "0 30px 70px -26px var(--shadow-color, rgba(0,0,0,0.55)), inset 0 1px 0 rgba(255,255,255,0.08)",
        "neon-btn": "0 8px 24px -8px var(--accent-color, #06b6d4)",
        "neon-toast": "0 24px 50px -20px var(--shadow-color, rgba(0,0,0,0.55))",
        "neon-modal": "0 40px 90px -30px var(--shadow-color, rgba(0,0,0,0.55))",
        "neon-popover": "0 24px 50px -20px var(--shadow-color, rgba(0,0,0,0.55))",
        // ── Starbank (SmartRotom) — fintech elevation ───────────────────────
        // Var-backed: dark needs its own shadows (a hairline tuned for white cards
        // is invisible on navy), so `--sb-sh-1..3` are swapped by the `.sb-app`
        // base layer below. Brand + focus are constant across themes.
        "sb-1": "var(--sb-sh-1)",
        "sb-2": "var(--sb-sh-2)",
        "sb-3": "var(--sb-sh-3)",
        "sb-brand": "var(--sb-sh-brand)",
        "sb-focus": "var(--sb-sh-focus)",
        // ChatApp (SmartRotom) — bubble/menu elevation (theme-var backed).
        "ca-bubble": "var(--ca-bubble-shadow)",
        "ca-pop": "0 16px 44px -10px rgb(0 0 0 / .4)",
        "ca-modal": "0 30px 70px -20px rgb(0 0 0 / .6)",
        // ── Pokédex (SmartRotom) — dark/gaming elevation ────────────────────
        "pk-glow": "0 0 24px rgba(249,115,22,.25)",
        "pk-elevated": "0 8px 32px rgba(0,0,0,.4), 0 2px 8px rgba(0,0,0,.3)",
        "pk-inner": "inset 0 1px 0 rgba(255,255,255,.06), inset 0 -1px 0 rgba(0,0,0,.4)",
        // The reused inset "3D" highlight on chips / stat-bar fills / progress segs.
        "pk-chip": "inset 0 1px 0 rgba(255,255,255,.18), inset 0 -1px 0 rgba(0,0,0,.18)",
        // ── Mewtube + Mewtwitch (SmartRotom) — accent glow + media elevation ──
        // Glow tracks the per-app accent (`--mw-accent` triplet, red / purple).
        "mw-glow": "0 0 20px rgb(var(--mw-accent) / .35)",
        "mw-glow-lg": "0 0 40px rgb(var(--mw-accent) / .2)",
        "mw-card": "0 8px 30px -12px rgba(0,0,0,.6)",
        "mw-elevated": "0 20px 50px -20px rgba(0,0,0,.7)",
      },
      backdropBlur: {
        xs: "2px",
      },
      translate: {
        boxShadowX: "4px",
        boxShadowY: "4px",
        reverseBoxShadowX: "-4px",
        reverseBoxShadowY: "-4px",
      },
      colors: {
        // ════════════════════════════════════════════════════════════════════
        // STARBANK (SmartRotom) — blue-anchored fintech tokens. Light theme
        // baked as hex (dark/density are deferred; convert to CSS-var-backed
        // when those are wired). Namespaced `sb-*` so nothing collides with the
        // other design systems sharing this config. Categoricals are colours so
        // `bg-sb-league/10 text-sb-league` gives the 10%-tint chip pattern.
        // ════════════════════════════════════════════════════════════════════
        sb: {
          // CSS-var backed (values in the `.sb-app` base layer below) so the handoff's
          // `[data-theme="dark"]` really swaps. Solid colours are RGB triplets, which is
          // what keeps the alpha modifier working — `bg-sb-league/10 text-sb-league` is
          // the categorical chip pattern and would break under a plain `var()`.
          50: "rgb(var(--sb-50) / <alpha-value>)",
          100: "rgb(var(--sb-100) / <alpha-value>)",
          200: "rgb(var(--sb-200) / <alpha-value>)",
          300: "rgb(var(--sb-300) / <alpha-value>)",
          400: "rgb(var(--sb-400) / <alpha-value>)",
          500: "rgb(var(--sb-500) / <alpha-value>)",
          600: "rgb(var(--sb-600) / <alpha-value>)",
          700: "rgb(var(--sb-700) / <alpha-value>)",
          800: "rgb(var(--sb-800) / <alpha-value>)",
          900: "rgb(var(--sb-900) / <alpha-value>)",
          950: "rgb(var(--sb-950) / <alpha-value>)",
          // surfaces
          bg: "rgb(var(--sb-bg) / <alpha-value>)",
          "bg-grid": "rgb(var(--sb-bg-grid) / <alpha-value>)",
          surface: "rgb(var(--sb-surface) / <alpha-value>)",
          "surface-2": "rgb(var(--sb-surface-2) / <alpha-value>)",
          "surface-3": "rgb(var(--sb-surface-3) / <alpha-value>)",
          border: "rgb(var(--sb-border) / <alpha-value>)",
          "border-strong": "rgb(var(--sb-border-strong) / <alpha-value>)",
          ring: "rgb(var(--sb-ring) / <alpha-value>)",
          // text
          fg: "rgb(var(--sb-fg) / <alpha-value>)",
          "fg-2": "rgb(var(--sb-fg-2) / <alpha-value>)",
          "fg-muted": "rgb(var(--sb-fg-muted) / <alpha-value>)",
          "fg-subtle": "rgb(var(--sb-fg-subtle) / <alpha-value>)",
          onbrand: "rgb(var(--sb-onbrand) / <alpha-value>)",
          // semantic — the `-soft` tints are solid in light but ALPHA in dark
          // (rgba over navy), so they stay plain vars: no alpha modifier on them.
          pos: "rgb(var(--sb-pos) / <alpha-value>)",
          "pos-2": "rgb(var(--sb-pos-2) / <alpha-value>)",
          "pos-soft": "var(--sb-pos-soft)",
          neg: "rgb(var(--sb-neg) / <alpha-value>)",
          "neg-2": "rgb(var(--sb-neg-2) / <alpha-value>)",
          "neg-soft": "var(--sb-neg-soft)",
          warn: "rgb(var(--sb-warn) / <alpha-value>)",
          "warn-soft": "var(--sb-warn-soft)",
          info: "rgb(var(--sb-info) / <alpha-value>)",
          "info-soft": "var(--sb-info-soft)",
          // categorical — constant across themes
          league: "rgb(var(--sb-league) / <alpha-value>)",
          shop: "rgb(var(--sb-shop) / <alpha-value>)",
          heal: "rgb(var(--sb-heal) / <alpha-value>)",
          transfer: "rgb(var(--sb-transfer) / <alpha-value>)",
          reward: "rgb(var(--sb-reward) / <alpha-value>)",
          fee: "rgb(var(--sb-fee) / <alpha-value>)",
          subscription: "rgb(var(--sb-subscription) / <alpha-value>)",
          other: "rgb(var(--sb-other) / <alpha-value>)",
        },

        // ════════════════════════════════════════════════════════════════════
        // CHATAPP (SmartRotom) — WhatsApp-style messaging tokens. REAL light/dark
        // + accent (CSS-var backed, swapped by `data-theme` / a runtime
        // `--ca-accent` triplet on the `.ca-app` root; see the ChatApp base-layer
        // plugin below). Wallpaper/bubble/density/font are baked. Namespaced
        // `ca-*` so nothing collides with the other systems sharing this config.
        // Alpha works: `bg-ca-accent/14`, `text-ca-500`, `bg-ca-panel`.
        // ════════════════════════════════════════════════════════════════════
        ca: {
          // neutral surface ramp (inverts light↔dark)
          50: "rgb(var(--ca-50) / <alpha-value>)",
          100: "rgb(var(--ca-100) / <alpha-value>)",
          200: "rgb(var(--ca-200) / <alpha-value>)",
          300: "rgb(var(--ca-300) / <alpha-value>)",
          400: "rgb(var(--ca-400) / <alpha-value>)",
          500: "rgb(var(--ca-500) / <alpha-value>)",
          600: "rgb(var(--ca-600) / <alpha-value>)",
          700: "rgb(var(--ca-700) / <alpha-value>)",
          800: "rgb(var(--ca-800) / <alpha-value>)",
          900: "rgb(var(--ca-900) / <alpha-value>)",
          950: "rgb(var(--ca-950) / <alpha-value>)",
          // semantic surfaces
          panel: "rgb(var(--ca-panel) / <alpha-value>)",
          header: "rgb(var(--ca-header) / <alpha-value>)",
          "search-bg": "rgb(var(--ca-search-bg) / <alpha-value>)",
          "input-bg": "rgb(var(--ca-input-bg) / <alpha-value>)",
          "bubble-in": "rgb(var(--ca-bubble-in) / <alpha-value>)",
          "bubble-in-text": "rgb(var(--ca-bubble-in-text) / <alpha-value>)",
          "bubble-out-text": "rgb(var(--ca-bubble-out-text) / <alpha-value>)",
          "bubble-out": "var(--ca-bubble-out)", // accent-derived (color-mix)
          wallpaper: "var(--ca-wallpaper-bg)",
          doodle: "var(--ca-doodle-color)",
          // brand accent (runtime-settable triplet) + derived soft
          accent: "rgb(var(--ca-accent) / <alpha-value>)",
          "on-accent": "rgb(var(--ca-on-accent) / <alpha-value>)",
          "accent-soft": "var(--ca-accent-soft)",
          // status
          online: "rgb(var(--ca-online) / <alpha-value>)",
          "tick-read": "rgb(var(--ca-tick-read) / <alpha-value>)",
          highlight: "rgb(var(--ca-highlight) / <alpha-value>)",
          info: "rgb(var(--ca-info) / <alpha-value>)",
          error: "rgb(var(--ca-error) / <alpha-value>)",
          warning: "rgb(var(--ca-warning) / <alpha-value>)",
        },

        // Notes (SmartRotom) — linked-notes surfaces + text + runtime accent,
        // all CSS-var-backed for real dark(default)/light theming. Values live in
        // the `.nt-app` base-layer plugin below. `--nt-accent`/`--nt-accent-fg`
        // are runtime-settable triplets (the tweaks accent picker sets them
        // inline on the root). Category hues (nt-c-*) are theme-independent and
        // drive folder/tag colours.
        nt: {
          // orange brand ramp (constant)
          50: "rgb(var(--nt-50) / <alpha-value>)",
          100: "rgb(var(--nt-100) / <alpha-value>)",
          200: "rgb(var(--nt-200) / <alpha-value>)",
          300: "rgb(var(--nt-300) / <alpha-value>)",
          400: "rgb(var(--nt-400) / <alpha-value>)",
          500: "rgb(var(--nt-500) / <alpha-value>)",
          600: "rgb(var(--nt-600) / <alpha-value>)",
          700: "rgb(var(--nt-700) / <alpha-value>)",
          800: "rgb(var(--nt-800) / <alpha-value>)",
          900: "rgb(var(--nt-900) / <alpha-value>)",
          950: "rgb(var(--nt-950) / <alpha-value>)",
          // category hues (constant) — folders + tags
          "c-primary": "rgb(var(--nt-c-primary) / <alpha-value>)",
          "c-secondary": "rgb(var(--nt-c-secondary) / <alpha-value>)",
          "c-accent": "rgb(var(--nt-c-accent) / <alpha-value>)",
          "c-success": "rgb(var(--nt-c-success) / <alpha-value>)",
          "c-warning": "rgb(var(--nt-c-warning) / <alpha-value>)",
          "c-error": "rgb(var(--nt-c-error) / <alpha-value>)",
          "c-info": "rgb(var(--nt-c-info) / <alpha-value>)",
          // surfaces (theme-dependent)
          bg: "rgb(var(--nt-bg) / <alpha-value>)",
          "bg-1": "rgb(var(--nt-bg-1) / <alpha-value>)",
          "bg-2": "rgb(var(--nt-bg-2) / <alpha-value>)",
          panel: "rgb(var(--nt-panel) / <alpha-value>)",
          "panel-2": "rgb(var(--nt-panel-2) / <alpha-value>)",
          elevated: "rgb(var(--nt-elevated) / <alpha-value>)",
          doc: "rgb(var(--nt-doc) / <alpha-value>)",
          // alpha-based surfaces (full colours)
          hover: "var(--nt-hover)",
          "hover-strong": "var(--nt-hover-strong)",
          border: "var(--nt-border)",
          "border-2": "var(--nt-border-2)",
          // text
          fg: "rgb(var(--nt-fg) / <alpha-value>)",
          "fg-muted": "rgb(var(--nt-fg-muted) / <alpha-value>)",
          "fg-subtle": "rgb(var(--nt-fg-subtle) / <alpha-value>)",
          // brand accent (runtime-settable) + status
          accent: "rgb(var(--nt-accent) / <alpha-value>)",
          "accent-fg": "rgb(var(--nt-accent-fg) / <alpha-value>)",
          "on-accent": "rgb(var(--nt-on-accent) / <alpha-value>)",
          success: "rgb(var(--nt-c-success) / <alpha-value>)",
          warning: "rgb(var(--nt-c-warning) / <alpha-value>)",
          error: "rgb(var(--nt-c-error) / <alpha-value>)",
        },

        // ── Taxi (SmartRotom) · "Teras Transit" ─────────────────────────────
        // Blue structure, yellow money: the blue ramp carries every structural
        // affordance (pins, player, routes) and stays fixed across themes, while
        // the amber accent is reserved for money and the one primary action per
        // surface. Backed by `.tx-app[data-theme]` — real light + dark.
        tx: {
          // canvas + map field (theme-dependent)
          bg: "rgb(var(--tx-bg-0) / <alpha-value>)",
          "bg-1": "rgb(var(--tx-bg-1) / <alpha-value>)",
          field: "rgb(var(--tx-field) / <alpha-value>)",
          // surfaces — the two translucent ones are alpha-composited over the
          // canvas, so they stay full colours rather than triplets.
          surface: "var(--tx-surface)",
          "surface-2": "var(--tx-surface-2)",
          "surface-solid": "rgb(var(--tx-surface-solid) / <alpha-value>)",
          "surface-raise": "rgb(var(--tx-surface-raise) / <alpha-value>)",
          line: "var(--tx-line)",
          "line-2": "var(--tx-line-2)",
          // ink ramp
          txt: "rgb(var(--tx-txt) / <alpha-value>)",
          "txt-2": "var(--tx-txt-2)",
          "txt-3": "var(--tx-txt-3)",
          // structural blue (constant — identical in both themes)
          "blue-300": "rgb(var(--tx-blue-300) / <alpha-value>)",
          "blue-400": "rgb(var(--tx-blue-400) / <alpha-value>)",
          "blue-500": "rgb(var(--tx-blue-500) / <alpha-value>)",
          "blue-600": "rgb(var(--tx-blue-600) / <alpha-value>)",
          "blue-700": "rgb(var(--tx-blue-700) / <alpha-value>)",
          "blue-ink": "rgb(var(--tx-blue-ink) / <alpha-value>)",
          // money accent (runtime-settable triplet; soft/glow follow it)
          accent: "rgb(var(--tx-accent) / <alpha-value>)",
          "accent-deep": "var(--tx-accent-deep)",
          "accent-soft": "var(--tx-accent-soft)",
          "accent-glow": "var(--tx-accent-glow)",
          "on-accent": "rgb(var(--tx-on-accent) / <alpha-value>)",
          money: "rgb(var(--tx-money) / <alpha-value>)",
          // status
          ok: "rgb(var(--tx-ok) / <alpha-value>)",
          "ok-soft": "var(--tx-ok-soft)",
          no: "rgb(var(--tx-no) / <alpha-value>)",
          "no-soft": "var(--tx-no-soft)",
          // map pin chrome (a pin sits on the field, not on a surface)
          "pin-bg": "var(--tx-pin-bg)",
          "pin-ink": "rgb(var(--tx-pin-ink) / <alpha-value>)",
          scrim: "var(--tx-scrim)",
        },

        // ════════════════════════════════════════════════════════════════════
        // LEGACY (Neon/v2) TOKEN VOCABULARY — @deprecated for Boffmedia v3, do
        // NOT use in new Boffmedia code. `boffmedia-v2` is deleted, but these
        // tokens are still live infrastructure for the OTHER design systems that
        // share this one config: SmartRotom, wingull, and the shadcn-compat
        // `components/ui` layer (hundreds of consumers). Not prunable until those
        // migrate. The CURRENT Boffmedia v3 vocabulary is further down:
        // base/panel/line/txt/accent/ok/warn/bad/signal.
        // ════════════════════════════════════════════════════════════════════

        // Standard gray palette for compatibility
        gray: {
          50: "#f9fafb",
          100: "#f3f4f6",
          200: "#e5e7eb",
          300: "#d1d5db",
          400: "#9ca3af",
          500: "#6b7280",
          600: "#4b5563",
          700: "#374151",
          800: "#1f2937",
          850: "#141b28",
          900: "#111827",
          950: "#030712",
        },

        // ── Semantic surface layers ───────────────────────────────────────────
        // bg-base, bg-layer-1, bg-layer-2, bg-layer-3
        // from-layer-1, to-layer-2, ring-offset-layer-1, etc.
        base:      "var(--bg)",
        "layer-1": "var(--layer-1)",
        "layer-2": "var(--layer-2)",
        "layer-3": "var(--layer-3)",

        // ── Brand: primary (orange) ───────────────────────────────────────────
        // bg-primary, bg-primary-hover, bg-primary-active, bg-primary-soft, bg-primary-on
        // text-primary, text-primary-hover, border-primary, etc.
        primary: {
          DEFAULT: "var(--primary)",
          hover:   "var(--primary-hover)",
          active:  "var(--primary-active)",
          soft:    "var(--primary-soft)",
          on:      "var(--on-primary)",
        },

        // ── Brand: secondary (cyan) ───────────────────────────────────────────
        secondary: {
          DEFAULT: "var(--secondary)",
          hover:   "var(--secondary-hover)",
          active:  "var(--secondary-active)",
          soft:    "var(--secondary-soft)",
          on:      "var(--on-secondary)",
        },

        // ── Semantic status ───────────────────────────────────────────────────
        success: {
          DEFAULT: "var(--success)",
          hover:   "var(--success-hover)",
          soft:    "var(--success-soft)",
          border:  "var(--success-border)",
          on:      "var(--on-success)",
        },
        warning: {
          DEFAULT: "var(--warning)",
          hover:   "var(--warning-hover)",
          soft:    "var(--warning-soft)",
          border:  "var(--warning-border)",
          on:      "var(--on-warning)",
        },
        danger: {
          DEFAULT: "var(--danger)",
          hover:   "var(--danger-hover)",
          soft:    "var(--danger-soft)",
          border:  "var(--danger-border)",
          on:      "var(--on-danger)",
        },
        info: {
          DEFAULT: "var(--info)",
          hover:   "var(--info-hover)",
          soft:    "var(--info-soft)",
          border:  "var(--info-border)",
          on:      "var(--on-info)",
        },

        // ── Typography ────────────────────────────────────────────────────────
        // text-ink, text-ink-muted, text-ink-dim
        ink: {
          DEFAULT: "var(--text)",
          muted:   "var(--text-muted)",
          dim:     "var(--text-dim)",
        },

        // ── Borders ───────────────────────────────────────────────────────────
        // border-edge, border-edge-strong, border-edge-divider
        edge: {
          DEFAULT: "var(--border)",
          strong:  "var(--border-strong)",
          divider: "var(--divider)",
        },

        // ── Chart palette ─────────────────────────────────────────────────────
        // bg-chart-1 … bg-chart-8
        chart: {
          1: "var(--chart-1)",
          2: "var(--chart-2)",
          3: "var(--chart-3)",
          4: "var(--chart-4)",
          5: "var(--chart-5)",
          6: "var(--chart-6)",
          7: "var(--chart-7)",
          8: "var(--chart-8)",
        },

        // ── Interaction tokens ────────────────────────────────────────────────
        "row-hover":    "var(--row-hover)",
        "row-selected": "var(--row-selected)",
        skeleton:       "var(--skeleton)",
        scrim:          "var(--scrim)",
        backdrop:       "var(--backdrop)",
        "image-overlay": "var(--image-overlay)",
        glass: {
          DEFAULT: "var(--glass)",
          border:  "var(--glass-border)",
        },

        // ── Badge state colors ────────────────────────────────────────────────
        // bg-badge-live, bg-badge-draft, etc.
        badge: {
          live:       "var(--badge-live)",
          draft:      "var(--badge-draft)",
          archived:   "var(--badge-archived)",
          processing: "var(--badge-processing)",
          paused:     "var(--badge-paused)",
        },

        // ── Code blocks ───────────────────────────────────────────────────────
        // bg-code, border-code-border, text-syntax-keyword, etc.
        code: {
          DEFAULT: "var(--code-bg)",
          border:  "var(--code-border)",
        },
        syntax: {
          keyword: "var(--syntax-keyword)",
          string:  "var(--syntax-string)",
          number:  "var(--syntax-number)",
          comment: "var(--syntax-comment)",
        },

        // ── Shadcn/ui compatibility — namespaced to avoid collision ───────────
        border: "hsl(var(--ui-border))",
        input: "hsl(var(--ui-input))",
        ring: "hsl(var(--ui-ring))",
        background: "hsl(var(--ui-background))",
        foreground: "hsl(var(--ui-foreground))",
        destructive: {
          DEFAULT: "hsl(var(--ui-destructive))",
          foreground: "hsl(var(--ui-destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--ui-muted))",
          foreground: "hsl(var(--ui-muted-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--ui-popover))",
          foreground: "hsl(var(--ui-popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--ui-card))",
          foreground: "hsl(var(--ui-card-foreground))",
        },

        // ════════════════════════════════════════════════════════════════════
        // BOFFMEDIA V3 — CURRENT TOKEN VOCABULARY. Use these in all new code:
        // surfaces base/base-2/base-deep/panel · hairlines line · text txt
        // brand accent · status ok/warn/bad/signal.
        // ════════════════════════════════════════════════════════════════════

        // ── Surfaces ──────────────────────────────────────────────────────────
        // bg-base (already defined → --bg), bg-base-2, bg-base-deep
        "base-2":    "var(--bg-2)",
        "base-deep": "var(--bg-deep)",
        panel: {
          DEFAULT: "var(--panel)",
          2:       "var(--panel-2)",
        },

        // ── Hairlines / borders ───────────────────────────────────────────────
        // border-line, border-line-2
        line: {
          DEFAULT: "var(--line)",
          2:       "var(--line-2)",
        },

        // ── Text ──────────────────────────────────────────────────────────────
        // text-txt, text-txt-muted, text-txt-dim
        txt: {
          DEFAULT: "var(--text)",
          muted:   "var(--muted)",
          dim:     "var(--dim)",
        },

        // ── Brand accent (orange) ─────────────────────────────────────────────
        // bg-accent, text-accent, bg-accent-soft, border-accent-line
        accent: {
          DEFAULT: "var(--accent)",
          bright:  "var(--accent-bright)",
          soft:    "var(--accent-soft)",
          line:    "var(--accent-line)",
          ink:     "var(--naranja-ink)",
        },

        // ── Status ────────────────────────────────────────────────────────────
        ok: {
          DEFAULT: "var(--ok)",
          soft:    "var(--ok-soft)",
        },
        warn: {
          DEFAULT: "var(--warn)",
          soft:    "var(--warn-soft)",
        },
        bad: {
          DEFAULT: "var(--bad)",
          soft:    "var(--bad-soft)",
        },
        signal: {
          DEFAULT: "var(--info)",
          soft:    "var(--info-soft)",
        },

        // ════════════════════════════════════════════════════════════════════
        // SMARTROTOM v3 CHROME — SmartRotom-owned vocabulary, structurally a
        // sibling of the Boffmedia v3 block above but a separate namespace so
        // the two design systems stay isolated (CLAUDE.md). Var-backed aliases
        // (see globals.css --sr-*) so the theme picker drives them for free.
        // Use with the shared geometry (cut/cut-corner/cut-tag) + font-display.
        // ════════════════════════════════════════════════════════════════════
        sr: {
          bg:        "var(--sr-bg)",
          panel:     "var(--sr-panel)",
          "panel-2": "var(--sr-panel-2)",
          line:      "var(--sr-line)",
          "line-2":  "var(--sr-line-2)",
          txt: {
            DEFAULT: "var(--sr-txt)",
            muted:   "var(--sr-txt-muted)",
            dim:     "var(--sr-txt-dim)",
          },
          accent: {
            DEFAULT: "var(--sr-accent)",
            bright:  "var(--sr-accent-bright)",
            soft:    "var(--sr-accent-soft)",
            line:    "var(--sr-accent-line)",
            ink:     "var(--sr-accent-ink)",
          },
          ok:   "var(--sr-ok)",
          warn: "var(--sr-warn)",
          bad:  "var(--sr-bad)",
        },
        // ════════════════════════════════════════════════════════════════════
        // POKÉDEX (SmartRotom) — dark/gaming palette. Values ported 1:1 from the
        // handoff styles.css (dark theme baked as hex). Namespaced `pk-*` so it
        // stays isolated from the other design systems sharing this config.
        // Per-type / status / rarity colours are DATA-DRIVEN and live as JS maps
        // in pokedex/_utils (applied via inline style), NOT here — a dynamic
        // `bg-pk-type-${t}` class can't be JIT-compiled (the f12 bug we're fixing).
        // ════════════════════════════════════════════════════════════════════
        pk: {
          primary: {
            50: "#fff7ed", 100: "#ffedd5", 200: "#fed7aa", 300: "#fdba74",
            400: "#fb923c", 500: "#f97316", 600: "#ea580c", 700: "#c2410c",
            800: "#9a3412", 900: "#7c2d12",
          },
          secondary: {
            300: "#67e8f9", 400: "#22d3ee", 500: "#06b6d4",
            600: "#0891b2", 700: "#0e7490", 900: "#164e63",
          },
          accent: {
            300: "#d8b4fe", 400: "#c084fc", 500: "#a855f7",
            600: "#9333ea", 900: "#4c1d95",
          },
          highlight: { 400: "#a3e635", 500: "#84cc16" },
          surface: {
            50: "#f9fbfd", 100: "#f2f6fa", 200: "#e4eaf2", 300: "#cdd7e3",
            400: "#97a6bb", 500: "#677790", 600: "#4a576e", 700: "#36415a",
            800: "#18212f", 900: "#0c1321", 950: "#030609",
          },
          success: "#10b981", warning: "#f59e0b", error: "#ef4444",
        },

        // ════════════════════════════════════════════════════════════════════
        // MEWTUBE + MEWTWITCH (SmartRotom) — media dual-accent tokens. Dark
        // canvas, ONE system, TWO accents: Mewtube red / Mewtwitch purple, plus
        // a warm-vs-cool surface ramp so each accent harmonizes. CSS-var backed
        // and swapped by `data-app` on the `.mw-app` root (see the mw base-layer
        // plugin below) — never a dynamic `bg-${x}` class (the G2 bug). Alpha
        // works: `bg-mw-accent/12`, `text-mw-fg-mute`, `bg-mw-800`.
        // ════════════════════════════════════════════════════════════════════
        mw: {
          bg:  "rgb(var(--mw-bg) / <alpha-value>)",
          900: "rgb(var(--mw-900) / <alpha-value>)",
          800: "rgb(var(--mw-800) / <alpha-value>)",
          700: "rgb(var(--mw-700) / <alpha-value>)",
          panel:    "var(--mw-panel)",
          "panel-2": "var(--mw-panel-2)",
          line:        "var(--mw-hairline)",
          "line-strong": "var(--mw-hairline-strong)",
          fg: {
            DEFAULT: "rgb(var(--mw-fg) / <alpha-value>)",
            mute:    "rgb(var(--mw-fg-mute) / <alpha-value>)",
            subtle:  "rgb(var(--mw-fg-subtle) / <alpha-value>)",
            faint:   "rgb(var(--mw-fg-faint) / <alpha-value>)",
          },
          accent: {
            DEFAULT: "rgb(var(--mw-accent) / <alpha-value>)",
            dark:    "var(--mw-accent-dark)",
            on:      "rgb(var(--mw-on-accent) / <alpha-value>)",
          },
          highlight: "rgb(var(--mw-highlight) / <alpha-value>)",
          secondary: "rgb(var(--mw-secondary) / <alpha-value>)",
          success:   "rgb(var(--mw-success) / <alpha-value>)",
          warning:   "rgb(var(--mw-warning) / <alpha-value>)",
          error:     "rgb(var(--mw-error) / <alpha-value>)",
          info:      "rgb(var(--mw-info) / <alpha-value>)",
        },
        // ════════════════════════════════════════════════════════════════════
        // Arcade (SmartRotom) — `ar-*`. Synthwave, dark-only: a deep violet void
        // lit by four neons. There is no light mode; the app ignores the theme
        // picker's mode entirely (SMARTROTOM_V3.md §2b — a single-mode app).
        // CSS-var backed (declared on `.ar-app`) rather than baked hex, because
        // the effect layer below — horizon, marquee, chrom, glows — has to read
        // the palette from inside plugin CSS. Alpha works: `bg-ar-cyan/12`.
        // The five neons are semantic *accents*, not a ramp: cyan = system/UI,
        // magenta = live/hot, violet = rare, amber = reward, lime = confirmed.
        // ════════════════════════════════════════════════════════════════════
        ar: {
          bg:       "rgb(var(--ar-bg) / <alpha-value>)",
          void:     "rgb(var(--ar-void) / <alpha-value>)",
          "void-2": "rgb(var(--ar-void-2) / <alpha-value>)",
          "void-3": "rgb(var(--ar-void-3) / <alpha-value>)",
          ink: {
            DEFAULT: "rgb(var(--ar-ink) / <alpha-value>)",
            dim:     "rgb(var(--ar-ink-dim) / <alpha-value>)",
            muted:   "rgb(var(--ar-ink-muted) / <alpha-value>)",
          },
          magenta: {
            DEFAULT: "rgb(var(--ar-magenta) / <alpha-value>)",
            2:       "rgb(var(--ar-magenta-2) / <alpha-value>)",
          },
          cyan: {
            DEFAULT: "rgb(var(--ar-cyan) / <alpha-value>)",
            2:       "rgb(var(--ar-cyan-2) / <alpha-value>)",
          },
          violet: {
            DEFAULT: "rgb(var(--ar-violet) / <alpha-value>)",
            2:       "rgb(var(--ar-violet-2) / <alpha-value>)",
          },
          amber:  "rgb(var(--ar-amber) / <alpha-value>)",
          lime:   "rgb(var(--ar-lime) / <alpha-value>)",
          danger: "rgb(var(--ar-danger) / <alpha-value>)",
          line:          "var(--ar-line)",
          "line-strong": "var(--ar-line-strong)",
          panel:         "var(--ar-panel)",
          "panel-2":     "var(--ar-panel-2)",
        },
        // ════════════════════════════════════════════════════════════════════
        // MISIONES (SmartRotom) — `ms-*`. The tavern quest board: a cork+wood
        // tablón holding parchment papers pinned with wax seals. Dark-only, one
        // palette (Pergamino) — the app ignores the theme picker's mode, like
        // Pokédex and Arcade (SMARTROTOM_V3.md §2b).
        // CSS-var backed (declared on `.ms-app`) rather than baked hex so the
        // paper/cork/wood component classes below can read the palette from
        // inside plugin CSS — and so the handoff's four alternate palettes
        // (Grimdark, Real, Bosque, Nocturno) are one extra addBase block, not a
        // refactor. Alpha works: `border-ms-ink-3/30`, `bg-ms-gold-2/12`.
        // The seal colours are STATUS-driven: they are applied through a literal
        // class map / SVG fill in `_utils/status.ts`, never `bg-ms-seal-${s}`.
        // ════════════════════════════════════════════════════════════════════
        ms: {
          board: {
            1:         "rgb(var(--ms-board-1) / <alpha-value>)",
            2:         "rgb(var(--ms-board-2) / <alpha-value>)",
            3:         "rgb(var(--ms-board-3) / <alpha-value>)",
            frame:     "rgb(var(--ms-board-frame) / <alpha-value>)",
            "frame-hi": "rgb(var(--ms-board-frame-hi) / <alpha-value>)",
          },
          paper: {
            1:    "rgb(var(--ms-paper-1) / <alpha-value>)",
            2:    "rgb(var(--ms-paper-2) / <alpha-value>)",
            3:    "rgb(var(--ms-paper-3) / <alpha-value>)",
            edge: "rgb(var(--ms-paper-edge) / <alpha-value>)",
          },
          ink: {
            1: "rgb(var(--ms-ink-1) / <alpha-value>)",
            2: "rgb(var(--ms-ink-2) / <alpha-value>)",
            3: "rgb(var(--ms-ink-3) / <alpha-value>)",
            4: "rgb(var(--ms-ink-4) / <alpha-value>)",
          },
          gold: {
            1: "rgb(var(--ms-gold-1) / <alpha-value>)",
            2: "rgb(var(--ms-gold-2) / <alpha-value>)",
            3: "rgb(var(--ms-gold-3) / <alpha-value>)",
            4: "rgb(var(--ms-gold-4) / <alpha-value>)",
          },
          seal: {
            active:    "rgb(var(--ms-seal-active) / <alpha-value>)",
            available: "rgb(var(--ms-seal-available) / <alpha-value>)",
            completed: "rgb(var(--ms-seal-completed) / <alpha-value>)",
            failed:    "rgb(var(--ms-seal-failed) / <alpha-value>)",
            locked:    "rgb(var(--ms-seal-locked) / <alpha-value>)",
          },
          stamp: {
            red:  "rgb(var(--ms-stamp-red) / <alpha-value>)",
            gold: "rgb(var(--ms-stamp-gold) / <alpha-value>)",
          },
        },
      },
      keyframes: {
        // Existing animations
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "float-wingull": {
          "0%, 100%": { transform: "translateY(0) rotate(-12deg)" },
          "50%": { transform: "translateY(-30px) rotate(5deg)" },
        },
        "bounce-spin": {
          "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
          "50%": { transform: "translateY(-20px) rotate(180deg)" },
        },
        // New enhanced animations
        appear: {
          "0%": { opacity: "0", transform: "scale(0.9)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-down": {
          "0%": { opacity: "0", transform: "translateY(-10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 5px var(--primary-soft, rgba(249,115,22,0.3))" },
          "50%": { boxShadow: "0 0 20px var(--primary-soft, rgba(249,115,22,0.6))" },
        },
        "k-shimmer": {
          from: { backgroundPosition: "200% 0" },
          to: { backgroundPosition: "-200% 0" },
        },
        "k-toast-in": {
          from: { opacity: "0", transform: "translateX(20px)" },
        },
        "k-fade": {
          from: { opacity: "0" },
        },
        "k-modal-in": {
          from: { opacity: "0", transform: "translateY(14px) scale(0.98)" },
        },
        "dd-in": {
          from: { opacity: "0", transform: "translateY(-6px)" },
        },
        "pulse-dot": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.3" },
        },
        // ── ChatApp (SmartRotom) ──────────────────────────────────────────
        "ca-bounce": {
          "0%, 60%, 100%": { transform: "translateY(0)", opacity: ".5" },
          "30%": { transform: "translateY(-4px)", opacity: "1" },
        },
        "ca-shimmer": {
          "0%": { backgroundPosition: "100% 0" },
          "100%": { backgroundPosition: "-100% 0" },
        },
        "ca-pop": { from: { opacity: "0", transform: "translateY(8px) scale(.98)" } },
        "ca-fade": { from: { opacity: "0" } },
        "ca-modal-in": { from: { opacity: "0", transform: "translateY(14px) scale(.98)" } },
        "ca-slide-in": { from: { opacity: "0", transform: "translateX(20px)" } },
        // ── Pokédex (SmartRotom) ──────────────────────────────────────────
        "pk-drop-in": { from: { opacity: "0", transform: "translateY(-6px)" } },
        "pk-fade-up": { from: { opacity: "0", transform: "translateY(6px)" } },
        // ── Mewtube + Mewtwitch (SmartRotom) ──────────────────────────────
        "mw-fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        // Live-pill white dot: expanding ring.
        "mw-ping-white": {
          "0%": { boxShadow: "0 0 0 0 rgba(255,255,255,.7)" },
          "70%": { boxShadow: "0 0 0 6px rgba(255,255,255,0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(255,255,255,0)" },
        },
        // Viewer / live dot: expanding ring in the per-app accent.
        "mw-ping": {
          "0%": { boxShadow: "0 0 0 0 rgb(var(--mw-accent) / .6)" },
          "70%": { boxShadow: "0 0 0 8px rgb(var(--mw-accent) / 0)" },
          "100%": { boxShadow: "0 0 0 0 rgb(var(--mw-accent) / 0)" },
        },
        // Sidebar live dot: opacity + scale breathe.
        "mw-blink": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: ".6", transform: "scale(.85)" },
        },
        // ── Arcade (SmartRotom) ───────────────────────────────────────────
        // Marquee wordmark: a neon gradient swept across clipped text.
        "ar-marquee": {
          "0%": { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "200% 50%" },
        },
        // Attract-mode blink. `steps(1)` at the call site on purpose — a CRT
        // cursor snaps, it does not fade.
        "ar-blink": {
          "0%, 55%": { opacity: "1" },
          "60%, 100%": { opacity: ".15" },
        },
        // Breathing cyan halo on the primary/active control.
        "ar-pulse": {
          "0%, 100%": {
            boxShadow: "0 0 0 0 rgb(var(--ar-cyan) / .35), inset 0 0 24px rgb(var(--ar-cyan) / .18)",
          },
          "50%": {
            boxShadow: "0 0 0 6px rgb(var(--ar-cyan) / 0), inset 0 0 38px rgb(var(--ar-cyan) / .28)",
          },
        },
        "ar-float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" },
        },
        // Expanding ring marking "today" / the winning tile.
        "ar-ring": {
          "0%": { transform: "scale(.9)", opacity: ".5" },
          "100%": { transform: "scale(1.6)", opacity: "0" },
        },
        // The reward "moment": card pop, shockwave, particle burst.
        "ar-pop": {
          "0%": { transform: "scale(.6)", opacity: "0" },
          "60%": { transform: "scale(1.06)", opacity: "1" },
          "100%": { transform: "scale(1)" },
        },
        "ar-celeb-ring": {
          "0%": { transform: "scale(.5)", opacity: ".7" },
          "100%": { transform: "scale(2.2)", opacity: "0" },
        },
        // `--ar-dx`/`--ar-dy` are set per particle inline — a data-driven value,
        // the sanctioned inline-style case (SMARTROTOM_V3.md §6).
        "ar-particle": {
          "0%": { transform: "translate(0, 0) scale(1)", opacity: "1" },
          "100%": { transform: "translate(var(--ar-dx, 0), var(--ar-dy, 0)) scale(0)", opacity: "0" },
        },
        "ar-skeleton": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        // ── Taxi (SmartRotom) ─────────────────────────────────────────────
        // Route beam: the dashed stroke crawls from player to destination.
        // 13 = the dash period (2 + 11) — any other value makes it stutter.
        "tx-beam": { to: { strokeDashoffset: "-13" } },
        // Player marker: sonar ping expanding out of the core.
        "tx-ping": {
          "0%": { transform: "scale(.5)", opacity: ".5" },
          "100%": { transform: "scale(1.7)", opacity: "0" },
        },
        "tx-card-in": {
          from: { opacity: "0", transform: "translateY(14px) scale(.98)" },
          to: { opacity: "1", transform: "none" },
        },
        "tx-sheet-up": {
          from: { opacity: "0", transform: "translateY(60px)" },
          to: { opacity: "1", transform: "none" },
        },
        "tx-toast-in": {
          from: { opacity: "0", transform: "translate(-50%, -24px)" },
          to: { opacity: "1", transform: "translate(-50%, 0)" },
        },
        "tx-fade": { from: { opacity: "0" }, to: { opacity: "1" } },
        // Teleport progress bar — fills once, then holds.
        "tx-load": { from: { width: "6%" }, to: { width: "100%" } },
        // ── Misiones (SmartRotom) ─────────────────────────────────────────
        // The parchment blocks are written in, not faded in: staggered delays
        // on `ms-fade-up` read as ink appearing line by line.
        "ms-fade-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "none" },
        },
        // The COMPLETADA stamp is struck: it falls from 2.4× with a blur and
        // overshoots before settling.
        "ms-stamp-down": {
          "0%": { transform: "rotate(-14deg) scale(2.4)", opacity: "0", filter: "blur(2px)" },
          "60%": { transform: "rotate(-14deg) scale(1.05)", opacity: ".9", filter: "blur(0)" },
          "80%": { transform: "rotate(-14deg) scale(.96)", opacity: ".84" },
          "100%": { transform: "rotate(-14deg) scale(1)", opacity: ".84" },
        },
        "ms-spark": {
          "0%": { opacity: "0", transform: "scale(.4) translateY(0)" },
          "40%": { opacity: "1", transform: "scale(1) translateY(-6px)" },
          "100%": { opacity: "0", transform: "scale(.5) translateY(-16px)" },
        },
        "ms-slide-in": { from: { transform: "translateX(100%)" }, to: { transform: "none" } },
        "ms-hourglass": {
          "0%, 42%": { transform: "rotate(0deg)" },
          "50%, 92%": { transform: "rotate(180deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
      },
      animation: {
        // Existing animations
        "float-wingull": "float-wingull 8s ease-in-out infinite",
        "bounce-spin": "bounce-spin 6s ease-in-out infinite",
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        // Enhanced animations
        appear: "appear 0.3s ease-out",
        "fade-in": "fade-in 0.2s ease-out",
        "slide-up": "slide-up 0.3s ease-out",
        "slide-down": "slide-down 0.3s ease-out",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "k-shimmer": "k-shimmer 1.5s linear infinite",
        "k-toast-in": "k-toast-in 0.28s var(--ease)",
        "k-fade": "k-fade 0.2s var(--ease)",
        "k-modal-in": "k-modal-in 0.26s var(--ease)",
        "dd-in": "dd-in 0.16s var(--ease)",
        "pulse-dot": "pulse-dot 1.6s var(--ease) infinite",
        // ── ChatApp (SmartRotom) ──────────────────────────────────────────
        "ca-bounce": "ca-bounce 1s infinite",
        "ca-shimmer": "ca-shimmer 1.4s infinite",
        "ca-pop": "ca-pop 0.14s cubic-bezier(.2,.8,.3,1)",
        "ca-fade": "ca-fade 0.18s ease",
        "ca-modal-in": "ca-modal-in 0.2s cubic-bezier(.2,.8,.3,1)",
        "ca-slide-in": "ca-slide-in 0.24s ease",
        // ── Pokédex (SmartRotom) ──────────────────────────────────────────
        "pk-drop-in": "pk-drop-in 0.18s cubic-bezier(.16,1,.3,1)",
        "pk-fade-up": "pk-fade-up 0.25s cubic-bezier(.16,1,.3,1)",
        // ── Mewtube + Mewtwitch (SmartRotom) ──────────────────────────────
        "mw-fade-in": "mw-fade-in 0.3s cubic-bezier(.2,.7,.2,1)",
        "mw-ping-white": "mw-ping-white 1.5s ease-in-out infinite",
        "mw-ping": "mw-ping 1.5s ease-in-out infinite",
        "mw-blink": "mw-blink 1.6s ease-in-out infinite",
        // ── Arcade (SmartRotom) ───────────────────────────────────────────
        "ar-marquee": "ar-marquee 6s linear infinite",
        "ar-blink": "ar-blink 1.05s steps(1) infinite",
        "ar-pulse": "ar-pulse 2.4s ease-in-out infinite",
        "ar-float": "ar-float 4s ease-in-out infinite",
        "ar-ring": "ar-ring 1.6s ease-out infinite",
        "ar-pop": "ar-pop .5s cubic-bezier(.2,.9,.2,1)",
        "ar-celeb-ring": "ar-celeb-ring 1.3s ease-out infinite",
        "ar-particle": "ar-particle 1s ease-out forwards",
        "ar-skeleton": "ar-skeleton 1.4s ease-in-out infinite",
        // ── Taxi (SmartRotom) ─────────────────────────────────────────────
        "tx-beam": "tx-beam 0.7s linear infinite",
        "tx-ping": "tx-ping 1.9s cubic-bezier(.22,1,.36,1) infinite",
        "tx-card-in": "tx-card-in 0.32s cubic-bezier(.22,1,.36,1)",
        "tx-sheet-up": "tx-sheet-up 0.34s cubic-bezier(.22,1,.36,1)",
        "tx-toast-in": "tx-toast-in 0.4s cubic-bezier(.22,1,.36,1)",
        "tx-fade": "tx-fade 0.22s ease",
        "tx-load": "tx-load 1.7s cubic-bezier(.22,1,.36,1) forwards",
        // ── Misiones (SmartRotom) ─────────────────────────────────────────
        "ms-fade-up": "ms-fade-up 0.35s ease both",
        "ms-stamp-down": "ms-stamp-down 0.5s cubic-bezier(.34,1.56,.64,1) both",
        "ms-spark": "ms-spark 3s ease-in-out infinite",
        "ms-slide-in": "ms-slide-in 0.32s cubic-bezier(.16,1,.3,1)",
        "ms-hourglass": "ms-hourglass 4s ease-in-out infinite",
      },
      transitionTimingFunction: {
        "pk-out": "cubic-bezier(.16, 1, .3, 1)",
        "pk-spring": "cubic-bezier(.34, 1.56, .64, 1)",
        // The Taxi handoff's single easing curve (`--ease`).
        tx: "cubic-bezier(.22, 1, .36, 1)",
      },
      spacing: {
        18: "4.5rem",
        88: "22rem",
        128: "32rem",
      },
      borderRadius: {
        "4xl": "2rem",
        "neon": "14px",
        "neon-lg": "22px",
        "neon-pill": "9999px",
        // ── Starbank (SmartRotom) radii ─────────────────────────────────────
        "sb-xs": "6px",
        "sb-sm": "10px",
        "sb-md": "14px",
        "sb-lg": "18px",
        "sb-xl": "24px",
        "sb-pill": "999px",
        // ── ChatApp (SmartRotom) radii ──────────────────────────────────────
        "ca-sm": "6px",
        "ca-md": "8px",
        "ca-lg": "12px",
        "ca-xl": "16px",
        "ca-2xl": "22px",
        // ── Pokédex (SmartRotom) radii ──────────────────────────────────────
        "pk-sm": "6px",
        "pk-md": "10px",
        "pk-lg": "14px",
        "pk-xl": "20px",
        "pk-2xl": "28px",
        "pk-pill": "999px",
        // ── Mewtube + Mewtwitch (SmartRotom) radii — handoff scale ──────────
        "mw-sm": "4px",   // radius-sm
        "mw-md": "6px",   // radius-md — buttons, inputs
        "mw-lg": "8px",   // radius-lg
        "mw-xl": "12px",  // radius-xl — small cards
        "mw-2xl": "16px", // radius-2xl — medium cards
        "mw-3xl": "24px", // radius-3xl — featured / hero cards
        "mw-pill": "999px",
        // ── Notes (SmartRotom) radii — handoff scale ───────────────────────
        "nt-sm": "6px",
        "nt-md": "9px",
        "nt-lg": "12px",
        "nt-xl": "16px",
        "nt-2xl": "22px",
        // ── Taxi (SmartRotom) radii — handoff scale ────────────────────────
        "tx-xs": "8px",
        "tx-sm": "11px",
        "tx-md": "14px",
        "tx-lg": "18px",
        "tx-xl": "24px",
        "tx-pill": "999px",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("tailwindcss-textshadow"),
    // ── Boffmedia v3 design system ─────────────────────────────────────────
    // Base heading treatment + shared geometry/label patterns, so pages get
    // the system look without repeating utility stacks. Scoped to the
    // `[data-ds="boffmedia"]` shell (set in `(boffmedia)/layout.tsx`) via
    // `:where()` so specificity stays at element level — any utility class on
    // a heading still wins.
    plugin(({ addBase, addComponents }) => {
      addBase({
        // Shared layout tokens (navbar height drives sticky offsets in the shells).
        ":root": {
          "--nav-h": "66px",
        },
        ':where([data-ds="boffmedia"]) :is(h1, h2, h3)': {
          fontFamily: "var(--font-display)",
          fontWeight: "800",
          fontStyle: "italic",
          textTransform: "uppercase",
          lineHeight: "0.92",
          letterSpacing: "-0.005em",
        },
        ':where([data-ds="boffmedia"]) :is(h1, h2, h3) em': {
          fontStyle: "italic",
          color: "transparent",
          WebkitTextStroke: "1.6px var(--accent)",
        },
        ':where([data-ds="boffmedia"]) :is(h4, h5, h6)': {
          fontFamily: "var(--font-display)",
          fontWeight: "700",
          textTransform: "uppercase",
          letterSpacing: "0.02em",
          lineHeight: "1.05",
        },
      })
      addComponents({
        // Diagonal cuts (size via --cut/--cut-lg tokens; override per-instance
        // with e.g. `[--cut:4px]`, `[--cut-tag:9px]`).
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
        // Page gutter — fluid width capped at 1280px with 40px gutters.
        ".wrap": {
          width: "100%",
          maxWidth: "1280px",
          marginInline: "auto",
          paddingInline: "2.5rem",
        },
        // Small uppercase mono label (dim). Color/size overridable by utilities.
        ".mono-label": {
          font: "600 11px/1 var(--font-mono)",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "var(--muted)",
        },
      })
    }),
    // ── Starbank (SmartRotom) theme layer ──────────────────────────────────
    // Real light/dark, ported 1:1 from the handoff's `:root` + `[data-theme="dark"]`.
    // Scoped to `.sb-app`; `data-theme` on that root swaps it (driven by the one
    // SmartRotom theme picker via `useRotomMode()`). The brand ramp, the categorical
    // accents and the focus/brand shadows are CONSTANT — the handoff overrides only
    // surfaces, text, the `-soft` tints and elevation.
    plugin(({ addBase }) => {
      const constant = {
        "--sb-50": "239 246 255", "--sb-100": "219 234 254", "--sb-200": "191 219 254",
        "--sb-300": "147 197 253", "--sb-400": "96 165 250", "--sb-500": "59 130 246",
        "--sb-600": "36 99 235", "--sb-700": "29 78 216", "--sb-800": "30 58 138",
        "--sb-900": "23 37 84", "--sb-950": "11 22 56",
        "--sb-ring": "36 99 235",
        "--sb-onbrand": "255 255 255",
        "--sb-pos": "4 120 87", "--sb-pos-2": "5 150 105",
        "--sb-neg": "185 28 28", "--sb-neg-2": "220 38 38",
        "--sb-warn": "180 83 9",
        "--sb-info": "29 78 216",
        "--sb-league": "36 99 235", "--sb-shop": "6 182 212", "--sb-heal": "236 72 153",
        "--sb-transfer": "139 92 246", "--sb-reward": "16 185 129", "--sb-fee": "148 163 184",
        "--sb-subscription": "245 158 11", "--sb-other": "100 116 139",
        "--sb-sh-brand": "0 14px 40px -16px rgba(36, 99, 235, .55)",
        "--sb-sh-focus": "0 0 0 3px rgba(36, 99, 235, .22)",
      }
      const light = {
        "--sb-bg": "243 246 252", "--sb-bg-grid": "234 240 250",
        "--sb-surface": "255 255 255", "--sb-surface-2": "247 250 255",
        "--sb-surface-3": "238 243 251",
        "--sb-border": "227 235 245", "--sb-border-strong": "201 214 236",
        "--sb-fg": "12 24 48", "--sb-fg-2": "44 58 85",
        "--sb-fg-muted": "91 107 133", "--sb-fg-subtle": "141 153 179",
        "--sb-pos-soft": "#e7f7ef", "--sb-neg-soft": "#fdecec",
        "--sb-warn-soft": "#fff5e0", "--sb-info-soft": "#e8f0ff",
        "--sb-sh-1": "0 1px 0 rgba(15, 30, 60, .04), 0 1px 2px rgba(15, 30, 60, .04)",
        "--sb-sh-2": "0 1px 0 rgba(15, 30, 60, .03), 0 6px 18px -8px rgba(15, 30, 60, .15)",
        "--sb-sh-3": "0 10px 30px -12px rgba(15, 30, 60, .25)",
      }
      const dark = {
        "--sb-bg": "7 17 42", "--sb-bg-grid": "10 23 52",
        "--sb-surface": "14 28 63", "--sb-surface-2": "17 35 73",
        "--sb-surface-3": "21 41 90",
        "--sb-border": "29 50 104", "--sb-border-strong": "39 64 126",
        "--sb-fg": "232 238 252", "--sb-fg-2": "194 204 228",
        "--sb-fg-muted": "148 163 196", "--sb-fg-subtle": "107 123 160",
        "--sb-pos-soft": "rgba(5, 150, 105, .15)", "--sb-neg-soft": "rgba(220, 38, 38, .18)",
        "--sb-warn-soft": "rgba(180, 83, 9, .2)", "--sb-info-soft": "rgba(29, 78, 216, .2)",
        "--sb-sh-1": "0 1px 0 rgba(0,0,0,.4), 0 1px 2px rgba(0,0,0,.4)",
        "--sb-sh-2": "0 1px 0 rgba(0,0,0,.4), 0 8px 24px -8px rgba(0,0,0,.55)",
        "--sb-sh-3": "0 14px 40px -14px rgba(0,0,0,.6)",
      }
      addBase({
        ".sb-app": { ...constant, ...light, colorScheme: "light" },
        '.sb-app[data-theme="dark"]': { ...dark, colorScheme: "dark" },
      })
    }),

    // ── ChatApp (SmartRotom) theme layer ───────────────────────────────────
    // Real light/dark + accent, scoped to the `.ca-app` root so it never leaks
    // into the rest of SmartRotom. `--ca-accent` is a runtime-settable RGB
    // triplet (an inline style on the root drives the accent picker); the soft
    // accent + outgoing-bubble tints are color-mixed off it per theme. Baked:
    // warm doodle wallpaper, tail bubbles, regular density, system font.
    plugin(({ addBase, addComponents }) => {
      const light = {
        "--ca-50": "17 27 33", "--ca-100": "31 44 52", "--ca-200": "59 74 84",
        "--ca-300": "84 101 111", "--ca-400": "102 119 129", "--ca-500": "134 150 160",
        "--ca-600": "174 186 193", "--ca-700": "209 215 219", "--ca-800": "240 242 245",
        "--ca-900": "255 255 255", "--ca-950": "255 255 255",
        "--ca-panel": "255 255 255", "--ca-header": "240 242 245",
        "--ca-search-bg": "255 255 255", "--ca-input-bg": "255 255 255",
        "--ca-bubble-in": "255 255 255", "--ca-bubble-in-text": "17 27 33",
        "--ca-bubble-out-text": "17 27 33",
        "--ca-bubble-out": "color-mix(in srgb, rgb(var(--ca-accent)) 20%, #ffffff)",
        "--ca-accent-soft": "color-mix(in srgb, rgb(var(--ca-accent)) 90%, black)",
        "--ca-wallpaper-bg": "#efeae2",
        "--ca-doodle-color": "rgba(86, 72, 53, .07)",
        "--ca-bubble-shadow": "0 1px .5px rgba(11,20,26,.13)",
      }
      const dark = {
        "--ca-50": "233 237 239", "--ca-100": "217 222 224", "--ca-200": "207 217 222",
        "--ca-300": "174 186 193", "--ca-400": "134 150 160", "--ca-500": "102 119 129",
        "--ca-600": "55 72 81", "--ca-700": "42 57 66", "--ca-800": "32 44 51",
        "--ca-900": "17 27 33", "--ca-950": "11 20 26",
        "--ca-panel": "17 27 33", "--ca-header": "32 44 51",
        "--ca-search-bg": "42 57 66", "--ca-input-bg": "42 57 66",
        "--ca-bubble-in": "31 44 51", "--ca-bubble-in-text": "233 237 239",
        "--ca-bubble-out-text": "233 237 239",
        "--ca-bubble-out": "color-mix(in srgb, rgb(var(--ca-accent)) 42%, #0b141a)",
        "--ca-accent-soft": "color-mix(in srgb, rgb(var(--ca-accent)) 68%, white)",
        "--ca-wallpaper-bg": "#0b141a",
        "--ca-doodle-color": "rgba(233, 237, 239, .045)",
        "--ca-bubble-shadow": "0 1px .5px rgba(0,0,0,.28)",
      }
      // Accent + status are theme-independent (default = WhatsApp green).
      const constant = {
        "--ca-accent": "0 168 132", "--ca-on-accent": "255 255 255",
        "--ca-online": "37 211 102", "--ca-tick-read": "83 189 235",
        "--ca-highlight": "37 211 102", "--ca-info": "53 145 235",
        "--ca-error": "240 84 84", "--ca-warning": "234 179 8",
        "--ca-t-fast": "120ms cubic-bezier(.4,0,.2,1)",
        "--ca-t-base": "200ms cubic-bezier(.4,0,.2,1)",
      }
      addBase({
        ".ca-app": { ...constant, ...light, colorScheme: "light" },
        '.ca-app[data-theme="dark"]': { ...dark, colorScheme: "dark" },
      })
      const doodle =
        "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Cg fill='none' stroke='%23000' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='40' cy='52' r='14'/%3E%3Ccircle cx='110' cy='30' r='3.4' fill='%23000' stroke='none'/%3E%3Cpath d='M174 56h16M182 48v16'/%3E%3Crect x='206' y='104' width='44' height='32' rx='11'/%3E%3Cpath d='M214 136l-4 9 11-5'/%3E%3Ccircle cx='70' cy='150' r='9'/%3E%3Cpath d='M126 128l22 22'/%3E%3Cpath d='M244 196l18 0-9 16z'/%3E%3Ccircle cx='40' cy='232' r='3.4' fill='%23000' stroke='none'/%3E%3Ccircle cx='150' cy='236' r='16'/%3E%3Cpath d='M250 36h16M258 28v16'/%3E%3Crect x='18' y='118' width='22' height='22' rx='7'/%3E%3Ccircle cx='212' cy='262' r='3.4' fill='%23000' stroke='none'/%3E%3Cpath d='M88 92l22-18'/%3E%3Ccircle cx='272' cy='150' r='8'/%3E%3Cpath d='M104 244h22M115 233v22'/%3E%3Ccircle cx='178' cy='160' r='3.4' fill='%23000' stroke='none'/%3E%3C/g%3E%3C/svg%3E\")"
      addComponents({
        // Repeating WhatsApp-style doodle wallpaper overlay (tinted by theme).
        ".ca-doodle": {
          backgroundColor: "var(--ca-doodle-color)",
          WebkitMaskImage: doodle, maskImage: doodle,
          WebkitMaskSize: "300px 300px", maskSize: "300px 300px",
          WebkitMaskRepeat: "repeat", maskRepeat: "repeat",
        },
        // Thin, theme-aware scrollbar (opt-in on scroll containers).
        ".ca-scroll": {
          scrollbarWidth: "thin",
          scrollbarColor: "rgb(var(--ca-500) / .55) transparent",
        },
        ".ca-scroll::-webkit-scrollbar": { width: "7px", height: "7px" },
        ".ca-scroll::-webkit-scrollbar-thumb": {
          background: "rgb(var(--ca-500) / .5)", borderRadius: "99px",
          border: "1.5px solid transparent", backgroundClip: "padding-box",
        },
        ".ca-scroll::-webkit-scrollbar-thumb:hover": { background: "rgb(var(--ca-500) / .8)" },
      })
    }),
    // ── Notes (SmartRotom) theme layer ─────────────────────────────────────
    // Real dark(default)/light + runtime accent, scoped to `.nt-app` so nothing
    // leaks into the rest of SmartRotom. `--nt-accent`/`--nt-accent-fg` are
    // runtime-settable RGB triplets (the tweaks accent picker sets them inline).
    // The editor prose (`.nt-doc`) and thin scrollbar live here as components so
    // no per-app CSS file is needed — descendant-styled contentEditable output
    // is the "absolutely necessary" case.
    plugin(({ addBase, addComponents }) => {
      const constant = {
        // orange brand ramp
        "--nt-50": "255 247 237", "--nt-100": "255 237 213", "--nt-200": "254 215 170",
        "--nt-300": "253 186 116", "--nt-400": "251 146 60", "--nt-500": "249 115 22",
        "--nt-600": "234 88 12", "--nt-700": "194 65 12", "--nt-800": "154 52 18",
        "--nt-900": "124 45 18", "--nt-950": "67 20 7",
        // category hues (folders + tags)
        "--nt-c-primary": "249 115 22", "--nt-c-secondary": "59 130 246",
        "--nt-c-accent": "217 70 239", "--nt-c-success": "16 185 129",
        "--nt-c-warning": "245 158 11", "--nt-c-error": "239 68 68",
        "--nt-c-info": "139 92 246",
      }
      const dark = {
        "--nt-bg": "3 6 9", "--nt-bg-1": "8 13 24", "--nt-bg-2": "12 19 33",
        "--nt-panel": "15 22 38", "--nt-panel-2": "20 29 47", "--nt-elevated": "26 36 56",
        "--nt-doc": "11 16 28",
        "--nt-hover": "rgb(255 255 255 / .04)", "--nt-hover-strong": "rgb(255 255 255 / .07)",
        "--nt-border": "rgb(255 255 255 / .08)", "--nt-border-2": "rgb(255 255 255 / .13)",
        "--nt-fg": "236 241 248", "--nt-fg-muted": "154 168 191", "--nt-fg-subtle": "108 122 146",
        "--nt-accent": "249 115 22", "--nt-accent-fg": "251 146 60", "--nt-on-accent": "10 12 18",
      }
      const light = {
        "--nt-bg": "244 247 251", "--nt-bg-1": "248 250 253", "--nt-bg-2": "255 255 255",
        "--nt-panel": "255 255 255", "--nt-panel-2": "248 250 253", "--nt-elevated": "255 255 255",
        "--nt-doc": "255 255 255",
        "--nt-hover": "rgb(15 23 42 / .04)", "--nt-hover-strong": "rgb(15 23 42 / .07)",
        "--nt-border": "rgb(15 23 42 / .09)", "--nt-border-2": "rgb(15 23 42 / .14)",
        "--nt-fg": "17 25 41", "--nt-fg-muted": "82 95 117", "--nt-fg-subtle": "133 146 168",
        "--nt-accent": "234 88 12", "--nt-accent-fg": "194 65 12", "--nt-on-accent": "255 255 255",
      }
      addBase({
        ".nt-app": { ...constant, ...dark, colorScheme: "dark" },
        '.nt-app[data-theme="light"]': { ...light, colorScheme: "light" },
        ".nt-app ::selection": { background: "rgb(var(--nt-accent) / .30)" },
      })
      const fg = "rgb(var(--nt-fg))"
      const border = "var(--nt-border)"
      addComponents({
        // Document prose — the note editor's rendered/edited HTML.
        ".nt-doc": {
          maxWidth: "740px", margin: "0 auto",
          padding: "52px clamp(22px, 7%, 64px) 200px",
          background: "rgb(var(--nt-doc))", minHeight: "100%",
          borderLeft: `1px solid ${border}`, borderRight: `1px solid ${border}`,
          color: fg,
        },
        ".nt-doc.wide": { maxWidth: "980px" },
        '.nt-doc[contenteditable="true"]': { caretColor: "rgb(var(--nt-accent))" },
        ".nt-doc:focus": { outline: "none" },
        ".nt-doc h1": { fontSize: "32px", lineHeight: "1.18", fontWeight: "700", letterSpacing: "-.02em", margin: "0 0 .5em", color: fg },
        ".nt-doc h2": { fontSize: "21px", lineHeight: "1.3", fontWeight: "650", letterSpacing: "-.01em", margin: "1.7em 0 .5em", color: fg },
        ".nt-doc h3": { fontSize: "17px", fontWeight: "650", margin: "1.4em 0 .4em", color: fg },
        ".nt-doc p": { fontSize: "16px", lineHeight: "1.72", margin: "0 0 1em", color: fg },
        ".nt-doc p.lead": { fontSize: "18px", lineHeight: "1.65", color: "rgb(var(--nt-fg-muted))", marginBottom: "1.4em" },
        ".nt-doc strong": { fontWeight: "650", color: fg },
        ".nt-doc ul, .nt-doc ol": { paddingLeft: "1.4em", margin: "0 0 1.1em" },
        ".nt-doc li": { fontSize: "16px", lineHeight: "1.7", marginBottom: ".35em" },
        ".nt-doc ul.todo": { listStyle: "none", paddingLeft: ".2em" },
        ".nt-doc ul.todo li": { position: "relative", paddingLeft: "30px", cursor: "pointer" },
        ".nt-doc ul.todo li::before": {
          content: '""', position: "absolute", left: "0", top: "4px",
          width: "18px", height: "18px", borderRadius: "5px",
          border: "1.5px solid var(--nt-border-2)", background: "rgb(var(--nt-panel))",
          transition: "all .15s cubic-bezier(.4,0,.2,1)",
        },
        '.nt-doc ul.todo li[data-done="true"]::before': { background: "rgb(var(--nt-accent))", borderColor: "rgb(var(--nt-accent))" },
        '.nt-doc ul.todo li[data-done="true"]::after': {
          content: '""', position: "absolute", left: "6px", top: "7px",
          width: "5px", height: "9px", border: "solid rgb(var(--nt-on-accent))",
          borderWidth: "0 2px 2px 0", transform: "rotate(45deg)",
        },
        '.nt-doc ul.todo li[data-done="true"]': { color: "rgb(var(--nt-fg-subtle))", textDecoration: "line-through" },
        ".nt-doc blockquote": { margin: "1.3em 0", padding: "4px 0 4px 18px", borderLeft: "3px solid rgb(var(--nt-accent))", color: "rgb(var(--nt-fg-muted))", fontStyle: "italic", fontSize: "16px", lineHeight: "1.65" },
        ".nt-doc code": { fontFamily: "'IBM Plex Mono', ui-monospace, monospace", fontSize: ".86em", background: "var(--nt-hover-strong)", padding: "2px 6px", borderRadius: "5px", color: "rgb(var(--nt-accent-fg))", border: `1px solid ${border}` },
        ".nt-doc pre": { background: "rgb(var(--nt-bg))", border: `1px solid ${border}`, borderRadius: "9px", padding: "16px 18px", overflow: "auto", margin: "1.2em 0" },
        ".nt-doc pre code": { background: "none", border: "none", padding: "0", color: fg },
        ".nt-doc table": { width: "100%", borderCollapse: "collapse", margin: "1.3em 0", fontSize: "14.5px", border: `1px solid ${border}`, borderRadius: "9px", overflow: "hidden" },
        ".nt-doc th, .nt-doc td": { textAlign: "left", padding: "9px 14px", borderBottom: `1px solid ${border}` },
        ".nt-doc th": { background: "rgb(var(--nt-panel))", fontWeight: "600", color: "rgb(var(--nt-fg-muted))", fontSize: "12.5px", letterSpacing: ".02em", textTransform: "uppercase" },
        ".nt-doc td": { borderRight: `1px solid ${border}` },
        ".nt-doc tr:last-child td": { borderBottom: "none" },
        ".nt-doc td:last-child, .nt-doc th:last-child": { borderRight: "none" },
        ".nt-doc tbody tr:hover": { background: "var(--nt-hover)" },
        ".nt-doc .wikilink": { color: "rgb(var(--nt-accent-fg))", textDecoration: "none", cursor: "pointer", borderBottom: "1px solid rgb(var(--nt-accent) / .35)", paddingBottom: "1px", borderRadius: "2px", transition: "background .12s" },
        '.nt-doc .wikilink::before': { content: '"[["', opacity: ".4", fontSize: ".85em" },
        '.nt-doc .wikilink::after': { content: '"]]"', opacity: ".4", fontSize: ".85em" },
        ".nt-doc .wikilink:hover": { background: "rgb(var(--nt-accent) / .15)" },
        ".nt-doc.serif p, .nt-doc.serif li, .nt-doc.serif blockquote": { fontFamily: "Georgia, Cambria, 'Times New Roman', serif", fontSize: "18px" },
        ".nt-doc.serif h1, .nt-doc.serif h2, .nt-doc.serif h3": { fontFamily: "Georgia, Cambria, 'Times New Roman', serif" },
        // Thin, theme-aware scrollbar (opt-in on scroll containers).
        ".nt-scroll": { scrollbarWidth: "thin", scrollbarColor: "var(--nt-border-2) transparent" },
        ".nt-scroll::-webkit-scrollbar": { width: "10px", height: "10px" },
        ".nt-scroll::-webkit-scrollbar-thumb": { background: "var(--nt-border-2)", borderRadius: "99px", border: "3px solid transparent", backgroundClip: "padding-box" },
        ".nt-scroll::-webkit-scrollbar-thumb:hover": { background: "rgb(var(--nt-fg-subtle))", backgroundClip: "padding-box" },
      })
    }),
    // ── Taxi (SmartRotom) theme layer ──────────────────────────────────────
    // "Teras Transit": blue structure, yellow money. Scoped to `.tx-app`, real
    // light + dark (the mode comes from the platform picker — SMARTROTOM_V3 §2b).
    // The blue ramp is CONSTANT across themes: it encodes structure (pins, the
    // player, the route beam), so it must not shift when the canvas flips. What
    // flips is the canvas, the ink and the translucent surfaces — which are
    // alpha-composited, hence full colours rather than triplets.
    plugin(({ addBase }) => {
      // Structural blue + the ink on a yellow fill — identical in both themes.
      const constant = {
        "--tx-blue-300": "147 197 253", "--tx-blue-400": "96 165 250",
        "--tx-blue-500": "59 130 246", "--tx-blue-600": "37 99 235",
        "--tx-blue-700": "29 78 216", "--tx-blue-ink": "11 28 69",
        "--tx-on-accent": "26 18 5",
        // Money accent. A triplet so soft/glow can derive off it — swap this one
        // var and the whole amber layer follows.
        "--tx-accent": "251 191 36",
        // The far end of every accent fill's gradient: the accent burnt down toward
        // amber-600. Derived, so it tracks the accent instead of being a second hex.
        "--tx-accent-deep": "color-mix(in srgb, rgb(var(--tx-accent)) 72%, #d97706)",
      }
      const dark = {
        "--tx-bg-0": "7 13 32", "--tx-bg-1": "10 19 48", "--tx-field": "6 14 34",
        "--tx-surface": "rgb(150 185 255 / .045)",
        "--tx-surface-2": "rgb(150 185 255 / .08)",
        "--tx-surface-solid": "14 24 56", "--tx-surface-raise": "18 32 71",
        "--tx-line": "rgb(140 175 255 / .13)",
        "--tx-line-2": "rgb(140 175 255 / .26)",
        "--tx-txt": "238 243 255",
        "--tx-txt-2": "rgb(206 222 255 / .74)",
        "--tx-txt-3": "rgb(170 194 245 / .5)",
        "--tx-accent-soft": "rgb(var(--tx-accent) / .2)",
        "--tx-accent-glow": "rgb(var(--tx-accent) / .42)",
        "--tx-money": "251 191 36",
        "--tx-ok": "52 211 153", "--tx-ok-soft": "rgb(52 211 153 / .16)",
        "--tx-no": "251 113 133", "--tx-no-soft": "rgb(251 113 133 / .16)",
        "--tx-pin-bg": "rgb(10 22 52 / .86)", "--tx-pin-ink": "255 255 255",
        "--tx-shadow-1": "0 10px 30px rgb(2 8 24 / .5)",
        "--tx-shadow-2": "0 24px 60px rgb(2 8 24 / .6)",
        "--tx-scrim": "rgb(3 8 22 / .62)",
        // The app canvas: a blue dawn top-left, a violet dusk bottom-right.
        "--tx-app-bg":
          "radial-gradient(1100px 640px at 14% -10%, rgb(37 99 235 / .34), transparent 60%)," +
          "radial-gradient(900px 560px at 100% 112%, rgb(168 85 247 / .10), transparent 55%)," +
          "linear-gradient(162deg, #0a1838 0%, #0a1330 48%, #060c1f 100%)",
        // The map field's graticule — a light blue on dark, a deep blue on light.
        "--tx-grid": "130 180 255",
      }
      const light = {
        "--tx-bg-0": "233 237 247", "--tx-bg-1": "255 255 255", "--tx-field": "230 236 248",
        "--tx-surface": "rgb(18 46 110 / .045)",
        "--tx-surface-2": "rgb(18 46 110 / .085)",
        "--tx-surface-solid": "255 255 255", "--tx-surface-raise": "255 255 255",
        "--tx-line": "rgb(20 52 120 / .13)",
        "--tx-line-2": "rgb(20 52 120 / .24)",
        "--tx-txt": "12 26 62",
        "--tx-txt-2": "rgb(20 42 92 / .72)",
        "--tx-txt-3": "rgb(40 64 118 / .52)",
        "--tx-accent-soft": "rgb(245 158 11 / .18)",
        "--tx-accent-glow": "rgb(245 158 11 / .3)",
        // Amber on white fails contrast, so money darkens to a burnt amber. The
        // accent itself stays bright — it only ever appears as a FILL in light.
        "--tx-money": "180 83 9",
        "--tx-ok": "5 150 105", "--tx-ok-soft": "rgb(5 150 105 / .12)",
        "--tx-no": "225 29 72", "--tx-no-soft": "rgb(225 29 72 / .12)",
        "--tx-pin-bg": "rgb(255 255 255 / 1)", "--tx-pin-ink": "12 26 62",
        "--tx-shadow-1": "0 8px 24px rgb(20 40 90 / .1)",
        "--tx-shadow-2": "0 20px 50px rgb(20 40 90 / .16)",
        "--tx-scrim": "rgb(30 50 100 / .34)",
        "--tx-app-bg":
          "radial-gradient(1100px 640px at 12% -12%, rgb(59 130 246 / .16), transparent 60%)," +
          "radial-gradient(900px 560px at 100% 112%, rgb(168 85 247 / .07), transparent 55%)," +
          "linear-gradient(162deg, #eef2fb 0%, #e9edf7 52%, #e3e9f6 100%)",
        "--tx-grid": "40 90 180",
      }
      addBase({
        // Every figure in the app is a fare, a coordinate or a distance — they
        // must align in columns, so tabular numerals are on at the root.
        ".tx-app": { ...constant, ...dark, colorScheme: "dark", fontVariantNumeric: "tabular-nums" },
        '.tx-app[data-theme="light"]': { ...light, colorScheme: "light" },
        ".tx-app ::selection": { background: "rgb(var(--tx-accent) / .3)" },
        ".tx-scroll::-webkit-scrollbar": { width: "8px" },
        ".tx-scroll::-webkit-scrollbar-thumb": { background: "var(--tx-line-2)", borderRadius: "4px" },
        // Horizontal chip rails scroll but must not show a bar.
        ".tx-rail": { scrollbarWidth: "none" },
        ".tx-rail::-webkit-scrollbar": { display: "none" },
      })
    }),
    // ── Mewtube + Mewtwitch (SmartRotom) theme layer ───────────────────────
    // One system, two accents, scoped to the `.mw-app` root so nothing leaks
    // into the rest of SmartRotom. `--mw-accent` is a per-app RGB triplet
    // (`data-app="mewtube"` → red, `="mewtwitch"` → purple); soft/glow tints
    // derive off it via Tailwind alpha + the mw-glow shadow. The surface ramp
    // warms for Mewtube (so red harmonizes) and stays cool for Mewtwitch — the
    // handoff's `.theme-*` behaviour, ported 1:1 from styles.css.
    plugin(({ addBase, addComponents }) => {
      // Theme-independent: text ramp, status, highlight/secondary, panels,
      // hairlines, accent-derived dark, easing.
      const constant = {
        "--mw-fg": "248 250 252",        // surface-50
        "--mw-fg-mute": "203 213 225",   // surface-300
        "--mw-fg-subtle": "148 163 184", // surface-400
        "--mw-fg-faint": "100 116 139",  // surface-500
        "--mw-on-accent": "255 255 255",
        "--mw-highlight": "132 204 22",  // lime-500 — subs / system events only
        "--mw-secondary": "6 182 212",   // cyan-500
        "--mw-success": "16 185 129",
        "--mw-warning": "234 179 8",
        "--mw-error": "239 68 68",
        "--mw-info": "59 130 246",
        "--mw-panel": "rgba(15, 21, 36, 0.85)",
        "--mw-panel-2": "rgba(22, 30, 48, 0.92)",
        "--mw-hairline": "rgba(255, 255, 255, 0.06)",
        "--mw-hairline-strong": "rgba(255, 255, 255, 0.1)",
        "--mw-accent-dark": "color-mix(in srgb, rgb(var(--mw-accent)) 70%, black)",
        "--mw-ease": "cubic-bezier(.2,.7,.2,1)",
      }
      // Mewtwitch — cool default ramp + purple.
      const mewtwitch = {
        "--mw-accent": "168 85 247",
        "--mw-bg": "3 5 15",    // surface-950
        "--mw-900": "12 18 32", // surface-900
        "--mw-800": "30 41 59", // surface-800
        "--mw-700": "51 65 85", // surface-700
      }
      // Mewtube — pink (Mew) + a warm pink-tinted ramp that harmonizes it.
      const mewtube = {
        "--mw-accent": "236 72 153", // #ec4899 pink-500
        "--mw-bg": "15 8 13",
        "--mw-900": "26 15 22",
        "--mw-800": "42 26 36",
        "--mw-700": "62 42 54",
        "--mw-hairline": "rgba(255, 220, 240, 0.07)",
        "--mw-hairline-strong": "rgba(255, 220, 240, 0.12)",
      }
      addBase({
        // Default to the cool ramp so the shell has a canvas even before the
        // per-app attribute resolves; the body-tint is accent 8% over canvas.
        ".mw-app": {
          ...constant,
          ...mewtwitch,
          colorScheme: "dark",
          color: "rgb(var(--mw-fg))",
          background: "color-mix(in srgb, rgb(var(--mw-accent)) 8%, rgb(var(--mw-bg)))",
        },
        '.mw-app[data-app="mewtube"]': mewtube,
        '.mw-app[data-app="mewtwitch"]': mewtwitch,
      })
      addComponents({
        // Thin, accent-aware scrollbar (opt-in on scroll containers).
        ".mw-scroll": {
          scrollbarWidth: "thin",
          scrollbarColor: "rgb(var(--mw-700) / .9) transparent",
        },
        ".mw-scroll::-webkit-scrollbar": { width: "6px", height: "6px" },
        ".mw-scroll::-webkit-scrollbar-thumb": {
          background: "rgb(var(--mw-700))",
          borderRadius: "99px",
        },
      })
    }),
    // ── Arcade (SmartRotom) theme layer ──────────────────────────────────────
    // Dark-only synthwave, scoped to `.ar-app`. Two things live here that cannot
    // be utilities: the palette (the effect classes below read it back out of the
    // vars) and the CRT layer — scanlines, vignette and the horizon grid are all
    // pseudo-elements with masks, which Tailwind cannot express.
    //
    // `data-scanlines` and `data-motion` on the `.ar-app` root are the two knobs
    // the in-app Ajustes screen writes; both degrade to the design's defaults
    // when absent. OS-level `prefers-reduced-motion` is handled separately, per
    // element, with `motion-reduce:animate-none` (SMARTROTOM_V3.md §11).
    plugin(({ addBase, addComponents }) => {
      addBase({
        ".ar-app": {
          "--ar-bg": "5 2 17",
          "--ar-void": "6 3 26",
          "--ar-void-2": "12 7 40",
          "--ar-void-3": "26 14 61",
          "--ar-ink": "238 240 255",
          "--ar-ink-dim": "188 185 220",
          "--ar-ink-muted": "139 133 173",
          "--ar-magenta": "255 46 147",
          "--ar-magenta-2": "255 109 191",
          "--ar-cyan": "0 229 255",
          "--ar-cyan-2": "121 242 255",
          "--ar-violet": "168 85 255",
          "--ar-violet-2": "199 155 255",
          "--ar-amber": "255 184 69",
          "--ar-lime": "122 248 202",
          "--ar-danger": "255 85 99",
          "--ar-line": "rgb(255 255 255 / .07)",
          "--ar-line-strong": "rgb(255 255 255 / .16)",
          "--ar-panel": "rgb(16 9 42 / .72)",
          "--ar-panel-2": "rgb(8 4 24 / .85)",
          // Scanline opacity — retuned by `data-scanlines`.
          "--ar-scan": ".045",
          colorScheme: "dark",
        },
        '.ar-app[data-scanlines="off"]': { "--ar-scan": "0" },
        '.ar-app[data-scanlines="strong"]': { "--ar-scan": ".1" },
        // The in-app "reducir motion" switch. Kills animation only — transitions
        // still run, so the loot reel still travels, it just does not shimmer.
        '.ar-app[data-motion="off"] *, .ar-app[data-motion="off"] *::before, .ar-app[data-motion="off"] *::after':
          { animation: "none !important" },
        ".ar-app ::selection": { background: "rgb(var(--ar-magenta) / .35)" },
        ".ar-app :focus-visible": {
          outline: "2px solid rgb(var(--ar-cyan))",
          outlineOffset: "2px",
          borderRadius: "4px",
        },
      })
      addComponents({
        // The workspace canvas: two neon bloom pools over a violet gradient.
        ".ar-canvas": {
          background:
            "radial-gradient(1200px 600px at 80% -10%, rgb(var(--ar-violet) / .18), transparent 60%)," +
            "radial-gradient(900px 500px at -10% 110%, rgb(var(--ar-magenta) / .16), transparent 60%)," +
            "linear-gradient(180deg, rgb(var(--ar-bg)) 0%, rgb(12 5 36) 100%)",
        },
        // CRT scanline overlay. The host must be positioned; every panel in the
        // system already is.
        ".ar-scanlines": { position: "relative" },
        ".ar-scanlines::before": {
          content: '""',
          position: "absolute",
          inset: "0",
          // Follows the host's corners on its own, so the host does not need
          // `overflow-hidden` just to keep the overlay off its rounded edges —
          // which is what lets a panel opt out of clipping and let a dropdown
          // escape it (see `Panel`'s `clip` prop).
          borderRadius: "inherit",
          backgroundImage:
            "repeating-linear-gradient(to bottom, rgb(255 255 255 / var(--ar-scan)) 0 1px, transparent 1px 3px)",
          mixBlendMode: "overlay",
          pointerEvents: "none",
          zIndex: "5",
        },
        ".ar-vignette::after": {
          content: '""',
          position: "absolute",
          inset: "0",
          pointerEvents: "none",
          background: "radial-gradient(120% 90% at 50% 40%, transparent 55%, rgb(0 0 0 / .55) 100%)",
          zIndex: "6",
        },
        // The synthwave road: a magenta→cyan sheet raked back in perspective and
        // masked into a grid. `mask-composite` intersects the three masks — the
        // fade, the horizontal rules and the vertical rules — so only the lines
        // that survive all three are painted.
        ".ar-horizon": {
          position: "absolute",
          inset: "0",
          overflow: "hidden",
          pointerEvents: "none",
        },
        ".ar-horizon::before": {
          content: '""',
          position: "absolute",
          left: "50%",
          top: "55%",
          width: "200%",
          height: "80%",
          background:
            "linear-gradient(to bottom, rgb(var(--ar-magenta) / 0) 0%, rgb(var(--ar-magenta) / .5) 50%, rgb(var(--ar-cyan) / .55) 100%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 0%, black 35%)," +
            "repeating-linear-gradient(to bottom, black 0 1px, transparent 1px 28px)," +
            "repeating-linear-gradient(89deg, black 0 1px, transparent 1px 60px)",
          maskImage:
            "linear-gradient(to bottom, transparent 0%, black 35%)," +
            "repeating-linear-gradient(to bottom, black 0 1px, transparent 1px 28px)," +
            "repeating-linear-gradient(89deg, black 0 1px, transparent 1px 60px)",
          WebkitMaskComposite: "source-in",
          maskComposite: "intersect",
          transformOrigin: "50% 0%",
          transform: "translate(-50%, 0) perspective(600px) rotateX(62deg)",
          opacity: ".35",
        },
        // The horizon line itself.
        ".ar-horizon::after": {
          content: '""',
          position: "absolute",
          left: "0",
          right: "0",
          top: "53%",
          height: "1px",
          background: "linear-gradient(to right, transparent, rgb(var(--ar-cyan)), transparent)",
          opacity: ".55",
          boxShadow: "0 0 20px rgb(var(--ar-cyan)), 0 0 60px rgb(var(--ar-cyan) / .4)",
        },
        // Chromatic aberration — a badly-converged CRT gun.
        ".ar-chrom": {
          textShadow: "1px 0 0 rgb(var(--ar-magenta) / .55), -1px 0 0 rgb(var(--ar-cyan) / .55)",
        },
        ".ar-glow-cyan": {
          textShadow: "0 0 8px rgb(var(--ar-cyan) / .6), 0 0 22px rgb(var(--ar-cyan) / .25)",
        },
        ".ar-glow-magenta": {
          textShadow: "0 0 8px rgb(var(--ar-magenta) / .7), 0 0 22px rgb(var(--ar-magenta) / .3)",
        },
        ".ar-glow-amber": {
          textShadow: "0 0 6px rgb(var(--ar-amber) / .7), 0 0 18px rgb(var(--ar-amber) / .3)",
        },
        // Marquee wordmark: the gradient is clipped to the glyphs and swept.
        ".ar-marquee-text": {
          background:
            "linear-gradient(90deg, rgb(var(--ar-cyan)) 0%, rgb(var(--ar-magenta)) 25%, rgb(var(--ar-amber)) 50%, rgb(var(--ar-magenta)) 75%, rgb(var(--ar-cyan)) 100%)",
          backgroundSize: "200% auto",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
          animation: "ar-marquee 6s linear infinite",
        },
        "@media (prefers-reduced-motion: reduce)": {
          ".ar-marquee-text": { animation: "none" },
        },
        // Cabinet-button press feel, shared by every control in the system.
        ".ar-lift": { transition: "transform .15s ease, box-shadow .2s ease, filter .2s ease" },
        ".ar-lift:hover": { transform: "translateY(-1px)" },
        ".ar-lift:active": { transform: "translateY(1px)" },
        ".ar-skeleton": {
          background:
            "linear-gradient(90deg, rgb(255 255 255 / .04) 25%, rgb(255 255 255 / .1) 37%, rgb(255 255 255 / .04) 63%)",
          backgroundSize: "200% 100%",
          animation: "ar-skeleton 1.4s ease-in-out infinite",
          borderRadius: "8px",
        },
        ".ar-scroll": {
          scrollbarWidth: "thin",
          scrollbarColor: "rgb(var(--ar-violet) / .35) transparent",
        },
        ".ar-scroll::-webkit-scrollbar": { width: "10px", height: "10px" },
        ".ar-scroll::-webkit-scrollbar-track": { background: "transparent" },
        ".ar-scroll::-webkit-scrollbar-thumb": {
          background: "rgb(var(--ar-violet) / .25)",
          borderRadius: "8px",
        },
        ".ar-scroll::-webkit-scrollbar-thumb:hover": { background: "rgb(var(--ar-violet) / .45)" },
      })
    }),
    // ══════════════════════════════════════════════════════════════════════
    // MISIONES (SmartRotom) — `.ms-app` base layer + the material classes.
    // Everything here is a texture Tailwind cannot express as utilities: the
    // cork board, the wooden frame, the parchment (stacked radial-gradients +
    // an SVG turbulence grain + burned corners), the desk and the wax stamp.
    // These are MATERIALS, not components — the components themselves are
    // Tailwind on JSX in misiones/_components (SMARTROTOM_V3.md §6).
    // ══════════════════════════════════════════════════════════════════════
    plugin(({ addBase, addComponents }) => {
      // Turbulence grain, inlined as a data-URI so no asset request is made.
      const grain = (freq: number, opacity: number) =>
        `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='${freq}' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='100' height='100' filter='url(%23n)' opacity='${opacity}'/></svg>")`

      const paperSurface =
        "radial-gradient(ellipse at 15% 20%, rgba(120,70,30,.10), transparent 50%)," +
        "radial-gradient(ellipse at 85% 80%, rgba(90,50,20,.12), transparent 60%)," +
        "radial-gradient(ellipse at 50% 50%, rgb(var(--ms-paper-1)), rgb(var(--ms-paper-2)) 80%, rgb(var(--ms-paper-3)))"

      addBase({
        // Pergamino — the one shipped palette. A second palette is one more
        // block here (`.ms-app[data-palette="grimdark"]`), nothing else.
        ".ms-app": {
          "--ms-board-1": "107 63 28",
          "--ms-board-2": "74 43 18",
          "--ms-board-3": "56 32 12",
          "--ms-board-frame": "42 24 10",
          "--ms-board-frame-hi": "106 69 32",
          "--ms-paper-1": "243 226 177",
          "--ms-paper-2": "231 208 148",
          "--ms-paper-3": "212 182 115",
          "--ms-paper-edge": "138 94 46",
          "--ms-ink-1": "42 26 10",
          "--ms-ink-2": "74 52 28",
          "--ms-ink-3": "107 76 46",
          "--ms-ink-4": "138 106 72",
          "--ms-gold-1": "245 215 133",
          "--ms-gold-2": "214 161 63",
          "--ms-gold-3": "162 108 26",
          "--ms-gold-4": "107 68 15",
          "--ms-seal-active": "200 144 38", // gold wax
          "--ms-seal-available": "179 65 26", // red wax
          "--ms-seal-completed": "107 20 16", // dark red wax
          "--ms-seal-failed": "42 42 42", // black wax
          "--ms-seal-locked": "90 70 50", // brown wax
          "--ms-stamp-red": "170 28 28",
          "--ms-stamp-gold": "162 108 26",
          "--ms-paper-shadow": "rgba(40, 22, 8, .45)",
          colorScheme: "dark",
          color: "rgb(var(--ms-ink-1))",
        },
        // The tavern canvas: warm light from above, dark from below, wood below
        // that. `::before` are the cork specks, `::after` the paper grain.
        ".ms-tavern": {
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(255,220,140,.10), transparent 50%)," +
            "radial-gradient(ellipse at 50% 120%, rgba(0,0,0,.7), transparent 60%)," +
            "linear-gradient(180deg, rgb(var(--ms-board-1)), rgb(var(--ms-board-2)) 70%, rgb(var(--ms-board-3)))",
          position: "relative",
        },
        ".ms-tavern::before": {
          content: '""',
          position: "absolute",
          inset: "0",
          pointerEvents: "none",
          backgroundImage:
            "radial-gradient(circle at 12% 22%, rgba(255,220,160,.06) 0 1.5px, transparent 2px)," +
            "radial-gradient(circle at 78% 11%, rgba(0,0,0,.25) 0 1px, transparent 2px)," +
            "radial-gradient(circle at 33% 76%, rgba(0,0,0,.18) 0 1.5px, transparent 2.5px)," +
            "radial-gradient(circle at 88% 60%, rgba(255,220,160,.06) 0 1px, transparent 2px)," +
            "radial-gradient(circle at 50% 45%, rgba(0,0,0,.18) 0 1.2px, transparent 2px)," +
            "radial-gradient(circle at 18% 92%, rgba(255,220,160,.05) 0 1.5px, transparent 2px)",
          backgroundSize: "280px 280px",
          opacity: ".85",
        },
        ".ms-tavern::after": {
          content: '""',
          position: "absolute",
          inset: "0",
          pointerEvents: "none",
          backgroundImage: grain(0.9, 0.55),
          mixBlendMode: "overlay",
          opacity: ".35",
        },
      })

      addComponents({
        // ── Parchment ──────────────────────────────────────────────────────
        ".ms-paper": {
          position: "relative",
          background: paperSurface,
          color: "rgb(var(--ms-ink-1))",
          borderRadius: "2px",
          boxShadow:
            "inset 0 0 40px rgba(80,50,20,.16), inset 0 0 6px rgba(80,50,20,.10)," +
            "0 1px 2px rgba(0,0,0,.3), 0 6px 16px var(--ms-paper-shadow), 0 18px 36px -8px rgba(0,0,0,.4)",
        },
        ".ms-paper::before": {
          content: '""',
          position: "absolute",
          inset: "0",
          borderRadius: "inherit",
          pointerEvents: "none",
          backgroundImage: grain(1.4, 0.5),
          mixBlendMode: "multiply",
          opacity: ".25",
        },
        // Burned, aged corners + a hairline of ink around the sheet.
        ".ms-paper::after": {
          content: '""',
          position: "absolute",
          inset: "0",
          borderRadius: "inherit",
          pointerEvents: "none",
          boxShadow: "inset 0 0 0 1px rgba(80,50,20,.22)",
          background:
            "radial-gradient(circle at 0% 0%, rgba(60,30,10,.35), transparent 18%)," +
            "radial-gradient(circle at 100% 0%, rgba(60,30,10,.30), transparent 16%)," +
            "radial-gradient(circle at 0% 100%, rgba(60,30,10,.28), transparent 18%)," +
            "radial-gradient(circle at 100% 100%, rgba(60,30,10,.32), transparent 16%)",
        },
        // A sheet torn out of a ledger, for the chain nodes.
        ".ms-torn": {
          clipPath: "polygon(2% 4%, 6% 0%, 95% 1%, 100% 5%, 99% 96%, 95% 100%, 5% 99%, 0% 95%)",
        },
        // ── A paper pinned to the board: straightens and lifts on hover ─────
        ".ms-pinned": {
          cursor: "pointer",
          transformOrigin: "50% 0%",
          transition: "transform .25s cubic-bezier(.34,1.56,.64,1), filter .2s ease, box-shadow .2s ease",
        },
        ".ms-pinned:hover": {
          transform: "translateY(-4px) rotate(0deg)",
          filter: "brightness(1.04)",
          zIndex: "5",
          boxShadow:
            "inset 0 0 40px rgba(80,50,20,.18), 0 4px 8px rgba(0,0,0,.4)," +
            "0 16px 32px var(--ms-paper-shadow), 0 24px 50px -10px rgba(0,0,0,.5)",
        },
        ".ms-pinned:focus-visible": {
          transform: "translateY(-4px) rotate(0deg)",
          outline: "2px solid rgb(var(--ms-gold-2))",
          outlineOffset: "3px",
        },
        "@media (prefers-reduced-motion: reduce)": {
          ".ms-pinned, .ms-pinned:hover": { transform: "none", transition: "none" },
        },
        // ── Cork board panel (holds the papers) ────────────────────────────
        ".ms-cork": {
          position: "relative",
          borderRadius: "4px",
          border: "1px solid rgba(0,0,0,.45)",
          background:
            "radial-gradient(ellipse at 30% 20%, rgba(255,220,160,.08), transparent 50%)," +
            "linear-gradient(180deg, rgba(40,24,12,.4), rgba(20,12,6,.5))",
          boxShadow: "inset 0 1px 0 rgba(255,200,100,.12), inset 0 0 80px rgba(0,0,0,.5)",
        },
        ".ms-cork::before": {
          content: '""',
          position: "absolute",
          inset: "0",
          borderRadius: "inherit",
          pointerEvents: "none",
          backgroundImage:
            "radial-gradient(circle at 22% 32%, rgba(255,220,160,.05) 0 1.5px, transparent 2px)," +
            "radial-gradient(circle at 68% 21%, rgba(0,0,0,.18) 0 1px, transparent 2px)," +
            "radial-gradient(circle at 43% 76%, rgba(0,0,0,.12) 0 1.5px, transparent 2.5px)," +
            "radial-gradient(circle at 78% 60%, rgba(255,220,160,.06) 0 1px, transparent 2px)",
          backgroundSize: "240px 240px",
        },
        // ── Wooden plank frame (the side rail, the mobile bar) ─────────────
        ".ms-wood": {
          background:
            "repeating-linear-gradient(90deg, rgb(var(--ms-board-frame)) 0px, rgb(var(--ms-board-frame-hi)) 18px," +
            "rgb(var(--ms-board-frame)) 24px, rgb(var(--ms-board-frame-hi)) 60px, rgb(var(--ms-board-frame)) 84px)," +
            "rgb(var(--ms-board-frame))",
          boxShadow:
            "inset 0 0 20px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,200,.06), inset 0 -1px 0 rgba(0,0,0,.4)",
          color: "rgb(var(--ms-gold-1))",
        },
        // ── The desk the letter is read on (planks running the other way) ──
        ".ms-desk": {
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(255,210,150,.10), transparent 60%)," +
            "repeating-linear-gradient(92deg, #3a2410 0px, #5a3818 18px, #2e1a0a 28px, #5a3818 50px, #3a2410 72px), #3a2410",
          boxShadow: "inset 0 0 80px rgba(0,0,0,.65), -10px 0 30px rgba(0,0,0,.55)",
        },
        // ── Leather tab (side-rail nav) ────────────────────────────────────
        ".ms-tab": {
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "12px 16px",
          fontFamily: "'IM Fell English SC', Cinzel, serif",
          fontSize: "12px",
          letterSpacing: ".10em",
          textTransform: "uppercase",
          color: "#d9b673",
          background: "linear-gradient(90deg, #3a2418, #2a1810 80%, transparent)",
          borderLeft: "3px solid transparent",
          cursor: "pointer",
          transition: "all .15s",
        },
        ".ms-tab:hover": {
          background: "linear-gradient(90deg, #4a2e1c, #38201a 80%, transparent)",
          color: "rgb(var(--ms-gold-1))",
        },
        ".ms-tab[aria-current='page']": {
          background: "linear-gradient(90deg, #5a3818, #38201a 80%, transparent)",
          color: "rgb(var(--ms-gold-1))",
          borderLeftColor: "rgb(var(--ms-gold-2))",
          boxShadow: "inset 6px 0 18px -6px rgba(255,200,100,.25)",
        },
        // ── Wax stamp struck across a finished paper ───────────────────────
        ".ms-stamp": {
          position: "absolute",
          pointerEvents: "none",
          whiteSpace: "nowrap",
          fontFamily: "'Cinzel Decorative', Cinzel, serif",
          fontWeight: "700",
          fontSize: "22px",
          textTransform: "uppercase",
          letterSpacing: ".18em",
          padding: "6px 14px 4px",
          color: "rgb(var(--ms-stamp-red))",
          border: "3px double rgb(var(--ms-stamp-red))",
          opacity: ".84",
          transform: "rotate(-14deg)",
          mixBlendMode: "multiply",
          filter: "contrast(1.05)",
          textShadow: "1px 1px 0 rgba(255,255,255,.06)",
        },
        ".ms-stamp-failed": {
          color: "rgb(var(--ms-ink-1))",
          borderColor: "rgb(var(--ms-ink-1))",
          transform: "rotate(-8deg)",
        },
        // ── Gold motes over an in-progress quest ───────────────────────────
        ".ms-sparkle": {
          position: "absolute",
          borderRadius: "50%",
          pointerEvents: "none",
          opacity: "0",
          filter: "blur(.4px)",
          background:
            "radial-gradient(circle, rgb(var(--ms-gold-1)) 0%, rgb(var(--ms-gold-2)) 40%, transparent 70%)",
        },
        // ── Illuminated manuscript initial ─────────────────────────────────
        ".ms-drop-cap::first-letter": {
          float: "left",
          fontFamily: "'Cinzel Decorative', Cinzel, serif",
          fontSize: "3.2em",
          lineHeight: ".85",
          margin: ".05em .1em 0 0",
          color: "rgb(var(--ms-gold-3))",
          textShadow: "1px 1px 0 rgba(255,220,160,.4)",
        },
        ".ms-scroll": { scrollbarWidth: "thin", scrollbarColor: "rgba(150,110,60,.35) transparent" },
        ".ms-scroll::-webkit-scrollbar": { width: "10px", height: "10px" },
        ".ms-scroll::-webkit-scrollbar-track": { background: "transparent" },
        ".ms-scroll::-webkit-scrollbar-thumb": {
          background: "rgba(150,110,60,.25)",
          borderRadius: "99px",
        },
        ".ms-scroll::-webkit-scrollbar-thumb:hover": { background: "rgba(150,110,60,.45)" },
      })
    }),
    // Enhanced text shadow plugin
    plugin(({ theme, addUtilities }) => {
      const shadowUtilities: Record<string, { textShadow: string }> = {}
      const colors = theme("colors") as Record<string, Record<string, string>>

      for (const color in colors) {
        if (typeof colors[color] === "object") {
          const colorValue = colors[color]["900"]
          if (typeof colorValue === "string") {
            const borderColor = colorValue.replace("<alpha-value>", "0.8")

            shadowUtilities[`.text-shadow-${color}-border1`] = {
              textShadow: `${borderColor} 1px 0px 0px, ${borderColor} 0.540302px 0.841471px 0px, ${borderColor} -0.416147px 0.909297px 0px, ${borderColor} -0.989992px 0.14112px 0px, ${borderColor} -0.653644px -0.756802px 0px, ${borderColor} 0.283662px -0.958924px 0px, ${borderColor} 0.96017px -0.279415px 0px`,
            }
            shadowUtilities[`.text-shadow-${color}-border2`] = {
              textShadow: `${borderColor} 2px 0px 0px, ${borderColor} 1.75517px 0.958851px 0px, ${borderColor} 1.0806px 1.68294px 0px, ${borderColor} 0.141474px 1.99499px 0px, ${borderColor} -0.832294px 1.81859px 0px, ${borderColor} -1.60229px 1.19694px 0px, ${borderColor} -1.97998px 0.28224px 0px, ${borderColor} -1.87291px -0.701566px 0px, ${borderColor} -1.30729px -1.5136px 0px, ${borderColor} -0.421592px -1.95506px 0px, ${borderColor} 0.567324px -1.91785px 0px, ${borderColor} 1.41734px -1.41108px 0px, ${borderColor} 1.92034px -0.558831px 0px`,
            }
            shadowUtilities[`.text-shadow-${color}-border3`] = {
              textShadow: `${borderColor} 3px 0px 0px, ${borderColor} 2.83487px 0.981584px 0px, ${borderColor} 2.35766px 1.85511px 0px, ${borderColor} 1.62091px 2.52441px 0px, ${borderColor} 0.705713px 2.91581px 0px, ${borderColor} -0.287171px 2.98622px 0px, ${borderColor} -1.24844px 2.72789px 0px, ${borderColor} -2.07227px 2.16926px 0px, ${borderColor} -2.66798px 1.37182px 0px, ${borderColor} -2.96998px 0.42336px 0px, ${borderColor} -2.94502px -0.571704px 0px, ${borderColor} -2.59586px -1.50383px 0px, ${borderColor} -1.96093px -2.27041px 0px, ${borderColor} -1.11013px -2.78704px 0px, ${borderColor} -0.137119px -2.99686px 0px, ${borderColor} 0.850987px -2.87677px 0px, ${borderColor} 1.74541px -2.43999px 0px, ${borderColor} 2.44769px -1.73459px 0px, ${borderColor} 2.88051px -0.838247px 0px`,
            }
          }
        }
      }

      addUtilities(shadowUtilities)
    }),
    // Glass effect utilities
    plugin(({ addUtilities }) => {
      addUtilities({
        ".glass-effect": {
          background: "rgba(255, 255, 255, 0.05)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        },
        ".glass-effect-strong": {
          background: "rgba(255, 255, 255, 0.1)",
          backdropFilter: "blur(15px)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
        },
        ".gradient-border": {
          borderImage: "linear-gradient(45deg, #f97316, #ea580c) 1",
        },
      })
    }),
  ],
}

export default config