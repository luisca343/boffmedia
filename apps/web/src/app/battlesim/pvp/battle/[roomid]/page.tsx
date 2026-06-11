'use client';

import { useState, useRef, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import { Protocol } from '@pkmn/protocol';
import { io, Socket } from 'socket.io-client';
import { env } from '@/config/env.public';
import { BattleCanvas } from '../../../_components/BattleCanvas';
import { BattleLayout } from '../../../_components/BattleLayout';
import { BattleSession } from '../../../_utils/BattleSession';
import { sanitizeHtml } from '../../../_utils/sanitizeHtml';
import useViewportWidth from '@/services/useViewPortWidth';
import { ASPECT_RATIO } from '../../../_utils/viewUtils';
import { useBSXLayout } from '../../../_hooks/useBSXLayout';
import { useChoiceMechanics } from '../../../_hooks/useChoiceMechanics';
import { MechanicToggles } from '../../../_components/MechanicToggles';
import { MovePanel } from '../../../_components/MovePanel';
import { SwitchPanel } from '../../../_components/SwitchPanel';
import { BSXTick, BSXRing } from '@/components/boffmedia/primitives';
import type { BSXKeyMove as BSXKeyMoveT } from '../../../_utils/toBSXMon';

const VISIBLE_TICK_LIMIT = 50;

function getGlobalSocket(): Socket | null {
  if (typeof window === 'undefined') return null;
  return (window as any).__pvp_socket ?? null;
}

export default function PvPBattlePage({
  params,
}: {
  params: Promise<{ roomid: string }>;
}) {
  const { roomid } = use(params);
  const decodedRoomId = decodeURIComponent(roomid);

  const [session, setSession] = useState<BattleSession | null>(null);
  const [side, setSide] = useState<'p1' | 'p2'>('p1');
  const [showAllLogs, setShowAllLogs] = useState(false);
  const [savedReplayId, setSavedReplayId] = useState<number | null>(null);
  const [savingReplay, setSavingReplay] = useState(false);
  const [battleStarted, setBattleStarted] = useState(false);
  const [, canvasWidth] = useViewportWidth();
  const [, forceUpdate] = useState(0);
  const logRef = useRef<HTMLDivElement>(null);
  const sceneInitialized = useRef(false);

  const triggerUpdate = useCallback(() => {
    forceUpdate((n) => n + 1);
  }, []);

  useEffect(() => {
    const socket = getGlobalSocket();
    if (!socket) return;

    const storedSide = localStorage.getItem(`pvp_side_${decodedRoomId}`) as 'p1' | 'p2' | null;
    if (storedSide) {
      setSide(storedSide);
    }

    let sess = (window as any).__pvp_sessions?.[decodedRoomId];
    if (!sess) {
      sess = new BattleSession(decodedRoomId, {
        onUpdate: triggerUpdate,
        onRequest: () => triggerUpdate(),
        onBattleEnd: () => triggerUpdate(),
      });
      sess.status = 'active';
      if (!(window as any).__pvp_sessions) {
        (window as any).__pvp_sessions = {};
      }
      (window as any).__pvp_sessions[decodedRoomId] = sess;
    } else {
      sess.callbacks = {
        onUpdate: triggerUpdate,
        onRequest: () => triggerUpdate(),
        onBattleEnd: () => triggerUpdate(),
      };
    }
    setSession(sess);

    const handleProtocol = (data: { roomId: string; line: string }) => {
      if (data.roomId === decodedRoomId) {
        sess.addLine(data.line);
        triggerUpdate();
      }
    };

    const handleRequest = (data: { roomId: string; request: Protocol.Request }) => {
      if (data.roomId === decodedRoomId) {
        sess.handleRequest(data.request);
        triggerUpdate();
      }
    };

    const handleBattleEnd = (data: { roomId: string; winner: string; replay: string; replayId?: number }) => {
      if (data.roomId === decodedRoomId) {
        sess.winner = data.winner;
        sess.replay = data.replay;
        sess.replayId = data.replayId ?? null;
        sess.status = 'finished';
        sess.battleComplete = true;
        sess.isWaitingForChoice = false;
        sess.currentRequest = null;
        (sess.battle as any).winner = data.winner;
        triggerUpdate();
      }
    };

    const handleTimerUpdate = (data: { roomId: string; p1: any; p2: any; activeSide: any }) => {
      if (data.roomId === decodedRoomId) {
        sess.timerState = { p1: data.p1, p2: data.p2, activeSide: data.activeSide };
        triggerUpdate();
      }
    };

    socket.on('protocol', handleProtocol);
    socket.on('request', handleRequest);
    socket.on('battleEnd', handleBattleEnd);
    socket.on('timerUpdate', handleTimerUpdate);

    const handleSpectateJoined = (data: { roomId: string; replay: string; status: string; currentRequest?: Protocol.Request | null }) => {
      if (data.roomId === decodedRoomId && data.replay) {
        for (const line of data.replay.split('\n')) {
          if (line.trim()) sess.addLine(line);
        }
        if (data.currentRequest) sess.handleRequest(data.currentRequest);
        triggerUpdate();
      }
    };
    socket.on('spectateJoined', handleSpectateJoined);
    socket.emit('spectate', { roomId: decodedRoomId });

    return () => {
      socket.off('protocol', handleProtocol);
      socket.off('request', handleRequest);
      socket.off('battleEnd', handleBattleEnd);
      socket.off('timerUpdate', handleTimerUpdate);
      socket.off('spectateJoined', handleSpectateJoined);
    };
  }, [decodedRoomId, triggerUpdate]);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [session?.htmlLog]);

  const handleInitScene = useCallback(
    (el: HTMLElement) => {
      if (session && !sceneInitialized.current) {
        session.initScene(el, side === 'p1' ? 0 : 1);
        sceneInitialized.current = true;
        triggerUpdate();
      }
    },
    [session, side, triggerUpdate],
  );

  const handleMakeChoice = useCallback(
    (choice: string) => {
      const socket = getGlobalSocket();
      if (socket && session) {
        socket.emit('makeChoice', { roomId: decodedRoomId, choice });
        session.isWaitingForChoice = false;
        session.currentRequest = null;
        session.resumeAfterChoice();
        triggerUpdate();
      }
    },
    [session, decodedRoomId, triggerUpdate],
  );

  const { activeMechanic, setActiveMechanic, makeChoiceWithMechanic } = useChoiceMechanics(
    useCallback((choice: string) => handleMakeChoice(choice), [handleMakeChoice])
  );

  const handleForfeit = useCallback(() => {
    if (confirm('Are you sure you want to forfeit?')) {
      const socket = getGlobalSocket();
      if (socket) socket.emit('forfeit', { roomId: decodedRoomId });
    }
  }, [decodedRoomId]);

  const state = session?.getState();
  const bsx = useBSXLayout(state ?? null);

  const pov = state ? (side === 'p1' ? 0 : 1) : 0;
  const opponentName = pov === 0 ? (state?.battle.p2?.name || 'Opponent') : (state?.battle.p1?.name || 'Opponent');

  if (!session || !state) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
        <div className="w-8 h-8 border-2 rounded-full animate-spin"
          style={{ borderColor: 'var(--border)', borderTopColor: 'var(--accent-bright)' }}
        />
        <p style={{ color: 'var(--text-muted)' }}>Loading battle...</p>
        <Link href="/battlesim/pvp" className="text-sm underline" style={{ color: 'var(--text-muted)' }}>
          Back to Lobby
        </Link>
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--rose-500)' }}>Error</h2>
          <p style={{ color: 'var(--text-muted)' }}>{state.error}</p>
        </div>
        <Link href="/battlesim/pvp"
          className="px-6 py-2 rounded-md font-medium transition-colors"
          style={{ background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border)' }}>
          Back to Lobby
        </Link>
      </div>
    );
  }

  const choicePanel = state.isWaitingForChoice && bsx.requestType === 'move' ? (
    <div className="flex flex-col gap-3">
      {bsx.bsxMoves.length > 0 && (
        <MovePanel
          moves={bsx.bsxMoves as BSXKeyMoveT[]}
          foe={bsx.bsxFoe ? { types: bsx.bsxFoe.types, tera: bsx.bsxFoe.tera, teraType: bsx.bsxFoe.teraType } : undefined}
          onChooseMove={(i) => makeChoiceWithMechanic(`move ${i}`)}
        />
      )}
      <MechanicToggles
        bsx={bsx}
        activeMechanic={activeMechanic}
        setActiveMechanic={setActiveMechanic}
        htmlLog={state.htmlLog}
      />
    </div>
  ) : null;

  const header = (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Link href="/battlesim/pvp" className="text-sm" style={{ color: 'var(--text-muted)' }}>
          ← Lobby
        </Link>
        <h1 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>PvP Battle</h1>
        <span className="text-xs px-2 py-1 rounded font-mono"
          style={{ color: 'var(--text-muted)', background: 'var(--surface-2)' }}>
          {decodedRoomId.slice(0, 8)}...
        </span>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          vs <strong>{opponentName}</strong>
        </span>
      </div>
      <div className="flex items-center gap-2">
        {state.timerState && state.status === 'active' && (
          <>
            <BSXRing sec={Math.ceil(state.timerState.p1.turnRemaining / 1000)} max={60} size={36} />
            <BSXRing sec={Math.ceil(state.timerState.p2.turnRemaining / 1000)} max={60} size={36} />
          </>
        )}
        {state.status === 'active' && (
          <button
            onClick={handleForfeit}
            className="px-4 py-1.5 rounded-md text-sm font-medium transition-colors"
            style={{ background: 'var(--surface-3)', color: 'var(--rose-400)', border: '1px solid color-mix(in srgb, var(--rose-500) 40%, transparent)' }}
          >
            Forfeit
          </button>
        )}
      </div>
    </div>
  );

  const rightPanel = (
    <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
      <div
        className="overflow-y-auto"
        ref={logRef}
        style={{ height: `${canvasWidth * ASPECT_RATIO}px`, background: 'var(--surface)' }}
      >
        {bsx.bsxTicks.length > VISIBLE_TICK_LIMIT && !showAllLogs && (
          <button
            onClick={() => setShowAllLogs(true)}
            className="w-full p-1 mb-1 text-xs font-mono"
            style={{ color: 'var(--text-muted)', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}
          >
            Show all {bsx.bsxTicks.length} events (showing last {VISIBLE_TICK_LIMIT})
          </button>
        )}
        {(showAllLogs ? bsx.bsxTicks : bsx.bsxTicks.slice(-VISIBLE_TICK_LIMIT)).map((ev, i) => (
          <BSXTick key={i} ev={ev as any} />
        ))}
      </div>
    </div>
  );

  const switchBench = state.isWaitingForChoice && bsx.requestType === 'move' && bsx.bsxBench.length > 0 ? (
    <SwitchPanel bench={bsx.bsxBench} onSwitch={(i) => handleMakeChoice(`switch ${i}`)} />
  ) : null;

  const forcedSwitch = state.isWaitingForChoice && bsx.requestType === 'switch' ? (
    <SwitchPanel bench={bsx.bsxBench} onSwitch={(i) => handleMakeChoice(`switch ${i}`)} label="Forced Switch" />
  ) : null;

  const postBattle = state.status === 'finished' ? (
    <div className="flex flex-col items-center gap-3 py-2">
      <div className="text-center">
        <h2 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>
          {state.winner === (pov === 0 ? state.battle.p1?.name : state.battle.p2?.name)
            ? 'You won!'
            : state.winner === 'tie'
              ? "It's a tie!"
              : `${state.winner} won!`}
        </h2>
      </div>
      {savingReplay && <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Saving replay...</p>}
      {savedReplayId && (
        <div className="flex flex-col items-center gap-2">
          <p className="text-sm" style={{ color: 'var(--emerald-400)' }}>Replay saved!</p>
          <Link href={`/battlesim/replay/${savedReplayId}`}
            className="px-6 py-2 rounded-md font-medium transition-colors"
            style={{ background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border)' }}>
            Watch Replay
          </Link>
        </div>
      )}
      <Link href="/battlesim/pvp"
        className="px-6 py-2 rounded-md font-medium transition-colors"
        style={{ background: 'var(--accent)', color: 'var(--text)', border: '1px solid var(--border)' }}>
        Play Again
      </Link>
    </div>
  ) : null;

  return (
    <BattleLayout
      header={header}
      rightPanel={rightPanel}
      switchBench={switchBench}
      forcedSwitch={forcedSwitch}
      postBattle={postBattle}
      turnText={bsx.turnText}
      isWaiting={state.isWaitingForChoice}
      status={state.status}
      turn={state.battle.turn}
    >
      <BattleCanvas
        battle={state.battle}
        pov={pov}
        messageBar={state.messageBar}
        showPreviewOverlay={state.battle.turn === 0 && !battleStarted}
        setBattleStarted={setBattleStarted}
        setIsPlaying={() => {}}
        currentAction={0}
        battleLog={null}
        initScene={handleInitScene}
        liveMode={true}
        liveStatus={state.status}
        battleComplete={state.battleComplete}
        choicePanel={choicePanel}
      />
    </BattleLayout>
  );
}
