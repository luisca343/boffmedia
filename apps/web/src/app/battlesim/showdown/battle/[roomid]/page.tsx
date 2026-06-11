'use client';

import { useState, useRef, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import { useShowdownBattle, getGlobalUsername } from '../../../_hooks/useShowdownBattle';
import { BattleCanvas } from '../../../_components/BattleCanvas';
import { BattleLayout } from '../../../_components/BattleLayout';
import { sanitizeHtml } from '../../../_utils/sanitizeHtml';
import useViewportWidth from '@/services/useViewPortWidth';
import { ASPECT_RATIO } from '../../../_utils/viewUtils';
import { useBSXLayout } from '../../../_hooks/useBSXLayout';
import { BSXKey, BSXBenchChip, BSXTick, BSXRing, BSXTeraBtn } from '@/components/boffmedia/primitives';
import type { BSXKeyMove as BSXKeyMoveT } from '../../../_utils/toBSXMon';

const VISIBLE_TICK_LIMIT = 50;

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
    spectatorCount,
    error,
    reconnectInfo,
    sendChoice,
    forfeit,
    sendChat,
    initScene,
    saveShowdownReplay,
  } = useShowdownBattle(decodedRoomId, { autoCreateSession: true });

  const [showAllLogs, setShowAllLogs] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [savedReplayId, setSavedReplayId] = useState<number | null>(null);
  const [savingReplay, setSavingReplay] = useState(false);
  const [activeMechanic, setActiveMechanic] = useState<string | null>(null);
  const [, canvasWidth] = useViewportWidth();
  const logRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const [battleStarted, setBattleStarted] = useState(false);

  const state = session?.getState();
  const bsx = useBSXLayout(state ?? null);

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

  useEffect(() => {
    if (session && (p1Name || p2Name)) {
      const gameEl = document.getElementById('game');
      if (gameEl) {
        initScene(gameEl, povRef.current);
      }
    }
  }, [p1Name, p2Name, session, initScene, pov]);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [state?.htmlLog]);

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

  useEffect(() => {
    if (state?.battleComplete && !savedReplayId && !savingReplay) {
      setSavingReplay(true);
      saveShowdownReplay().then((id) => {
        if (id) setSavedReplayId(id);
        setSavingReplay(false);
      });
    }
  }, [state?.battleComplete, savedReplayId, savingReplay, saveShowdownReplay]);

  const sendChoiceWithMechanic = useCallback((choice: string) => {
    if (activeMechanic) {
      sendChoice(`${choice} ${activeMechanic}`);
      setActiveMechanic(null);
    } else {
      sendChoice(choice);
    }
  }, [activeMechanic, sendChoice]);

  if (!session || !state || status === 'connecting' || status === 'authenticating' || status === 'joining') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
        <div className="w-8 h-8 border-2 rounded-full animate-spin"
          style={{ borderColor: 'var(--border)', borderTopColor: 'var(--accent-bright)' }}
        />
        <p style={{ color: 'var(--text-muted)' }}>
          {status === 'connecting' && 'Connecting to Showdown server...'}
          {status === 'authenticating' && 'Authenticating...'}
          {status === 'joining' && 'Joining battle...'}
          {(status === 'idle' || status === 'authenticated') && 'Waiting for battle to start...'}
        </p>
        {reconnectInfo && (
          <p className="text-xs" style={{ color: 'var(--amber-400)' }}>
            Reconnecting (attempt {reconnectInfo.attempt}/{reconnectInfo.maxAttempts})...
          </p>
        )}
        <Link href="/battlesim/showdown" className="text-sm underline"
          style={{ color: 'var(--text-muted)' }}>
          Back to Lobby
        </Link>
      </div>
    );
  }

  if (status === 'error' || state.status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--rose-500)' }}>Error</h2>
          <p style={{ color: 'var(--text-muted)' }}>{error || state.error}</p>
        </div>
        <div className="flex gap-3">
          <Link href="/battlesim/showdown"
            className="px-6 py-2 rounded-md font-medium transition-colors"
            style={{ background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border)' }}>
            Back to Lobby
          </Link>
        </div>
      </div>
    );
  }

  const isMyTurn = state.isWaitingForChoice;
  const trapMsg = state.currentRequest?.active?.[0]?.trapped ? ' (trapped)' : '';

  const choicePanel = isMyTurn && bsx.requestType === 'move' ? (
    <div className="flex flex-col gap-3">
      {bsx.bsxMoves.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {bsx.bsxMoves.map((move, i) => (
            <BSXKey key={i} move={move as BSXKeyMoveT} hotkey={String(i + 1)}
              target={bsx.bsxFoe ? { types: bsx.bsxFoe.types, tera: bsx.bsxFoe.tera, teraType: bsx.bsxFoe.teraType } : undefined}
              onClick={() => sendChoiceWithMechanic(`move ${i + 1}`)} />
          ))}
        </div>
      )}
      <div className="flex gap-2 flex-wrap">
        {bsx.mechCanTera && bsx.mechTeraType && (
          <BSXTeraBtn type={bsx.mechTeraType} armed={activeMechanic === 'terastallize'}
            onToggle={() => setActiveMechanic(activeMechanic === 'terastallize' ? null : 'terastallize')} hotkey="T" />
        )}
        {bsx.mechCanMega && (
          <button className="px-3 py-1.5 rounded-md text-sm font-medium transition-all cursor-pointer"
            style={{ background: activeMechanic === 'mega' ? 'color-mix(in srgb, var(--accent) 20%, var(--surface-2))' : 'var(--surface-2)',
              border: `1px solid ${activeMechanic === 'mega' ? 'var(--accent-bright)' : 'var(--border)'}`, color: 'var(--text)' }}
            onClick={() => setActiveMechanic(activeMechanic === 'mega' ? null : 'mega')}>Mega</button>
        )}
        {bsx.mechCanDyna && (
          <button className="px-3 py-1.5 rounded-md text-sm font-medium transition-all cursor-pointer"
            style={{ background: activeMechanic === 'dynamax' ? 'color-mix(in srgb, var(--accent) 20%, var(--surface-2))' : 'var(--surface-2)',
              border: `1px solid ${activeMechanic === 'dynamax' ? 'var(--accent-bright)' : 'var(--border)'}`, color: 'var(--text)' }}
            onClick={() => setActiveMechanic(activeMechanic === 'dynamax' ? null : 'dynamax')}>Dynamax</button>
        )}
        {bsx.mechZMoves && (
          <button className="px-3 py-1.5 rounded-md text-sm font-medium transition-all cursor-pointer"
            style={{ background: activeMechanic === 'zmove' ? 'color-mix(in srgb, var(--accent) 20%, var(--surface-2))' : 'var(--surface-2)',
              border: `1px solid ${activeMechanic === 'zmove' ? 'var(--accent-bright)' : 'var(--border)'}`, color: 'var(--text)' }}
            onClick={() => setActiveMechanic(activeMechanic === 'zmove' ? null : 'zmove')}>Z-Move</button>
        )}
      </div>
    </div>
  ) : null;

  const header = (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Link href="/battlesim/showdown" className="text-sm" style={{ color: 'var(--text-muted)' }}>
          ← Lobby
        </Link>
        <h1 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>Showdown Battle</h1>
        <span className="text-xs px-2 py-1 rounded font-mono"
          style={{ color: 'var(--text-muted)', background: 'var(--surface-2)' }}>
          {decodedRoomId}
        </span>
        {username && (
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Playing as <strong>{username}</strong>
          </span>
        )}
        {spectatorCount > 0 && (
          <span className="text-xs px-2 py-1 rounded"
            style={{ color: 'var(--text-muted)', background: 'var(--surface-2)' }}>
            {spectatorCount} spectator{spectatorCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
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
    <div className="flex flex-col gap-3">
      <div className="flex-1 rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
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

      <div className="rounded-lg flex flex-col shrink-0" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div ref={chatRef} className="overflow-y-auto p-2 text-sm space-y-0.5" style={{ maxHeight: '120px' }}>
          {chatMessages.length === 0 && (
            <p className="text-xs text-center py-4" style={{ color: 'var(--text-dim)' }}>
              Battle chat will appear here
            </p>
          )}
          {chatMessages.map((msg, i) => (
            <div key={i} className="text-xs" style={{ color: 'var(--text-muted)' }}>
              <span style={{ color: 'var(--accent-bright)', fontWeight: 600 }}>{msg.sender}: </span>
              <span dangerouslySetInnerHTML={{ __html: sanitizeHtml(msg.message) }} />
            </div>
          ))}
        </div>
        {state.status === 'active' && (
          <div className="p-2 flex gap-2" style={{ borderTop: '1px solid var(--border)' }}>
            <input
              type="text" placeholder="Say something..." value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
              className="flex-1 px-2 py-1.5 rounded text-xs"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
            />
            <button
              onClick={handleSendChat} disabled={!chatInput.trim()}
              className="px-3 py-1.5 rounded text-xs font-medium disabled:opacity-50"
              style={{ background: 'var(--surface-3)', color: 'var(--text)', border: '1px solid var(--border)' }}
            >
              Send
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const switchBench = isMyTurn && bsx.requestType === 'move' && bsx.bsxBench.length > 0 ? (
    <div className="flex flex-col gap-2">
      <div className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Switch{trapMsg}</div>
      <div className="flex flex-wrap gap-2">
        {bsx.bsxBench.map((mon, i) => (
          <BSXBenchChip key={i} mon={mon} hotkey={String(i + 1)} disabled={mon.fnt}
            onClick={mon.fnt ? undefined : () => sendChoice(`switch ${i + 1}`)} />
        ))}
      </div>
    </div>
  ) : null;

  const forcedSwitch = isMyTurn && bsx.requestType === 'switch' ? (
    <div className="flex flex-col gap-2">
      <div className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Forced Switch</div>
      <div className="flex flex-wrap gap-2">
        {bsx.bsxBench.map((mon, i) => (
          <BSXBenchChip key={i} mon={mon} hotkey={String(i + 1)} disabled={mon.fnt}
            onClick={mon.fnt ? undefined : () => sendChoice(`switch ${i + 1}`)} />
        ))}
      </div>
    </div>
  ) : null;

  const postBattle = state.status === 'finished' ? (
    <div className="flex flex-col items-center gap-3 py-2">
      <div className="text-center">
        <h2 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>
          {state.winner === username ? 'You won!' : state.winner === 'tie' ? "It's a tie!" : `${state.winner} won!`}
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
      <Link href="/battlesim/showdown"
        className="px-6 py-2 rounded-md font-medium transition-colors"
        style={{ background: 'var(--accent)', color: 'var(--text)', border: '1px solid var(--border)' }}>
        Back to Lobby
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
      isWaiting={isMyTurn}
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
        username={username}
        choicePanel={choicePanel}
      />
    </BattleLayout>
  );
}
