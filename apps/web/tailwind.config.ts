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
        "sb-1": "0 1px 0 rgba(15,30,60,.04), 0 1px 2px rgba(15,30,60,.04)",
        "sb-2": "0 1px 0 rgba(15,30,60,.03), 0 6px 18px -8px rgba(15,30,60,.15)",
        "sb-3": "0 10px 30px -12px rgba(15,30,60,.25)",
        "sb-brand": "0 14px 40px -16px rgba(36,99,235,.55)",
        "sb-focus": "0 0 0 3px rgba(36,99,235,.22)",
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
          50: "#eff6ff", 100: "#dbeafe", 200: "#bfdbfe", 300: "#93c5fd",
          400: "#60a5fa", 500: "#3b82f6", 600: "#2463eb", 700: "#1d4ed8",
          800: "#1e3a8a", 900: "#172554", 950: "#0b1638",
          // surfaces
          bg: "#f3f6fc", "bg-grid": "#eaf0fa", surface: "#ffffff",
          "surface-2": "#f7faff", "surface-3": "#eef3fb",
          border: "#e3ebf5", "border-strong": "#c9d6ec", ring: "#2463eb",
          // text
          fg: "#0c1830", "fg-2": "#2c3a55", "fg-muted": "#5b6b85",
          "fg-subtle": "#8d99b3", onbrand: "#ffffff",
          // semantic
          pos: "#047857", "pos-2": "#059669", "pos-soft": "#e7f7ef",
          neg: "#b91c1c", "neg-2": "#dc2626", "neg-soft": "#fdecec",
          warn: "#b45309", "warn-soft": "#fff5e0",
          info: "#1d4ed8", "info-soft": "#e8f0ff",
          // categorical
          league: "#2463eb", shop: "#06b6d4", heal: "#ec4899",
          transfer: "#8b5cf6", reward: "#10b981", fee: "#94a3b8",
          subscription: "#f59e0b", other: "#64748b",
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
      },
      transitionTimingFunction: {
        "pk-out": "cubic-bezier(.16, 1, .3, 1)",
        "pk-spring": "cubic-bezier(.34, 1.56, .64, 1)",
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
      // Mewtube — warm ramp + red (neutralizes the blue tint).
      const mewtube = {
        "--mw-accent": "239 68 68",
        "--mw-bg": "14 8 10",
        "--mw-900": "24 16 18",
        "--mw-800": "38 26 28",
        "--mw-700": "58 42 44",
        "--mw-hairline": "rgba(255, 220, 220, 0.07)",
        "--mw-hairline-strong": "rgba(255, 220, 220, 0.12)",
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