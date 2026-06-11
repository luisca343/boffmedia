'use client';

import { useTranslations } from 'next-intl';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { BoffActionBar, BSXRing, Icon } from '@/components/boffmedia/primitives';

const MODE_META: Record<string, { label: string; color: string }> = {
  ai: { label: 'VS AI', color: 'var(--cyan-400)' },
  pvp: { label: 'PVP', color: 'var(--orange-400)' },
  showdown: { label: 'SHOWDOWN', color: 'var(--purple-400)' },
  replay: { label: 'REPLAY', color: 'var(--emerald-400)' },
};

interface BattleHeaderProps {
  mode: 'ai' | 'pvp' | 'showdown' | 'replay';
  backHref?: string;
  backLabel?: string;
  roomId?: string;
  formatLabel?: string;
  username?: string;
  opponentName?: string;
  spectatorCount?: number;
  /** Remaining seconds per side — rings render only when provided. */
  timerP1?: number | null;
  timerP2?: number | null;
  timerMax?: number;
  showForfeit?: boolean;
  onForfeit?: () => void;
  /** Extra header content (e.g. session tabs) rendered in the start slot. */
  extra?: ReactNode;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export function BattleHeader({
  mode,
  backHref,
  backLabel,
  roomId,
  formatLabel,
  username,
  opponentName,
  spectatorCount,
  timerP1,
  timerP2,
  timerMax = 60,
  showForfeit,
  onForfeit,
  extra,
  isFullscreen,
  onToggleFullscreen,
}: BattleHeaderProps) {
  const t = useTranslations('battlesim');
  const meta = MODE_META[mode];
  const back = backLabel ?? t('header.lobby');

  return (
    <BoffActionBar
      aria-label="Battle header"
      start={
        <>
          {backHref && (
            <Link href={backHref} className="bsx-focus text-sm whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
              ← {back}
            </Link>
          )}
          <span
            className="font-mono font-bold text-t-3xs tracking-[.12em] px-2 py-1 rounded-[var(--radius-sm)] shrink-0"
            style={{
              color: meta.color,
              background: `color-mix(in srgb, ${meta.color} 14%, transparent)`,
              border: `1px solid color-mix(in srgb, ${meta.color} 40%, transparent)`,
            }}
          >
            {meta.label}
          </span>
          {roomId && (
            <span
              className="text-t-xs px-2 py-1 rounded-[var(--radius-sm)] font-mono max-w-[16ch] overflow-hidden text-ellipsis whitespace-nowrap"
              style={{ color: 'var(--text-muted)', background: 'var(--surface-2)' }}
              title={roomId}
            >
              {roomId}
            </span>
          )}
          {formatLabel && (
            <span className="text-t-xs whitespace-nowrap" style={{ color: 'var(--text-dim)' }}>{formatLabel}</span>
          )}
          {extra}
        </>
      }
      center={
        username || opponentName ? (
          <span className="text-t-xs whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
            {username && <strong style={{ color: 'var(--text)' }}>{username}</strong>}
            {username && opponentName && <span style={{ color: 'var(--text-dim)' }}> {t('header.vs')} </span>}
            {opponentName && <strong style={{ color: 'var(--text)' }}>{opponentName}</strong>}
          </span>
        ) : undefined
      }
      end={
        <>
          {spectatorCount != null && spectatorCount > 0 && (
            <span
              className="text-t-xs px-2 py-1 rounded-[var(--radius-sm)] whitespace-nowrap"
              style={{ color: 'var(--text-muted)', background: 'var(--surface-2)' }}
            >
              👁 {spectatorCount}
            </span>
          )}
          {timerP1 != null && <BSXRing sec={timerP1} max={timerMax} size={36} />}
          {timerP2 != null && <BSXRing sec={timerP2} max={timerMax} size={36} />}
          {onToggleFullscreen && (
            <button
              onClick={onToggleFullscreen}
              className="bsx-focus p-2 rounded-[var(--radius-sm)] transition-colors duration-[var(--dur-fast)]"
              style={{
                background: 'var(--surface-2)',
                color: 'var(--text-muted)',
                border: '1px solid var(--border)',
              }}
              title={isFullscreen ? t('header.exitFullscreen') : t('header.fullscreen')}
            >
              <Icon name={isFullscreen ? 'exit-fullscreen' : 'fullscreen'} size={16} />
            </button>
          )}
          {showForfeit && onForfeit && (
            <button
              onClick={onForfeit}
              className="bsx-focus px-4 py-1.5 rounded-[var(--radius-sm)] text-sm font-medium transition-colors duration-[var(--dur)]"
              style={{
                background: 'var(--surface-3)',
                color: 'var(--rose-400)',
                border: '1px solid color-mix(in srgb, var(--rose-500) 40%, transparent)',
              }}
            >
              {t('header.forfeit')}
            </button>
          )}
        </>
      }
    />
  );
}
