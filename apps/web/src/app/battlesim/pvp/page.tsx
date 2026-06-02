'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { usePvPMatchmaking } from '../_hooks/usePvPMatchmaking';
import { BattleSession } from '../_utils/BattleSession';

const BATTLE_FORMATS = [
  { value: 'gen9randombattle', label: 'Gen 9 Random Battle' },
  { value: 'gen8randombattle', label: 'Gen 8 Random Battle' },
  { value: 'gen7randombattle', label: 'Gen 7 Random Battle' },
  { value: 'gen9nationaldex', label: 'National Dex' },
] as const;

export default function PvPLobbyPage() {
  const router = useRouter();
  const {
    status,
    error,
    playerId,
    queueFormat,
    pendingChallenges,
    activeSession,
    activeRoomId,
    activeSide,
    connect,
    joinQueue,
    leaveQueue,
    challengePlayer,
    acceptChallenge,
    rejectChallenge,
    setActiveSession,
  } = usePvPMatchmaking();

  const [selectedFormat, setSelectedFormat] = useState('gen9randombattle');
  const [challengeTarget, setChallengeTarget] = useState('');
  const [, forceUpdate] = useState(0);
  const triggerUpdate = useCallback(() => forceUpdate((n) => n + 1), []);

  // Auto-connect on mount
  useEffect(() => {
    connect();
  }, [connect]);

  // When a battle is created, create a session and navigate to battle page
  useEffect(() => {
    if (status === 'inBattle' && activeRoomId && !activeSession) {
      // Store side so the battle page can pick it up
      if (activeSide) {
        localStorage.setItem(`pvp_side_${activeRoomId}`, activeSide);
      }
      const session = new BattleSession(activeRoomId, {
        onUpdate: triggerUpdate,
        onRequest: () => triggerUpdate(),
        onBattleEnd: () => triggerUpdate(),
      });
      session.status = 'active';

      // Store globally so the battle page can pick it up
      if (!(window as any).__pvp_sessions) {
        (window as any).__pvp_sessions = {};
      }
      (window as any).__pvp_sessions[activeRoomId] = session;

      setActiveSession(session, activeRoomId);
      router.push(`/battlesim/pvp/battle/${encodeURIComponent(activeRoomId)}`);
    }
  }, [status, activeRoomId, activeSession, activeSide, setActiveSession, router, triggerUpdate]);

  const handleFindMatch = () => {
    joinQueue(selectedFormat);
  };

  const handleCancelSearch = () => {
    leaveQueue();
  };

  const handleChallenge = () => {
    if (!challengeTarget.trim()) return;
    challengePlayer(challengeTarget.trim(), selectedFormat);
  };

  const isSearching = status === 'searching';
  const canSearch = status === 'connected' || status === 'idle';

  return (
    <div className="flex flex-col gap-4 p-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">PvP Battle</h1>
          <p className="text-sm text-muted-foreground">
            Play Pokémon battles against other players on our server
          </p>
        </div>
        <StatusBadge status={status} playerId={playerId} />
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-lg p-3 text-sm">
          {error}
        </div>
      )}

      {/* Incoming challenges */}
      {pendingChallenges.length > 0 && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 space-y-2">
          <h3 className="font-semibold text-blue-600">Incoming Challenges</h3>
          {pendingChallenges.map((ch) => (
            <div
              key={ch.from}
              className="flex items-center justify-between bg-card border rounded-md p-3"
            >
              <div>
                <span className="font-semibold">{ch.from}</span>
                <span className="text-muted-foreground ml-2">
                  challenged you to {ch.format}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => acceptChallenge(ch.from)}
                  className="px-4 py-1.5 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
                >
                  Accept
                </button>
                <button
                  onClick={() => rejectChallenge(ch.from)}
                  className="px-4 py-1.5 bg-destructive text-destructive-foreground rounded-md text-sm font-medium hover:bg-destructive/90 transition-colors"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Find Match */}
        <div className="bg-card border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-2">Find Match</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Join the matchmaking queue and get paired with another player.
          </p>

          <select
            value={selectedFormat}
            onChange={(e) => setSelectedFormat(e.target.value)}
            disabled={isSearching}
            className="w-full px-3 py-2 bg-background border rounded-md text-sm text-foreground mb-4 disabled:opacity-50"
          >
            {BATTLE_FORMATS.map((fmt) => (
              <option key={fmt.value} value={fmt.value}>
                {fmt.label}
              </option>
            ))}
          </select>

          {!isSearching ? (
            <button
              onClick={handleFindMatch}
              disabled={!canSearch}
              className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-md text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Find Match
            </button>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
                <span className="text-sm text-muted-foreground">
                  Searching for opponent...
                </span>
              </div>
              <button
                onClick={handleCancelSearch}
                className="w-full px-4 py-2 bg-secondary text-secondary-foreground rounded-md text-sm font-medium hover:bg-secondary/80 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Challenge Player */}
        <div className="bg-card border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-2">Challenge Player</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Send a direct challenge to a specific player.
          </p>

          <select
            value={selectedFormat}
            onChange={(e) => setSelectedFormat(e.target.value)}
            className="w-full px-3 py-2 bg-background border rounded-md text-sm text-foreground mb-4"
          >
            {BATTLE_FORMATS.map((fmt) => (
              <option key={fmt.value} value={fmt.value}>
                {fmt.label}
              </option>
            ))}
          </select>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Player ID"
              value={challengeTarget}
              onChange={(e) => setChallengeTarget(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleChallenge()}
              className="flex-1 px-3 py-2 bg-background border rounded-md text-sm text-foreground placeholder:text-muted-foreground"
            />
            <button
              onClick={handleChallenge}
              disabled={!challengeTarget.trim() || !canSearch}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md text-sm font-medium hover:bg-secondary/80 transition-colors disabled:opacity-50"
            >
              Challenge
            </button>
          </div>
        </div>
      </div>

      {/* Your Player ID */}
      {playerId && (
        <div className="bg-card border rounded-lg p-4">
          <h2 className="text-sm font-semibold mb-2">Your Player ID</h2>
          <p className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded inline-block">
            {playerId}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Share this ID with friends so they can challenge you directly.
          </p>
        </div>
      )}
    </div>
  );
}

function StatusBadge({
  status,
  playerId,
}: {
  status: string;
  playerId: string | null;
}) {
  const color =
    status === 'inBattle'
      ? 'bg-green-500/20 text-green-600 border-green-500/30'
      : status === 'searching'
        ? 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30'
        : status === 'connected'
          ? 'bg-blue-500/20 text-blue-600 border-blue-500/30'
          : status === 'error'
            ? 'bg-red-500/20 text-red-600 border-red-500/30'
            : 'bg-gray-500/20 text-gray-600 border-gray-500/30';

  const label =
    status === 'inBattle'
      ? 'In Battle'
      : status === 'searching'
        ? 'Searching...'
        : status === 'connected'
          ? 'Connected'
          : status === 'connecting'
            ? 'Connecting...'
            : status === 'error'
              ? 'Error'
              : 'Disconnected';

  return (
    <span className={`px-3 py-1.5 rounded-full text-xs font-medium border ${color}`}>
      {label}
    </span>
  );
}
