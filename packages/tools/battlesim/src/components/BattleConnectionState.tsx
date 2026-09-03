'use client';

import * as React from 'react';
import { Button, Icon, Spinner, cn, type IconName } from '@boffmedia/ui';

import { useToolT, BATTLESIM_NS } from '../i18n';
import { BsimErrorState, BsimKicker, BSIM_STATE } from './bsim-kit';
import { useBsimNavMaybe } from '../nav';

type ConnectionKind = 'loading' | 'connecting' | 'reconnecting' | 'queue' | 'error';

interface BattleConnectionStateProps {
  kind: ConnectionKind;
  message: string;
  detail?: string;
  /**
   * Kept for the call sites that still pass one, and deliberately NOT rendered
   * as an `<a href>`: `/pokemon/battlesim/pvp` is a route the launcher does not
   * have, and following it there navigates the whole webview out of the app.
   * Passing it means "offer a way back"; where back goes is the nav seam's
   * business.
   */
  backHref?: string;
  backLabel?: string;
  onRetry?: () => void;
  retryLabel?: string;
  children?: React.ReactNode;
}

/** How long a wait may go unexplained before we admit it is unusual. */
const SLOW_MS = 20_000;

const KIND: Record<Exclude<ConnectionKind, 'error'>, { icon: IconName; key: string; tone: string }> = {
  loading: { icon: 'clock', key: 'hub.conn.loading', tone: 'text-txt-dim' },
  connecting: { icon: 'link', key: 'hub.conn.connecting', tone: 'text-signal' },
  reconnecting: { icon: 'refresh', key: 'hub.conn.reconnecting', tone: 'text-warn' },
  queue: { icon: 'users', key: 'hub.conn.queue', tone: 'text-accent-bright' },
};

/**
 * The one waiting-room screen for every battle surface.
 *
 * `kind` used to be accepted and then ignored — every value but `error` drew the
 * same spinner and the same sentence, so "reconnecting after your tunnel" and
 * "waiting for an opponent" were indistinguishable. Each state now names itself,
 * and any wait that runs past twenty seconds stops pretending it is normal.
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
  const t = useToolT(BATTLESIM_NS);
  const nav = useBsimNavMaybe();
  const back = React.useCallback(() => {
    if (nav && !nav.back()) nav.replace('hub', {});
  }, [nav]);

  const [slow, setSlow] = React.useState(false);
  React.useEffect(() => {
    if (kind === 'error') return;
    setSlow(false);
    const id = setTimeout(() => setSlow(true), SLOW_MS);
    return () => clearTimeout(id);
  }, [kind, message]);

  const backButton = (size: 'sm' | 'md') =>
    backHref && nav
      ? <Button size={size} icon="back" onClick={back}>{backLabel ?? t('connection.backToLobby')}</Button>
      : null;

  if (kind === 'error') {
    return (
      <div data-ds="boffmedia" className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-txt">
        <BsimErrorState
          icon="alert"
          title={t('connection.error')}
          lead={message}
          actions={
            <>
              {onRetry && <Button variant="pri" icon="refresh" onClick={onRetry}>{retryLabel ?? t('connection.tryAgain')}</Button>}
              {backButton('md')}
            </>
          }
        />
        {children}
      </div>
    );
  }

  const face = KIND[kind];

  return (
    <div data-ds="boffmedia" className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-txt">
      <section className={cn(BSIM_STATE, 'cut-corner cut-corner-edge [--cut-line:var(--line)] grid justify-items-center gap-[14px] border border-solid border-line bg-panel px-5 py-8 text-center')}>
        <BsimKicker className={cn('inline-flex items-center gap-[7px]', face.tone)}>
          <Icon name={face.icon} size={12} />
          {t(face.key)}
        </BsimKicker>

        <Spinner size={26} />

        <p role="status" className="m-0 font-display text-[15px]/[1.3] font-bold not-italic uppercase tracking-[0.03em] text-txt">
          {message}
        </p>

        {detail && <p className="m-0 font-mono text-[11px] leading-[1.45] text-warn">{detail}</p>}

        {/* Twenty seconds in, silence stops being reassuring. */}
        {slow && (
          <p className="m-0 font-body text-[12.5px] leading-[1.45] text-txt-muted">{t('hub.conn.slow')}</p>
        )}

        {children}

        {(onRetry || (backHref && nav)) && (
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            {onRetry && (slow || kind === 'reconnecting') && (
              <Button size="sm" variant="pri" icon="refresh" onClick={onRetry}>{retryLabel ?? t('hub.conn.retry')}</Button>
            )}
            {backButton('sm')}
          </div>
        )}
      </section>
    </div>
  );
}
