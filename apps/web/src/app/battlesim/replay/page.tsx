'use client';

import { Game } from './_components/Game';

const C = 'var(--emerald-400)';

export default function ReplayPage() {
  return (
    <div className="relative min-h-[calc(100vh-80px)] overflow-hidden px-4 py-10">
      {/* Grid dot background */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(var(--grid-dot) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          maskImage: 'radial-gradient(ellipse at center 20%, black, transparent 75%)',
        }}
      />
      {/* Radial glow */}
      <div
        aria-hidden="true"
        className="absolute -top-40 left-1/2 -translate-x-1/2 w-[720px] h-[420px] rounded-full pointer-events-none"
        style={{ background: `radial-gradient(ellipse, color-mix(in srgb, ${C} 16%, transparent), transparent 70%)` }}
      />

      <div className="relative z-10 mx-auto max-w-5xl flex flex-col gap-8">
        {/* Hero header */}
        <header className="flex flex-col gap-2">
          <span className="font-mono font-bold text-t-3xs tracking-[.3em] uppercase" style={{ color: C }}>
            📺 04
          </span>
          <h1
            className="font-display font-black italic uppercase text-5xl md:text-6xl tracking-[.02em]"
            style={{ color: 'var(--text)', textShadow: `0 0 36px color-mix(in srgb, ${C} 35%, transparent)` }}
          >
            Replays
          </h1>
          <p className="text-lg max-w-[52ch]" style={{ color: 'var(--text-muted)' }}>
            Load a replay log or paste a Showdown replay
          </p>
        </header>

        {/* Game card */}
        <div
          className="relative overflow-hidden rounded-[var(--radius-lg)]"
          style={{
            background: `color-mix(in srgb, ${C} 8%, var(--surface))`,
            border: `1px solid color-mix(in srgb, ${C} 25%, var(--border))`,
          }}
        >
          {/* Accent stripe */}
          <span
            aria-hidden="true"
            className="absolute top-0 left-0 h-0.5 w-2/5"
            style={{ background: `linear-gradient(90deg, ${C}, transparent)` }}
          />
          <Game />
        </div>
      </div>
    </div>
  );
}
