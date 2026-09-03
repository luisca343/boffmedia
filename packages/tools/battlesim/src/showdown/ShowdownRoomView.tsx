'use client';

import { useToolT, BATTLESIM_NS } from '../i18n';
import { Button } from '@boffmedia/ui';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useShowdownBattle, getGlobalUsername } from '../useShowdownBattle';
import { BattleConnectionState } from '../components/BattleConnectionState';
import { LiveBattle } from '../components/LiveBattle';
import { BsimErrorState } from '../components/bsim-kit';
import { useBsimNav, useBsimBackOrHub } from '../nav';
import type { EndAction } from '../lib/battle-types';

export function BsimShowdownRoomView() {
  // The address comes from the nav seam, not from a route prop: the
  // launcher has no router to supply one, and `params: Promise<...>` is a
  // Next App Router signature this package must not depend on.
  const nav = useBsimNav();
  const roomid = nav.params.roomId ?? "";
  const decodedRoomId = decodeURIComponent(roomid);
  const t = useToolT(BATTLESIM_NS);
  const backOrHub = useBsimBackOrHub();

  const {
    status, username, session, chatMessages, spectatorCount, error, reconnectInfo,
    sendChoice, cancelChoice, forfeit, sendChat, initScene, saveShowdownReplay,
  } = useShowdownBattle(decodedRoomId, { autoCreateSession: true });

  const [savedReplayId, setSavedReplayId] = useState<number | null>(null);
  const [savingReplay, setSavingReplay] = useState(false);

  const state = session?.getState();

  const myName = username?.trim() || getGlobalUsername()?.trim();
  const p1Name = state?.battle?.p1?.name?.trim();
  const p2Name = state?.battle?.p2?.name?.trim();
  const pov: 0 | 1 = p1Name === myName ? 0 : p2Name === myName ? 1 : 0;
  const povRef = useRef<0 | 1>(0);
  if (p1Name || p2Name) povRef.current = pov;

  const handleInitScene = useCallback((el: HTMLElement) => { initScene(el, povRef.current); }, [initScene]);

  useEffect(() => {
    if (session && (p1Name || p2Name)) {
      const gameEl = document.getElementById('game');
      if (gameEl) initScene(gameEl, povRef.current);
    }
  }, [p1Name, p2Name, session, initScene, pov]);

  useEffect(() => {
    if (state?.battleComplete && !savedReplayId && !savingReplay) {
      setSavingReplay(true);
      saveShowdownReplay().then((id) => {
        if (id) setSavedReplayId(id);
        setSavingReplay(false);
      });
    }
  }, [state?.battleComplete, savedReplayId, savingReplay, saveShowdownReplay]);

  if (!session || !state || status === 'connecting' || status === 'authenticating' || status === 'joining') {
    const message =
      status === 'connecting' ? t('connection.connectingShowdown')
      : status === 'authenticating' ? t('connection.authenticating')
      : status === 'joining' ? t('connection.joiningBattle')
      : t('connection.waitingBattle');
    return (
      <BattleConnectionState
        kind={reconnectInfo ? 'reconnecting' : 'connecting'}
        message={message}
        detail={reconnectInfo ? t('connection.reconnecting', { attempt: reconnectInfo.attempt, max: reconnectInfo.maxAttempts }) : undefined}
      >
        <Button variant="ghost" onClick={backOrHub}>{t('connection.backToLobby')}</Button>
      </BattleConnectionState>
    );
  }

  if (status === 'error' || state.status === 'error') {
    return (
      <div className="flex min-h-[var(--tool-vh,100dvh)] items-center justify-center bg-base p-4 text-txt">
        <BsimErrorState code="connect_failed" lead={error || state.error || undefined} actions={<Button variant="pri" onClick={backOrHub}>{t('connection.backToLobby')}</Button>} />
      </div>
    );
  }

  const isSpectator = !!p1Name && !!p2Name && myName !== p1Name && myName !== p2Name;

  const endActions: EndAction[] = [
    ...(savedReplayId ? [{ id: 'replay', label: t('battle.end.watchReplay'), variant: 'pri' as const, icon: 'play' as const, onClick: () => nav.push('replayDetail', { id: String(savedReplayId) }) }] : []),
    { id: 'lobby', label: t('battle.end.backToLobby'), variant: savedReplayId ? 'ghost' : 'pri', onClick: () => nav.replace('showdown', {}) },
  ];

  return (
    <LiveBattle
      state={state} pov={pov} mode="showdown" roomLabel={decodedRoomId}
      onChoice={(choice) => sendChoice(choice)}
      onUndo={cancelChoice}
      onForfeit={isSpectator ? undefined : forfeit}
      onBack={backOrHub}
      initScene={handleInitScene}
      chat={{ messages: chatMessages, onSend: (msg) => sendChat(msg), disabled: state.status !== 'active' }}
      spectator={isSpectator}
      spectatorCount={spectatorCount}
      endActions={endActions}
      banner={savingReplay ? <p className="m-0 px-3 pt-2 font-mono text-[11px] text-txt-muted">{t('end.savingReplay')}</p> : undefined}
    />
  );
}
