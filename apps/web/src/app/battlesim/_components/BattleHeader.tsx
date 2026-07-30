'use client';

import { useTranslations } from 'next-intl';

import type { CSSProperties, ReactNode } from 'react';
import Link from 'next/link';
import { Icon } from '@boffmedia/ui';
import { BxRing } from '@/app/(boffmedia)/(herramientas)/pokemon/battlesim/_components/ui/bx-kit';

/** `labelKey` is a key id under `battlesim.header.modes` — never copy. */
const MODE_META: Record<string, { labelKey: string; tone: string }> = {
  ai: { labelKey: 'ai', tone: 'var(--signal)' },
  pvp: { labelKey: 'pvp', tone: 'var(--warn)' },
  showdown: { labelKey: 'showdown', tone: 'var(--accent)' },
  replay: { labelKey: 'replay', tone: 'var(--ok)' },
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
    <header
      aria-label={t('header.aria')}
      style={{ clipPath: 'polygon(0 0,100% 0,100% calc(100% - 12px),calc(100% - 12px) 100%,0 100%)' }}
      className="flex flex-wrap items-center gap-x-3 gap-y-2 border border-solid border-line bg-[color-mix(in_srgb,var(--panel)_88%,transparent)] px-3 py-2 backdrop-blur-[4px]"
    >
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        {backHref && (
          <Link
            href={backHref}
            className="inline-flex items-center gap-1 whitespace-nowrap font-mono text-[11px] uppercase tracking-[0.06em] text-txt-muted transition-colors hover:text-txt focus-visible:outline-none"
          >
            <Icon name="back" size={13} />{back}
          </Link>
        )}
        <span
          style={{ ['--tyc']: meta.tone, clipPath: 'polygon(3px 0,100% 0,calc(100% - 3px) 100%,0 100%)' } as CSSProperties}
          className="flex-none border border-solid border-[color-mix(in_srgb,var(--tyc)_45%,transparent)] bg-[color-mix(in_srgb,var(--tyc)_14%,transparent)] px-2 py-1 font-mono text-[10px] font-bold uppercase leading-none tracking-[0.12em] text-[var(--tyc)]"
        >
          {t(`header.modes.${meta.labelKey}`)}
        </span>
        {roomId && (
          <span
            className="max-w-[16ch] overflow-hidden text-ellipsis whitespace-nowrap border border-solid border-line-2 bg-base px-2 py-1 font-mono text-[10px] leading-none text-txt-muted"
            title={roomId}
          >
            {roomId}
          </span>
        )}
        {formatLabel && (
          <span className="whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.06em] text-txt-dim">{formatLabel}</span>
        )}
        {extra}
      </div>

      {(username || opponentName) && (
        <span className="mx-auto whitespace-nowrap font-mono text-[11px] text-txt-muted">
          {username && <strong className="text-txt">{username}</strong>}
          {username && opponentName && <span className="text-txt-dim"> {t('header.vs')} </span>}
          {opponentName && <strong className="text-txt">{opponentName}</strong>}
        </span>
      )}

      <div className="ml-auto flex flex-none items-center gap-2">
        {spectatorCount != null && spectatorCount > 0 && (
          <span className="inline-flex items-center gap-1 whitespace-nowrap border border-solid border-line-2 bg-base px-2 py-1 font-mono text-[10px] leading-none text-txt-muted">
            <Icon name="eye" size={12} />{spectatorCount}
          </span>
        )}
        {timerP1 != null && <BxRing sec={timerP1} max={timerMax} size={36} />}
        {timerP2 != null && <BxRing sec={timerP2} max={timerMax} size={36} />}
        {onToggleFullscreen && (
          <button
            type="button"
            onClick={onToggleFullscreen}
            title={isFullscreen ? t('header.exitFullscreen') : t('header.fullscreen')}
            className="grid h-8 w-8 place-items-center border border-solid border-line-2 bg-base text-txt-muted transition-colors hover:border-accent-line hover:text-txt focus-visible:outline-none"
          >
            <Icon name={isFullscreen ? 'exitFullscreen' : 'fullscreen'} size={15} />
          </button>
        )}
        {showForfeit && onForfeit && (
          <button
            type="button"
            onClick={onForfeit}
            className="border border-solid border-[color-mix(in_srgb,var(--bad)_45%,transparent)] bg-bad-soft px-4 py-1.5 font-mono text-[11px] font-semibold uppercase leading-none tracking-[0.06em] text-bad transition-colors hover:bg-[color-mix(in_srgb,var(--bad)_22%,transparent)] focus-visible:outline-none"
          >
            {t('header.forfeit')}
          </button>
        )}
      </div>
    </header>
  );
}
