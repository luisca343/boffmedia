'use client';

import { useTranslations } from 'next-intl';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { Spinner } from '@/components/boffmedia/primitives/spinner';

interface BattleConnectionStateProps {
  kind: 'loading' | 'connecting' | 'reconnecting' | 'queue' | 'error';
  message: string;
  detail?: string;
  backHref?: string;
  backLabel?: string;
  onRetry?: () => void;
  retryLabel?: string;
  children?: ReactNode;
}

/**
 * Shared connection-lifecycle screen for all battle surfaces:
 * connecting / reconnecting / queueing spinners and error states.
 */
export function BattleConnectionState({
  kind,
  message,
  detail,
  backHref,
  backLabel,
  onRetry,
  retryLabel,
  children,
}: BattleConnectionStateProps) {
  const t = useTranslations('battlesim');
  const isError = kind === 'error';

  return (
    <div data-ds="boffmedia" className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-txt">
      {isError ? (
        <div className="text-center">
          <h2 className="mb-2 text-[22px] text-bad">{t('connection.error')}</h2>
          <p className="text-txt-muted">{message}</p>
        </div>
      ) : (
        <>
          <Spinner size={28} />
          <p role="status" className="font-mono text-[13px] uppercase tracking-[0.06em] text-txt-muted">{message}</p>
        </>
      )}
      {detail && (
        <p className="font-mono text-[11px] text-warn">{detail}</p>
      )}
      {children}
      <div className="flex items-center gap-3">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            style={{ clipPath: 'polygon(4px 0,100% 0,calc(100% - 4px) 100%,0 100%)' }}
            className="bg-accent px-6 py-2 font-display text-[13px] font-bold uppercase leading-none tracking-[0.04em] text-accent-ink transition-[filter] hover:brightness-110 focus-visible:outline-none"
          >
            {retryLabel ?? t('connection.tryAgain')}
          </button>
        )}
        {backHref && (
          <Link
            href={backHref}
            className="border border-solid border-line-2 bg-panel px-6 py-2 font-mono text-[12px] font-semibold uppercase leading-none tracking-[0.06em] text-txt-muted transition-colors hover:border-accent-line hover:text-txt focus-visible:outline-none"
          >
            {backLabel ?? t('connection.backToLobby')}
          </Link>
        )}
      </div>
    </div>
  );
}
