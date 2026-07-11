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