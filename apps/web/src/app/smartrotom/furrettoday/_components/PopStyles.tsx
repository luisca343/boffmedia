"use client"
export default function PopStyles() {
  return (
    <style jsx global>{`
      @import url('https://fonts.googleapis.com/css2?family=Bangers&family=Anton&family=Archivo+Black&family=Space+Grotesk:wght@400;500;600;700&family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;0,9..144,700;0,9..144,900;1,9..144,400;1,9..144,600&family=Inter:wght@400;500;600;700;800;900&display=swap');

      /* ============================================================
         Furret Today — Pop-Art Digital Magazine Design System
         ============================================================ */

      /* ---------- Tokens ---------- */
      :root {
        --ft-ink: #0b0b0f;
        --ft-paper: #fdf6e3;
        --ft-paper-2: #f5ecd0;
        --ft-paper-dark: #1a1925;

        --ft-pink: #ff2d87;
        --ft-pink-soft: #ffd1e3;
        --ft-yellow: #ffd60a;
        --ft-yellow-soft: #fff3a8;
        --ft-cyan: #00c4d4;
        --ft-cyan-soft: #c9f3f7;
        --ft-orange: #ff7a1a;
        --ft-orange-soft: #ffd8b8;
        --ft-purple: #8b5cf6;
        --ft-purple-soft: #e6dcff;
        --ft-lime: #b3e63b;
        --ft-red: #ed1c24;

        --ft-font-display: "Bangers", "Anton", "Archivo Black", system-ui, sans-serif;
        --ft-font-deck: "Fraunces", Georgia, serif;
        --ft-font-body: "Space Grotesk", "Inter", system-ui, sans-serif;
        --ft-font-ui: "Inter", system-ui, sans-serif;

        --ft-shadow-pop: 6px 6px 0 0 var(--ft-ink);
        --ft-shadow-pop-lg: 10px 10px 0 0 var(--ft-ink);
        --ft-shadow-pop-sm: 3px 3px 0 0 var(--ft-ink);
        --ft-border: 2.5px solid var(--ft-ink);
        --ft-border-thick: 4px solid var(--ft-ink);

        --ft-radius-sm: 6px;
        --ft-radius: 14px;
        --ft-radius-lg: 24px;
      }

      * { box-sizing: border-box; }

      /* ---------- Base reset for furrettoday pages ---------- */
      .ft-root {
        margin: 0;
        padding: 0;
        background: var(--ft-paper);
        color: var(--ft-ink);
        font-family: var(--ft-font-body);
        -webkit-font-smoothing: antialiased;
        text-rendering: optimizeLegibility;
        min-height: 100vh;
        background: linear-gradient(180deg, var(--ft-paper) 0%, var(--ft-paper-2) 100%);
      }

      .ft-root img { display: block; max-width: 100%; }
      .ft-root button, .ft-root a { font-family: inherit; }
      .ft-root a { color: inherit; text-decoration: none; }

      /* ---------- Display type ---------- */
      .ft-display {
        font-family: var(--ft-font-display);
        font-weight: 400;
        letter-spacing: 0.02em;
        line-height: 0.95;
      }
      .ft-deck {
        font-family: var(--ft-font-deck);
        font-weight: 600;
        font-style: italic;
        font-optical-sizing: auto;
        line-height: 1.15;
      }
      .ft-eyebrow {
        font-family: var(--ft-font-ui);
        font-weight: 800;
        font-size: 11px;
        letter-spacing: 0.18em;
        text-transform: uppercase;
      }
      .ft-meta {
        font-family: var(--ft-font-ui);
        font-weight: 500;
        font-size: 13px;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: var(--ft-ink);
        opacity: 0.7;
      }
      .ft-body {
        font-family: var(--ft-font-body);
        font-size: 16px;
        line-height: 1.65;
        color: #232027;
      }
      .ft-byline {
        font-family: var(--ft-font-deck);
        font-style: italic;
        font-weight: 600;
      }

      /* Ink stroke around large display text */
      .ft-ink-stroke {
        -webkit-text-stroke: 2.5px var(--ft-ink);
        paint-order: stroke fill;
      }

      /* Sticker (small rotated badge) */
      .ft-sticker {
        display: inline-block;
        font-family: var(--ft-font-display);
        letter-spacing: 0.04em;
        padding: 6px 14px 4px;
        background: var(--ft-yellow);
        color: var(--ft-ink);
        border: var(--ft-border);
        border-radius: 999px;
        box-shadow: var(--ft-shadow-pop-sm);
        transform: rotate(-3deg);
        white-space: nowrap;
      }

      /* ---------- Backgrounds ---------- */
      .ft-halftone {
        background-image: radial-gradient(var(--ft-ink) 1.2px, transparent 1.4px);
        background-size: 10px 10px;
        background-position: 0 0;
      }
      .ft-halftone-dense {
        background-image: radial-gradient(var(--ft-ink) 1.6px, transparent 1.8px);
        background-size: 8px 8px;
      }
      .ft-halftone-color {
        background-image: radial-gradient(var(--ft-pink) 1.4px, transparent 1.6px);
        background-size: 9px 9px;
      }
      .ft-halftone-mask {
        -webkit-mask-image: linear-gradient(180deg, #000 0%, #000 70%, transparent 100%);
        mask-image: linear-gradient(180deg, #000 0%, #000 70%, transparent 100%);
      }

      .ft-newsprint {
        background: repeating-linear-gradient(
          to bottom,
          transparent 0, transparent 27px,
          rgba(0,0,0,0.04) 27px, rgba(0,0,0,0.04) 28px
        );
      }

      .ft-stripes {
        background-image: repeating-linear-gradient(
          45deg,
          var(--ft-yellow) 0 16px,
          var(--ft-ink) 16px 19px
        );
      }

      /* ---------- Cards & containers ---------- */
      .ft-card {
        background: #fff;
        border: var(--ft-border);
        border-radius: var(--ft-radius-lg);
        box-shadow: var(--ft-shadow-pop);
        transition: transform 180ms cubic-bezier(.2,.7,.2,1), box-shadow 180ms cubic-bezier(.2,.7,.2,1);
      }
      .ft-card:hover {
        transform: translate(-2px, -2px);
        box-shadow: var(--ft-shadow-pop-lg);
      }
      .ft-card-flat { border: var(--ft-border); border-radius: var(--ft-radius); background: #fff; }

      /* Buttons */
      .ft-btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 12px 20px;
        font-family: var(--ft-font-ui);
        font-weight: 800;
        font-size: 14px;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        background: var(--ft-yellow);
        color: var(--ft-ink);
        border: var(--ft-border);
        border-radius: 999px;
        box-shadow: var(--ft-shadow-pop-sm);
        cursor: pointer;
        transition: transform 140ms ease, box-shadow 140ms ease, background-color 140ms ease;
        white-space: nowrap;
      }
      .ft-btn:hover { transform: translate(-2px, -2px); box-shadow: 5px 5px 0 0 var(--ft-ink); }
      .ft-btn:active { transform: translate(1px, 1px); box-shadow: 2px 2px 0 0 var(--ft-ink); }
      .ft-btn.is-primary { background: var(--ft-pink); color: #fff; }
      .ft-btn.is-ink { background: var(--ft-ink); color: var(--ft-yellow); }
      .ft-btn.is-cyan { background: var(--ft-cyan); color: var(--ft-ink); }
      .ft-btn.is-ghost { background: transparent; box-shadow: none; }
      .ft-btn.is-ghost:hover { background: rgba(0,0,0,0.05); transform: none; box-shadow: none; }
      .ft-btn.is-sm { padding: 8px 14px; font-size: 12px; }
      .ft-btn.is-lg { padding: 16px 28px; font-size: 16px; }

      /* Pill labels */
      .ft-pill {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 12px 3px;
        font-family: var(--ft-font-ui);
        font-weight: 800;
        font-size: 11px;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        background: var(--ft-ink);
        color: var(--ft-yellow);
        border-radius: 999px;
      }
      .ft-pill.is-pink { background: var(--ft-pink); color: #fff; }
      .ft-pill.is-cyan { background: var(--ft-cyan); color: var(--ft-ink); }
      .ft-pill.is-yellow { background: var(--ft-yellow); color: var(--ft-ink); }
      .ft-pill.is-lime { background: var(--ft-lime); color: var(--ft-ink); }
      .ft-pill.is-orange { background: var(--ft-orange); color: var(--ft-ink); }
      .ft-pill.is-purple { background: var(--ft-purple); color: #fff; }
      .ft-pill.is-paper { background: var(--ft-paper); color: var(--ft-ink); border: 1.5px solid var(--ft-ink); }
      .ft-pill.is-live::before {
        content: ""; width: 6px; height: 6px; border-radius: 999px;
        background: #fff; box-shadow: 0 0 0 2px rgba(255,255,255,0.4);
        animation: ft-pulse 1.4s infinite ease-in-out;
      }

      /* Decorative number stamp */
      .ft-stamp {
        font-family: var(--ft-font-display);
        font-size: 64px;
        line-height: 1;
        color: var(--ft-pink);
        -webkit-text-stroke: 2.5px var(--ft-ink);
        paint-order: stroke fill;
      }

      /* Dotted divider */
      .ft-divider {
        border: 0;
        border-top: 3px dotted var(--ft-ink);
        margin: 24px 0;
      }

      /* Animations */
      @keyframes ft-pulse { 0%,100% { opacity: 1 } 50% { opacity: 0.4 } }
      @keyframes ft-bob { 0%,100% { transform: translateY(0) rotate(-2deg) } 50% { transform: translateY(-4px) rotate(-1deg) } }
      @keyframes ft-shake { 0%,100% { transform: rotate(-3deg) } 50% { transform: rotate(3deg) } }
      @keyframes ft-marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }
      @keyframes ft-burst { 0% { transform: scale(0.8); opacity: 0 } 60% { transform: scale(1.05); opacity: 1 } 100% { transform: scale(1); opacity: 1 } }

      .ft-bob { animation: ft-bob 4.5s ease-in-out infinite; }
      .ft-burst-in { animation: ft-burst 360ms cubic-bezier(.2,.8,.2,1) both; }

      @media (prefers-reduced-motion: reduce) {
        .ft-root *, .ft-root *::before, .ft-root *::after { animation: none !important; transition: none !important; }
      }

      /* Focus states */
      .ft-root :focus-visible {
        outline: 3px solid var(--ft-pink);
        outline-offset: 3px;
        border-radius: 4px;
      }

      /* ---------- Layout helpers ---------- */
      .ft-wrap {
        max-width: 1280px;
        margin: 0 auto;
        padding: 0 24px;
      }
      .ft-wrap-wide {
        max-width: 1400px;
        margin: 0 auto;
        padding: 0 24px;
      }

      /* Marquee ticker */
      .ft-marquee {
        overflow: hidden;
        border-top: var(--ft-border);
        border-bottom: var(--ft-border);
        background: var(--ft-yellow);
      }
      .ft-marquee__track {
        display: inline-flex;
        white-space: nowrap;
        animation: ft-marquee 40s linear infinite;
      }
      .ft-marquee__item {
        display: inline-flex;
        align-items: center;
        gap: 14px;
        font-family: var(--ft-font-display);
        font-size: 18px;
        letter-spacing: 0.05em;
        padding: 8px 22px;
      }
      .ft-marquee__sep {
        display: inline-block; width: 8px; height: 8px; background: var(--ft-pink);
        border: 2px solid var(--ft-ink); border-radius: 999px; transform: rotate(45deg);
      }

      /* Drop cap */
      .ft-dropcap::first-letter {
        font-family: var(--ft-font-display);
        font-size: 88px;
        line-height: 0.85;
        float: left;
        padding: 8px 12px 4px 0;
        color: var(--ft-pink);
        -webkit-text-stroke: 2px var(--ft-ink);
        paint-order: stroke fill;
      }

      /* Pull quote */
      .ft-pullquote {
        font-family: var(--ft-font-deck);
        font-weight: 700;
        font-style: italic;
        font-size: 30px;
        line-height: 1.2;
        color: var(--ft-ink);
        padding: 28px 0 28px 28px;
        border-left: 6px solid var(--ft-pink);
        position: relative;
        margin: 32px 0;
      }
      .ft-pullquote::before {
        content: '“';
        position: absolute;
        font-family: var(--ft-font-display);
        font-size: 110px;
        color: var(--ft-pink);
        top: -10px;
        left: -8px;
        line-height: 1;
        opacity: 0.25;
      }

      /* Search input */
      .ft-input {
        font-family: var(--ft-font-ui);
        font-size: 15px;
        padding: 12px 16px;
        border: var(--ft-border);
        border-radius: 999px;
        background: #fff;
        box-shadow: var(--ft-shadow-pop-sm);
        min-width: 0;
      }
      .ft-input:focus { outline: none; border-color: var(--ft-pink); }

      /* Scrollbar (pop-art) */
      .ft-scroll::-webkit-scrollbar { height: 10px; width: 10px; }
      .ft-scroll::-webkit-scrollbar-track { background: var(--ft-paper-2); border-radius: 999px; }
      .ft-scroll::-webkit-scrollbar-thumb { background: var(--ft-pink); border-radius: 999px; border: 2px solid var(--ft-ink); }

      /* Article body */
      .ft-article-body { font-family: var(--ft-font-body); font-size: 18px; line-height: 1.75; color: #1a1822; }
      .ft-article-body p { margin: 0 0 22px; }
      .ft-article-body h2 { font-family: var(--ft-font-display); font-size: 34px; margin: 40px 0 16px; letter-spacing: 0.02em; }
      .ft-article-body strong { background: var(--ft-yellow); padding: 0 4px; }
      .ft-article-body a { color: var(--ft-pink); text-decoration: underline; text-decoration-thickness: 2px; text-underline-offset: 3px; }

      /* Tag chip */
      .ft-chip {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 14px;
        font-family: var(--ft-font-ui);
        font-weight: 700;
        font-size: 12px;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        background: #fff;
        color: var(--ft-ink);
        border: 2px solid var(--ft-ink);
        border-radius: 999px;
        cursor: pointer;
        transition: background 120ms ease, color 120ms ease;
      }
      .ft-chip:hover { background: var(--ft-yellow); }
      .ft-chip.is-active { background: var(--ft-pink); color: #fff; }

      /* Loading skeleton (pop) */
      .ft-skel {
        background: linear-gradient(90deg, rgba(0,0,0,0.06) 0%, rgba(0,0,0,0.12) 50%, rgba(0,0,0,0.06) 100%);
        background-size: 200% 100%;
        animation: ft-shimmer 1.4s linear infinite;
        border: 2px solid var(--ft-ink);
        border-radius: var(--ft-radius);
      }
      @keyframes ft-shimmer { from { background-position: 200% 0 } to { background-position: -200% 0 } }

      /* Cover variants */
      .ft-cover--paper { background: var(--ft-paper); }
      .ft-cover--ink { background: var(--ft-paper-dark); color: #fff; }
      .ft-cover--pink { background: var(--ft-pink); color: #fff; }
      .ft-cover--cyan { background: var(--ft-cyan); color: var(--ft-ink); }

      /* Hover lift */
      .ft-lift { transition: transform 200ms ease, box-shadow 200ms ease; }
      .ft-lift:hover { transform: translate(-2px, -2px) rotate(-0.5deg); }

      /* Utility rotations */
      .ft-rotate--1 { transform: rotate(-1deg); }
      .ft-rotate-1 { transform: rotate(1deg); }
      .ft-rotate--2 { transform: rotate(-2deg); }
      .ft-rotate-2 { transform: rotate(2deg); }
      .ft-tilt:hover { transform: rotate(-1deg) translate(-2px,-2px); }

      /* ---------- CKEditor overrides (scoped to furrettoday only) ---------- */
      .ck.ck-editor__editable_inline {
        overflow: hidden !important;
        height: 100% !important;
        font-family: var(--ft-font-body) !important;
        font-size: 17px !important;
        line-height: 1.7 !important;
      }

      /* Pop-art CKEditor content styles — only inside furrettoday pages */
      .ft-root .ck-content {
        font-family: var(--ft-font-body);
        font-size: 18px;
        line-height: 1.75;
        color: #1a1822;
      }

      .ft-root .ck-content p {
        margin: 0 0 22px;
      }

      /* H2: yellow background with ink box-shadow */
      .ft-root .ck-content h2 {
        font-family: var(--ft-font-display);
        font-size: 34px;
        margin: 40px 0 16px;
        letter-spacing: 0.02em;
        line-height: 1.1;
      }
      .ft-root .ck-content h2 > span,
      .ft-root .ck-content h2 {
        background: var(--ft-yellow);
        padding: 0 8px;
        box-shadow: 3px 3px 0 var(--ft-ink);
        display: inline;
      }

      /* Blockquote: pull-quote style */
      .ft-root .ck-content blockquote {
        font-family: var(--ft-font-deck);
        font-weight: 700;
        font-style: italic;
        font-size: 26px;
        line-height: 1.2;
        color: var(--ft-ink);
        padding: 28px 0 28px 28px;
        border-left: 6px solid var(--ft-pink);
        position: relative;
        margin: 32px 0;
        background: transparent;
      }
      .ft-root .ck-content blockquote::before {
        content: '"';
        position: absolute;
        font-family: var(--ft-font-display);
        font-size: 100px;
        color: var(--ft-pink);
        top: -10px;
        left: -8px;
        line-height: 1;
        opacity: 0.25;
      }

      /* Strong: yellow highlight */
      .ft-root .ck-content strong {
        background: var(--ft-yellow);
        padding: 0 4px;
      }

      /* Links: pink underline */
      .ft-root .ck-content a {
        color: var(--ft-pink);
        text-decoration: underline;
        text-decoration-thickness: 2px;
        text-underline-offset: 3px;
      }

      /* Drop cap on first paragraph */
      .ft-root .ck-content > p:first-of-type::first-letter,
      .ft-root .ft-dropcap::first-letter {
        font-family: var(--ft-font-display);
        font-size: 88px;
        line-height: 0.85;
        float: left;
        padding: 8px 12px 4px 0;
        color: var(--ft-pink);
        -webkit-text-stroke: 2px var(--ft-ink);
        paint-order: stroke fill;
      }

      /* Hide the placeholder text in editor */
      .ck-placeholder {
        display: none !important;
      }
    `}</style>
  );
}
