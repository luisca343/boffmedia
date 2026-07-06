'use client';

import { BoffSpinner } from '@/components/boffmedia-v2/primitives';

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
    status, error, playerId, queueFormat, pendingChallenges,
    activeSession, activeRoomId, activeSide,
    connect, joinQueue, leaveQueue, challengePlayer,
    acceptChallenge, rejectChallenge, setActiveSession,
  } = usePvPMatchmaking();

  const [selectedFormat, setSelectedFormat] = useState('gen9randombattle');
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
      router.push(`/battlesim/pvp/battle/${encodeURIComponent(activeRoomId)}`);
    }
  }, [status, activeRoomId, activeSession, activeSide, setActiveSession, router, triggerUpdate]);

  const handleFindMatch = () => joinQueue(selectedFormat);
  const handleCancelSearch = () => leaveQueue();
  const handleChallenge = () => { if (challengeTarget.trim()) challengePlayer(challengeTarget.trim(), selectedFormat); };

  const isSearching = status === 'searching';
  const canSearch = status === 'connected' || status === 'idle';

  const cardStyle = { background: 'var(--card-bg)', border: 'var(--card-border)', borderRadius: 'var(--radius-lg)' };
  const inputStyle = { background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 'var(--radius)' };
  const btnStyle = { background: 'var(--secondary)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' };

  return (
    <div className="flex flex-col gap-4 p-4 max-w-4xl mx-auto" style={{ color: 'var(--text)', background: 'var(--bg)' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>PvP Battle</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Play Pokémon battles against other players on our server
          </p>
        </div>
        <StatusBadge status={status} playerId={playerId} />
      </div>

      {error && (
        <div className="p-3 text-sm rounded-lg" style={{
          background: 'color-mix(in srgb, var(--rose-500) 10%, transparent)',
          border: '1px solid color-mix(in srgb, var(--rose-500) 30%, transparent)',
          color: 'var(--rose-400)'
        }}>
          {error}
        </div>
      )}

      {pendingChallenges.length > 0 && (
        <div className="p-4 space-y-2 rounded-lg" style={{
          background: 'color-mix(in srgb, var(--secondary) 10%, transparent)',
          border: '1px solid color-mix(in srgb, var(--secondary) 30%, transparent)',
        }}>
          <h3 className="font-semibold" style={{ color: 'var(--secondary-hover)' }}>Incoming Challenges</h3>
          {pendingChallenges.map((ch) => (
            <div key={ch.from} className="flex items-center justify-between p-3 rounded-md" style={cardStyle}>
              <div>
                <span className="font-semibold" style={{ color: 'var(--text)' }}>{ch.from}</span>
                <span className="ml-2" style={{ color: 'var(--text-muted)' }}>challenged you to {ch.format}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => acceptChallenge(ch.from)}
                  className="px-4 py-1.5 rounded-md text-sm font-medium"
                  style={{ background: 'color-mix(in srgb, var(--emerald-500) 80%, transparent)', color: '#fff', border: '1px solid transparent' }}
                >
                  Accept
                </button>
                <button
                  onClick={() => rejectChallenge(ch.from)}
                  className="px-4 py-1.5 rounded-md text-sm font-medium"
                  style={{ background: 'var(--layer-3)', color: 'var(--rose-400)', border: '1px solid color-mix(in srgb, var(--rose-500) 40%, transparent)' }}
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="p-6" style={cardStyle}>
          <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--text)' }}>Find Match</h2>
          <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
            Join the matchmaking queue and get paired with another player.
          </p>
          <select
            value={selectedFormat}
            onChange={(e) => setSelectedFormat(e.target.value)}
            disabled={isSearching}
            className="w-full px-3 py-2 text-sm mb-4 disabled:opacity-50" style={inputStyle}
          >
            {BATTLE_FORMATS.map((fmt) => (
              <option key={fmt.value} value={fmt.value}>{fmt.label}</option>
            ))}
          </select>
          {!isSearching ? (
            <button
              onClick={handleFindMatch}
              disabled={!canSearch}
              className="w-full px-4 py-3 rounded-md text-sm font-semibold disabled:opacity-50" style={btnStyle}
            >
              Find Match
            </button>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-3">
                <BoffSpinner size="sm" />
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Searching for opponent...</span>
              </div>
              <button
                onClick={handleCancelSearch}
                className="w-full px-4 py-2 rounded-md text-sm font-medium"
                style={{ background: 'var(--layer-3)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        <div className="p-6" style={cardStyle}>
          <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--text)' }}>Challenge Player</h2>
          <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
            Send a direct challenge to a specific player.
          </p>
          <select
            value={selectedFormat}
            onChange={(e) => setSelectedFormat(e.target.value)}
            className="w-full px-3 py-2 text-sm mb-4" style={inputStyle}
          >
            {BATTLE_FORMATS.map((fmt) => (
              <option key={fmt.value} value={fmt.value}>{fmt.label}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <input
              type="text" placeholder="Player ID" value={challengeTarget}
              onChange={(e) => setChallengeTarget(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleChallenge()}
              className="flex-1 px-3 py-2 text-sm" style={inputStyle}
            />
            <button
              onClick={handleChallenge} disabled={!challengeTarget.trim() || !canSearch}
              className="px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
              style={{ background: 'var(--layer-3)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
            >
              Challenge
            </button>
          </div>
        </div>
      </div>

      {playerId && (
        <div className="p-4" style={cardStyle}>
          <h2 className="text-sm font-semibold mb-2" style={{ color: 'var(--text)' }}>Your Player ID</h2>
          <p className="text-xs font-mono px-2 py-1 rounded inline-block"
            style={{ color: 'var(--text-muted)', background: 'var(--layer-2)' }}>
            {playerId}
          </p>
          <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
            Share this ID with friends so they can challenge you directly.
          </p>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status, playerId }: { status: string; playerId: string | null }) {
  const palettes: Record<string, { bg: string; fg: string; bd: string }> = {
    inBattle: { bg: 'color-mix(in srgb, var(--emerald-500) 20%, transparent)', fg: 'var(--emerald-400)', bd: 'color-mix(in srgb, var(--emerald-500) 30%, transparent)' },
    searching: { bg: 'color-mix(in srgb, var(--amber-500) 20%, transparent)', fg: 'var(--amber-400)', bd: 'color-mix(in srgb, var(--amber-500) 30%, transparent)' },
    connected: { bg: 'color-mix(in srgb, var(--secondary) 20%, transparent)', fg: 'var(--secondary-hover)', bd: 'color-mix(in srgb, var(--secondary) 30%, transparent)' },
    error: { bg: 'color-mix(in srgb, var(--rose-500) 20%, transparent)', fg: 'var(--rose-400)', bd: 'color-mix(in srgb, var(--rose-500) 30%, transparent)' },
    default: { bg: 'color-mix(in srgb, #888 20%, transparent)', fg: '#888', bd: 'color-mix(in srgb, #888 30%, transparent)' },
  };
  const p = palettes[status] || palettes.default;
  const labels: Record<string, string> = {
    inBattle: 'In Battle', searching: 'Searching...', connected: 'Connected',
    connecting: 'Connecting...', error: 'Error',
  };

  return (
    <span className="px-3 py-1.5 rounded-full text-xs font-medium border"
      style={{ background: p.bg, color: p.fg, borderColor: p.bd }}>
      {labels[status] || 'Disconnected'}
    </span>
  );
}
