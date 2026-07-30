import type { Config } from "tailwindcss"
import plugin from "tailwindcss/plugin"

import {
  colors as baseColors,
  fontFamily as baseFontFamily,
  geometry,
  uiContent,
} from "@boffmedia/tailwind-config/base"

const config: Config = {
  darkMode: ["selector", '[data-theme="dark"]'],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    // The v3 primitives live in @boffmedia/ui now — without these globs every
    // class they own gets purged out of the build.
    ...uiContent,
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  prefix: "",
  theme: {
    extend: {
      fontFamily: {
        vinque: ["Vinque", "sans-serif"],
        roboto: ["Roboto", "sans-serif"],
        bebas: ["Bebas Neue", "sans-serif"],
        // Boffmedia type system (default) — shared with @boffmedia/ui's hosts
        ...baseFontFamily,
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
        // PC (SmartRotom) — the storage console, triple type system (self-hosted).
        // Chakra Petch is the squared-off HUD face: it carries the wordmark, box
        // names and panel titles and nothing else. Every figure — dex numbers,
        // levels, box counts, IV/EV, stat totals — is JetBrains Mono, because the
        // whole app is a grid of numbers that must align down a column.
        pc: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        "pc-display": ["Chakra Petch", "Inter", "ui-sans-serif", "sans-serif"],
        "pc-mono": ["JetBrains Mono", "ui-monospace", "monospace"],
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
        // Furret Today (SmartRotom) — the pop-art magazine. Four faces: Bangers
        // shouts every headline (single 400 weight — never ask for another),
        // Fraunces is the italic serif deck/byline, Space Grotesk is the body
        // copy, and Inter carries every uppercase UI label (eyebrows, pills,
        // buttons) where the display face would be unreadable at 11px.
        ft: ["Space Grotesk", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        "ft-display": ["Bangers", "Anton", "Archivo Black", "ui-sans-serif", "sans-serif"],
        "ft-deck": ["Fraunces", "Georgia", "Times New Roman", "serif"],
        "ft-ui": ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        // Gobierno de Teras (SmartRotom) — the civic paper system. Libre
        // Baskerville is the engraved face: every heading, every figure on a
        // stat tile, the seal's circular legend. Public Sans is the UI. Space
        // Mono is the institutional label face — it carries every uppercase
        // kicker, table header, badge and case number, and nothing else.
        gt: ["Public Sans", "ui-sans-serif", "system-ui", "sans-serif"],
        "gt-display": ["Libre Baskerville", "Georgia", "Times New Roman", "serif"],
        "gt-mono": ["Space Mono", "Roboto Mono", "ui-monospace", "monospace"],
        // Wigglypop (SmartRotom) — the bubbly marketplace. Only two families, and
        // the split is unusual: Fredoka is the ROUNDED face (wordmark, card and
        // panel titles, every heading) and tops out at 600 — asking it for 700+
        // silently falls back, so the design's "bold" IS 600. Nunito carries body
        // copy AND every figure: `font-wp-mono` is not a real monospace, it is
        // Nunito 800 with tabular-nums (see the `.wp-num` component class), which
        // is what keeps prices column-aligned without importing a third family.
        wp: ["Nunito", "ui-sans-serif", "system-ui", "sans-serif"],
        "wp-display": ["Fredoka", "Nunito", "ui-rounded", "sans-serif"],
        "wp-mono": ["Nunito", "ui-sans-serif", "system-ui", "sans-serif"],
        // Rooker (SmartRotom) — the social nest. Alone among the twelve, its
        // body face is the reader's OWN system UI font: a timeline should read
        // like the device it is on. `font-rk-chirp` (Hanken Grotesk, self-hosted
        // variable 400–900) is the opt-in alternative offered in Pantalla — it
        // is applied by swapping `--rk-font` on the scope root, so `font-rk`
        // resolves to whichever face the reader chose. There is no display face:
        // Rooker sets hierarchy with weight, never with a second family.
        rk: ["var(--rk-font)", "ui-sans-serif", "system-ui", "sans-serif"],
        "rk-chirp": ["Hanken Grotesk", "ui-sans-serif", "system-ui", "sans-serif"],
        "rk-mono": ["IBM Plex Mono", "Roboto Mono", "ui-monospace", "monospace"],
        // Pasaporte (SmartRotom) — a state-issued travel document, so the type is
        // the type of officialdom. Four faces, each with one job and no overlap:
        // `ps-display` (Cinzel) is INSCRIPTIONAL — engraved caps, used only where a
        // real passport engraves: the cover word PASAPORTE, the seal's roman
        // numeral, folio numerals. `ps-ceremony` (Marcellus) is the Roman serif
        // that carries every heading and every *value* on the paper. `ps` (Public
        // Sans) is the civic grotesque for field labels and prose. `ps-mono`
        // (Spline Sans Mono) is the OCR voice — the MRZ strip, record codes,
        // dates, captions. Setting a value in the wrong one is the fastest way to
        // make the document read like an app instead of a passport.
        ps: ["Public Sans", "ui-sans-serif", "system-ui", "sans-serif"],
        "ps-display": ["Cinzel", "Playfair Display", "serif"],
        "ps-ceremony": ["Marcellus", "Cormorant Garamond", "serif"],
        "ps-mono": ["Spline Sans Mono", "ui-monospace", "monospace"],
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
        // ── Furret Today (SmartRotom) — the hard offset "print" drop ────────
        // No blur, no spread: a solid ink slab offset down-right, the way a
        // misregistered second pass looks on cheap newsprint. This IS the
        // app's elevation system; there is no soft shadow anywhere in it.
        "ft-pop": "6px 6px 0 0 rgb(var(--ft-ink))",
        "ft-pop-sm": "3px 3px 0 0 rgb(var(--ft-ink))",
        "ft-pop-md": "5px 5px 0 0 rgb(var(--ft-ink))",
        "ft-pop-lg": "10px 10px 0 0 rgb(var(--ft-ink))",
        "ft-pop-xs": "2px 2px 0 0 rgb(var(--ft-ink))",
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
        // ── Gobierno de Teras (SmartRotom) — paper elevation ───────────────
        // Every shadow carries a warm-white inset top edge: on cream paper a
        // neutral drop shadow alone reads as dirt, not as lift.
        "gt-sm": "0 1px 2px rgba(74,64,40,.08), inset 0 1px 0 rgba(255,255,255,.6)",
        gt: "0 2px 10px -4px rgba(74,64,40,.22), inset 0 1px 0 rgba(255,255,255,.7)",
        "gt-lg": "0 16px 40px -20px rgba(50,42,22,.45), inset 0 1px 0 rgba(255,255,255,.7)",
        // ── Wigglypop (SmartRotom) — candy elevation ────────────────────────
        // Every shadow is tinted with the accent's plum (223,63,137), never a
        // neutral black: on a pink-cream page a grey drop shadow reads as soot.
        // The ramp is deliberately long-and-soft (large blur, large negative
        // spread) — that softness is what makes the surfaces read as inflated.
        "wp-soft": "0 8px 22px -12px rgba(223,63,137,.22)",
        wp: "0 16px 36px -18px rgba(223,63,137,.30)",
        "wp-btn": "0 3px 8px -5px rgba(223,63,137,.3)",
        // The primary button and the active tab sit on a much heavier drop —
        // that is what lifts the pink gradient off the pink page.
        "wp-primary": "0 10px 20px -8px rgba(223,63,137,.7)",
        "wp-tab": "0 8px 16px -8px rgba(223,63,137,.6)",
        "wp-card-hover": "0 22px 40px -20px rgba(223,63,137,.5)",
        "wp-modal": "0 30px 70px -24px rgba(223,63,137,.5)",
        // Ring + glow in one, for the hovered/selected slot and card.
        "wp-glow":
          "0 0 0 1px rgba(242,99,160,.5), 0 8px 24px -8px rgba(242,99,160,.45)",
        // The three rarity hovers. Literal classes, applied from the map in
        // `_utils/rarity.ts` — never `shadow-wp-${rarity}` (§4).
        "wp-raro": "0 22px 40px -20px rgba(18,192,176,.45)",
        "wp-epico": "0 22px 40px -20px rgba(157,92,224,.5)",
        "wp-legendario": "0 22px 42px -18px rgba(243,165,31,.55)",
        "wp-slot": "inset 0 1px 0 #fff, 0 4px 10px -7px rgba(223,63,137,.18)",
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

        // ── Boffmedia v3 vocabulary ───────────────────────────────────────────
        // surfaces base/base-2/base-deep/panel · hairlines line · text txt
        // brand accent · status ok/warn/bad/signal. Shared with the launcher.
        ...baseColors,

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
        // PC (SmartRotom) — `pc-*`. The storage console: a slate void behind
        // frosted glass panels. Dark-only — the app ignores the theme picker's
        // mode (SMARTROTOM_V3.md §2b), like Pokédex, Arcade and Misiones.
        // CSS-var backed (declared on `.pc-app`) rather than baked hex, because
        // the glass/slot/wallpaper component classes below have to read the
        // palette from inside plugin CSS. Alpha works: `bg-pc-accent/16`.
        // Blue is the ONE structural accent; the other six are strictly
        // semantic roles and never decorate: cyan = multi-select, violet =
        // compare/filters, green = valid drop, amber = held item, rose =
        // destructive/fainted, gold = shiny.
        // ════════════════════════════════════════════════════════════════════
        pc: {
          bg:    "rgb(var(--pc-bg) / <alpha-value>)",
          "bg-1": "rgb(var(--pc-bg-1) / <alpha-value>)",
          "bg-2": "rgb(var(--pc-bg-2) / <alpha-value>)",
          fg: {
            DEFAULT: "rgb(var(--pc-fg) / <alpha-value>)",
            muted:   "rgb(var(--pc-fg-muted) / <alpha-value>)",
            subtle:  "rgb(var(--pc-fg-subtle) / <alpha-value>)",
          },
          accent: {
            DEFAULT: "rgb(var(--pc-accent) / <alpha-value>)",
            strong:  "rgb(var(--pc-accent-strong) / <alpha-value>)",
          },
          cyan:   "rgb(var(--pc-cyan) / <alpha-value>)",
          violet: "rgb(var(--pc-violet) / <alpha-value>)",
          green:  "rgb(var(--pc-green) / <alpha-value>)",
          amber:  "rgb(var(--pc-amber) / <alpha-value>)",
          rose:   "rgb(var(--pc-rose) / <alpha-value>)",
          gold:   "rgb(var(--pc-gold) / <alpha-value>)",
          line:          "var(--pc-line)",
          "line-strong": "var(--pc-line-strong)",
          panel:         "var(--pc-panel)",
          "panel-2":     "var(--pc-panel-2)",
          "panel-solid": "rgb(var(--pc-panel-solid) / <alpha-value>)",
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
        // ════════════════════════════════════════════════════════════════════
        // FURRET TODAY (SmartRotom) — `ft-*`. A pop-art printed magazine: warm
        // newsprint paper, comic ink, and six saturated accents that behave like
        // spot colours on a press. Light-only — the paper IS the design, so the
        // app ignores the theme picker's mode (like Pokédex, Arcade, Misiones —
        // SMARTROTOM_V3.md §2b). The dark "ink" cover is a SECTION, not a theme.
        // CSS-var backed (declared on `.ft-app`) so the halftone/newsprint/stripe
        // component classes below can read the palette from inside plugin CSS.
        // Alpha works: `bg-ft-pink/12`, `border-ft-ink/30`.
        // The six accents are DATA-DRIVEN (an article's category picks one), so
        // they are applied through the literal class maps in `_utils/accents.ts`
        // — never `bg-ft-${accent}` (§4: dynamic classes silently never compile).
        // ════════════════════════════════════════════════════════════════════
        ft: {
          ink:   "rgb(var(--ft-ink) / <alpha-value>)",
          paper: {
            DEFAULT: "rgb(var(--ft-paper) / <alpha-value>)",
            2:       "rgb(var(--ft-paper-2) / <alpha-value>)",
            dark:    "rgb(var(--ft-paper-dark) / <alpha-value>)",
          },
          // Body copy sits a touch warmer/lighter than pure ink so long-form
          // reading does not vibrate against the cream paper.
          body:  "rgb(var(--ft-body) / <alpha-value>)",
          deck:  "rgb(var(--ft-deck) / <alpha-value>)",
          pink: {
            DEFAULT: "rgb(var(--ft-pink) / <alpha-value>)",
            soft:    "rgb(var(--ft-pink-soft) / <alpha-value>)",
          },
          yellow: {
            DEFAULT: "rgb(var(--ft-yellow) / <alpha-value>)",
            soft:    "rgb(var(--ft-yellow-soft) / <alpha-value>)",
          },
          cyan: {
            DEFAULT: "rgb(var(--ft-cyan) / <alpha-value>)",
            soft:    "rgb(var(--ft-cyan-soft) / <alpha-value>)",
          },
          orange: {
            DEFAULT: "rgb(var(--ft-orange) / <alpha-value>)",
            soft:    "rgb(var(--ft-orange-soft) / <alpha-value>)",
          },
          purple: {
            DEFAULT: "rgb(var(--ft-purple) / <alpha-value>)",
            soft:    "rgb(var(--ft-purple-soft) / <alpha-value>)",
          },
          lime:  "rgb(var(--ft-lime) / <alpha-value>)",
          red:   "rgb(var(--ft-red) / <alpha-value>)",
        },
        // ════════════════════════════════════════════════════════════════════
        // GOBIERNO DE TERAS (SmartRotom) — `gt-*`. A civic institution printed
        // on warm paper: cream surfaces, warm-black ink, municipal green and
        // heraldic gold. Light-only — the paper IS the design, so the app
        // ignores the theme picker's mode (like Furret Today, Pokédex, Arcade,
        // Misiones — SMARTROTOM_V3.md §2b).
        //
        // `accent` is the one themeable axis: four institutional colours
        // (civic / navy / burgundy / gold) swapped by `data-accent` on the
        // scope root. The six `dep-*` hues are NOT themeable — a department's
        // colour is its identity, and it stays put whatever the accent is.
        // ════════════════════════════════════════════════════════════════════
        gt: {
          paper: {
            bg: "rgb(var(--gt-paper-bg) / <alpha-value>)",
            0:  "rgb(var(--gt-paper-0) / <alpha-value>)",
            1:  "rgb(var(--gt-paper-1) / <alpha-value>)",
            2:  "rgb(var(--gt-paper-2) / <alpha-value>)",
            3:  "rgb(var(--gt-paper-3) / <alpha-value>)",
          },
          line: {
            DEFAULT: "rgb(var(--gt-line) / <alpha-value>)",
            strong:  "rgb(var(--gt-line-strong) / <alpha-value>)",
            soft:    "rgb(var(--gt-line-soft) / <alpha-value>)",
          },
          ink: {
            900: "rgb(var(--gt-ink-900) / <alpha-value>)",
            800: "rgb(var(--gt-ink-800) / <alpha-value>)",
            700: "rgb(var(--gt-ink-700) / <alpha-value>)",
            600: "rgb(var(--gt-ink-600) / <alpha-value>)",
            500: "rgb(var(--gt-ink-500) / <alpha-value>)",
            400: "rgb(var(--gt-ink-400) / <alpha-value>)",
            300: "rgb(var(--gt-ink-300) / <alpha-value>)",
          },
          civic: {
            DEFAULT: "rgb(var(--gt-civic) / <alpha-value>)",
            700:     "rgb(var(--gt-civic-700) / <alpha-value>)",
            600:     "rgb(var(--gt-civic-600) / <alpha-value>)",
            300:     "rgb(var(--gt-civic-300) / <alpha-value>)",
            tint:    "rgb(var(--gt-civic-tint) / <alpha-value>)",
          },
          gold: {
            DEFAULT: "rgb(var(--gt-gold) / <alpha-value>)",
            600:     "rgb(var(--gt-gold-600) / <alpha-value>)",
            300:     "rgb(var(--gt-gold-300) / <alpha-value>)",
            tint:    "rgb(var(--gt-gold-tint) / <alpha-value>)",
          },
          // The accent follows `data-accent`; everything else here does not.
          accent: {
            DEFAULT: "rgb(var(--gt-accent) / <alpha-value>)",
            strong:  "rgb(var(--gt-accent-strong) / <alpha-value>)",
            tint:    "rgb(var(--gt-accent-tint) / <alpha-value>)",
          },
          dep: {
            urbanismo: "rgb(var(--gt-dep-urbanismo) / <alpha-value>)",
            seguridad: "rgb(var(--gt-dep-seguridad) / <alpha-value>)",
            hacienda:  "rgb(var(--gt-dep-hacienda) / <alpha-value>)",
            justicia:  "rgb(var(--gt-dep-justicia) / <alpha-value>)",
            poblacion: "rgb(var(--gt-dep-poblacion) / <alpha-value>)",
            gobierno:  "rgb(var(--gt-dep-gobierno) / <alpha-value>)",
          },
          ok:     { DEFAULT: "rgb(var(--gt-ok) / <alpha-value>)",     tint: "rgb(var(--gt-ok-tint) / <alpha-value>)" },
          warn:   { DEFAULT: "rgb(var(--gt-warn) / <alpha-value>)",   tint: "rgb(var(--gt-warn-tint) / <alpha-value>)" },
          danger: { DEFAULT: "rgb(var(--gt-danger) / <alpha-value>)", tint: "rgb(var(--gt-danger-tint) / <alpha-value>)" },
          info:   { DEFAULT: "rgb(var(--gt-info) / <alpha-value>)",   tint: "rgb(var(--gt-info-tint) / <alpha-value>)" },
        },
        // ════════════════════════════════════════════════════════════════════
        // Rooker (SmartRotom) — "el nido social". Backed by `.rk-app[data-theme]`
        // with THREE canvases, not two: Claro, Tenue and Oscuro. Light/dark still
        // comes from the platform picker (SMARTROTOM_V3 §2b) — what the app owns
        // is *which* dark, which is a contrast preference, not a theme.
        //
        // The accent is a runtime triplet (`--rk-accent`, six choices) and every
        // brand surface derives off it through Tailwind's alpha channel, so one
        // var swap repaints the whole timeline. What must NOT follow the accent
        // are the action colours: a Retrino is always green and a heart is always
        // pink, exactly as on Twitter — recolouring them would destroy the
        // learned meaning. Those five reaction hues are therefore constants.
        // ════════════════════════════════════════════════════════════════════
        // ════════════════════════════════════════════════════════════════════
        // WIGGLYPOP (SmartRotom) — `wp-*`. The bubbly marketplace: Wallapop's
        // friendly second-hand shop crossed with Wigglytuff's balloon pink.
        // Light-only, like Furret Today and Gobierno — the pink-cream paper IS
        // the product, so the app ignores the theme picker's mode
        // (SMARTROTOM_V3.md §2b). There is no `data-theme` axis on `.wp-app`.
        //
        // TWO accents, and the split is the whole system:
        //   · `wp-accent` (balloon pink) = IDENTITY and ACTION — the brand, the
        //     primary button, the active tab, every focus ring.
        //   · `wp-teal` (Wallapop's teal) = MONEY and TRUST — every price, the
        //     valuation box, the escrow/verified badges. It is never decorative.
        // Keeping money teal is what stops a page of pink prices from turning
        // into visual noise, and it is why a price is legible at a glance.
        //
        // The four rarity hues are DATA-DRIVEN (a Pokémon's IVs pick one), so
        // they are applied through the literal class maps in `_utils/rarity.ts`
        // — never `text-wp-rarity-${r}` (§4: dynamic classes never compile).
        // ════════════════════════════════════════════════════════════════════
        wp: {
          // Surfaces: a pink-cream page, white cards. `bg` is the page, `panel`
          // is the frosted chrome (used at /90), `panel-2` the sunken tint.
          bg: "rgb(var(--wp-bg) / <alpha-value>)",
          "bg-soft": "rgb(var(--wp-bg-soft) / <alpha-value>)",
          panel: "rgb(var(--wp-panel) / <alpha-value>)",
          "panel-2": "rgb(var(--wp-panel-2) / <alpha-value>)",
          // Wigglytuff's belly — the wallet pill and nothing else. It is the one
          // warm note in a cool-pink page, which is what makes money feel held.
          cream: {
            DEFAULT: "rgb(var(--wp-cream) / <alpha-value>)",
            deep: "rgb(var(--wp-cream-deep) / <alpha-value>)",
          },
          // Hairlines are a dusty plum, not grey. One triplet, two strengths via
          // alpha: `border-wp-line/24` is the default rule, `/46` the strong one.
          line: "rgb(var(--wp-line) / <alpha-value>)",
          // Text is deep plum, never black — #000 on this page reads as a hole.
          fg: {
            DEFAULT: "rgb(var(--wp-fg) / <alpha-value>)",
            muted: "rgb(var(--wp-fg-muted) / <alpha-value>)",
            subtle: "rgb(var(--wp-fg-subtle) / <alpha-value>)",
          },
          accent: {
            DEFAULT: "rgb(var(--wp-accent) / <alpha-value>)",
            strong: "rgb(var(--wp-accent-strong) / <alpha-value>)",
            // The two stops of the primary gradient (`.wp-grad-primary`).
            light: "rgb(var(--wp-accent-light) / <alpha-value>)",
          },
          // Money + trust. `teal` is the price colour; `teal-deep` is text ON a
          // teal-tinted surface (the trust chip), where plain teal would fail AA.
          teal: {
            DEFAULT: "rgb(var(--wp-teal) / <alpha-value>)",
            deep: "rgb(var(--wp-teal-deep) / <alpha-value>)",
          },
          green: "rgb(var(--wp-green) / <alpha-value>)",
          violet: "rgb(var(--wp-violet) / <alpha-value>)",
          amber: "rgb(var(--wp-amber) / <alpha-value>)",
          gold: "rgb(var(--wp-gold) / <alpha-value>)",
          rose: "rgb(var(--wp-rose) / <alpha-value>)",
          // Rarity. Note `raro` IS teal and `legendario` IS gold — deliberately
          // the same triplets, so the rarity ramp and the money/reward ramp stay
          // one palette rather than two competing ones.
          rarity: {
            comun: "rgb(var(--wp-rarity-comun) / <alpha-value>)",
            raro: "rgb(var(--wp-rarity-raro) / <alpha-value>)",
            epico: "rgb(var(--wp-rarity-epico) / <alpha-value>)",
            legendario: "rgb(var(--wp-rarity-legendario) / <alpha-value>)",
          },
        },
        rk: {
          bg:       "rgb(var(--rk-bg) / <alpha-value>)",
          card:     "rgb(var(--rk-card) / <alpha-value>)",
          elevated: "rgb(var(--rk-elevated) / <alpha-value>)",
          // The nav/header scrim sits over scrolling content and is blurred, so
          // it is a full colour (pre-composited alpha), not a triplet.
          nav:      "var(--rk-nav)",
          hover:    "var(--rk-hover)",
          fg: {
            DEFAULT: "rgb(var(--rk-fg) / <alpha-value>)",
            muted:   "rgb(var(--rk-fg-muted) / <alpha-value>)",
            subtle:  "rgb(var(--rk-fg-subtle) / <alpha-value>)",
          },
          line: {
            DEFAULT: "rgb(var(--rk-line) / <alpha-value>)",
            strong:  "rgb(var(--rk-line-strong) / <alpha-value>)",
          },
          accent: {
            DEFAULT: "rgb(var(--rk-accent) / <alpha-value>)",
            // The ink that sits ON the accent — flips to near-black for the
            // light accents (yellow, green) so the CTA label stays legible.
            fg:      "rgb(var(--rk-accent-fg) / <alpha-value>)",
          },
          // Fixed action + status colours. Constant across all three canvases.
          heart:    "rgb(var(--rk-heart) / <alpha-value>)",
          ball:     "rgb(var(--rk-ball) / <alpha-value>)",
          choque:   "rgb(var(--rk-choque) / <alpha-value>)",
          shiny:    "rgb(var(--rk-shiny) / <alpha-value>)",
          fuego:    "rgb(var(--rk-fuego) / <alpha-value>)",
          rt:       "rgb(var(--rk-rt) / <alpha-value>)",
          live:     "rgb(var(--rk-live) / <alpha-value>)",
          verified: "rgb(var(--rk-verified) / <alpha-value>)",
        },
        // ════════════════════════════════════════════════════════════════════
        // PASAPORTE (SmartRotom) — `ps-*`. The one app with TWO surfaces, and
        // the split is the whole design:
        //
        //   the DESK  — walnut, oxblood leather, gold foil, navy. Dark. It is
        //               the immigration counter the book lies on: topbar, page
        //               controls, inspection chrome, the replay modal.
        //   the PAPER — cream security stock, brown-black ink. Light. Everything
        //               INSIDE the book.
        //
        // Both live in one scope root, always, in both platform modes: a passport
        // is a physical object and its paper does not turn dark because the OS
        // did. So `ps-*` is FIXED-CANVAS, like Furret Today's newsprint — the app
        // never reads `useRotomMode()` (SMARTROTOM_V3.md §2b).
        //
        // Never put desk ink on paper or paper ink on the desk: `text-ps-ink` on
        // the topbar is invisible, `text-ps-chrome-fg` on a page is invisible.
        ps: {
          // ── The desk ──────────────────────────────────────────────────────
          desk: {
            DEFAULT: "rgb(var(--ps-desk) / <alpha-value>)",
            hi: "rgb(var(--ps-desk-hi) / <alpha-value>)",
            lo: "rgb(var(--ps-desk-lo) / <alpha-value>)",
          },
          // The blotter the book rests on — oxblood leather, not brown.
          leather: {
            DEFAULT: "rgb(var(--ps-leather) / <alpha-value>)",
            deep: "rgb(var(--ps-leather-deep) / <alpha-value>)",
          },
          // Type on the desk.
          chrome: {
            fg: "rgb(var(--ps-chrome-fg) / <alpha-value>)",
            muted: "rgb(var(--ps-chrome-muted) / <alpha-value>)",
            subtle: "rgb(var(--ps-chrome-subtle) / <alpha-value>)",
          },
          // Navy buckram — the cover cloth, the emblem, the nav buttons, and the
          // carné's header band. The document's institutional colour.
          navy: {
            DEFAULT: "rgb(var(--ps-navy) / <alpha-value>)",
            deep: "rgb(var(--ps-navy-deep) / <alpha-value>)",
            hi: "rgb(var(--ps-navy-hi) / <alpha-value>)",
          },
          // Gold foil. `gild` is the leaf, `hi` its lit edge, `lo` its shadow —
          // all three are needed or the foil reads as flat yellow. Hairlines on
          // the desk are this colour at low alpha: `border-ps-gild/18`.
          gild: {
            DEFAULT: "rgb(var(--ps-gild) / <alpha-value>)",
            hi: "rgb(var(--ps-gild-hi) / <alpha-value>)",
            lo: "rgb(var(--ps-gild-lo) / <alpha-value>)",
          },
          // The satin bookmark.
          ribbon: {
            DEFAULT: "rgb(var(--ps-ribbon) / <alpha-value>)",
            hi: "rgb(var(--ps-ribbon-hi) / <alpha-value>)",
          },

          // ── The paper ─────────────────────────────────────────────────────
          paper: {
            DEFAULT: "rgb(var(--ps-paper) / <alpha-value>)",
            "2": "rgb(var(--ps-paper-2) / <alpha-value>)",
            edge: "rgb(var(--ps-paper-edge) / <alpha-value>)",
          },
          // Ink is a warm brown-black, never #000 — pure black on cream reads as
          // a printing error. `ink` at low alpha IS the ruled line: the handoff's
          // `--rule` is nothing but `rgb(var(--ps-ink) / .22)`, so use
          // `border-ps-ink/22` rather than inventing a rule token.
          ink: {
            DEFAULT: "rgb(var(--ps-ink) / <alpha-value>)",
            soft: "rgb(var(--ps-ink-soft) / <alpha-value>)",
            faint: "rgb(var(--ps-ink-faint) / <alpha-value>)",
          },

          // ── The security inks ─────────────────────────────────────────────
          // The chapter accents. Desaturated on purpose: these are intaglio inks
          // sharing one low chroma, which is what makes twelve differently
          // coloured chapters still look like one document. A chapter picks a
          // pair and passes it down as `--ps-chapter` / `--ps-chapter-deep`
          // (see `chapter` below) — it does NOT reach for these directly, so the
          // primitives stay chapter-agnostic.
          oxblood: {
            DEFAULT: "rgb(var(--ps-oxblood) / <alpha-value>)",
            deep: "rgb(var(--ps-oxblood-deep) / <alpha-value>)",
          },
          teal: {
            DEFAULT: "rgb(var(--ps-teal) / <alpha-value>)",
            deep: "rgb(var(--ps-teal-deep) / <alpha-value>)",
          },
          plum: {
            DEFAULT: "rgb(var(--ps-plum) / <alpha-value>)",
            deep: "rgb(var(--ps-plum-deep) / <alpha-value>)",
          },
          olive: {
            DEFAULT: "rgb(var(--ps-olive) / <alpha-value>)",
            deep: "rgb(var(--ps-olive-deep) / <alpha-value>)",
          },
          info: {
            DEFAULT: "rgb(var(--ps-info) / <alpha-value>)",
            deep: "rgb(var(--ps-info-deep) / <alpha-value>)",
          },
          ok: "rgb(var(--ps-ok) / <alpha-value>)",
          warn: "rgb(var(--ps-warn) / <alpha-value>)",
          bad: "rgb(var(--ps-bad) / <alpha-value>)",

          // The RUNTIME chapter accent. Every page sets these two on its own root
          // (`style={chapterVars(accent)}`), so `text-ps-chapter-deep` means
          // "this chapter's ink" wherever it is used and no primitive ever needs
          // to know which chapter it is inside. This is the one pair whose value
          // is data-driven — §4's sanctioned inline-style case, not a dynamic
          // class name.
          chapter: {
            DEFAULT: "rgb(var(--ps-chapter) / <alpha-value>)",
            deep: "rgb(var(--ps-chapter-deep) / <alpha-value>)",
          },

          // Medal + ladder tiers. Fixed, and shared by the Logros coins and the
          // Temporada ladder — one metal ramp, used twice, so a gold logro and a
          // gold rung are the same gold.
          tier: {
            bronce: "rgb(var(--ps-tier-bronce) / <alpha-value>)",
            plata: "rgb(var(--ps-tier-plata) / <alpha-value>)",
            oro: "rgb(var(--ps-tier-oro) / <alpha-value>)",
            platino: "rgb(var(--ps-tier-platino) / <alpha-value>)",
            diamante: "rgb(var(--ps-tier-diamante) / <alpha-value>)",
            maestro: "rgb(var(--ps-tier-maestro) / <alpha-value>)",
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
        // ── PC (SmartRotom) ─────────────────────────────────────────────────
        "pc-fade": { from: { opacity: "0" }, to: { opacity: "1" } },
        "pc-pop": {
          from: { opacity: "0", transform: "scale(.92)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "pc-slide-up": {
          from: { opacity: "0", transform: "translateY(14px)" },
          to: { opacity: "1", transform: "none" },
        },
        "pc-slide-in-right": {
          from: { opacity: "0", transform: "translateX(40px)" },
          to: { opacity: "1", transform: "none" },
        },
        "pc-float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-5px)" },
        },
        "pc-shimmer": {
          from: { backgroundPosition: "-200% 0" },
          to: { backgroundPosition: "200% 0" },
        },
        // Referenced by name from the `.pc-boot-scan::after` component class.
        pcBootSweep: { from: { transform: "translateY(0)" }, to: { transform: "translateY(420%)" } },
        "pc-boot-cell": {
          "0%": { opacity: "0", transform: "scale(.5)" },
          "70%": { transform: "scale(1.08)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "pc-boot-spin": { to: { transform: "rotate(360deg)" } },
        "pc-boot-blink": { "50%": { opacity: ".2" } },
        "pc-pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 0 1px rgb(var(--pc-accent) / .3)" },
          "50%": { boxShadow: "0 0 18px -2px rgb(var(--pc-accent) / .5)" },
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
        // ── Furret Today (SmartRotom) ───────────────────────────────────────
        "ft-pulse": { "0%, 100%": { opacity: "1" }, "50%": { opacity: ".4" } },
        "ft-bob": {
          "0%, 100%": { transform: "translateY(0) rotate(-2deg)" },
          "50%": { transform: "translateY(-4px) rotate(-1deg)" },
        },
        "ft-marquee": {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
        "ft-burst": {
          "0%": { transform: "scale(.8)", opacity: "0" },
          "60%": { transform: "scale(1.05)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "ft-shimmer": {
          from: { backgroundPosition: "200% 0" },
          to: { backgroundPosition: "-200% 0" },
        },
        // ── Gobierno de Teras (SmartRotom) ────────────────────────────────
        // The seal's circular legend turns once every 90s — slow enough to read
        // as engraving that happens to move, not as a spinner.
        "gt-seal": { to: { transform: "rotate(360deg)" } },
        // Transform-only, so a throttled or backgrounded tab can never leave
        // the content stuck invisible at opacity 0.
        "gt-pop": { from: { transform: "translateY(8px)" }, to: { transform: "translateY(0)" } },
        "gt-pop-scale": { from: { transform: "scale(.97)" }, to: { transform: "scale(1)" } },
        "gt-blink": { "0%, 55%": { opacity: "1" }, "56%, 100%": { opacity: ".25" } },
        "gt-pulse": { "0%, 100%": { opacity: "1" }, "50%": { opacity: ".5" } },
        "gt-stamp": {
          "0%":   { opacity: "0", transform: "scale(1.5) rotate(-14deg)" },
          "60%":  { opacity: "1", transform: "scale(.94) rotate(-9deg)" },
          "100%": { transform: "scale(1) rotate(-9deg)" },
        },
        "gt-toast": {
          from: { opacity: "0", transform: "translateY(10px) scale(.98)" },
          to:   { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        // ── Wigglypop (SmartRotom) ──────────────────────────────────────────
        // The system's motion signature is OVERSHOOT. `wp-pop` deliberately
        // scales past 1 before settling — that 8% overshoot on the bouncy ease
        // is what makes a card feel inflated rather than merely animated, and it
        // is the one thing to preserve if any of these are ever retuned.
        "wp-pop": {
          "0%":   { opacity: "0", transform: "scale(.6)" },
          "60%":  { transform: "scale(1.08)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "wp-fade": { from: { opacity: "0" }, to: { opacity: "1" } },
        "wp-slide-up": {
          from: { opacity: "0", transform: "translateY(14px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        // The detail hero bobs. Slow and small — it reads as a balloon holding
        // station, not as a thing demanding attention.
        "wp-floaty": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%":      { transform: "translateY(-7px)" },
        },
        // ── Rooker (SmartRotom) ─────────────────────────────────────────────
        "rk-pop": {
          "0%":   { transform: "scale(.4)", opacity: "0" },
          "60%":  { transform: "scale(1.15)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        // The reaction that flies off the button when you tap it.
        "rk-fly": {
          "0%":   { transform: "translateY(0) rotate(0)" },
          "100%": { transform: "translateY(-46px) rotate(8deg)", opacity: "0" },
        },
        "rk-fadeup": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        // The sheen that crawls across a shiny capture. Drives background-position,
        // so the gradient it animates must be sized 200% wide.
        "rk-shimmer": { to: { backgroundPosition: "200% 0" } },
        // The halo on anything live. Hard-coded to the live red because that is
        // what "live" means here — it does not follow the accent.
        "rk-live": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgb(var(--rk-live) / .5)" },
          "50%":      { boxShadow: "0 0 0 5px rgb(var(--rk-live) / 0)" },
        },
        // ── Pasaporte (SmartRotom) ────────────────────────────────────────
        // A rubber stamp being brought down on the page: it arrives oversized and
        // rotated, overshoots, and settles a few degrees off-square. The final
        // -4deg is the point — a stamp that lands perfectly straight looks
        // printed, not struck.
        "ps-stamp": {
          "0%":   { transform: "scale(2.6) rotate(-18deg)", opacity: "0" },
          "60%":  { opacity: "1" },
          "72%":  { transform: "scale(.9) rotate(2deg)" },
          "100%": { transform: "scale(1) rotate(-4deg)", opacity: "1" },
        },
        // The inspection beam sweeping down the whole viewport.
        "ps-scan": { "0%": { top: "-180px" }, "100%": { top: "100%" } },
        // The narrower beam that runs inside the carné's QR box.
        "ps-qrscan": { "0%, 100%": { top: "5px" }, "50%": { top: "64px" } },
        "ps-spin": { to: { transform: "rotate(360deg)" } },
        "ps-shimmer": {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
        // The "drag the corner" hint on the closed cover.
        "ps-hint": { "0%, 100%": { opacity: ".35" }, "50%": { opacity: ".85" } },
        "ps-fade": { from: { opacity: "0" } },
        "ps-sheet-in": {
          from: { opacity: "0", transform: "translateY(14px) scale(.98)" },
        },
        "ps-toast-in": {
          from: { opacity: "0", transform: "translate(-50%, 20px)" },
          to: { opacity: "1", transform: "translate(-50%, 0)" },
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
        // ── PC (SmartRotom) ─────────────────────────────────────────────────
        "pc-fade": "pc-fade .3s cubic-bezier(.22,.61,.36,1) both",
        "pc-pop": "pc-pop .22s cubic-bezier(.22,.61,.36,1) both",
        "pc-slide-up": "pc-slide-up .28s cubic-bezier(.22,.61,.36,1) both",
        "pc-slide-in-right": "pc-slide-in-right .28s cubic-bezier(.22,.61,.36,1) both",
        "pc-float": "pc-float 5s ease-in-out infinite",
        "pc-shimmer": "pc-shimmer 1.4s linear infinite",
        "pc-boot-cell": "pc-boot-cell .3s cubic-bezier(.22,.61,.36,1) both",
        "pc-boot-spin": "pc-boot-spin 1.5s linear infinite",
        "pc-boot-blink": "pc-boot-blink 1s steps(2) infinite",
        "pc-pulse-glow": "pc-pulse-glow 1.5s infinite",
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
        // ── Furret Today (SmartRotom) ─────────────────────────────────────
        "ft-pulse": "ft-pulse 1.4s ease-in-out infinite",
        "ft-bob": "ft-bob 4.5s ease-in-out infinite",
        "ft-marquee": "ft-marquee 40s linear infinite",
        "ft-burst": "ft-burst .36s cubic-bezier(.2,.8,.2,1) both",
        "ft-shimmer": "ft-shimmer 1.4s linear infinite",
        // ── Gobierno de Teras (SmartRotom) ────────────────────────────────
        "gt-seal": "gt-seal 90s linear infinite",
        "gt-pop": "gt-pop .28s ease-out both",
        "gt-pop-scale": "gt-pop-scale .22s ease-out both",
        "gt-blink": "gt-blink 1.3s step-end infinite",
        "gt-pulse": "gt-pulse 1.8s ease-in-out infinite",
        "gt-stamp": "gt-stamp .4s cubic-bezier(.2,.8,.3,1) both",
        "gt-toast": "gt-toast .22s ease-out both",
        // ── Wigglypop (SmartRotom) ──────────────────────────────────────────
        // `wp-pop` rides the bouncy ease (it is the one that overshoots); the
        // other two ride the soft ease, because content sliding in should not
        // wobble. Pair each with `motion-reduce:animate-none` at the usage site.
        "wp-pop": "wp-pop .3s cubic-bezier(.34,1.4,.5,1) both",
        "wp-fade": "wp-fade .3s cubic-bezier(.22,.61,.36,1) both",
        "wp-slide-up": "wp-slide-up .3s cubic-bezier(.22,.61,.36,1) both",
        "wp-floaty": "wp-floaty 5s cubic-bezier(.22,.61,.36,1) infinite",
        // ── Rooker (SmartRotom) ─────────────────────────────────────────────
        "rk-pop": "rk-pop .18s ease-out both",
        "rk-fly": "rk-fly .65s ease-out forwards",
        "rk-fadeup": "rk-fadeup .28s ease-out both",
        "rk-shimmer": "rk-shimmer 3.4s linear infinite",
        "rk-live": "rk-live 2s ease-in-out infinite",
        // ── Pasaporte (SmartRotom) ──────────────────────────────────────────
        "ps-stamp": "ps-stamp .62s cubic-bezier(.3,1.4,.4,1) both",
        "ps-scan": "ps-scan 3.4s linear infinite",
        "ps-qrscan": "ps-qrscan 1.9s ease-in-out infinite",
        "ps-spin": "ps-spin 6s linear infinite",
        "ps-spin-slow": "ps-spin 16s linear infinite",
        "ps-shimmer": "ps-shimmer 1.4s linear infinite",
        "ps-hint": "ps-hint 2.4s ease-in-out infinite",
        "ps-fade": "ps-fade .3s ease-out both",
        "ps-sheet-in": "ps-sheet-in .32s cubic-bezier(.22,.9,.31,1) both",
        "ps-toast-in": "ps-toast-in .32s cubic-bezier(.22,.9,.31,1) both",
      },
      transitionTimingFunction: {
        "pk-out": "cubic-bezier(.16, 1, .3, 1)",
        "pk-spring": "cubic-bezier(.34, 1.56, .64, 1)",
        // The Taxi handoff's single easing curve (`--ease`).
        tx: "cubic-bezier(.22, 1, .36, 1)",
        // Furret Today — the "snap" the pop cards lift on.
        ft: "cubic-bezier(.2, .7, .2, 1)",
        // Wigglypop's two curves. `ease-wp` OVERSHOOTS (the 1.4 control point is
        // past 1) — it is the bouncy one, and it belongs on anything that scales
        // or lifts: buttons, cards, slots, the toggle knob. `ease-wp-soft` does
        // not overshoot and belongs on anything that fades or slides, where a
        // bounce would look like a bug. Do not swap them.
        wp: "cubic-bezier(.34, 1.4, .5, 1)",
        "wp-soft": "cubic-bezier(.22, .61, .36, 1)",
      },
      spacing: {
        18: "4.5rem",
        88: "22rem",
        128: "32rem",
      },
      // Alpha steps the default scale does not have. Tailwind's built-in `opacity`
      // scale steps in 5s, so a modifier like `/24` matches no utility and emits
      // NOTHING — the border simply does not exist, with no error and no warning.
      // This is §4's silent-failure mode reached through the alpha modifier instead
      // of through an interpolated class name, and it had already bitten four apps:
      //
      //   /12  gobierno (dept tints, `bg-gt-ok/12`), rooker (`bg-rk-accent/12`)
      //   /14  mewtube  (`bg-mw-accent/14`)
      //   /18  pasaporte — the desk hairline (`border-ps-gild/18`)
      //   /22  pasaporte — the rule on the paper (`border-ps-ink/22`)
      //   /24  wigglypop — its default hairline, `border-wp-line/24`, 60 call sites
      //   /46  wigglypop — its strong hairline
      //
      // These are measured values, not roundable to the nearest 5 without changing
      // the design, so the scale grows to fit them. Anything added here must be a
      // value some app actually uses — this is not a dumping ground.
      opacity: {
        12: "0.12",
        14: "0.14",
        18: "0.18",
        22: "0.22",
        24: "0.24",
        46: "0.46",
      },
      borderWidth: {
        // ── Furret Today (SmartRotom) — the comic ink outline ───────────────
        // The half-pixel is deliberate: 2.5px is the handoff's stroke and it
        // renders crisper than 2px against the halftone dots at 1x.
        ft: "2.5px",
        "ft-thick": "4px",
        "ft-hair": "1.5px",
        // ── Wigglypop (SmartRotom) — the soft 1.5px rule ────────────────────
        // Every card, button, input and slot in Wigglypop is bordered at 1.5px,
        // not 1px. It is the single most load-bearing number in the system: at
        // 1px the white cards dissolve into the pink page, and at 2px they turn
        // into stickers. The hairline (`border-wp-line/24`) stays 1px.
        wp: "1.5px",
      },
      borderRadius: {
        "4xl": "2rem",
        "neon": "14px",
        "neon-lg": "22px",
        "neon-pill": "9999px",
        // ── Rooker (SmartRotom) radii ───────────────────────────────────────
        // A two-value system on purpose: every container is a 16px card and
        // every control is a full pill. `rk-sm` exists only for the tiny
        // square-ish things (the clear-search chip, an inline swatch).
        "rk-sm": "4px",
        "rk-md": "12px",
        rk: "16px",
        "rk-pill": "9999px",
        // ── Furret Today (SmartRotom) radii ─────────────────────────────────
        "ft-sm": "6px",
        "ft-md": "10px",
        ft: "14px",
        "ft-lg": "24px",
        "ft-pill": "999px",
        // ── Wigglypop (SmartRotom) radii ────────────────────────────────────
        // Generous and rounded — this is a balloon system. `wp` (18px) is the
        // card/panel, `wp-sm` (13px) every control and input, `wp-lg` (26px) the
        // modal. Anything interactive that is not a rectangle is a full pill.
        "wp-sm": "13px",
        wp: "18px",
        "wp-lg": "26px",
        "wp-pill": "999px",
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
        // ── PC (SmartRotom) radii ───────────────────────────────────────────
        "pc-sm": "10px",
        pc: "14px",
        "pc-lg": "20px",
        "pc-pill": "999px",
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
        // ── Gobierno de Teras (SmartRotom) radii ───────────────────────────
        // Deliberately tight: this is a printed document, not an app surface.
        "gt-sm": "5px",
        gt: "8px",
        "gt-pill": "999px",
      },
    },
  },
  plugins: [
    // Shared .cut/.cut-seal/.cut-corner/.cut-tag geometry.
    geometry,
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
        // The .cut* geometry moved to @boffmedia/tailwind-config (the `geometry`
        // plugin below) — shared with @boffmedia/ui and SmartRotom chrome alike.
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
    // The editor prose (`.nt-app .nt-doc`) and thin scrollbar live here as components so
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
        ".nt-app .nt-doc": {
          maxWidth: "740px", margin: "0 auto",
          padding: "52px clamp(22px, 7%, 64px) 200px",
          background: "rgb(var(--nt-doc))", minHeight: "100%",
          borderLeft: `1px solid ${border}`, borderRight: `1px solid ${border}`,
          color: fg,
        },
        ".nt-app .nt-doc.wide": { maxWidth: "980px" },
        '.nt-app .nt-doc[contenteditable="true"]': { caretColor: "rgb(var(--nt-accent))" },
        ".nt-app .nt-doc:focus": { outline: "none" },
        ".nt-app .nt-doc h1": { fontSize: "32px", lineHeight: "1.18", fontWeight: "700", letterSpacing: "-.02em", margin: "0 0 .5em", color: fg },
        ".nt-app .nt-doc h2": { fontSize: "21px", lineHeight: "1.3", fontWeight: "650", letterSpacing: "-.01em", margin: "1.7em 0 .5em", color: fg },
        ".nt-app .nt-doc h3": { fontSize: "17px", fontWeight: "650", margin: "1.4em 0 .4em", color: fg },
        ".nt-app .nt-doc p": { fontSize: "16px", lineHeight: "1.72", margin: "0 0 1em", color: fg },
        ".nt-app .nt-doc p.lead": { fontSize: "18px", lineHeight: "1.65", color: "rgb(var(--nt-fg-muted))", marginBottom: "1.4em" },
        ".nt-app .nt-doc strong": { fontWeight: "650", color: fg },
        ".nt-app .nt-doc ul, .nt-app .nt-doc ol": { paddingLeft: "1.4em", margin: "0 0 1.1em" },
        ".nt-app .nt-doc li": { fontSize: "16px", lineHeight: "1.7", marginBottom: ".35em" },
        ".nt-app .nt-doc ul.todo": { listStyle: "none", paddingLeft: ".2em" },
        ".nt-app .nt-doc ul.todo li": { position: "relative", paddingLeft: "30px", cursor: "pointer" },
        ".nt-app .nt-doc ul.todo li::before": {
          content: '""', position: "absolute", left: "0", top: "4px",
          width: "18px", height: "18px", borderRadius: "5px",
          border: "1.5px solid var(--nt-border-2)", background: "rgb(var(--nt-panel))",
          transition: "all .15s cubic-bezier(.4,0,.2,1)",
        },
        '.nt-app .nt-doc ul.todo li[data-done="true"]::before': { background: "rgb(var(--nt-accent))", borderColor: "rgb(var(--nt-accent))" },
        '.nt-app .nt-doc ul.todo li[data-done="true"]::after': {
          content: '""', position: "absolute", left: "6px", top: "7px",
          width: "5px", height: "9px", border: "solid rgb(var(--nt-on-accent))",
          borderWidth: "0 2px 2px 0", transform: "rotate(45deg)",
        },
        '.nt-app .nt-doc ul.todo li[data-done="true"]': { color: "rgb(var(--nt-fg-subtle))", textDecoration: "line-through" },
        ".nt-app .nt-doc blockquote": { margin: "1.3em 0", padding: "4px 0 4px 18px", borderLeft: "3px solid rgb(var(--nt-accent))", color: "rgb(var(--nt-fg-muted))", fontStyle: "italic", fontSize: "16px", lineHeight: "1.65" },
        ".nt-app .nt-doc code": { fontFamily: "'IBM Plex Mono', ui-monospace, monospace", fontSize: ".86em", background: "var(--nt-hover-strong)", padding: "2px 6px", borderRadius: "5px", color: "rgb(var(--nt-accent-fg))", border: `1px solid ${border}` },
        ".nt-app .nt-doc pre": { background: "rgb(var(--nt-bg))", border: `1px solid ${border}`, borderRadius: "9px", padding: "16px 18px", overflow: "auto", margin: "1.2em 0" },
        ".nt-app .nt-doc pre code": { background: "none", border: "none", padding: "0", color: fg },
        ".nt-app .nt-doc table": { width: "100%", borderCollapse: "collapse", margin: "1.3em 0", fontSize: "14.5px", border: `1px solid ${border}`, borderRadius: "9px", overflow: "hidden" },
        ".nt-app .nt-doc th, .nt-app .nt-doc td": { textAlign: "left", padding: "9px 14px", borderBottom: `1px solid ${border}` },
        ".nt-app .nt-doc th": { background: "rgb(var(--nt-panel))", fontWeight: "600", color: "rgb(var(--nt-fg-muted))", fontSize: "12.5px", letterSpacing: ".02em", textTransform: "uppercase" },
        ".nt-app .nt-doc td": { borderRight: `1px solid ${border}` },
        ".nt-app .nt-doc tr:last-child td": { borderBottom: "none" },
        ".nt-app .nt-doc td:last-child, .nt-app .nt-doc th:last-child": { borderRight: "none" },
        ".nt-app .nt-doc tbody tr:hover": { background: "var(--nt-hover)" },
        ".nt-app .nt-doc hr": { border: "none", height: "1px", background: "var(--nt-border-2)", margin: "1.6em 0" },
        ".nt-app .nt-doc .callout": { borderLeft: "3px solid rgb(var(--nt-c-info))", background: "rgb(var(--nt-c-info) / .09)", borderRadius: "9px", padding: "12px 16px", margin: "1.2em 0" },
        ".nt-app .nt-doc .callout > p": { marginBottom: ".5em" },
        ".nt-app .nt-doc .callout > p:last-child": { marginBottom: "0" },
        '.nt-app .nt-doc .callout[data-kind="success"]': { borderLeftColor: "rgb(var(--nt-c-success))", background: "rgb(var(--nt-c-success) / .09)" },
        '.nt-app .nt-doc .callout[data-kind="warning"]': { borderLeftColor: "rgb(var(--nt-c-warning))", background: "rgb(var(--nt-c-warning) / .09)" },
        '.nt-app .nt-doc .callout[data-kind="error"]': { borderLeftColor: "rgb(var(--nt-c-error))", background: "rgb(var(--nt-c-error) / .09)" },
        ".nt-app .nt-doc .wikilink": { color: "rgb(var(--nt-accent-fg))", textDecoration: "none", cursor: "pointer", borderBottom: "1px solid rgb(var(--nt-accent) / .35)", paddingBottom: "1px", borderRadius: "2px", transition: "background .12s" },
        '.nt-app .nt-doc .wikilink::before': { content: '"[["', opacity: ".4", fontSize: ".85em" },
        '.nt-app .nt-doc .wikilink::after': { content: '"]]"', opacity: ".4", fontSize: ".85em" },
        ".nt-app .nt-doc .wikilink:hover": { background: "rgb(var(--nt-accent) / .15)" },
        ".nt-app .nt-doc.serif p, .nt-app .nt-doc.serif li, .nt-app .nt-doc.serif blockquote": { fontFamily: "Georgia, Cambria, 'Times New Roman', serif", fontSize: "18px" },
        ".nt-app .nt-doc.serif h1, .nt-app .nt-doc.serif h2, .nt-app .nt-doc.serif h3": { fontFamily: "Georgia, Cambria, 'Times New Roman', serif" },
        // Thin, theme-aware scrollbar (opt-in on scroll containers).
        ".nt-scroll": { scrollbarWidth: "thin", scrollbarColor: "var(--nt-border-2) transparent" },
        ".nt-scroll::-webkit-scrollbar": { width: "10px", height: "10px" },
        ".nt-scroll::-webkit-scrollbar-thumb": { background: "var(--nt-border-2)", borderRadius: "99px", border: "3px solid transparent", backgroundClip: "padding-box" },
        ".nt-scroll::-webkit-scrollbar-thumb:hover": { background: "rgb(var(--nt-fg-subtle))", backgroundClip: "padding-box" },
      })
      // ── CKEditor (the notas editor) — Lark chrome skinned with nt tokens ──
      // Every var references an nt var, so light/dark flip for free. Balloons
      // mount on <body>: NotesEditor stamps `.nt-app`+data-theme on CKEditor's
      // .ck-body-wrapper so these resolve there too.
      addBase({
        ".nt-app": {
          "--ck-border-radius": "8px",
          "--ck-font-size-base": "13px",
          "--ck-color-base-background": "rgb(var(--nt-doc))",
          "--ck-color-base-foreground": "rgb(var(--nt-panel-2))",
          "--ck-color-base-border": "var(--nt-border)",
          "--ck-color-base-action": "rgb(var(--nt-c-success))",
          "--ck-color-base-focus": "rgb(var(--nt-accent))",
          "--ck-color-base-text": "rgb(var(--nt-fg))",
          "--ck-color-base-active": "rgb(var(--nt-accent))",
          "--ck-color-base-active-focus": "rgb(var(--nt-accent))",
          "--ck-color-text": "rgb(var(--nt-fg))",
          "--ck-color-engine-placeholder-text": "rgb(var(--nt-fg-subtle))",
          "--ck-color-focus-border": "rgb(var(--nt-accent) / .55)",
          "--ck-color-focus-outer-shadow": "rgb(var(--nt-accent) / .18)",
          "--ck-color-shadow-drop": "rgb(0 0 0 / .3)",
          "--ck-color-shadow-inner": "transparent",
          "--ck-color-button-default-background": "transparent",
          "--ck-color-button-default-hover-background": "var(--nt-hover-strong)",
          "--ck-color-button-default-active-background": "var(--nt-hover-strong)",
          "--ck-color-button-default-disabled-background": "transparent",
          "--ck-color-button-on-background": "rgb(var(--nt-accent) / .15)",
          "--ck-color-button-on-hover-background": "rgb(var(--nt-accent) / .22)",
          "--ck-color-button-on-active-background": "rgb(var(--nt-accent) / .25)",
          "--ck-color-button-on-disabled-background": "transparent",
          "--ck-color-button-on-color": "rgb(var(--nt-accent-fg))",
          "--ck-color-button-action-background": "rgb(var(--nt-accent))",
          "--ck-color-button-action-hover-background": "rgb(var(--nt-600))",
          "--ck-color-button-action-active-background": "rgb(var(--nt-600))",
          "--ck-color-button-action-text": "rgb(var(--nt-on-accent))",
          "--ck-color-switch-button-off-background": "rgb(var(--nt-fg-subtle))",
          "--ck-color-switch-button-on-background": "rgb(var(--nt-accent))",
          "--ck-color-dropdown-panel-background": "rgb(var(--nt-panel))",
          "--ck-color-dropdown-panel-border": "var(--nt-border-2)",
          "--ck-color-input-background": "rgb(var(--nt-bg-2))",
          "--ck-color-input-border": "var(--nt-border-2)",
          "--ck-color-input-error-border": "rgb(var(--nt-c-error))",
          "--ck-color-input-text": "rgb(var(--nt-fg))",
          "--ck-color-input-disabled-background": "var(--nt-hover)",
          "--ck-color-input-disabled-border": "var(--nt-border)",
          "--ck-color-input-disabled-text": "rgb(var(--nt-fg-subtle))",
          "--ck-color-list-background": "rgb(var(--nt-panel))",
          "--ck-color-list-button-hover-background": "var(--nt-hover-strong)",
          "--ck-color-list-button-on-background": "rgb(var(--nt-accent))",
          "--ck-color-list-button-on-background-focus": "rgb(var(--nt-accent))",
          "--ck-color-list-button-on-text": "rgb(var(--nt-on-accent))",
          "--ck-color-panel-background": "rgb(var(--nt-panel))",
          "--ck-color-panel-border": "var(--nt-border-2)",
          "--ck-color-toolbar-background": "rgb(var(--nt-panel))",
          "--ck-color-toolbar-border": "var(--nt-border)",
          "--ck-color-tooltip-background": "rgb(var(--nt-elevated))",
          "--ck-color-tooltip-text": "rgb(var(--nt-fg))",
          "--ck-color-widget-blurred-border": "var(--nt-border-2)",
          "--ck-color-widget-hover-border": "rgb(var(--nt-accent) / .5)",
          "--ck-color-widget-editable-focus-background": "rgb(var(--nt-doc))",
          "--ck-color-link-default": "rgb(var(--nt-accent-fg))",
        },
      })
      addComponents({
        // The editor owns the pane's scrolling: toolbar fixed, content scrolls.
        ".nt-app .ck.ck-editor": { display: "flex", flexDirection: "column", height: "100%" },
        ".nt-app .ck.ck-editor__main": { flex: "1 1 0%", minHeight: "0", overflowY: "auto", background: "rgb(var(--nt-bg-1))" },
        ".nt-app .ck.ck-editor__main > .ck-editor__editable": { border: "none" },
        // Editor layout (outranks CKEditor's own `.ck.ck-editor__editable_inline`
        // padding): full pane width — the pane itself is the page.
        ".nt-app .ck.ck-editor__main > .ck-editor__editable.nt-doc": {
          maxWidth: "none",
          margin: "0",
          padding: "40px clamp(24px, 4%, 64px) 200px",
          minHeight: "100%",
          border: "none",
        },
        ".nt-app .ck.ck-editor__editable.ck-focused:not(.ck-editor__nested-editable)": { border: "none", boxShadow: "none" },
        ".nt-app .ck.ck-editor__top .ck-sticky-panel .ck-toolbar": { border: "none", borderBottom: "1px solid var(--nt-border)", padding: "4px 8px" },
        ".nt-app .ck.ck-toolbar .ck.ck-toolbar__separator": { background: "var(--nt-border-2)" },
        ".nt-app .nt-mention-item": { fontSize: "13px" },
        ".nt-app .nt-mention-new": { fontStyle: "italic" },
        // CKEditor wraps tables in figure.table; its own `.ck-content .table table`
        // rules outrank the plain `.nt-doc table` look, so the nt table style is
        // re-stated at figure specificity.
        ".nt-app .nt-doc figure.table": { margin: "1.3em 0", width: "100%" },
        ".nt-app .nt-doc figure.table table": {
          margin: "0",
          width: "100%",
          borderCollapse: "collapse",
          border: "1px solid var(--nt-border)",
          fontSize: "14.5px",
        },
        ".nt-app .nt-doc figure.table table th, .nt-app .nt-doc figure.table table td": {
          textAlign: "left",
          padding: "9px 14px",
          border: "none",
          borderBottom: "1px solid var(--nt-border)",
          borderRight: "1px solid var(--nt-border)",
        },
        ".nt-app .nt-doc figure.table table th": {
          background: "rgb(var(--nt-panel))",
          fontWeight: "600",
          color: "rgb(var(--nt-fg-muted))",
          fontSize: "12.5px",
          letterSpacing: ".02em",
          textTransform: "uppercase",
        },
        ".nt-app .nt-doc figure.table table tr:last-child td": { borderBottom: "none" },
        ".nt-app .nt-doc figure.table table td:last-child, .nt-app .nt-doc figure.table table th:last-child": {
          borderRight: "none",
        },
        // CKEditor's todo markup, restyled to the nt checkbox look. `.nt-app`
        // prefix outranks the bundle's own content styles (injected later).
        ".nt-app .nt-doc ul.todo-list": { listStyle: "none", paddingLeft: ".2em" },
        ".nt-app .nt-doc .todo-list .todo-list__label > input": {
          WebkitAppearance: "none",
          appearance: "none",
          width: "18px",
          height: "18px",
          borderRadius: "5px",
          border: "1.5px solid var(--nt-border-2)",
          background: "rgb(var(--nt-panel))",
          position: "relative",
          verticalAlign: "-4px",
          marginRight: "10px",
          cursor: "pointer",
          transition: "all .15s cubic-bezier(.4,0,.2,1)",
        },
        ".nt-app .nt-doc .todo-list .todo-list__label > input::before": { display: "none" },
        ".nt-app .nt-doc .todo-list .todo-list__label > input::after": {
          content: '""',
          position: "absolute",
          left: "5.5px",
          top: "2.5px",
          width: "5px",
          height: "9px",
          border: "solid rgb(var(--nt-on-accent))",
          borderWidth: "0 2px 2px 0",
          transform: "rotate(45deg)",
          display: "none",
        },
        ".nt-app .nt-doc .todo-list .todo-list__label > input:checked": {
          background: "rgb(var(--nt-accent))",
          borderColor: "rgb(var(--nt-accent))",
        },
        ".nt-app .nt-doc .todo-list .todo-list__label > input:checked::after": { display: "block" },
        ".nt-app .nt-doc .todo-list .todo-list__label > input:checked ~ .todo-list__label__description": {
          color: "rgb(var(--nt-fg-subtle))",
          textDecoration: "line-through",
        },
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
    // ── PC (SmartRotom) ───────────────────────────────────────────────────────
    // Dark-only slate console, scoped to `.pc-app`. Four things live here that
    // genuinely cannot be utilities: the palette (the component classes below
    // read it back out of the vars), the frosted-glass panel, the storage slot
    // (a four-layer inset shadow plus six mutually-composable states), and the
    // ten box wallpapers — which MUST be literal classes, because the box theme
    // is data-driven and `theme-${t}` would never compile (SMARTROTOM_V3.md §4).
    plugin(({ addBase, addComponents }) => {
      addBase({
        ".pc-app": {
          "--pc-bg": "7 11 22",
          "--pc-bg-1": "11 17 32",
          "--pc-bg-2": "15 23 42",
          "--pc-fg": "238 242 251",
          "--pc-fg-muted": "174 187 212",
          "--pc-fg-subtle": "107 122 153",
          "--pc-accent": "79 155 255",
          "--pc-accent-strong": "47 123 240",
          "--pc-cyan": "56 211 224",
          "--pc-violet": "167 139 250",
          "--pc-green": "56 211 159",
          "--pc-amber": "245 183 64",
          "--pc-rose": "251 113 133",
          "--pc-gold": "252 211 77",
          "--pc-line": "rgb(120 140 175 / .16)",
          "--pc-line-strong": "rgb(130 155 195 / .30)",
          "--pc-panel": "rgb(20 29 48 / .72)",
          "--pc-panel-2": "rgb(30 41 59 / .55)",
          "--pc-panel-solid": "17 26 46",
          colorScheme: "dark",
        },
        ".pc-app ::selection": { background: "rgb(var(--pc-accent) / .35)" },
        ".pc-app :focus-visible": {
          outline: "2px solid rgb(var(--pc-accent))",
          outlineOffset: "2px",
          borderRadius: "4px",
        },
        ".pc-app ::-webkit-scrollbar": { width: "10px", height: "10px" },
        ".pc-app ::-webkit-scrollbar-track": { background: "transparent" },
        ".pc-app ::-webkit-scrollbar-thumb": {
          background: "rgb(120 140 175 / .22)",
          borderRadius: "99px",
          border: "2px solid transparent",
          backgroundClip: "content-box",
        },
        ".pc-app ::-webkit-scrollbar-thumb:hover": { background: "rgb(120 140 175 / .4)", backgroundClip: "content-box" },
      })
      addComponents({
        // The console void: an accent bloom top-right, a violet one bottom-left.
        ".pc-canvas": {
          background:
            "radial-gradient(1200px 700px at 78% -10%, rgb(var(--pc-accent) / .13), transparent 60%)," +
            "radial-gradient(900px 600px at 5% 110%, rgb(var(--pc-violet) / .12), transparent 55%)," +
            "linear-gradient(160deg, rgb(var(--pc-bg-1)), rgb(var(--pc-bg)) 70%)",
        },
        // Every panel in the app. Backdrop-filter is the whole point — the box
        // wallpaper has to bleed through the chrome sitting on top of it.
        ".pc-glass": {
          background: "var(--pc-panel)",
          backdropFilter: "blur(16px) saturate(120%)",
          WebkitBackdropFilter: "blur(16px) saturate(120%)",
          border: "1px solid var(--pc-line)",
        },
        // A storage slot. The states compose (a favourite can also be selected
        // and a drop target), so they are additive classes, not an enum.
        ".pc-slot": {
          position: "relative",
          width: "100%",
          aspectRatio: "1",
          borderRadius: "10px",
          border: "1px solid var(--pc-line)",
          background: "linear-gradient(180deg, rgb(13 20 36 / .5), rgb(9 14 26 / .65))",
          boxShadow: "inset 0 1px 0 rgb(255 255 255 / .04), inset 0 -8px 16px -10px rgb(0 0 0 / .6)",
          transition: "transform .12s cubic-bezier(.22,.61,.36,1), border-color .14s, box-shadow .14s, background .14s",
          cursor: "pointer",
          userSelect: "none",
        },
        ".pc-slot-empty": {
          background: "linear-gradient(180deg, rgb(255 255 255 / .015), rgb(0 0 0 / .12))",
          borderStyle: "dashed",
          borderColor: "rgb(120 140 175 / .18)",
          cursor: "default",
        },
        ".pc-slot:not(.pc-slot-empty):hover": {
          transform: "translateY(-3px)",
          borderColor: "var(--pc-line-strong)",
          boxShadow: "0 12px 22px -12px rgb(0 0 0 / .8), inset 0 1px 0 rgb(255 255 255 / .06)",
          zIndex: "2",
        },
        ".pc-slot-selected": {
          borderColor: "rgb(var(--pc-accent))",
          boxShadow: "0 0 0 1px rgb(var(--pc-accent) / .4), 0 0 24px -2px rgb(var(--pc-accent) / .35)",
        },
        ".pc-slot-multi": {
          borderColor: "rgb(var(--pc-cyan))",
          boxShadow: "0 0 0 1px rgb(var(--pc-cyan)), 0 0 18px -4px rgb(var(--pc-cyan) / .5)",
        },
        ".pc-slot-compare": {
          borderColor: "rgb(var(--pc-violet))",
          boxShadow: "0 0 0 1px rgb(var(--pc-violet))",
        },
        ".pc-slot-drop": {
          borderColor: "rgb(var(--pc-green))",
          borderStyle: "solid",
          boxShadow: "0 0 0 2px rgb(var(--pc-green)), 0 0 22px -2px rgb(var(--pc-green) / .6)",
          background: "rgb(var(--pc-green) / .12)",
        },
        ".pc-slot-dragging": { opacity: ".35" },
        // The favourite ring is a pseudo-element so it layers under the sprite
        // without a wrapper and without eating pointer events.
        ".pc-slot-fav::before": {
          content: '""',
          position: "absolute",
          inset: "-1px",
          borderRadius: "inherit",
          boxShadow: "inset 0 0 14px -2px rgb(var(--pc-gold) / .55)",
          pointerEvents: "none",
        },
        // ── Box wallpapers ────────────────────────────────────────────────────
        // Ten named gradients + a shared dot screen and vignette. Literal classes
        // on purpose: the theme is a data value, so it is mapped to a full class
        // name in `_utils/boxThemes.ts` — never interpolated (§4, audit gap G2).
        ".pc-wp": { position: "absolute", inset: "0", opacity: ".9" },
        ".pc-wp::after": {
          content: '""',
          position: "absolute",
          inset: "0",
          background:
            "radial-gradient(120% 80% at 50% 0%, rgb(255 255 255 / .05), transparent 60%)," +
            "linear-gradient(180deg, transparent, rgb(var(--pc-bg) / .55))",
        },
        ".pc-wp-dots": {
          backgroundImage: "radial-gradient(rgb(255 255 255 / .06) 1px, transparent 1.4px)",
          backgroundSize: "18px 18px",
        },
        ".pc-wp-classic": { background: "linear-gradient(160deg,#1b2742,#0e1626)" },
        ".pc-wp-forest": { background: "linear-gradient(160deg,#143226,#0c1b16)" },
        ".pc-wp-ocean": { background: "linear-gradient(160deg,#10314a,#0a1a2c)" },
        ".pc-wp-volcano": { background: "linear-gradient(160deg,#3a1b1b,#1c0f12)" },
        ".pc-wp-space": { background: "linear-gradient(160deg,#241845,#0d0a1e)" },
        ".pc-wp-meadow": { background: "linear-gradient(160deg,#2a3318,#12180c)" },
        ".pc-wp-dusk": { background: "linear-gradient(160deg,#3a234a,#171026)" },
        ".pc-wp-cave": { background: "linear-gradient(160deg,#222733,#0e1118)" },
        ".pc-wp-rainbow": { background: "linear-gradient(125deg,#3a1d3f,#1c2748 45%,#123333)" },
        ".pc-wp-sakura": { background: "linear-gradient(160deg,#3d2336,#1d1320)" },
        // The boot screen's CRT sweep — a pseudo-element, so not a utility.
        ".pc-boot-scan": {
          position: "absolute",
          inset: "0",
          pointerEvents: "none",
          background: "repeating-linear-gradient(0deg, rgb(255 255 255 / .022) 0 1px, transparent 1px 3px)",
          opacity: ".55",
        },
        ".pc-boot-scan::after": {
          content: '""',
          position: "absolute",
          left: "0",
          right: "0",
          top: "-45%",
          height: "45%",
          background: "linear-gradient(180deg, transparent, rgb(var(--pc-accent) / .10), transparent)",
          animation: "pcBootSweep 2.6s cubic-bezier(.22,.61,.36,1) infinite",
        },
      })
    }),
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
        // Grimdark — soot-black board, bone parchment, iron-gall ink.
        '.ms-app[data-palette="grimdark"]': {
          "--ms-board-1": "42 24 16",
          "--ms-board-2": "26 14 7",
          "--ms-board-3": "14 8 5",
          "--ms-board-frame": "5 2 1",
          "--ms-board-frame-hi": "58 36 24",
          "--ms-paper-1": "200 180 137",
          "--ms-paper-2": "168 148 109",
          "--ms-paper-3": "122 104 74",
          "--ms-paper-edge": "74 58 34",
          "--ms-ink-1": "24 16 10",
          "--ms-ink-2": "40 30 18",
          "--ms-ink-3": "74 58 34",
          "--ms-ink-4": "106 90 58",
          "--ms-gold-1": "216 192 138",
          "--ms-gold-2": "168 132 28",
          "--ms-gold-3": "110 84 24",
          "--ms-gold-4": "58 44 12",
          "--ms-seal-active": "138 104 24",
          "--ms-seal-available": "142 28 14",
          "--ms-seal-completed": "74 10 8",
          "--ms-seal-failed": "10 10 10",
          "--ms-seal-locked": "42 32 24",
          "--ms-stamp-red": "138 20 20",
          "--ms-stamp-gold": "110 84 24",
          "--ms-paper-shadow": "rgba(0, 0, 0, .7)",
        },
        // Royal — midnight-blue board, cream parchment, silver-and-gold seals.
        '.ms-app[data-palette="royal"]': {
          "--ms-board-1": "30 39 86",
          "--ms-board-2": "18 24 58",
          "--ms-board-3": "10 14 38",
          "--ms-board-frame": "10 14 38",
          "--ms-board-frame-hi": "58 70 130",
          "--ms-paper-1": "242 230 200",
          "--ms-paper-2": "226 212 173",
          "--ms-paper-3": "196 183 138",
          "--ms-paper-edge": "110 96 56",
          "--ms-ink-1": "27 26 46",
          "--ms-ink-2": "42 38 64",
          "--ms-ink-3": "74 70 104",
          "--ms-ink-4": "106 102 136",
          "--ms-gold-1": "232 216 160",
          "--ms-gold-2": "194 160 76",
          "--ms-gold-3": "142 108 32",
          "--ms-gold-4": "90 68 12",
          "--ms-seal-active": "194 160 76",
          "--ms-seal-available": "74 76 158",
          "--ms-seal-completed": "44 42 94",
          "--ms-seal-failed": "42 42 58",
          "--ms-seal-locked": "90 76 106",
          "--ms-stamp-red": "138 52 52",
          "--ms-stamp-gold": "142 108 32",
          "--ms-paper-shadow": "rgba(8, 12, 38, .55)",
        },
        // Forest — mossy board, sun-bleached parchment, verdigris seals.
        '.ms-app[data-palette="forest"]': {
          "--ms-board-1": "42 62 34",
          "--ms-board-2": "27 42 22",
          "--ms-board-3": "14 26 10",
          "--ms-board-frame": "26 42 20",
          "--ms-board-frame-hi": "74 94 58",
          "--ms-paper-1": "239 224 184",
          "--ms-paper-2": "221 201 152",
          "--ms-paper-3": "192 170 120",
          "--ms-paper-edge": "106 84 48",
          "--ms-ink-1": "30 36 16",
          "--ms-ink-2": "46 58 24",
          "--ms-ink-3": "74 90 40",
          "--ms-ink-4": "106 122 68",
          "--ms-gold-1": "232 200 144",
          "--ms-gold-2": "192 138 60",
          "--ms-gold-3": "138 90 32",
          "--ms-gold-4": "74 46 12",
          "--ms-seal-active": "62 122 58",
          "--ms-seal-available": "176 74 28",
          "--ms-seal-completed": "74 36 16",
          "--ms-seal-failed": "42 24 18",
          "--ms-seal-locked": "58 52 34",
          "--ms-stamp-red": "156 58 40",
          "--ms-stamp-gold": "138 90 32",
          "--ms-paper-shadow": "rgba(20, 30, 12, .55)",
        },
        // Nocturno — starless-night board, moonlit parchment, ember seals.
        '.ms-app[data-palette="nocturno"]': {
          "--ms-board-1": "26 34 56",
          "--ms-board-2": "14 20 36",
          "--ms-board-3": "7 11 22",
          "--ms-board-frame": "6 9 18",
          "--ms-board-frame-hi": "46 58 94",
          "--ms-paper-1": "239 226 188",
          "--ms-paper-2": "221 202 154",
          "--ms-paper-3": "194 171 120",
          "--ms-paper-edge": "106 90 56",
          "--ms-ink-1": "34 26 16",
          "--ms-ink-2": "54 41 26",
          "--ms-ink-3": "90 72 48",
          "--ms-ink-4": "122 104 72",
          "--ms-gold-1": "255 217 138",
          "--ms-gold-2": "232 176 76",
          "--ms-gold-3": "176 124 36",
          "--ms-gold-4": "110 74 16",
          "--ms-seal-active": "217 152 40",
          "--ms-seal-available": "184 67 28",
          "--ms-seal-completed": "106 36 16",
          "--ms-seal-failed": "22 22 22",
          "--ms-seal-locked": "58 54 80",
          "--ms-stamp-red": "176 52 38",
          "--ms-stamp-gold": "176 124 36",
          "--ms-paper-shadow": "rgba(2, 5, 14, .7)",
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
          backgroundImage: "url('/assets/misiones/textures/wall-bg.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          mixBlendMode: "overlay",
          opacity: ".7",
        },
        // ── Swappable surface textures for the showcase (ancestor toggle) ──
        "[data-surface='corcho'] .ms-tavern::after": {
          backgroundImage: "url('/assets/misiones/textures/cork-board.png')",
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
          opacity: ".6",
        },
        "[data-surface='cuero'] .ms-tavern::after": {
          backgroundImage: "url('/assets/misiones/textures/leather-grain.png')",
          backgroundSize: "520px 520px",
          backgroundRepeat: "repeat",
          opacity: ".5",
        },
        "[data-surface='fieltro'] .ms-tavern::after": {
          backgroundImage: "url('/assets/misiones/textures/felt.png')",
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
          opacity: ".55",
        },
        "[data-surface='piedra'] .ms-tavern::after": {
          backgroundImage: "url('/assets/misiones/textures/slate.png')",
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
          opacity: ".62",
        },
        "[data-surface='fieltro'] .ms-tavern": {
          filter: "saturate(.9)",
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
          backgroundColor: "#9c7440",
          backgroundImage:
            "url('/assets/misiones/textures/cork-board.png')," +
            "radial-gradient(ellipse at 50% 32%, rgba(0,0,0,0) 45%, rgba(40,24,10,.42))," +
            "linear-gradient(180deg, #bd925a, #9c7440 58%, #85602f)",
          backgroundSize: "440px, cover, cover",
          backgroundBlendMode: "overlay, normal, normal",
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
          backgroundImage:
            "url('/assets/misiones/textures/wood-planks.png')," +
            "linear-gradient(90deg, rgb(var(--ms-board-frame)), rgb(var(--ms-board-frame-hi)) 42%, rgb(var(--ms-board-frame-hi)) 58%, rgb(var(--ms-board-frame)))",
          backgroundSize: "100% 100%, cover",
          backgroundBlendMode: "overlay, normal",
          boxShadow:
            "inset 0 0 20px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,200,.06), inset 0 -1px 0 rgba(0,0,0,.4)",
          color: "rgb(var(--ms-gold-1))",
        },
        // ── Side rail: raised panel above the board (layers on .ms-wood; texture-overlay TODO) ──
        ".ms-side-rail": {
          position: "relative",
          zIndex: "3",
          boxShadow:
            "7px 0 26px -6px rgba(0,0,0,.72), inset -3px 0 0 rgba(0,0,0,.55)," +
            "inset 4px 0 10px -6px rgba(255,220,150,.18), inset 0 0 20px rgba(0,0,0,.5)",
        },
        // ── Parchment control panel (filters bar; texture-overlay TODO) ─────
        ".ms-filters": {
          position: "relative",
          borderRadius: "10px",
          padding: "16px 18px 18px",
          background:
            "radial-gradient(ellipse at 18% 12%, rgba(120,70,30,.07), transparent 55%)," +
            "radial-gradient(ellipse at 50% 50%, rgb(var(--ms-paper-1)), rgb(var(--ms-paper-2)) 72%, rgb(var(--ms-paper-3)))",
          border: "1px solid rgb(var(--ms-ink-3))",
          boxShadow:
            "0 14px 30px -14px rgba(0,0,0,.55), inset 0 0 44px rgba(80,50,20,.14), inset 0 1px 0 rgba(255,255,255,.35)",
          color: "rgb(var(--ms-ink-1))",
        },
        ".ms-filters-rule": {
          flex: "1",
          height: "2px",
          borderRadius: "2px",
          background: "linear-gradient(90deg, rgba(90,60,30,.45), rgba(90,60,30,.10) 70%, transparent)",
        },
        ".ms-filters-divider": {
          height: "1px",
          margin: "14px 0 12px",
          background:
            "linear-gradient(90deg, transparent, rgba(60,40,20,.30) 15%, rgba(60,40,20,.30) 85%, transparent)",
          boxShadow: "0 1px 0 rgba(255,255,255,.4)",
        },
        // ── Wooden frame around the cork board (wraps .ms-cork) ──
        ".ms-board-frame": {
          position: "relative",
          padding: "22px",
          borderRadius: "12px",
          border: "1px solid rgba(0,0,0,.55)",
          backgroundImage:
            "url('/assets/misiones/textures/wall-planks.png')," +
            "linear-gradient(180deg, rgb(var(--ms-board-frame-hi)), rgb(var(--ms-board-frame)) 50%, rgb(var(--ms-board-3)))",
          backgroundSize: "340px, cover",
          backgroundBlendMode: "overlay, normal",
          boxShadow:
            "0 18px 46px -10px rgba(0,0,0,.72), inset 0 3px 0 rgba(255,220,150,.22)," +
            "inset 0 -5px 10px rgba(0,0,0,.55), inset 3px 0 6px rgba(0,0,0,.32), inset -3px 0 6px rgba(0,0,0,.32)",
        },
        ".ms-board-frame::after": {
          content: '""',
          position: "absolute",
          inset: "22px",
          borderRadius: "5px",
          pointerEvents: "none",
          boxShadow: "0 0 0 2px rgba(0,0,0,.5), inset 0 0 14px rgba(0,0,0,.5)",
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
          color: "rgb(var(--ms-gold-1) / .85)",
          backgroundImage:
            "url('/assets/misiones/textures/leather-grain.png')," +
            "linear-gradient(90deg, rgb(var(--ms-board-frame-hi)), rgb(var(--ms-board-frame)) 80%, transparent)",
          backgroundSize: "160px, cover",
          backgroundBlendMode: "overlay, normal",
          borderLeft: "3px solid transparent",
          cursor: "pointer",
          transition: "all .15s",
        },
        ".ms-tab:hover": {
          background: "linear-gradient(90deg, rgb(var(--ms-board-frame-hi)), rgb(var(--ms-board-frame)) 80%, transparent)",
          filter: "brightness(1.25)",
          color: "rgb(var(--ms-gold-1))",
        },
        ".ms-tab[aria-current='page']": {
          background: "linear-gradient(90deg, rgb(var(--ms-board-frame-hi)), rgb(var(--ms-board-frame)) 80%, transparent)",
          filter: "brightness(1.45)",
          color: "rgb(var(--ms-gold-1))",
          borderLeftColor: "rgb(var(--ms-gold-2))",
          boxShadow: "inset 6px 0 18px -6px rgb(var(--ms-gold-1) / .25)",
        },
        // ── Menu-item variants — same `.ms-tab` markup, restyled by an
        // ancestor `[data-tabstyle]`. Leather (above) stays the default.
        // Placa — a raised carved-wood plaque.
        "[data-tabstyle='placa'] nav": { padding: "16px 12px", gap: "9px" },
        "[data-tabstyle='placa'] .ms-tab": {
          borderRadius: "6px",
          background: "linear-gradient(180deg, rgb(var(--ms-board-frame-hi)), rgb(var(--ms-board-frame)))",
          border: "1px solid rgba(0,0,0,.55)",
          boxShadow:
            "inset 0 1px 0 rgba(255,220,150,.20), inset 0 -2px 4px rgba(0,0,0,.4), 0 2px 4px rgba(0,0,0,.4)",
          color: "rgb(var(--ms-gold-1))",
        },
        "[data-tabstyle='placa'] .ms-tab:hover": {
          filter: "brightness(1.14)",
          transform: "translateX(3px)",
        },
        "[data-tabstyle='placa'] .ms-tab[aria-current='page']": {
          background: "linear-gradient(180deg, rgb(var(--ms-gold-3)), rgb(var(--ms-gold-4)))",
          color: "#20140a",
          borderColor: "rgb(var(--ms-gold-4))",
          boxShadow: "inset 0 2px 5px rgba(0,0,0,.45), 0 0 14px -4px rgb(var(--ms-gold-2))",
        },
        "[data-tabstyle='placa'] .ms-tab[aria-current='page'] > span:nth-child(3)": { display: "none" },
        // Sello — a wax-seal medallion.
        "[data-tabstyle='sello'] nav": { padding: "14px 10px", gap: "4px" },
        "[data-tabstyle='sello'] .ms-tab": {
          background: "none",
          borderLeft: "none",
          padding: "8px 10px",
          borderRadius: "10px",
          color: "rgb(var(--ms-gold-1))",
          gap: "12px",
        },
        "[data-tabstyle='sello'] .ms-tab > span:first-child": {
          width: "36px",
          height: "36px",
          borderRadius: "50%",
          display: "grid",
          placeItems: "center",
          opacity: "1",
          background: "radial-gradient(circle at 36% 30%, rgb(var(--ms-seal-available)), rgb(var(--ms-seal-completed)))",
          color: "#f5d785",
          fontSize: "15px",
          boxShadow:
            "inset 0 -2px 5px rgba(0,0,0,.5), inset 0 2px 3px rgba(255,220,150,.25), 0 2px 4px rgba(0,0,0,.45)",
        },
        "[data-tabstyle='sello'] .ms-tab:hover": { background: "rgba(255,220,150,.06)" },
        "[data-tabstyle='sello'] .ms-tab[aria-current='page']": { background: "rgba(255,220,150,.10)" },
        "[data-tabstyle='sello'] .ms-tab[aria-current='page'] > span:first-child": {
          background: "radial-gradient(circle at 36% 30%, rgb(var(--ms-gold-2)), rgb(var(--ms-gold-4)))",
          boxShadow: "0 0 14px -2px rgb(var(--ms-gold-2)), inset 0 -2px 5px rgba(0,0,0,.4)",
        },
        "[data-tabstyle='sello'] .ms-tab[aria-current='page'] > span:nth-child(3)": { display: "none" },
        // Grabado — engraved brass, minimal.
        "[data-tabstyle='grabado'] nav": { padding: "10px 0", gap: "0" },
        "[data-tabstyle='grabado'] .ms-tab": {
          background: "none",
          padding: "13px 20px",
          color: "rgb(var(--ms-gold-2))",
          letterSpacing: ".16em",
          borderLeft: "3px solid transparent",
          borderBottom: "1px solid rgba(255,220,150,.07)",
        },
        "[data-tabstyle='grabado'] .ms-tab > span:first-child": { opacity: ".5" },
        "[data-tabstyle='grabado'] .ms-tab:hover": {
          color: "rgb(var(--ms-gold-1))",
          background: "linear-gradient(90deg, rgba(255,220,150,.06), transparent 70%)",
        },
        "[data-tabstyle='grabado'] .ms-tab[aria-current='page']": {
          color: "rgb(var(--ms-gold-1))",
          borderLeftColor: "rgb(var(--ms-gold-2))",
          textShadow: "0 0 8px rgba(255,220,150,.45)",
          background: "linear-gradient(90deg, rgba(255,220,150,.12), transparent 72%)",
        },
        "[data-tabstyle='grabado'] .ms-tab[aria-current='page'] > span:nth-child(3)": { display: "none" },
        // Estandarte — a heraldic hanging banner.
        "[data-tabstyle='estandarte'] nav": { padding: "16px 14px", gap: "11px" },
        "[data-tabstyle='estandarte'] .ms-tab": {
          padding: "12px 14px 17px",
          border: "none",
          color: "#f0d9a0",
          background: "linear-gradient(180deg, rgb(var(--ms-seal-available)), rgb(var(--ms-seal-completed)))",
          clipPath: "polygon(0 0,100% 0,100% 100%,50% 84%,0 100%)",
          boxShadow: "inset 0 1px 0 rgba(255,220,150,.25), 0 3px 6px -1px rgba(0,0,0,.5)",
        },
        "[data-tabstyle='estandarte'] .ms-tab:hover": {
          filter: "brightness(1.12)",
          transform: "translateY(-2px)",
        },
        "[data-tabstyle='estandarte'] .ms-tab[aria-current='page']": {
          background: "linear-gradient(180deg, rgb(var(--ms-gold-2)), rgb(var(--ms-gold-4)))",
          color: "#20140a",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,.35), 0 0 16px -3px rgb(var(--ms-gold-2))",
        },
        "[data-tabstyle='estandarte'] .ms-tab[aria-current='page'] > span:nth-child(3)": { display: "none" },
        // Manuscrito — illuminated minimal text.
        "[data-tabstyle='manuscrito'] nav": { padding: "16px 8px", gap: "3px" },
        "[data-tabstyle='manuscrito'] .ms-tab": {
          background: "none",
          border: "none",
          padding: "10px 16px",
          fontFamily: "'Cinzel Decorative', Cinzel, serif",
          textTransform: "none",
          letterSpacing: ".01em",
          fontSize: "15px",
          color: "rgb(var(--ms-gold-1))",
        },
        "[data-tabstyle='manuscrito'] .ms-tab > span:first-child": {
          color: "rgb(var(--ms-gold-3))",
          opacity: ".85",
        },
        "[data-tabstyle='manuscrito'] .ms-tab:hover": { color: "#fff2d0" },
        "[data-tabstyle='manuscrito'] .ms-tab[aria-current='page'] > span:nth-child(2)": {
          borderBottom: "2px solid rgb(var(--ms-gold-2))",
          paddingBottom: "3px",
        },
        "[data-tabstyle='manuscrito'] .ms-tab[aria-current='page'] > span:first-child": {
          color: "rgb(var(--ms-gold-1))",
          opacity: "1",
        },
        "[data-tabstyle='manuscrito'] .ms-tab[aria-current='page'] > span:nth-child(3)": { display: "none" },
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

    // ══════════════════════════════════════════════════════════════════════
    // FURRET TODAY (SmartRotom) — `.ft-app`
    // A pop-art printed magazine. Light-only by design: the warm newsprint
    // paper IS the product, so unlike Starbank/ChatApp/Notas there is no
    // `data-theme` axis here (SMARTROTOM_V3.md §2b — the app ignores the
    // picker's mode, like Pokédex, Arcade and Misiones). The dark cover is a
    // SECTION (`.ft-cover-ink`), not a theme.
    //
    // The palette is declared as raw `R G B` triplets so Tailwind's
    // `<alpha-value>` works on every token AND so the component classes below
    // can read it from inside plugin CSS.
    // ══════════════════════════════════════════════════════════════════════
    plugin(({ addBase, addComponents }) => {
      addBase({
        ".ft-app": {
          "--ft-ink": "11 11 15",
          "--ft-paper": "253 246 227",
          "--ft-paper-2": "245 236 208",
          "--ft-paper-dark": "26 25 37",
          "--ft-body": "35 32 39",
          "--ft-deck": "58 54 69",
          "--ft-pink": "255 45 135",
          "--ft-pink-soft": "255 209 227",
          "--ft-yellow": "255 214 10",
          "--ft-yellow-soft": "255 243 168",
          "--ft-cyan": "0 196 212",
          "--ft-cyan-soft": "201 243 247",
          "--ft-orange": "255 122 26",
          "--ft-orange-soft": "255 216 184",
          "--ft-purple": "139 92 246",
          "--ft-purple-soft": "230 220 255",
          "--ft-lime": "179 230 59",
          "--ft-red": "237 28 36",
          // The paper gradient: the press laid ink heavier at the foot.
          background:
            "linear-gradient(180deg, rgb(var(--ft-paper)) 0%, rgb(var(--ft-paper-2)) 100%)",
          color: "rgb(var(--ft-ink))",
          "-webkit-font-smoothing": "antialiased",
          textRendering: "optimizeLegibility",
        },
        // Focus is a hot-pink ring everywhere in the app, never a browser blue.
        ".ft-app :focus-visible": {
          outline: "3px solid rgb(var(--ft-pink))",
          outlineOffset: "3px",
          borderRadius: "4px",
        },
      })

      addComponents({
        // ── Ben-Day dots ───────────────────────────────────────────────────
        // The load-bearing texture of the whole system. `-color` tints the dots
        // with the current accent; `-mask` fades them out at the foot so a
        // section can dissolve into the paper instead of ending on a hard edge.
        ".ft-halftone": {
          backgroundImage:
            "radial-gradient(rgb(var(--ft-ink)) 1.2px, transparent 1.4px)",
          backgroundSize: "10px 10px",
        },
        ".ft-halftone-dense": {
          backgroundImage:
            "radial-gradient(rgb(var(--ft-ink)) 1.6px, transparent 1.8px)",
          backgroundSize: "8px 8px",
        },
        ".ft-halftone-light": {
          backgroundImage: "radial-gradient(#fff 1.6px, transparent 1.8px)",
          backgroundSize: "14px 14px",
        },
        ".ft-halftone-mask": {
          maskImage:
            "linear-gradient(180deg, #000 0%, #000 70%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(180deg, #000 0%, #000 70%, transparent 100%)",
        },
        // Faint ruled lines — the ghost of a newspaper's baseline grid.
        ".ft-newsprint": {
          backgroundImage:
            "repeating-linear-gradient(to bottom, transparent 0, transparent 27px, rgba(0,0,0,.04) 27px, rgba(0,0,0,.04) 28px)",
        },
        // Hazard stripes for the ticker rails.
        ".ft-stripes": {
          backgroundImage:
            "repeating-linear-gradient(45deg, rgb(var(--ft-yellow)) 0 16px, rgb(var(--ft-ink)) 16px 19px)",
        },

        // ── The dark cover ─────────────────────────────────────────────────
        ".ft-cover-ink": {
          background: "rgb(var(--ft-paper-dark))",
          color: "#fff",
        },

        // ── Long-form article body ─────────────────────────────────────────
        // The reader renders CKEditor-authored HTML, so every element has to be
        // styled by tag here — the editor emits no classes we control.
        ".ft-article": {
          fontFamily: "'Space Grotesk', Inter, ui-sans-serif, system-ui, sans-serif",
          fontSize: "18px",
          lineHeight: "1.75",
          color: "rgb(var(--ft-body))",
        },
        ".ft-article p": { margin: "0 0 22px" },
        ".ft-article h1": {
          fontFamily: "Bangers, Anton, ui-sans-serif, sans-serif",
          fontSize: "40px",
          lineHeight: "1.05",
          letterSpacing: ".02em",
          margin: "40px 0 16px",
        },
        ".ft-article h2": {
          fontFamily: "Bangers, Anton, ui-sans-serif, sans-serif",
          fontSize: "34px",
          lineHeight: "1.1",
          letterSpacing: ".02em",
          margin: "40px 0 16px",
        },
        ".ft-article h3": {
          fontFamily: "Bangers, Anton, ui-sans-serif, sans-serif",
          fontSize: "26px",
          margin: "32px 0 12px",
          letterSpacing: ".02em",
        },
        // A highlighter drawn straight onto the word.
        ".ft-article strong": {
          background: "rgb(var(--ft-yellow))",
          padding: "0 4px",
          fontWeight: "700",
        },
        ".ft-article a": {
          color: "rgb(var(--ft-pink))",
          textDecoration: "underline",
          textDecorationThickness: "2px",
          textUnderlineOffset: "3px",
        },
        ".ft-article ul, .ft-article ol": {
          margin: "0 0 22px",
          paddingLeft: "24px",
        },
        ".ft-article li": { margin: "0 0 8px" },
        ".ft-article img": {
          border: "2.5px solid rgb(var(--ft-ink))",
          borderRadius: "14px",
          boxShadow: "6px 6px 0 0 rgb(var(--ft-ink))",
          margin: "28px 0",
        },
        ".ft-article figcaption": {
          fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
          fontSize: "13px",
          textTransform: "uppercase",
          letterSpacing: ".04em",
          opacity: ".7",
          marginTop: "-16px",
          marginBottom: "28px",
        },
        ".ft-article blockquote": {
          fontFamily: "Fraunces, Georgia, serif",
          fontWeight: "700",
          fontStyle: "italic",
          fontSize: "30px",
          lineHeight: "1.2",
          color: "rgb(var(--ft-ink))",
          padding: "28px 0 28px 28px",
          borderLeft: "6px solid rgb(var(--ft-pink))",
          margin: "32px 0",
        },
        // The oversized comic initial that opens a story.
        ".ft-dropcap::first-letter": {
          fontFamily: "Bangers, Anton, ui-sans-serif, sans-serif",
          fontSize: "88px",
          lineHeight: ".85",
          float: "left",
          padding: "8px 12px 4px 0",
          color: "rgb(var(--ft-pink))",
          WebkitTextStroke: "2px rgb(var(--ft-ink))",
          paintOrder: "stroke fill",
        },

        // ── Ink-stroked display type ───────────────────────────────────────
        ".ft-ink-stroke": {
          WebkitTextStroke: "2.5px rgb(var(--ft-ink))",
          paintOrder: "stroke fill",
        },
        // The big pink section numeral.
        ".ft-stamp": {
          fontFamily: "Bangers, Anton, ui-sans-serif, sans-serif",
          fontSize: "64px",
          lineHeight: "1",
          color: "rgb(var(--ft-pink))",
          WebkitTextStroke: "2.5px rgb(var(--ft-ink))",
          paintOrder: "stroke fill",
        },

        // ── Pop-art scrollbar ──────────────────────────────────────────────
        ".ft-scroll::-webkit-scrollbar": { height: "10px", width: "10px" },
        ".ft-scroll::-webkit-scrollbar-track": {
          background: "rgb(var(--ft-paper-2))",
          borderRadius: "999px",
        },
        ".ft-scroll::-webkit-scrollbar-thumb": {
          background: "rgb(var(--ft-pink))",
          borderRadius: "999px",
          border: "2px solid rgb(var(--ft-ink))",
        },

        // ── Skeleton ───────────────────────────────────────────────────────
        ".ft-skel": {
          background:
            "linear-gradient(90deg, rgba(0,0,0,.06) 0%, rgba(0,0,0,.12) 50%, rgba(0,0,0,.06) 100%)",
          backgroundSize: "200% 100%",
          border: "2px solid rgb(var(--ft-ink))",
          borderRadius: "14px",
        },
      })
    }),

    // ════════════════════════════════════════════════════════════════════════
    // GOBIERNO DE TERAS (SmartRotom) — `.gt-app` scope root.
    //
    // Light-only: `colorScheme: light` is declared here and there is no
    // `[data-theme]` variant, because the warm paper IS the design. The app
    // therefore ignores the theme picker's mode (SMARTROTOM_V3.md §2b).
    //
    // Two data-attributes on the root ARE honoured:
    //   data-accent="civic|navy|burgundy|gold"  — the institutional colour
    //   data-density="comfortable|compact"      — table/grid rhythm
    // ════════════════════════════════════════════════════════════════════════
    plugin(({ addBase, addComponents }) => {
      addBase({
        ".gt-app": {
          // paper surfaces (warm cream)
          "--gt-paper-bg": "236 229 214",
          "--gt-paper-0": "252 250 244",
          "--gt-paper-1": "246 241 230",
          "--gt-paper-2": "239 232 216",
          "--gt-paper-3": "230 221 201",
          "--gt-line": "220 211 189",
          "--gt-line-strong": "199 187 158",
          "--gt-line-soft": "231 223 205",
          // ink (warm near-black → faint)
          "--gt-ink-900": "42 37 23",
          "--gt-ink-800": "58 51 34",
          "--gt-ink-700": "76 68 48",
          "--gt-ink-600": "99 90 65",
          "--gt-ink-500": "131 121 84",
          "--gt-ink-400": "156 146 114",
          "--gt-ink-300": "184 174 142",
          // civic core
          "--gt-civic": "31 111 74",
          "--gt-civic-700": "24 90 60",
          "--gt-civic-600": "27 101 67",
          "--gt-civic-300": "111 174 143",
          "--gt-civic-tint": "228 238 231",
          "--gt-gold": "169 132 47",
          "--gt-gold-600": "146 112 38",
          "--gt-gold-300": "216 185 110",
          "--gt-gold-tint": "241 233 211",
          // department hues — fixed identities, never themed
          "--gt-dep-urbanismo": "176 97 58",
          "--gt-dep-seguridad": "47 90 158",
          "--gt-dep-hacienda": "31 111 74",
          "--gt-dep-justicia": "138 58 85",
          "--gt-dep-poblacion": "77 107 130",
          "--gt-dep-gobierno": "169 132 47",
          // status — muted, so they sit on paper instead of shouting off it
          "--gt-ok": "46 125 82",
          "--gt-ok-tint": "227 239 230",
          "--gt-warn": "183 134 29",
          "--gt-warn-tint": "244 236 212",
          "--gt-danger": "178 58 58",
          "--gt-danger-tint": "244 226 223",
          "--gt-info": "63 111 163",
          "--gt-info-tint": "227 234 242",
          // accent — defaults to civic green; data-accent swaps it below
          "--gt-accent": "31 111 74",
          "--gt-accent-strong": "24 90 60",
          "--gt-accent-tint": "228 238 231",
          // rhythm — data-density swaps these
          "--gt-gap": "16px",
          "--gt-row-py": "11px",
          colorScheme: "light",
        },
        '.gt-app[data-accent="navy"]': {
          "--gt-accent": "47 90 158",
          "--gt-accent-strong": "36 74 133",
          "--gt-accent-tint": "227 234 244",
        },
        '.gt-app[data-accent="burgundy"]': {
          "--gt-accent": "138 58 85",
          "--gt-accent-strong": "115 47 71",
          "--gt-accent-tint": "241 227 232",
        },
        '.gt-app[data-accent="gold"]': {
          "--gt-accent": "169 132 47",
          "--gt-accent-strong": "141 109 36",
          "--gt-accent-tint": "243 236 214",
        },
        '.gt-app[data-density="compact"]': {
          "--gt-gap": "11px",
          "--gt-row-py": "7px",
        },
        ".gt-app ::selection": {
          background: "rgb(var(--gt-accent))",
          color: "#fff",
        },
        ".gt-app :focus-visible": {
          outline: "2px solid rgb(var(--gt-accent))",
          outlineOffset: "2px",
          borderRadius: "4px",
        },
      })

      addComponents({
        // The paper itself: a warm bloom from the top, a green wash at the
        // bottom, and a faint cross-hatched guilloché — the engraved security
        // pattern that makes the surface read as an official document rather
        // than a beige div. Fixed behind everything, never interactive.
        ".gt-paper": {
          position: "relative",
          isolation: "isolate",
          "&::before, &::after": {
            content: '""',
            position: "absolute",
            inset: "0",
            zIndex: "-1",
            pointerEvents: "none",
          },
          "&::before": {
            background:
              "radial-gradient(130% 80% at 50% -10%, rgba(169,132,47,.07), transparent 55%), radial-gradient(100% 70% at 100% 110%, rgba(31,111,74,.05), transparent 55%)",
          },
          "&::after": {
            opacity: ".5",
            backgroundImage:
              "repeating-linear-gradient(45deg, rgba(120,100,60,.025) 0 1px, transparent 1px 7px), repeating-linear-gradient(-45deg, rgba(120,100,60,.02) 0 1px, transparent 1px 9px)",
          },
        },

        // The engraved gold rule across the top of an official card.
        ".gt-edge-gold": {
          position: "relative",
          overflow: "hidden",
          "&::before": {
            content: '""',
            position: "absolute",
            left: "0",
            right: "0",
            top: "0",
            height: "3px",
            background:
              "linear-gradient(90deg, transparent, rgb(var(--gt-gold)), transparent)",
          },
        },

        // The department-coloured spine down a card's left edge. The colour
        // comes from `--gt-dep`, set inline by whatever knows the department.
        ".gt-spine": {
          position: "relative",
          "&::before": {
            content: '""',
            position: "absolute",
            left: "0",
            top: "0",
            bottom: "0",
            width: "3px",
            background: "var(--gt-dep, rgb(var(--gt-accent)))",
            borderTopLeftRadius: "inherit",
            borderBottomLeftRadius: "inherit",
          },
        },

        // The fine double rule that divides sections of a printed document.
        ".gt-rule": {
          border: "none",
          borderTop: "1px solid rgb(var(--gt-line-strong))",
          borderBottom: "1px solid rgb(var(--gt-line))",
          height: "3px",
          background: "transparent",
        },

        ".gt-scroll::-webkit-scrollbar": { width: "11px", height: "11px" },
        ".gt-scroll::-webkit-scrollbar-track": { background: "transparent" },
        ".gt-scroll::-webkit-scrollbar-thumb": {
          background: "rgb(var(--gt-line-strong))",
          borderRadius: "8px",
          border: "3px solid transparent",
          backgroundClip: "padding-box",
        },
        ".gt-scroll::-webkit-scrollbar-thumb:hover": {
          background: "rgb(var(--gt-ink-300))",
        },
      })
    }),
    // ── Rooker (SmartRotom) theme layer ────────────────────────────────────
    // "El nido social": a Twitter-faithful timeline. Scoped to `.rk-app`, with
    // THREE canvases where every other app has two — Claro, Tenue and Oscuro.
    // That is not an extra theme: the platform picker still decides light vs
    // dark (§2b), and when it says dark the reader picks *which* dark. Tenue is
    // the default (a desaturated navy — Twitter's "dim"); Oscuro is true black
    // for OLED. So `data-theme` carries the resolved canvas, never a preference
    // the app invented.
    //
    // `--rk-accent` is a runtime triplet the reader chooses from six. It is set
    // on the scope root by the Pantalla panel, and everything brand-coloured
    // derives from it through Tailwind's alpha channel — there is no second
    // place a brand colour is written down.
    plugin(({ addBase, addComponents }) => {
      // Constant across all three canvases. The five reaction hues and the two
      // action colours encode MEANING (a Retrino is green, a like is pink, live
      // is red), so they must not drift when the canvas or the accent changes.
      const constant = {
        "--rk-heart":    "249 24 128",
        "--rk-ball":     "244 33 46",
        "--rk-choque":   "255 212 0",
        "--rk-shiny":    "29 155 240",
        "--rk-fuego":    "255 122 0",
        "--rk-rt":       "0 186 124",
        "--rk-live":     "244 33 46",
        "--rk-verified": "29 155 240",
        // Defaults; the Pantalla panel overwrites both on the scope root.
        "--rk-accent":    "29 155 240",
        "--rk-accent-fg": "255 255 255",
        // The body face. Swapped to Hanken Grotesk when the reader picks Chirp.
        "--rk-font":
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, 'Apple Color Emoji', 'Segoe UI Emoji', sans-serif",
      }
      const dim = {
        "--rk-bg":          "21 32 43",
        "--rk-card":        "30 39 50",
        "--rk-elevated":    "40 51 64",
        "--rk-nav":         "rgb(21 32 43 / .85)",
        "--rk-hover":       "rgb(239 243 244 / .03)",
        "--rk-fg":          "247 249 249",
        "--rk-fg-muted":    "139 152 165",
        "--rk-fg-subtle":   "139 152 165",
        "--rk-line":        "56 68 77",
        "--rk-line-strong": "84 99 110",
      }
      const light = {
        "--rk-bg":          "255 255 255",
        "--rk-card":        "247 249 249",
        "--rk-elevated":    "239 243 244",
        "--rk-nav":         "rgb(255 255 255 / .85)",
        "--rk-hover":       "rgb(15 20 25 / .03)",
        "--rk-fg":          "15 20 25",
        "--rk-fg-muted":    "83 100 113",
        "--rk-fg-subtle":   "83 100 113",
        "--rk-line":        "239 243 244",
        "--rk-line-strong": "207 217 222",
      }
      const lightsout = {
        "--rk-bg":          "0 0 0",
        "--rk-card":        "22 24 28",
        "--rk-elevated":    "29 31 35",
        "--rk-nav":         "rgb(0 0 0 / .8)",
        "--rk-hover":       "rgb(231 233 234 / .03)",
        "--rk-fg":          "231 233 234",
        "--rk-fg-muted":    "113 118 123",
        "--rk-fg-subtle":   "113 118 123",
        "--rk-line":        "47 51 54",
        "--rk-line-strong": "62 65 68",
      }
      addBase({
        ".rk-app": { ...constant, ...dim, colorScheme: "dark" },
        '.rk-app[data-theme="light"]':     { ...light, colorScheme: "light" },
        '.rk-app[data-theme="lightsout"]': { ...lightsout, colorScheme: "dark" },
        ".rk-app ::selection": { background: "rgb(var(--rk-accent) / .3)" },
      })
      addComponents({
        ".rk-scroll": {
          scrollbarWidth: "thin",
          scrollbarColor: "rgb(var(--rk-line-strong)) transparent",
        },
        ".rk-scroll::-webkit-scrollbar": { width: "8px", height: "8px" },
        ".rk-scroll::-webkit-scrollbar-track": { background: "transparent" },
        ".rk-scroll::-webkit-scrollbar-thumb": {
          background: "rgb(var(--rk-line-strong))",
          borderRadius: "999px",
          border: "2px solid transparent",
          backgroundClip: "content-box",
        },
        ".rk-scroll::-webkit-scrollbar-thumb:hover": {
          background: "rgb(var(--rk-fg-subtle))",
        },
        // The horizontal event rail scrolls but must not show a bar.
        ".rk-rail": { scrollbarWidth: "none" },
        ".rk-rail::-webkit-scrollbar": { display: "none" },
      })
    }),

    // ══════════════════════════════════════════════════════════════════════
    // WIGGLYPOP (SmartRotom) — `.wp-app`
    // The bubbly marketplace. Light-only by design: the pink-cream page IS the
    // product, so there is no `data-theme` axis here (SMARTROTOM_V3.md §2b —
    // the app ignores the picker's mode, like Furret Today and Gobierno).
    //
    // The palette is declared as raw `R G B` triplets so Tailwind's
    // `<alpha-value>` works on every token (`border-wp-line/24`) AND so the
    // component classes below can read it from inside plugin CSS.
    // ══════════════════════════════════════════════════════════════════════
    plugin(({ addBase, addComponents }) => {
      addBase({
        ".wp-app": {
          "--wp-bg": "252 230 240",
          "--wp-bg-soft": "254 244 249",
          "--wp-panel": "255 255 255",
          "--wp-panel-2": "253 234 243",
          "--wp-cream": "255 242 230",
          "--wp-cream-deep": "255 226 204",
          "--wp-line": "214 142 178",
          "--wp-fg": "60 34 54",
          "--wp-fg-muted": "140 108 128",
          "--wp-fg-subtle": "187 159 174",
          "--wp-accent": "242 99 160",
          "--wp-accent-strong": "223 63 137",
          "--wp-accent-light": "248 124 176",
          "--wp-teal": "18 192 176",
          "--wp-teal-deep": "10 156 142",
          "--wp-green": "17 179 154",
          "--wp-violet": "157 92 224",
          "--wp-amber": "245 166 35",
          "--wp-gold": "243 165 31",
          "--wp-rose": "241 91 122",
          "--wp-rarity-comun": "181 138 163",
          "--wp-rarity-raro": "18 192 176",
          "--wp-rarity-epico": "157 92 224",
          "--wp-rarity-legendario": "243 165 31",
          // Two corner glows over a vertical cream→pink wash. The glows are what
          // stop the page from reading as flat pink: warm pink top-right, the
          // money-teal bottom-left, so the page itself states the two accents.
          background:
            "radial-gradient(1100px 620px at 86% -10%, rgba(242,99,160,.12), transparent 60%), radial-gradient(900px 600px at -5% 108%, rgba(18,192,176,.10), transparent 55%), linear-gradient(180deg, rgb(var(--wp-bg-soft)), rgb(var(--wp-bg)) 82%)",
          backgroundAttachment: "fixed",
          color: "rgb(var(--wp-fg))",
          // 600 is the app's *resting* weight — not a heading trick. Nunito at
          // 400 looks anaemic on this page; the whole system is set semibold up.
          fontWeight: "600",
          "-webkit-font-smoothing": "antialiased",
        },
        ".wp-app :focus-visible": {
          outline: "3px solid rgb(var(--wp-accent))",
          outlineOffset: "2px",
          borderRadius: "6px",
        },
      })

      addComponents({
        // ── The frosted panel ───────────────────────────────────────────────
        // White at 90% over the pink page + a saturation bump, so what shows
        // through stays candy-coloured instead of going grey.
        ".wp-glass": {
          background: "rgb(var(--wp-panel) / .9)",
          backdropFilter: "blur(8px) saturate(120%)",
          WebkitBackdropFilter: "blur(8px) saturate(120%)",
          border: "1px solid rgb(var(--wp-line) / .24)",
          boxShadow: "0 8px 22px -12px rgba(223,63,137,.22)",
        },
        // The top nav sits over scrolling cards and blurs harder than a panel.
        ".wp-chrome": {
          background: "rgb(var(--wp-panel) / .86)",
          backdropFilter: "blur(18px) saturate(140%)",
          WebkitBackdropFilter: "blur(18px) saturate(140%)",
        },
        // ── The primary gradient ────────────────────────────────────────────
        // One class, used by the primary button, the active nav/format tab and
        // the brand mark — they must always be the same pink or the chrome
        // stops reading as one object. Top-lit (light stop above), which is
        // what gives the pill its inflated look.
        ".wp-grad-primary": {
          backgroundImage:
            "linear-gradient(180deg, rgb(var(--wp-accent-light)), rgb(var(--wp-accent-strong)))",
        },
        ".wp-grad-mark": {
          backgroundImage:
            "linear-gradient(150deg, #fb8cc0, #ef4f97 62%, #e0418a)",
        },
        // ── Figures ─────────────────────────────────────────────────────────
        // Every price, balance, IV, level and count. Tabular numerals are what
        // keep a column of prices aligned; 800 is what makes them read as money
        // rather than as body copy. Non-negotiable on anything numeric.
        ".wp-num": {
          fontVariantNumeric: "tabular-nums",
          fontWeight: "800",
        },
        // ── Sprite backdrops ────────────────────────────────────────────────
        // The pastel wash behind every Pokémon sprite. Data-driven (the mon's
        // primary type picks one), so these are LITERAL classes selected through
        // the map in `_utils/spriteTheme.ts` — never `wp-bg-${type}` (§4).
        ".wp-wall": { position: "relative", overflow: "hidden" },
        // The white bloom every wash carries at the top, so the sprite always
        // has light behind its head regardless of which wash it landed on.
        ".wp-wall::after": {
          content: '""',
          position: "absolute",
          inset: "0",
          background:
            "radial-gradient(120% 80% at 50% 8%, rgba(255,255,255,.55), transparent 60%)",
        },
        ".wp-wall-classic": { backgroundImage: "linear-gradient(160deg,#fce7f1,#f8d9e8)" },
        ".wp-wall-forest":  { backgroundImage: "linear-gradient(160deg,#e5f3d9,#d7ecc9)" },
        ".wp-wall-ocean":   { backgroundImage: "linear-gradient(160deg,#dcf3f3,#cbeeee)" },
        ".wp-wall-volcano": { backgroundImage: "linear-gradient(160deg,#ffe6dc,#ffd5c5)" },
        ".wp-wall-space":   { backgroundImage: "linear-gradient(160deg,#e8e6fb,#dcd9f6)" },
        ".wp-wall-meadow":  { backgroundImage: "linear-gradient(160deg,#eaf4d8,#dcedc6)" },
        ".wp-wall-dusk":    { backgroundImage: "linear-gradient(160deg,#f0e2fb,#e7d3f6)" },
        ".wp-wall-cave":    { backgroundImage: "linear-gradient(160deg,#edecf2,#e1e0ea)" },
        ".wp-wall-rainbow": { backgroundImage: "linear-gradient(125deg,#fce0ee,#e7ecfb 50%,#dcf3ee)" },
        ".wp-wall-sakura":  { backgroundImage: "linear-gradient(160deg,#fde3ed,#fbd4e5)" },
        // The dot screen laid over a wash. Plum at 5% — any darker and it fights
        // the sprite it is supposed to sit behind.
        ".wp-dots": {
          backgroundImage:
            "radial-gradient(rgba(60,34,54,.05) 1px, transparent 1.6px)",
          backgroundSize: "18px 18px",
        },
        // The shiny / legendary bloom behind a sprite. Teal for shiny (it is the
        // same teal as money — a shiny IS value), gold for legendary.
        ".wp-burst-shiny": {
          background:
            "radial-gradient(60% 60% at 50% 42%, rgba(18,192,176,.26), transparent 70%)",
        },
        ".wp-burst-legend": {
          background:
            "radial-gradient(60% 60% at 50% 42%, rgba(243,165,31,.26), transparent 72%)",
        },
        // ── Sprites ─────────────────────────────────────────────────────────
        // Pixelated, with a warm-plum contact shadow so the sprite sits ON the
        // wash rather than floating over it.
        ".wp-sprite": {
          imageRendering: "pixelated",
          objectFit: "contain",
          filter: "drop-shadow(0 5px 6px rgba(180,110,150,.35))",
          pointerEvents: "none",
        },
        // The detail hero. The handoff drew smooth official artwork here, but the
        // only sprite source we actually have is the self-hosted Pixelmon manifest
        // (`utils/spriteUtils`) — there is no artwork endpoint. So the hero is the
        // same pixel sprite, upscaled and given a much deeper drop. Staying
        // pixelated is the honest call and reads as deliberate; smoothing it would
        // just be a blurry sprite pretending to be art.
        ".wp-sprite-hero": {
          imageRendering: "pixelated",
          objectFit: "contain",
          filter: "drop-shadow(0 24px 26px rgba(120,70,100,.35))",
        },
        // ── Scrollbars ──────────────────────────────────────────────────────
        ".wp-scroll::-webkit-scrollbar": { width: "11px", height: "11px" },
        ".wp-scroll::-webkit-scrollbar-track": { background: "transparent" },
        ".wp-scroll::-webkit-scrollbar-thumb": {
          background: "rgb(var(--wp-line) / .4)",
          borderRadius: "999px",
          border: "3px solid transparent",
          backgroundClip: "content-box",
        },
        ".wp-scroll::-webkit-scrollbar-thumb:hover": {
          background: "rgb(var(--wp-line) / .62)",
          backgroundClip: "content-box",
        },
        ".wp-noscroll": { scrollbarWidth: "none" },
        ".wp-noscroll::-webkit-scrollbar": { display: "none" },
      })
    }),

    // ══════════════════════════════════════════════════════════════════════
    // PASAPORTE (SmartRotom) — `.ps-app`
    // A state-issued travel document lying open on an immigration counter.
    //
    // FIXED CANVAS, and this is a design decision, not an omission: the desk is
    // always dark and the paper is always cream, in every platform theme. A
    // passport is a physical object — its pages do not turn dark because the OS
    // did. So the app never reads `useRotomMode()` (SMARTROTOM_V3.md §2b, same
    // stance as Furret Today's newsprint and Gobierno's warm paper).
    //
    // The `data-*` attributes on the root are DOCUMENT properties, not themes:
    //   data-ornament  minimal | tasteful | maximal  — how loud the security
    //                  print is. Scales the guilloché line-work, the paper grain
    //                  and the gold tooling on the blotter through three
    //                  multipliers, so one reader control retunes the whole book.
    //   data-motion    on | off — parks the looping ambience (scan beam, holo
    //                  spin, hint pulse) for readers who want the book still.
    //
    // Everything below that Tailwind cannot express — multi-layer security
    // print, the scalloped wax edge, buckram weave, holographic conic foil — is
    // a component class here rather than an inline style, so the pages stay
    // readable JSX. (§6: Tailwind-only; the plugin IS the escape hatch.)
    // ══════════════════════════════════════════════════════════════════════
    plugin(({ addBase, addComponents }) => {
      addBase({
        ".ps-app": {
          // ── The desk ────────────────────────────────────────────────────
          "--ps-desk": "42 29 18",
          "--ps-desk-hi": "58 42 28",
          "--ps-desk-lo": "25 15 8",
          "--ps-leather": "60 26 23",
          "--ps-leather-deep": "27 10 9",
          "--ps-chrome-fg": "246 244 240",
          "--ps-chrome-muted": "183 175 160",
          "--ps-chrome-subtle": "140 133 118",
          "--ps-navy": "42 60 99",
          "--ps-navy-deep": "20 34 59",
          "--ps-navy-hi": "47 95 153",
          "--ps-gild": "200 162 75",
          "--ps-gild-hi": "244 227 161",
          "--ps-gild-lo": "138 106 35",
          "--ps-ribbon": "156 43 43",
          "--ps-ribbon-hi": "196 69 69",

          // ── The paper ───────────────────────────────────────────────────
          "--ps-paper": "239 230 214",
          "--ps-paper-2": "231 220 200",
          "--ps-paper-edge": "216 202 176",
          // The block of leaves seen edge-on. `leaf` is the lit top of a sheet, `leaf-shade`
          // the gap between two — alternating them is what reads as a *stack* rather than a
          // thick border, and `board` is the cover the stack sits on. See `.ps-leaves-*`.
          "--ps-leaf": "233 219 207",
          "--ps-leaf-shade": "170 158 148",
          "--ps-board": "8 41 84",
          "--ps-ink": "44 36 25",
          "--ps-ink-soft": "92 81 66",
          "--ps-ink-faint": "138 125 104",

          // ── Security inks (the chapter accents) ─────────────────────────
          "--ps-oxblood": "156 59 54",
          "--ps-oxblood-deep": "110 39 35",
          "--ps-teal": "47 111 126",
          "--ps-teal-deep": "36 75 86",
          "--ps-plum": "110 74 134",
          "--ps-plum-deep": "75 51 91",
          "--ps-olive": "106 120 56",
          "--ps-olive-deep": "68 75 39",
          "--ps-info": "43 74 114",
          "--ps-info-deep": "36 63 99",
          "--ps-ok": "63 125 84",
          "--ps-warn": "176 132 35",
          "--ps-bad": "162 58 50",

          // Default chapter accent. Every page overwrites this pair on its own
          // root — see `chapterVars()` in `_utils/chapters.ts`.
          "--ps-chapter": "156 59 54",
          "--ps-chapter-deep": "110 39 35",

          // ── Tiers ───────────────────────────────────────────────────────
          "--ps-tier-bronce": "196 126 58",
          "--ps-tier-plata": "159 176 189",
          "--ps-tier-oro": "227 169 43",
          "--ps-tier-platino": "111 202 214",
          "--ps-tier-diamante": "94 200 224",
          "--ps-tier-maestro": "154 106 214",

          // ── Ornament multipliers ────────────────────────────────────────
          // One property, two surfaces: `--ps-guilloche` scales the security
          // line-work and `--ps-grain` the paper fibre. `data-ornament` moves
          // both together, which is why the setting reads as one physical
          // property of the document rather than two checkboxes.
          "--ps-guilloche": ".5",
          "--ps-grain": ".07",

          // The fibre. One SVG turbulence, reused by the paper, the buckram and
          // the leather — the same noise at three scales and blend modes is what
          // makes them read as three materials rather than three gradients.
          "--ps-noise":
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",

          color: "rgb(var(--ps-chrome-fg))",
          // The counter: a warm lamp pool from above, plank seams, and walnut.
          background:
            "radial-gradient(130% 85% at 50% -12%, rgba(255,224,165,.12), transparent 55%), repeating-linear-gradient(90deg, rgba(0,0,0,.22) 0 1.5px, transparent 1.5px 240px), repeating-linear-gradient(90deg, rgba(255,236,200,.014) 0 2px, transparent 2px 11px), linear-gradient(180deg, rgb(var(--ps-desk-hi)), rgb(var(--ps-desk)) 58%, rgb(var(--ps-desk-lo)))",
          "-webkit-font-smoothing": "antialiased",
        },

        ".ps-app[data-ornament='minimal']": {
          "--ps-guilloche": "0",
          "--ps-grain": ".03",
        },
        ".ps-app[data-ornament='maximal']": {
          "--ps-guilloche": "1",
          "--ps-grain": ".12",
        },
        // Motion off parks the ambience only. Entrances still run — a stamp that
        // never lands would leave the page looking broken, so `motion-reduce:`
        // handles those per-component and this handles the loops.
        ".ps-app[data-motion='off'] .ps-loop": {
          animation: "none !important",
        },
      })

      addComponents({
        // ── The paper ─────────────────────────────────────────────────────
        // A soft page's surface: guilloché security print, the sheen off the top
        // edge, then the cream stock itself. The line-work is three repeating
        // gradients at different angles and centres — one alone reads as a
        // pattern, three reads as engraving.
        ".ps-paper-surface": {
          background:
            "repeating-radial-gradient(circle at 20% 14%, transparent 0 7px, rgb(70 52 30 / calc(.05 * var(--ps-guilloche))) 7px 8px), repeating-radial-gradient(circle at 84% 90%, transparent 0 6px, rgb(40 58 80 / calc(.045 * var(--ps-guilloche))) 6px 7px), repeating-linear-gradient(68deg, transparent 0 13px, rgb(60 46 28 / calc(.03 * var(--ps-guilloche))) 13px 14px), radial-gradient(120% 90% at 50% 0%, rgba(255,255,255,.5), transparent 55%), linear-gradient(180deg, rgb(var(--ps-paper)), rgb(var(--ps-paper-2)))",
        },
        // Fibre, multiplied into the stock.
        ".ps-paper-surface::after": {
          content: '""',
          position: "absolute",
          inset: "0",
          pointerEvents: "none",
          backgroundImage: "var(--ps-noise)",
          backgroundSize: "200px",
          mixBlendMode: "multiply",
          opacity: "var(--ps-grain)",
        },
        // Foxing at the edges — the faint browning of stored paper.
        ".ps-paper-surface::before": {
          content: '""',
          position: "absolute",
          inset: "0",
          pointerEvents: "none",
          boxShadow:
            "inset 0 0 60px rgba(120,90,40,.18), inset 0 0 12px rgba(80,60,20,.25)",
        },
        // Gutter shade. A bound book is darker where it folds; without this the
        // spread reads as two flat rectangles instead of one open book.
        ".ps-gutter-l": {
          boxShadow: "inset -34px 0 46px -30px rgba(74,56,30,.6)",
        },
        ".ps-gutter-r": {
          boxShadow: "inset 34px 0 46px -30px rgba(74,56,30,.6)",
        },

        // ── Thickness ─────────────────────────────────────────────────────
        // The passport is a BLOCK, not a sheet. A single shadow under a leaf reads as
        // paper; what reads as a bound book is the stack seen edge-on — so this is
        // twelve hard 1px shadow steps ALTERNATING lit-leaf / shade, each offset one
        // more pixel diagonally, and then a 16px slab of the cover board underneath.
        // Hard 0-blur steps are the whole trick: blur them and it collapses back into a
        // smudge. The steps run away from the spine, so the two sides mirror — a right
        // leaf stacks to the right, a left leaf to the left, and the gutter stays clean.
        ".ps-leaves-r": {
          boxShadow: [
            "1px 1px 0 0 rgb(var(--ps-leaf))",
            "2px 2px 0 0 rgb(var(--ps-leaf-shade))",
            "3px 3px 0 0 rgb(var(--ps-leaf))",
            "4px 4px 0 0 rgb(var(--ps-leaf-shade))",
            "5px 5px 0 0 rgb(var(--ps-leaf))",
            "6px 6px 0 0 rgb(var(--ps-leaf-shade))",
            "7px 7px 0 0 rgb(var(--ps-leaf))",
            "8px 8px 0 0 rgb(var(--ps-leaf-shade))",
            "9px 9px 0 0 rgb(var(--ps-leaf))",
            "10px 10px 0 0 rgb(var(--ps-leaf-shade))",
            "11px 11px 0 0 rgb(var(--ps-leaf))",
            "12px 12px 0 0 rgb(var(--ps-leaf-shade))",
            "16px 16px 0 0 rgb(var(--ps-board))",
          ].join(", "),
        },
        ".ps-leaves-l": {
          boxShadow: [
            "-1px 1px 0 0 rgb(var(--ps-leaf))",
            "-2px 2px 0 0 rgb(var(--ps-leaf-shade))",
            "-3px 3px 0 0 rgb(var(--ps-leaf))",
            "-4px 4px 0 0 rgb(var(--ps-leaf-shade))",
            "-5px 5px 0 0 rgb(var(--ps-leaf))",
            "-6px 6px 0 0 rgb(var(--ps-leaf-shade))",
            "-7px 7px 0 0 rgb(var(--ps-leaf))",
            "-8px 8px 0 0 rgb(var(--ps-leaf-shade))",
            "-9px 9px 0 0 rgb(var(--ps-leaf))",
            "-10px 10px 0 0 rgb(var(--ps-leaf-shade))",
            "-11px 11px 0 0 rgb(var(--ps-leaf))",
            "-12px 12px 0 0 rgb(var(--ps-leaf-shade))",
            "-16px 16px 0 0 rgb(var(--ps-board))",
          ].join(", "),
        },

        // ── The cover ─────────────────────────────────────────────────────
        // Navy buckram: a woven cloth, so the noise is crossed with a fine warp
        // and weft rather than used alone.
        ".ps-buckram::after": {
          content: '""',
          position: "absolute",
          inset: "0",
          pointerEvents: "none",
          mixBlendMode: "overlay",
          opacity: ".55",
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(255,255,255,.05) 0 1px, transparent 1px 3px), repeating-linear-gradient(90deg, rgba(0,0,0,.07) 0 1px, transparent 1px 3px), var(--ps-noise)",
          backgroundSize: "auto, auto, 240px",
        },
        // The embossed double gold rule stamped into the cloth.
        ".ps-emboss::before": {
          content: '""',
          position: "absolute",
          inset: "18px",
          borderRadius: "3px",
          border: "1px solid rgb(var(--ps-gild) / .5)",
          boxShadow:
            "inset 0 0 0 5px rgb(var(--ps-gild) / .22), inset 0 1px 0 rgba(255,255,255,.06), inset 0 0 38px rgba(0,0,0,.5)",
          pointerEvents: "none",
        },

        // ── Gold foil type ────────────────────────────────────────────────
        // Hot-stamped lettering. The gradient runs light→leaf→shadow→light so
        // the glyph has a lit top edge and a lit bottom edge, like real foil
        // catching the lamp twice.
        ".ps-foil": {
          background:
            "linear-gradient(180deg, rgb(var(--ps-gild-hi)), rgb(var(--ps-gild)) 45%, rgb(var(--ps-gild-lo)) 75%, rgb(var(--ps-gild-hi)))",
          "-webkit-background-clip": "text",
          backgroundClip: "text",
          "-webkit-text-fill-color": "transparent",
          filter:
            "drop-shadow(0 1px 0 rgba(0,0,0,.45)) drop-shadow(0 0 8px rgba(244,227,161,.25))",
        },

        // ── The wax seal ──────────────────────────────────────────────────
        // The scalloped edge of a struck seal. This clip-path is the shape of
        // the whole Medallas chapter, so it lives here once rather than being
        // pasted into each component.
        ".ps-wax": {
          clipPath:
            "polygon(50% 0,61% 6%,72% 3%,78% 14%,90% 16%,90% 28%,99% 36%,93% 47%,100% 57%,90% 64%,93% 76%,81% 80%,79% 92%,67% 90%,58% 99%,48% 91%,37% 97%,30% 86%,18% 86%,18% 74%,8% 67%,15% 57%,7% 46%,16% 38%,12% 26%,24% 23%,27% 11%,39% 14%,46% 4%)",
          background:
            "radial-gradient(circle at 38% 32%, rgba(255,255,255,.35), transparent 45%), radial-gradient(circle at 50% 50%, color-mix(in srgb, rgb(var(--ps-seal)) 88%, #fff), rgb(var(--ps-seal)) 60%, color-mix(in srgb, rgb(var(--ps-seal)) 70%, #000))",
          boxShadow:
            "0 2px 4px rgba(0,0,0,.35), inset 0 0 0 2px rgba(255,255,255,.25), inset 0 -4px 10px rgba(0,0,0,.35)",
        },
        // An unstruck seal: a blind-embossed depression in the paper, not a
        // greyed-out disc. It is pressed IN (light from below, shadow above),
        // which is the opposite of every other lit surface here.
        ".ps-wax-blank": {
          clipPath: "circle(46%)",
          background:
            "radial-gradient(circle at 50% 38%, rgba(255,255,255,.4), rgba(120,104,78,.16))",
          boxShadow:
            "inset 0 2px 5px rgba(80,62,30,.4), inset 0 -2px 4px rgba(255,255,255,.5)",
        },

        // ── Metal ─────────────────────────────────────────────────────────
        // A struck coin, for logro medals and ladder pips. Reads `--ps-metal`.
        ".ps-coin": {
          background:
            "radial-gradient(circle at 38% 30%, rgba(255,255,255,.55), transparent 46%), radial-gradient(circle at 50% 52%, color-mix(in srgb, rgb(var(--ps-metal)) 82%, #fff), rgb(var(--ps-metal)) 58%, color-mix(in srgb, rgb(var(--ps-metal)) 68%, #000))",
          boxShadow:
            "0 2px 4px rgba(0,0,0,.32), inset 0 0 0 2px rgba(255,255,255,.28), inset 0 -3px 7px rgba(0,0,0,.34)",
        },
        ".ps-coin-blank": {
          background:
            "radial-gradient(circle at 50% 38%, rgba(255,255,255,.45), rgba(150,135,105,.18))",
          boxShadow:
            "inset 0 2px 5px rgba(80,62,30,.38), inset 0 -2px 4px rgba(255,255,255,.55)",
        },

        // ── Holography ────────────────────────────────────────────────────
        // The one place the document is allowed a saturated rainbow: a hologram
        // is *supposed* to look out of place on paper. That is what makes it
        // read as a security feature and not as decoration.
        ".ps-holo": {
          background:
            "conic-gradient(from 0deg, #06b6d4, #a855f7, #84cc16, #f97316, #06b6d4)",
        },
        // The season seal's foil: the same trick in gold, so it reads as struck
        // metal rather than as a hologram.
        ".ps-holo-gold": {
          background:
            "conic-gradient(from 0deg, rgb(var(--ps-gild)), #fff6d8, rgb(var(--ps-gild-lo)), rgb(var(--ps-gild)), #fff6d8, rgb(var(--ps-gild-lo)), rgb(var(--ps-gild)))",
        },
        // A holographic border with a transparent core — used for the overprint
        // that appears on the pages during inspection.
        ".ps-holo-ring": {
          background:
            "linear-gradient(#0000,#0000) padding-box, conic-gradient(from 0deg, #06b6d4, #a855f7, #84cc16, #06b6d4) border-box",
          border: "3px solid transparent",
          mixBlendMode: "multiply",
        },

        // ── Inspection ────────────────────────────────────────────────────
        ".ps-grid-glow": {
          backgroundImage:
            "linear-gradient(rgb(var(--ps-teal) / .06) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--ps-teal) / .06) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        },
        ".ps-beam": {
          background:
            "linear-gradient(180deg, transparent, rgb(var(--ps-teal) / .22), transparent)",
          mixBlendMode: "screen",
        },

        // ── Figures ───────────────────────────────────────────────────────
        // Every number on the document is tabular. A passport whose digits
        // shift width between two rows is not a passport.
        ".ps-num": { fontVariantNumeric: "tabular-nums" },

        // ── Loading ───────────────────────────────────────────────────────
        ".ps-skeleton": {
          background:
            "linear-gradient(90deg, rgb(var(--ps-ink) / .07), rgb(var(--ps-ink) / .16), rgb(var(--ps-ink) / .07))",
          backgroundSize: "200% 100%",
        },

        // ── Scrollbars ────────────────────────────────────────────────────
        ".ps-scroll::-webkit-scrollbar": { width: "10px", height: "10px" },
        ".ps-scroll::-webkit-scrollbar-track": { background: "transparent" },
        ".ps-scroll::-webkit-scrollbar-thumb": {
          background: "rgb(var(--ps-ink) / .22)",
          borderRadius: "999px",
          border: "3px solid transparent",
          backgroundClip: "content-box",
        },
        ".ps-scroll::-webkit-scrollbar-thumb:hover": {
          background: "rgb(var(--ps-ink) / .4)",
          backgroundClip: "content-box",
        },
      })
    }),
  ],
}

export default config