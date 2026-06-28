'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface Mode {
  href: string;
  icon: string;
  titleKey: string;
  descKey: string;
  color: string;
  hero?: boolean;
}

const MODES: Mode[] = [
  { href: "/battlesim/play", icon: "⚔️", titleKey: "landing.play", descKey: "landing.playDesc", color: "var(--cyan-400)", hero: true },
  { href: "/battlesim/pvp", icon: "🏆", titleKey: "landing.pvp", descKey: "landing.pvpDesc", color: "var(--orange-400)" },
  { href: "/battlesim/showdown", icon: "🌐", titleKey: "landing.showdown", descKey: "landing.showdownDesc", color: "var(--purple-400)" },
  { href: "/battlesim/replay", icon: "📺", titleKey: "landing.replays", descKey: "landing.replaysDesc", color: "var(--emerald-400)" },
  { href: "/battlesim/calc", icon: "🔢", titleKey: "landing.calc", descKey: "landing.calcDesc", color: "var(--amber-400)" },
];

/** Detects an in-progress battle from client session globals for quick resume. */
function useActiveBattle(): { href: string } | null {
  const [active, setActive] = useState<{ href: string } | null>(null);

  useEffect(() => {
    const w = window as any;
    const pvpSessions = w.__pvp_sessions ? Object.entries(w.__pvp_sessions) : [];
    for (const [roomId, sess] of pvpSessions as [string, any][]) {
      if (sess?.status === 'active') {
        setActive({ href: `/battlesim/pvp/battle/${encodeURIComponent(roomId)}` });
        return;
      }
    }
  }, []);

  return active;
}

function ModeCard({ mode, t, index }: { mode: Mode; t: ReturnType<typeof useTranslations>; index: number }) {
  return (
    <Link
      href={mode.href}
      className={`launcher-card bsx-focus group relative flex flex-col justify-end overflow-hidden rounded-[var(--radius-lg)] p-6 transition-transform duration-[var(--dur)] ease-[var(--ease)] hover:-translate-y-1 ${
        mode.hero ? 'lg:row-span-2 min-h-[260px] lg:min-h-0' : 'min-h-[150px]'
      }`}
      style={{
        background: `linear-gradient(150deg, color-mix(in srgb, ${mode.color} 16%, var(--layer-1)), var(--layer-1) 55%)`,
        border: `1px solid color-mix(in srgb, ${mode.color} 30%, var(--border))`,
        animationDelay: `${0.08 * index}s`,
        ['--_c' as any]: mode.color,
      }}
    >
      {/* Oversized icon backdrop */}
      <span
        aria-hidden="true"
        className={`absolute -top-4 -right-4 select-none pointer-events-none opacity-[.13] group-hover:opacity-25 group-hover:scale-110 transition-all duration-[var(--dur)] ease-[var(--ease)] ${
          mode.hero ? 'text-[10rem]' : 'text-[6rem]'
        }`}
      >
        {mode.icon}
      </span>

      {/* Diagonal accent stripe */}
      <span
        aria-hidden="true"
        className="absolute top-0 left-0 h-1 w-2/5 group-hover:w-3/5 transition-all duration-[var(--dur)] ease-[var(--ease)]"
        style={{ background: `linear-gradient(90deg, ${mode.color}, transparent)` }}
      />

      <div className="relative z-10 flex flex-col gap-1.5">
        <span
          className="font-mono font-bold text-t-4xs tracking-[.22em] uppercase"
          style={{ color: mode.color }}
        >
          {String(index + 1).padStart(2, '0')}
        </span>
        <h2 className={`font-display font-extrabold uppercase tracking-[.04em] text-ink ${mode.hero ? 'text-3xl' : 'text-xl'}`}>
          {t(mode.titleKey)}
        </h2>
        <p className="text-sm max-w-[34ch]" style={{ color: 'var(--text-muted)' }}>
          {t(mode.descKey)}
        </p>
        <span
          className="mt-1 inline-flex items-center gap-2 font-mono font-bold text-t-3xs tracking-[.14em] uppercase opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-[var(--dur)] ease-[var(--ease)]"
          style={{ color: mode.color }}
        >
          ▶▶
        </span>
      </div>

      {/* Hover glow */}
      <span
        aria-hidden="true"
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-[var(--dur)] pointer-events-none"
        style={{ boxShadow: `inset 0 0 60px -30px var(--_c), 0 0 40px -18px var(--_c)` }}
      />
    </Link>
  );
}

export default function Page() {
  const t = useTranslations('battlesim');
  const activeBattle = useActiveBattle();
  const [hero, ...rest] = MODES;

  return (
    <div className="launcher relative min-h-[calc(100vh-80px)] overflow-hidden px-4 py-10">
      {/* Ambient background: grid + drifting glow */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(var(--grid-dot) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          maskImage: 'radial-gradient(ellipse at center 20%, black, transparent 75%)',
        }}
      />
      <div
        aria-hidden="true"
        className="launcher-glow absolute -top-40 left-1/2 -translate-x-1/2 w-[720px] h-[420px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, color-mix(in srgb, var(--secondary) 16%, transparent), transparent 70%)' }}
      />

      <div className="relative z-10 mx-auto max-w-5xl flex flex-col gap-8">
        {/* Hero header */}
        <header className="launcher-in flex flex-col gap-2">
          <span className="font-mono font-bold text-t-3xs tracking-[.3em] uppercase" style={{ color: 'var(--secondary-hover)' }}>
            ⚡ Boffmedia
          </span>
          <h1
            className="font-display font-black italic uppercase text-5xl md:text-6xl tracking-[.02em]"
            style={{ color: 'var(--text)', textShadow: '0 0 36px color-mix(in srgb, var(--secondary) 35%, transparent)' }}
          >
            {t('landing.title')}
          </h1>
          <p className="text-lg max-w-[52ch]" style={{ color: 'var(--text-muted)' }}>
            {t('landing.subtitle')}
          </p>
        </header>

        {/* Quick resume */}
        {activeBattle && (
          <Link
            href={activeBattle.href}
            className="launcher-in bsx-focus flex items-center gap-3 self-start px-5 py-3 rounded-[var(--radius)] font-medium"
            style={{
              background: 'color-mix(in srgb, var(--emerald-500) 12%, var(--layer-1))',
              border: '1px solid color-mix(in srgb, var(--emerald-500) 45%, transparent)',
              color: 'var(--emerald-400)',
              animationDelay: '.05s',
            }}
          >
            <span
              className="w-2 h-2 rounded-full shrink-0 animate-pulse"
              style={{ background: 'var(--emerald-400)', boxShadow: '0 0 8px var(--emerald-400)' }}
            />
            {t('landing.resume')}
          </Link>
        )}

        {/* Bento mode grid: hero card + stack */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:auto-rows-[170px]">
          <div className="lg:col-span-2 lg:row-span-2 grid">
            <ModeCard mode={hero} t={t} index={0} />
          </div>
          {rest.map((mode, i) => (
            <ModeCard key={mode.href} mode={mode} t={t} index={i + 1} />
          ))}
        </div>
      </div>

      <style jsx>{`
        .launcher-in, :global(.launcher-card) {
          animation: launcher-rise 0.55s var(--ease) both;
        }
        .launcher-glow {
          animation: launcher-drift 9s ease-in-out infinite alternate;
        }
        @keyframes launcher-rise {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: none; }
        }
        @keyframes launcher-drift {
          from { transform: translate(-55%, 0); opacity: 0.8; }
          to { transform: translate(-45%, 24px); opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          .launcher-in, :global(.launcher-card), .launcher-glow {
            animation: none !important;
            opacity: 1;
            transform: none;
          }
        }
      `}</style>
    </div>
  );
}
