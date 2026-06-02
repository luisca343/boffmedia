'use client';

import { useState, useRef, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import { Protocol } from '@pkmn/protocol';
import { io, Socket } from 'socket.io-client';
import { env } from '@/config/env.public';
import { BattleCanvas } from '../../../_components/BattleCanvas';
import { ChoiceInput } from '../../../_components/ChoiceInput/ChoiceInput';
import { TurnTimer } from '../../../_components/TurnTimer';
import { BattleSession } from '../../../_utils/BattleSession';
import { sanitizeHtml } from '../../../_utils/sanitizeHtml';
import useViewportWidth from '@/services/useViewPortWidth';
import { ASPECT_RATIO } from '../../../_utils/viewUtils';

const VISIBLE_LOG_LIMIT = 50;

const MECHANIC_EVENT_MARKERS = ['|-mega|', '|-terastallize|', '|-zpower|', '|-burst|', '|-primal|'];

function hasMechanicBeenUsed(htmlLog: string[]): boolean {
  return htmlLog.some((line) => MECHANIC_EVENT_MARKERS.some((marker) => line.includes(marker)));
}

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
  const [showTimer, setShowTimer] = useState(false);
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

  // Initialize socket and session
  useEffect(() => {
    const socket = getGlobalSocket();
    if (!socket) return;

    // Get side from battleCreated event or localStorage
    const storedSide = localStorage.getItem(`pvp_side_${decodedRoomId}`) as 'p1' | 'p2' | null;
    if (storedSide) {
      setSide(storedSide);
    }

    // Create or restore session
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
      // Patch callbacks so the battle page gets updates
      sess.callbacks = {
        onUpdate: triggerUpdate,
        onRequest: () => triggerUpdate(),
        onBattleEnd: () => triggerUpdate(),
      };
    }
    setSession(sess);

    // Listen for events specific to this room
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

    // Spectate to catch up on any lines that arrived before we mounted
    const handleSpectateJoined = (data: { roomId: string; replay: string; status: string; currentRequest?: Protocol.Request | null }) => {
      if (data.roomId === decodedRoomId && data.replay) {
        // Replay buffered lines
        for (const line of data.replay.split('\n')) {
          if (line.trim()) {
            sess.addLine(line);
          }
        }
        // If there's a pending request, handle it
        if (data.currentRequest) {
          sess.handleRequest(data.currentRequest);
        }
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

  // Auto-scroll log
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

  const handleForfeit = useCallback(() => {
    if (confirm('Are you sure you want to forfeit?')) {
      const socket = getGlobalSocket();
      if (socket) {
        socket.emit('forfeit', { roomId: decodedRoomId });
      }
    }
  }, [decodedRoomId]);

  const state = session?.getState();

  // Loading state
  if (!session || !state) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        <p className="text-muted-foreground">Loading battle...</p>
        <Link
          href="/battlesim/pvp"
          className="text-sm text-muted-foreground hover:text-foreground underline"
        >
          Back to Lobby
        </Link>
      </div>
    );
  }

  // Error state
  if (state.status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-destructive mb-2">Error</h2>
          <p className="text-muted-foreground">{state.error}</p>
        </div>
        <Link
          href="/battlesim/pvp"
          className="px-6 py-2 bg-secondary text-secondary-foreground rounded-md font-medium hover:bg-secondary/80 transition-colors"
        >
          Back to Lobby
        </Link>
      </div>
    );
  }

  const pov = side === 'p1' ? 0 : 1;
  const opponentName = pov === 0 ? (state.battle.p2?.name || 'Opponent') : (state.battle.p1?.name || 'Opponent');

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/battlesim/pvp"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Lobby
          </Link>
          <h1 className="text-lg font-semibold">PvP Battle</h1>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded font-mono">
            {decodedRoomId.slice(0, 8)}...
          </span>
          <span className="text-xs text-muted-foreground">
            vs <strong>{opponentName}</strong>
          </span>
        </div>
        <div className="flex items-center gap-2">
          {state.timerState && state.status === 'active' && (
            <button
              onClick={() => setShowTimer(!showTimer)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                showTimer
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              Timer
            </button>
          )}
          {state.status === 'active' && (
            <button
              onClick={handleForfeit}
              className="px-4 py-1.5 bg-destructive text-destructive-foreground rounded-md text-sm font-medium hover:bg-destructive/90 transition-colors"
            >
              Forfeit
            </button>
          )}
        </div>
      </div>

      {/* Timer */}
      {showTimer && state.timerState && state.status === 'active' && (
        <TurnTimer
          p1={state.timerState.p1}
          p2={state.timerState.p2}
          activeSide={state.timerState.activeSide}
        />
      )}

      {/* Battle Canvas + Log */}
      <div className="flex">
        <div className="flex flex-col relative">
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
          />
        </div>
        <div className="flex flex-col">
          <div
            className="w-[400px] bg-surface-800 p-2 overflow-y-auto text-surface-50 h-full"
            ref={logRef}
            style={{ height: `${canvasWidth * ASPECT_RATIO}px` }}
          >
            {state.htmlLog.length > VISIBLE_LOG_LIMIT && !showAllLogs && (
              <button
                onClick={() => setShowAllLogs(true)}
                className="w-full p-1 mb-1 text-xs bg-surface-600 rounded hover:bg-surface-500 text-surface-200"
              >
                Show all {state.htmlLog.length} lines (showing last {VISIBLE_LOG_LIMIT})
              </button>
            )}
            {(showAllLogs ? state.htmlLog : state.htmlLog.slice(-VISIBLE_LOG_LIMIT)).map(
              (line, index) => (
                <div
                  key={
                    showAllLogs
                      ? index
                      : state.htmlLog.length - VISIBLE_LOG_LIMIT + index
                  }
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(line) }}
                />
              ),
            )}
          </div>
          <div className="bg-surface-800 flex-1" />
        </div>
      </div>

      {/* Choice Input */}
      {state.isWaitingForChoice && state.currentRequest && (
        <ChoiceInput
          request={state.currentRequest}
          makeChoice={handleMakeChoice}
          isWaiting={state.isWaitingForChoice}
          mechanicUsed={hasMechanicBeenUsed(state.htmlLog)}
        />
      )}

      {/* Turn indicator */}
      {state.status === 'active' && state.battle.turn > 0 && (
        <div className="text-center text-sm text-muted-foreground">
          Turn {state.battle.turn}
          {state.isWaitingForChoice && ' — Your turn!'}
        </div>
      )}

      {/* Post-battle */}
      {state.status === 'finished' && (
        <div className="flex flex-col items-center gap-3">
          <div className="text-center">
            <h2 className="text-xl font-semibold">
              {state.winner === (pov === 0 ? state.battle.p1?.name : state.battle.p2?.name)
                ? 'You won!'
                : state.winner === 'tie'
                  ? "It's a tie!"
                  : `${state.winner} won!`}
            </h2>
          </div>
          {savingReplay && (
            <p className="text-sm text-muted-foreground">Saving replay...</p>
          )}
          {savedReplayId && (
            <div className="flex flex-col items-center gap-2">
              <p className="text-sm text-green-600">Replay saved!</p>
              <Link
                href={`/battlesim/replay/${savedReplayId}`}
                className="px-6 py-2 bg-secondary text-secondary-foreground rounded-md font-medium hover:bg-secondary/80 transition-colors"
              >
                Watch Replay
              </Link>
            </div>
          )}
          <Link
            href="/battlesim/pvp"
            className="px-6 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors"
          >
            Play Again
          </Link>
        </div>
      )}
    </div>
  );
}
