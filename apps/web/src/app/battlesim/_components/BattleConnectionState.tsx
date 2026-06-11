'use client';

import { useTranslations } from 'next-intl';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { BoffSpinner } from '@/components/boffmedia/primitives';

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
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
      {isError ? (
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--rose-500)' }}>{t('connection.error')}</h2>
          <p style={{ color: 'var(--text-muted)' }}>{message}</p>
        </div>
      ) : (
        <>
          <BoffSpinner size="md" />
          <p role="status" style={{ color: 'var(--text-muted)' }}>{message}</p>
        </>
      )}
      {detail && (
        <p className="text-xs" style={{ color: 'var(--amber-400)' }}>{detail}</p>
      )}
      {children}
      <div className="flex items-center gap-3">
        {onRetry && (
          <button
            onClick={onRetry}
            className="bsx-focus px-6 py-2 rounded-md font-medium transition-colors"
            style={{ background: 'var(--accent)', color: 'var(--text)', border: '1px solid var(--border)' }}
          >
            {retryLabel ?? t('connection.tryAgain')}
          </button>
        )}
        {backHref && (
          <Link
            href={backHref}
            className="bsx-focus px-6 py-2 rounded-md font-medium transition-colors"
            style={{ background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border)' }}
          >
            {backLabel ?? t('connection.backToLobby')}
          </Link>
        )}
      </div>
    </div>
  );
}
