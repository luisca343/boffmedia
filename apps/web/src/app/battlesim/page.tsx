'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const MODES = [
  { href: "/battlesim/play", icon: "⚔️", titleKey: "landing.play", descKey: "landing.playDesc", color: "var(--cyan-400)" },
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

export default function Page() {
  const t = useTranslations('battlesim');
  const activeBattle = useActiveBattle();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8 px-4">
      <div className="text-center">
        <h1 className="font-display text-4xl font-bold mb-3" style={{ color: 'var(--text)' }}>{t('landing.title')}</h1>
        <p className="text-lg" style={{ color: 'var(--text-muted)' }}>
          {t('landing.subtitle')}
        </p>
      </div>

      {activeBattle && (
        <Link
          href={activeBattle.href}
          className="bsx-focus flex items-center gap-3 px-5 py-3 rounded-[var(--radius)] font-medium"
          style={{
            background: 'color-mix(in srgb, var(--emerald-500) 12%, var(--surface))',
            border: '1px solid color-mix(in srgb, var(--emerald-500) 45%, transparent)',
            color: 'var(--emerald-400)',
          }}
        >
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ background: 'var(--emerald-400)', boxShadow: '0 0 8px var(--emerald-400)' }}
          />
          {t('landing.resume')}
        </Link>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 w-full max-w-5xl">
        {MODES.map((mode) => (
          <Link
            key={mode.href}
            href={mode.href}
            className="bsx-focus group flex flex-col items-center gap-2 p-6 rounded-[var(--radius)] transition-all duration-[var(--dur)] ease-[var(--ease)] hover:scale-[1.02] hover:-translate-y-0.5"
            style={{
              background: 'var(--card-bg)',
              border: 'var(--card-border)',
              boxShadow: 'var(--card-shadow)',
            }}
          >
            <span
              className="grid place-items-center w-12 h-12 rounded-[var(--radius)] text-2xl transition-shadow duration-[var(--dur)]"
              style={{
                background: `color-mix(in srgb, ${mode.color} 12%, var(--surface-2))`,
                border: `1px solid color-mix(in srgb, ${mode.color} 35%, transparent)`,
              }}
            >
              {mode.icon}
            </span>
            <h2 className="font-display text-lg font-semibold" style={{ color: 'var(--text)' }}>{t(mode.titleKey)}</h2>
            <p className="text-sm text-center" style={{ color: 'var(--text-muted)' }}>{t(mode.descKey)}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
