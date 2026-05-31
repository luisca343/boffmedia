'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLiveBattle, LiveBattleStatus } from '../_hooks/useLiveBattle';
import { BattleCanvas } from '../_components/BattleCanvas';
import { ChoiceInput } from '../_components/ChoiceInput/ChoiceInput';

export default function PlayPage() {
  const {
    roomId,
    status,
    battle,
    scene,
    currentRequest,
    isWaitingForChoice,
    htmlLog,
    messageBar,
    replayId,
    error,
    createBattle,
    makeChoice,
    forfeit,
    initScene,
  } = useLiveBattle();

  const [battleStarted, setBattleStarted] = useState(false);

  const handleCreateBattle = () => {
    setBattleStarted(true);
    createBattle('gen9randombattle');
  };

  const handlePlayAgain = () => {
    setBattleStarted(false);
    createBattle('gen9randombattle');
  };

  // Idle state — show create battle button
  if (status === 'idle' || (!battleStarted && status !== 'active')) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Battle Simulator</h1>
          <p className="text-muted-foreground">
            Play a Pokémon battle against an AI opponent
          </p>
        </div>
        <button
          onClick={handleCreateBattle}
          className="px-8 py-3 bg-primary text-primary-foreground rounded-lg text-lg font-semibold hover:bg-primary/90 transition-colors shadow-lg"
        >
          Start Battle
        </button>
      </div>
    );
  }

  // Connecting state
  if (status === 'connecting') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        <p className="text-muted-foreground">Connecting to battle server...</p>
      </div>
    );
  }

  // Error state
  if (status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-destructive mb-2">Error</h2>
          <p className="text-muted-foreground">{error}</p>
        </div>
        <button
          onClick={handleCreateBattle}
          className="px-6 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Active or finished battle
  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold">Live Battle</h1>
          {roomId && (
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
              {roomId.slice(0, 8)}...
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {status === 'active' && (
            <button
              onClick={forfeit}
              className="px-4 py-1.5 bg-destructive text-destructive-foreground rounded-md text-sm font-medium hover:bg-destructive/90 transition-colors"
            >
              Forfeit
            </button>
          )}
        </div>
      </div>

      {/* Battle Canvas */}
      <div className="relative">
        <BattleCanvas
          battle={battle}
          pov={0}
          messageBar={messageBar}
          showPreviewOverlay={battle.turn === 0 && !battleStarted}
          setBattleStarted={setBattleStarted}
          setIsPlaying={() => {}}
          currentAction={0}
          battleLog={null}
          initScene={initScene}
          liveMode={true}
          liveStatus={status}
          onPlayAgain={handlePlayAgain}
        />
      </div>

      {/* Choice Input */}
      {isWaitingForChoice && currentRequest && (
        <ChoiceInput
          request={currentRequest}
          makeChoice={makeChoice}
          isWaiting={isWaitingForChoice}
        />
      )}

      {/* Post-battle actions */}
      {status === 'finished' && (
        <div className="flex items-center justify-center gap-3">
          {replayId && (
            <Link
              href={`/battlesim/replay/${replayId}`}
              className="px-6 py-2 bg-secondary text-secondary-foreground rounded-md font-medium hover:bg-secondary/90 transition-colors"
            >
              Watch Replay
            </Link>
          )}
        </div>
      )}

      {/* Turn indicator */}
      {status === 'active' && battle.turn > 0 && (
        <div className="text-center text-sm text-muted-foreground">
          Turn {battle.turn}
          {isWaitingForChoice && ' — Your turn!'}
        </div>
      )}
    </div>
  );
}
