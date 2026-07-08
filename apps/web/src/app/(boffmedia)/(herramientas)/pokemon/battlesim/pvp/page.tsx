'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { usePvPMatchmaking } from '@/app/battlesim/_hooks/usePvPMatchmaking';
import { BattleSession } from '@/app/battlesim/_utils/BattleSession';
import { Panel, Button, Input, Select, Badge, Spinner } from '@/components/boffmedia/primitives';
import { BSIM_FORMATS } from '../_lib/bsim-data';

const STATUS_TONE: Record<string, 'ok' | 'warn' | 'info' | 'bad' | 'default'> = {
  inBattle: 'ok', searching: 'warn', connected: 'info', error: 'bad',
};

export default function PvPLobbyPage() {
  const t = useTranslations('battlesim');
  const router = useRouter();
  const {
    status, error, playerId, pendingChallenges,
    activeSession, activeRoomId, activeSide,
    connect, joinQueue, leaveQueue, challengePlayer,
    acceptChallenge, rejectChallenge, setActiveSession,
  } = usePvPMatchmaking();

  const [selectedFormat, setSelectedFormat] = useState<string>(BSIM_FORMATS[0].value);
  const [challengeTarget, setChallengeTarget] = useState('');
  const [, forceUpdate] = useState(0);
  const triggerUpdate = useCallback(() => forceUpdate((n) => n + 1), []);

  useEffect(() => { connect(); }, [connect]);

  useEffect(() => {
    if (status === 'inBattle' && activeRoomId && !activeSession) {
      if (activeSide) localStorage.setItem(`pvp_side_${activeRoomId}`, activeSide);
      const session = new BattleSession(activeRoomId, {
        onUpdate: triggerUpdate, onRequest: () => triggerUpdate(), onBattleEnd: () => triggerUpdate(),
      });
      session.status = 'active';
      if (!(window as any).__pvp_sessions) (window as any).__pvp_sessions = {};
      (window as any).__pvp_sessions[activeRoomId] = session;
      setActiveSession(session, activeRoomId);
      router.push(`/pokemon/battlesim/pvp/battle/${encodeURIComponent(activeRoomId)}`);
    }
  }, [status, activeRoomId, activeSession, activeSide, setActiveSession, router, triggerUpdate]);

  const isSearching = status === 'searching';
  const canSearch = status === 'connected' || status === 'idle';
  const KNOWN_STATUS = ['connecting', 'connected', 'idle', 'searching', 'inBattle', 'error'];
  const statusLabel = t(`pvp.status.${KNOWN_STATUS.includes(status) ? status : 'disconnected'}`);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 p-4 text-txt">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-[clamp(24px,3.5vw,34px)]">{t('pvp.title')}</h1>
          <p className="mt-1 text-txt-muted">{t('pvp.subtitle')}</p>
        </div>
        <Badge tone={STATUS_TONE[status] ?? 'default'}>{statusLabel}</Badge>
      </div>

      {error && (
        <div className="border border-solid border-[color-mix(in_srgb,var(--bad)_40%,transparent)] bg-bad-soft px-3 py-2 font-mono text-[12px] text-bad">{error}</div>
      )}

      {pendingChallenges.length > 0 && (
        <Panel title={t('pvp.incomingChallenges')}>
          <div className="flex flex-col gap-2">
            {pendingChallenges.map((ch) => (
              <div key={ch.from} className="flex items-center justify-between gap-3 border border-solid border-line bg-base px-3 py-2">
                <span className="min-w-0 truncate text-[13px]"><b className="text-txt">{ch.from}</b> <span className="text-txt-muted">{t('pvp.challengedYou', { format: ch.format })}</span></span>
                <div className="flex flex-none gap-2">
                  <Button size="sm" variant="pri" onClick={() => acceptChallenge(ch.from)}>{t('pvp.accept')}</Button>
                  <Button size="sm" variant="danger" onClick={() => rejectChallenge(ch.from)}>{t('pvp.reject')}</Button>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title={t('pvp.findMatch.title')}>
          <p className="mb-4 text-[13px] text-txt-muted">{t('pvp.findMatch.desc')}</p>
          <Select
            className="mb-4"
            value={selectedFormat}
            onChange={setSelectedFormat}
            disabled={isSearching}
            ariaLabel={t('app.lobby.formatLabel')}
            options={BSIM_FORMATS.map((f) => ({ value: f.value, label: f.label }))}
          />
          {!isSearching ? (
            <Button variant="pri" className="w-full" disabled={!canSearch} onClick={() => joinQueue(selectedFormat)}>{t('pvp.findMatch.button')}</Button>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-center gap-3 font-mono text-[12px] text-txt-muted"><Spinner size={16} />{t('pvp.searching')}</div>
              <Button className="w-full" onClick={() => leaveQueue()}>{t('pvp.cancel')}</Button>
            </div>
          )}
        </Panel>

        <Panel title={t('pvp.challenge.title')}>
          <p className="mb-4 text-[13px] text-txt-muted">{t('pvp.challenge.desc')}</p>
          <Select
            className="mb-4"
            value={selectedFormat}
            onChange={setSelectedFormat}
            ariaLabel={t('app.lobby.formatLabel')}
            options={BSIM_FORMATS.map((f) => ({ value: f.value, label: f.label }))}
          />
          <div className="flex gap-2">
            <Input
              className="flex-1"
              placeholder={t('pvp.challenge.placeholder')}
              value={challengeTarget}
              onChange={(e) => setChallengeTarget(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && challengeTarget.trim()) challengePlayer(challengeTarget.trim(), selectedFormat); }}
            />
            <Button disabled={!challengeTarget.trim() || !canSearch} onClick={() => challengeTarget.trim() && challengePlayer(challengeTarget.trim(), selectedFormat)}>{t('pvp.challenge.button')}</Button>
          </div>
        </Panel>
      </div>

      {playerId && (
        <Panel title={t('pvp.yourId.title')}>
          <p className="mb-2 inline-block border border-solid border-line-2 bg-base px-2 py-1 font-mono text-[11px] text-txt-muted">{playerId}</p>
          <p className="text-[12px] text-txt-dim">{t('pvp.yourId.desc')}</p>
        </Panel>
      )}
    </div>
  );
}
