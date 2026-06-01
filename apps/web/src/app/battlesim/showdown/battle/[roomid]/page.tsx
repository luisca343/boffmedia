'use client';

import { useState, useRef, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import { useShowdownBattle, getGlobalUsername } from '../../../_hooks/useShowdownBattle';
import { BattleCanvas } from '../../../_components/BattleCanvas';
import { ChoiceInput } from '../../../_components/ChoiceInput/ChoiceInput';
import { sanitizeHtml } from '../../../_utils/sanitizeHtml';
import useViewportWidth from '@/services/useViewPortWidth';
import { ASPECT_RATIO } from '../../../_utils/viewUtils';

const VISIBLE_LOG_LIMIT = 50;

export default function ShowdownBattlePage({
  params,
}: {
  params: Promise<{ roomid: string }>;
}) {
  const { roomid } = use(params);
  const decodedRoomId = decodeURIComponent(roomid);

  const {
    status,
    username,
    session,
    chatMessages,
    error,
    reconnectInfo,
    sendChoice,
    forfeit,
    sendChat,
    initScene,
  } = useShowdownBattle(decodedRoomId, { autoCreateSession: true });

  const [showAllLogs, setShowAllLogs] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [, canvasWidth] = useViewportWidth();
  const logRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const [battleStarted, setBattleStarted] = useState(false);

  const state = session?.getState();

  // Determine our PoV using the globally stored login username
  const myName = username?.trim() || getGlobalUsername()?.trim();
  const p1Name = state?.battle?.p1?.name?.trim();
  const p2Name = state?.battle?.p2?.name?.trim();
  const pov: 0 | 1 = p1Name === myName ? 0 : p2Name === myName ? 1 : 0;
  const povRef = useRef<0 | 1>(0);
  if (p1Name || p2Name) {
    povRef.current = pov;
  }

  const handleInitScene = useCallback(
    (el: HTMLElement) => {
      initScene(el, povRef.current);
    },
    [initScene],
  );

  // Re-init scene after replay when player names become available
  useEffect(() => {
    if (session && (p1Name || p2Name)) {
      const gameEl = document.getElementById('game');
      if (gameEl) {
        initScene(gameEl, povRef.current);
      }
    }
  }, [p1Name, p2Name, session, initScene, pov]);

  // Auto-scroll log
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [state?.htmlLog]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    sendChat(chatInput);
    setChatInput('');
  };

  const handleForfeit = () => {
    if (confirm('Are you sure you want to forfeit?')) {
      forfeit();
    }
  };

  // Connecting / waiting state
  if (!session || !state || status === 'connecting' || status === 'authenticating' || status === 'joining') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        <p className="text-muted-foreground">
          {status === 'connecting' && 'Connecting to Showdown server...'}
          {status === 'authenticating' && 'Authenticating...'}
          {status === 'joining' && 'Joining battle...'}
          {(status === 'idle' || status === 'authenticated') && 'Waiting for battle to start...'}
        </p>
        {reconnectInfo && (
          <p className="text-xs text-yellow-500">
            Reconnecting (attempt {reconnectInfo.attempt}/{reconnectInfo.maxAttempts})...
          </p>
        )}
        <Link
          href="/battlesim/showdown"
          className="text-sm text-muted-foreground hover:text-foreground underline"
        >
          Back to Lobby
        </Link>
      </div>
    );
  }

  // Error state
  if (status === 'error' || state.status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-destructive mb-2">Error</h2>
          <p className="text-muted-foreground">{error || state.error}</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/battlesim/showdown"
            className="px-6 py-2 bg-secondary text-secondary-foreground rounded-md font-medium hover:bg-secondary/80 transition-colors"
          >
            Back to Lobby
          </Link>
        </div>
      </div>
    );
  }

  // Active / finished battle
  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/battlesim/showdown"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Lobby
          </Link>
          <h1 className="text-lg font-semibold">Showdown Battle</h1>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded font-mono">
            {decodedRoomId}
          </span>
          {username && (
            <span className="text-xs text-muted-foreground">
              Playing as <strong>{username}</strong>
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
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

      {/* Battle Canvas + Log + Chat */}
      <div className="flex gap-4">
        {/* Battle Canvas */}
        <div className="flex flex-col">
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
            username={username}
          />
        </div>

        {/* Right panel: Log + Chat */}
        <div className="flex flex-col w-[400px]">
          {/* Battle Log */}
          <div
            ref={logRef}
            className="bg-surface-800 p-2 overflow-y-auto text-surface-50"
            style={{ height: `${canvasWidth * ASPECT_RATIO * 0.6}px`, flexShrink: 0 }}
          >
            {state.htmlLog.length > VISIBLE_LOG_LIMIT && !showAllLogs && (
              <button
                onClick={() => setShowAllLogs(true)}
                className="w-full p-1 mb-1 text-xs bg-surface-600 rounded hover:bg-surface-500 text-surface-200"
              >
                Show all {state.htmlLog.length} lines (showing last{' '}
                {VISIBLE_LOG_LIMIT})
              </button>
            )}
            {(showAllLogs
              ? state.htmlLog
              : state.htmlLog.slice(-VISIBLE_LOG_LIMIT)
            ).map((line, index) => (
              <div
                key={
                  showAllLogs
                    ? index
                    : state.htmlLog.length - VISIBLE_LOG_LIMIT + index
                }
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(line) }}
              />
            ))}
          </div>

          {/* Battle Chat */}
          <div className="bg-surface-900 border-t border-surface-700 flex flex-col">
            <div
              ref={chatRef}
              className="h-[150px] overflow-y-auto p-2 text-sm space-y-0.5"
            >
              {chatMessages.length === 0 && (
                <p className="text-surface-500 text-xs text-center py-4">
                  Battle chat will appear here
                </p>
              )}
              {chatMessages.map((msg, i) => (
                <div key={i} className="text-xs">
                  <span className="font-semibold text-primary">
                    {msg.sender}:{' '}
                  </span>
                  <span
                    dangerouslySetInnerHTML={{
                      __html: sanitizeHtml(msg.message),
                    }}
                  />
                </div>
              ))}
            </div>
            {state.status === 'active' && (
              <div className="p-2 border-t border-surface-700 flex gap-2">
                <input
                  type="text"
                  placeholder="Say something..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                  className="flex-1 px-2 py-1.5 bg-surface-800 border border-surface-600 rounded text-xs text-surface-100"
                />
                <button
                  onClick={handleSendChat}
                  disabled={!chatInput.trim()}
                  className="px-3 py-1.5 bg-surface-700 text-surface-200 rounded text-xs hover:bg-surface-600 disabled:opacity-50"
                >
                  Send
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Choice Input */}
      {state.isWaitingForChoice && state.currentRequest && (
        <ChoiceInput
          request={state.currentRequest}
          makeChoice={sendChoice}
          isWaiting={state.isWaitingForChoice}
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
              {state.winner === username
                ? 'You won!'
                : state.winner === 'tie'
                  ? "It's a tie!"
                  : `${state.winner} won!`}
            </h2>
          </div>
          <Link
            href="/battlesim/showdown"
            className="px-6 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors"
          >
            Back to Lobby
          </Link>
        </div>
      )}
    </div>
  );
}
