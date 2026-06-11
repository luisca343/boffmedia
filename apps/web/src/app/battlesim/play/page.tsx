'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useLiveBattleManager } from '../_hooks/useLiveBattleManager';
import { BattleCanvas } from '../_components/BattleCanvas';
import { BattleLayout } from '../_components/BattleLayout';
import { ASPECT_RATIO } from '../_utils/viewUtils';
import useViewportWidth from '@/services/useViewPortWidth';
import { useBSXLayout } from '../_hooks/useBSXLayout';
import { BSXKey, BSXBenchChip, BSXTick, BSXRing, BSXTeraBtn } from '@/components/boffmedia/primitives';
import type { BSXKeyMove as BSXKeyMoveT } from '../_utils/toBSXMon';

const VISIBLE_TICK_LIMIT = 50;

const MECHANIC_EVENT_MARKERS = ['|-mega|', '|-terastallize|', '|-zpower|', '|-burst|', '|-primal|'];

function hasMechanicBeenUsed(htmlLog: string[]): boolean {
  return htmlLog.some((line) => MECHANIC_EVENT_MARKERS.some((marker) => line.includes(marker)));
}

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
  const [activeMechanic, setActiveMechanic] = useState<string | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<string>('gen9randombattle');
  const [, canvasWidth] = useViewportWidth();
  const logRef = useRef<HTMLDivElement>(null);

  const session = activeSession;
  const state = session?.getState();
  const bsx = useBSXLayout(state ?? null);

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

  const makeChoiceWithMechanic = useCallback((choice: string) => {
    if (activeMechanic) {
      makeChoice(state!.roomId, `${choice} ${activeMechanic}`);
      setActiveMechanic(null);
    } else {
      makeChoice(state!.roomId, choice);
    }
  }, [activeMechanic, makeChoice, state]);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [state?.htmlLog]);

  // Idle state
  if (!session || !state) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text)' }}>Battle Simulator</h1>
          <p style={{ color: 'var(--text-muted)' }}>Play a Pokémon battle against an AI opponent</p>
        </div>
        <div className="flex flex-col items-center gap-3">
          <select
            value={selectedFormat}
            onChange={(e) => setSelectedFormat(e.target.value)}
            className="px-4 py-2 rounded-md text-sm font-medium cursor-pointer"
            style={{ background: 'var(--card-bg)', border: 'var(--card-border)', color: 'var(--text)' }}
          >
            {BATTLE_FORMATS.map((fmt) => (
              <option key={fmt.value} value={fmt.value}>{fmt.label}</option>
            ))}
          </select>
          <button
            onClick={handleCreateBattle}
            className="px-8 py-3 rounded-lg text-lg font-semibold transition-colors shadow-lg"
            style={{ background: 'var(--accent)', color: 'var(--text)', border: '1px solid var(--border)', boxShadow: '0 4px 14px -4px var(--border)' }}
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
        <BattleTabs
          sessions={sessions}
          activeRoomId={activeRoomId!}
          onSwitch={switchTab}
          onClose={closeTab}
          onNew={handleCreateBattle}
        />
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <div className="w-8 h-8 border-2 rounded-full animate-spin"
            style={{
              borderColor: 'var(--border)',
              borderTopColor: 'var(--accent-bright)',
            }}
          />
          <p style={{ color: 'var(--text-muted)' }}>Connecting to battle server...</p>
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
            <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--rose-500)' }}>Error</h2>
            <p style={{ color: 'var(--text-muted)' }}>{state.error}</p>
          </div>
          <button
            onClick={handleCreateBattle}
            className="px-6 py-2 rounded-md font-medium transition-colors"
            style={{ background: 'var(--accent)', color: 'var(--text)', border: '1px solid var(--border)' }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const choicePanel = state.isWaitingForChoice && bsx.requestType === 'move' ? (
    <div className="flex flex-col gap-3">
      {bsx.bsxMoves.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {bsx.bsxMoves.map((move, i) => (
            <BSXKey key={i} move={move as BSXKeyMoveT} hotkey={String(i + 1)}
              target={bsx.bsxFoe ? { types: bsx.bsxFoe.types, tera: bsx.bsxFoe.tera, teraType: bsx.bsxFoe.teraType } : undefined}
              onClick={() => makeChoiceWithMechanic(`move ${i + 1}`)} />
          ))}
        </div>
      )}
      <div className="flex gap-2 flex-wrap">
        {bsx.mechCanTera && bsx.mechTeraType && (
          <BSXTeraBtn type={bsx.mechTeraType} armed={activeMechanic === 'terastallize'}
            onToggle={() => setActiveMechanic(activeMechanic === 'terastallize' ? null : 'terastallize')}
            used={hasMechanicBeenUsed(state.htmlLog)} hotkey="T" />
        )}
        {bsx.mechCanMega && (
          <button className="px-3 py-1.5 rounded-md text-sm font-medium transition-all cursor-pointer"
            style={{ background: activeMechanic === 'mega' ? 'color-mix(in srgb, var(--accent) 20%, var(--surface-2))' : 'var(--surface-2)',
              border: `1px solid ${activeMechanic === 'mega' ? 'var(--accent-bright)' : 'var(--border)'}`, color: 'var(--text)',
              boxShadow: activeMechanic === 'mega' ? '0 0 0 1px var(--accent-bright) inset' : undefined }}
            onClick={() => setActiveMechanic(activeMechanic === 'mega' ? null : 'mega')}>Mega</button>
        )}
        {bsx.mechCanDyna && (
          <button className="px-3 py-1.5 rounded-md text-sm font-medium transition-all cursor-pointer"
            style={{ background: activeMechanic === 'dynamax' ? 'color-mix(in srgb, var(--accent) 20%, var(--surface-2))' : 'var(--surface-2)',
              border: `1px solid ${activeMechanic === 'dynamax' ? 'var(--accent-bright)' : 'var(--border)'}`, color: 'var(--text)',
              boxShadow: activeMechanic === 'dynamax' ? '0 0 0 1px var(--accent-bright) inset' : undefined }}
            onClick={() => setActiveMechanic(activeMechanic === 'dynamax' ? null : 'dynamax')}>Dynamax</button>
        )}
        {bsx.mechZMoves && (
          <button className="px-3 py-1.5 rounded-md text-sm font-medium transition-all cursor-pointer"
            style={{ background: activeMechanic === 'zmove' ? 'color-mix(in srgb, var(--accent) 20%, var(--surface-2))' : 'var(--surface-2)',
              border: `1px solid ${activeMechanic === 'zmove' ? 'var(--accent-bright)' : 'var(--border)'}`, color: 'var(--text)',
              boxShadow: activeMechanic === 'zmove' ? '0 0 0 1px var(--accent-bright) inset' : undefined }}
            onClick={() => setActiveMechanic(activeMechanic === 'zmove' ? null : 'zmove')}>Z-Move</button>
        )}
      </div>
    </div>
  ) : null;

  // Active or finished battle
  const header = (
    <>
      <BattleTabs
        sessions={sessions}
        activeRoomId={activeRoomId!}
        onSwitch={switchTab}
        onClose={closeTab}
        onNew={handleCreateBattle}
      />
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>Live Battle</h1>
          {state.roomId && (
            <span className="text-xs px-2 py-1 rounded" style={{ color: 'var(--text-muted)', background: 'var(--surface-2)' }}>
              {state.roomId.slice(0, 8)}...
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {state.timerState && state.status === 'active' && (
            <>
              <BSXRing sec={bsx.bsxTimerP1} max={60} size={40} />
              <BSXRing sec={bsx.bsxTimerP2} max={60} size={40} />
            </>
          )}
          {state.status === 'active' && (
            <button
              onClick={() => forfeit(state.roomId)}
              className="px-4 py-1.5 rounded-md text-sm font-medium transition-colors"
              style={{ background: 'var(--surface-3)', color: 'var(--rose-400)', border: '1px solid color-mix(in srgb, var(--rose-500) 40%, transparent)' }}
            >
              Forfeit
            </button>
          )}
        </div>
      </div>
    </>
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
    <div className="flex flex-col gap-2">
      <div className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Switch</div>
      <div className="flex flex-wrap gap-2">
        {bsx.bsxBench.map((mon, i) => (
          <BSXBenchChip key={i} mon={mon} hotkey={String(i + 1)} disabled={mon.fnt}
            onClick={mon.fnt ? undefined : () => makeChoice(state.roomId, `switch ${i + 1}`)} />
        ))}
      </div>
    </div>
  ) : null;

  const forcedSwitch = state.isWaitingForChoice && bsx.requestType === 'switch' ? (
    <div className="flex flex-col gap-2">
      <div className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Forced Switch</div>
      <div className="flex flex-wrap gap-2">
        {bsx.bsxBench.map((mon, i) => (
          <BSXBenchChip key={i} mon={mon} hotkey={String(i + 1)} disabled={mon.fnt}
            onClick={mon.fnt ? undefined : () => makeChoice(state.roomId, `switch ${i + 1}`)} />
        ))}
      </div>
    </div>
  ) : null;

  const teamPreview = state.isWaitingForChoice && bsx.requestType === 'team' ? (
    <div className="flex flex-col gap-2 px-4 py-3 rounded-lg" style={{ background: 'var(--card-bg)', border: 'var(--card-border)' }}>
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Team Preview — sending default order</p>
      <button onClick={() => makeChoice(state.roomId, 'team 1')}
        className="px-4 py-2 rounded-md text-sm font-medium transition-colors"
        style={{ background: 'var(--accent)', color: 'var(--text)', border: '1px solid var(--border)' }}>Confirm Team</button>
    </div>
  ) : null;

  const postBattle = state.status === 'finished' ? (
    <div className="flex items-center justify-center gap-3 py-2">
      {state.replayId && (
        <Link href={`/battlesim/replay/${state.replayId}`}
          className="px-6 py-2 rounded-md font-medium transition-colors"
          style={{ background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border)' }}>
          Watch Replay
        </Link>
      )}
    </div>
  ) : null;

  return (
    <BattleLayout
      header={header}
      rightPanel={rightPanel}
      switchBench={switchBench}
      forcedSwitch={forcedSwitch}
      teamPreview={teamPreview}
      postBattle={postBattle}
      turnText={bsx.turnText}
      isWaiting={state.isWaitingForChoice}
      status={state.status}
      turn={state.battle.turn}
    >
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
        choicePanel={choicePanel}
      />
    </BattleLayout>
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
    <div
      className="flex items-center gap-1 rounded-lg p-1 overflow-x-auto"
      style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
    >
      {sessionEntries.map(([roomId, session]) => {
        const isActive = roomId === activeRoomId;
        const st = session.getState();
        const label = st.status === 'finished'
          ? (st.winner === 'Player' ? 'Won' : st.winner === 'tie' ? 'Tie' : 'Lost')
          : `Turn ${st.battle.turn}`;

        return (
          <div
            key={roomId}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm cursor-pointer transition-colors"
            style={{
              background: isActive ? 'var(--surface-3)' : 'transparent',
              color: isActive ? 'var(--text)' : 'var(--text-muted)',
            }}
            onClick={() => onSwitch(roomId)}
          >
            <span className="truncate max-w-[100px]">{roomId.slice(0, 8)}</span>
            <span
              className="text-xs px-1.5 py-0.5 rounded"
              style={{
                background: st.status === 'active' ? 'color-mix(in srgb, var(--emerald-500) 20%, transparent)' :
                  st.status === 'finished' ? 'var(--surface-3)' :
                  st.status === 'connecting' ? 'color-mix(in srgb, var(--amber-500) 20%, transparent)' :
                  'color-mix(in srgb, var(--rose-500) 20%, transparent)',
                color: st.status === 'active' ? 'var(--emerald-400)' :
                  st.status === 'finished' ? 'var(--text-dim)' :
                  st.status === 'connecting' ? 'var(--amber-400)' :
                  'var(--rose-400)',
              }}
            >
              {label}
            </span>
            {sessions.size > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); onClose(roomId); }}
                className="ml-1 text-xs"
                style={{ color: 'var(--text-dim)' }}
              >
                ×
              </button>
            )}
          </div>
        );
      })}
      <button
        onClick={onNew}
        className="px-3 py-1.5 rounded-md text-sm transition-colors"
        style={{ color: 'var(--text-dim)' }}
      >
        + New
      </button>
    </div>
  );
}
