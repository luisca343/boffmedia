'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useLiveBattleManager } from '../_hooks/useLiveBattleManager';
import { BattleCanvas } from '../_components/BattleCanvas';
import { ChoiceInput } from '../_components/ChoiceInput/ChoiceInput';
import { TurnTimer } from '../_components/TurnTimer';
import { ASPECT_RATIO } from '../_utils/viewUtils';
import { sanitizeHtml } from '../_utils/sanitizeHtml';
import useViewportWidth from '@/services/useViewPortWidth';

const VISIBLE_LOG_LIMIT = 50;

const BATTLE_FORMATS = [
  { value: 'gen9randombattle', label: 'Gen 9 Random Battle' },
  { value: 'gen8randombattle', label: 'Gen 8 Random Battle' },
  { value: 'gen7randombattle', label: 'Gen 7 Random Battle' },
  { value: 'gen6randombattle', label: 'Gen 6 Random Battle' },
  { value: 'gen9nationaldex', label: 'National Dex' },
] as const;

export default function PlayPage() {
  const {
    sessions,
    activeRoomId,
    activeSession,
    createBattle,
    switchTab,
    closeTab,
    makeChoice,
    forfeit,
    initScene,
  } = useLiveBattleManager();

  const [battleStarted, setBattleStarted] = useState(false);
  const [showTimer, setShowTimer] = useState(false);
  const [showAllLogs, setShowAllLogs] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<string>('gen9randombattle');
  const [, canvasWidth] = useViewportWidth();
  const logRef = useRef<HTMLDivElement>(null);

  const session = activeSession;
  const state = session?.getState();

  const handleCreateBattle = () => {
    setBattleStarted(true);
    createBattle(selectedFormat);
  };

  const handlePlayAgain = () => {
    setBattleStarted(false);
    createBattle(selectedFormat);
  };

  const handleInitScene = useCallback((el: HTMLElement) => {
    if (activeRoomId) {
      initScene(activeRoomId, el);
    }
  }, [activeRoomId, initScene]);

  // Auto-scroll log to bottom
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [state?.htmlLog]);

  // Idle state
  if (!session || !state) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Battle Simulator</h1>
          <p className="text-muted-foreground">
            Play a Pokémon battle against an AI opponent
          </p>
        </div>
        <div className="flex flex-col items-center gap-3">
          <select
            value={selectedFormat}
            onChange={(e) => setSelectedFormat(e.target.value)}
            className="px-4 py-2 bg-card border rounded-md text-sm font-medium cursor-pointer"
          >
            {BATTLE_FORMATS.map((fmt) => (
              <option key={fmt.value} value={fmt.value}>
                {fmt.label}
              </option>
            ))}
          </select>
          <button
            onClick={handleCreateBattle}
            className="px-8 py-3 bg-primary text-primary-foreground rounded-lg text-lg font-semibold hover:bg-primary/90 transition-colors shadow-lg"
          >
            Start Battle
          </button>
        </div>
      </div>
    );
  }

  // Connecting state
  if (state.status === 'connecting') {
    return (
      <div className="flex flex-col gap-4 p-4">
        {/* Tabs */}
        <BattleTabs
          sessions={sessions}
          activeRoomId={activeRoomId!}
          onSwitch={switchTab}
          onClose={closeTab}
          onNew={handleCreateBattle}
        />
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          <p className="text-muted-foreground">Connecting to battle server...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (state.status === 'error') {
    return (
      <div className="flex flex-col gap-4 p-4">
        <BattleTabs
          sessions={sessions}
          activeRoomId={activeRoomId!}
          onSwitch={switchTab}
          onClose={closeTab}
          onNew={handleCreateBattle}
        />
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-destructive mb-2">Error</h2>
            <p className="text-muted-foreground">{state.error}</p>
          </div>
          <button
            onClick={handleCreateBattle}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Active or finished battle
  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Tabs */}
      <BattleTabs
        sessions={sessions}
        activeRoomId={activeRoomId!}
        onSwitch={switchTab}
        onClose={closeTab}
        onNew={handleCreateBattle}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold">Live Battle</h1>
          {state.roomId && (
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
              {state.roomId.slice(0, 8)}...
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {state.timerState && state.status === 'active' && (
            <button
              onClick={() => setShowTimer(!showTimer)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${showTimer ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}
            >
              Timer
            </button>
          )}
          {state.status === 'active' && (
            <button
              onClick={() => forfeit(state.roomId)}
              className="px-4 py-1.5 bg-destructive text-destructive-foreground rounded-md text-sm font-medium hover:bg-destructive/90 transition-colors"
            >
              Forfeit
            </button>
          )}
        </div>
      </div>

      {/* Timer (togglable) */}
      {showTimer && state.timerState && state.status === 'active' && (
        <TurnTimer p1={state.timerState.p1} p2={state.timerState.p2} activeSide={state.timerState.activeSide} />
      )}

      {/* Battle Canvas + Log */}
      <div className="flex">
        <div className="flex flex-col relative">
          <BattleCanvas
            battle={state.battle}
            pov={0}
            messageBar={state.messageBar}
            showPreviewOverlay={state.battle.turn === 0 && !battleStarted}
            setBattleStarted={setBattleStarted}
            setIsPlaying={() => {}}
            currentAction={0}
            battleLog={null}
            initScene={handleInitScene}
            liveMode={true}
            liveStatus={state.status}
            onPlayAgain={handlePlayAgain}
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
            {(showAllLogs ? state.htmlLog : state.htmlLog.slice(-VISIBLE_LOG_LIMIT)).map((line, index) => (
              <div
                key={showAllLogs ? index : state.htmlLog.length - VISIBLE_LOG_LIMIT + index}
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(line) }}
              />
            ))}
          </div>
          <div className="bg-surface-800 flex-1" />
        </div>
      </div>

      {/* Choice Input */}
      {state.isWaitingForChoice && state.currentRequest && (
        <ChoiceInput
          request={state.currentRequest}
          makeChoice={(choice) => makeChoice(state.roomId, choice)}
          isWaiting={state.isWaitingForChoice}
        />
      )}

      {/* Post-battle actions */}
      {state.status === 'finished' && (
        <div className="flex items-center justify-center gap-3">
          {state.replayId && (
            <Link
              href={`/battlesim/replay/${state.replayId}`}
              className="px-6 py-2 bg-secondary text-secondary-foreground rounded-md font-medium hover:bg-secondary/90 transition-colors"
            >
              Watch Replay
            </Link>
          )}
        </div>
      )}

      {/* Turn indicator */}
      {state.status === 'active' && state.battle.turn > 0 && (
        <div className="text-center text-sm text-muted-foreground">
          Turn {state.battle.turn}
          {state.isWaitingForChoice && ' — Your turn!'}
        </div>
      )}
    </div>
  );
}

// ─── Battle Tabs Component ───

function BattleTabs({
  sessions,
  activeRoomId,
  onSwitch,
  onClose,
  onNew,
}: {
  sessions: Map<string, any>;
  activeRoomId: string;
  onSwitch: (roomId: string) => void;
  onClose: (roomId: string) => void;
  onNew: () => void;
}) {
  const sessionEntries = Array.from(sessions.entries());

  return (
    <div className="flex items-center gap-1 bg-surface-900 rounded-lg p-1 overflow-x-auto">
      {sessionEntries.map(([roomId, session]) => {
        const isActive = roomId === activeRoomId;
        const state = session.getState();
        const label = state.status === 'finished'
          ? (state.winner === 'Player' ? 'Won' : state.winner === 'tie' ? 'Tie' : 'Lost')
          : `Turn ${state.battle.turn}`;

        return (
          <div
            key={roomId}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm cursor-pointer transition-colors ${
              isActive
                ? 'bg-surface-700 text-surface-50 font-medium'
                : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800'
            }`}
            onClick={() => onSwitch(roomId)}
          >
            <span className="truncate max-w-[100px]">
              {roomId.slice(0, 8)}
            </span>
            <span className={`text-xs px-1.5 py-0.5 rounded ${
              state.status === 'active' ? 'bg-green-900/50 text-green-300' :
              state.status === 'finished' ? 'bg-surface-600 text-surface-300' :
              state.status === 'connecting' ? 'bg-yellow-900/50 text-yellow-300' :
              'bg-red-900/50 text-red-300'
            }`}>
              {label}
            </span>
            {sessions.size > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClose(roomId);
                }}
                className="ml-1 text-surface-500 hover:text-surface-200 text-xs"
              >
                ×
              </button>
            )}
          </div>
        );
      })}
      <button
        onClick={onNew}
        className="px-3 py-1.5 rounded-md text-sm text-surface-400 hover:text-surface-200 hover:bg-surface-800 transition-colors"
      >
        + New
      </button>
    </div>
  );
}
