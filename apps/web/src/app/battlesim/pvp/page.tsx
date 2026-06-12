'use client';

import { BoffSpinner } from '@/components/boffmedia/primitives';

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

const C = 'var(--orange-400)';

function LobbyCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`relative overflow-hidden rounded-[var(--radius-lg)] p-6 ${className}`}
      style={{
        background: `linear-gradient(150deg, color-mix(in srgb, ${C} 14%, var(--surface)), var(--surface) 60%)`,
        border: `1px solid color-mix(in srgb, ${C} 28%, var(--border))`,
      }}
    >
      <span
        aria-hidden="true"
        className="absolute top-0 left-0 h-0.5 w-2/5"
        style={{ background: `linear-gradient(90deg, ${C}, transparent)` }}
      />
      {children}
    </div>
  );
}

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

  const inputStyle = { background: 'var(--surface-2)', border: `1px solid color-mix(in srgb, ${C} 20%, var(--border))`, color: 'var(--text)', borderRadius: 'var(--radius)' };

  return (
    <div className="relative min-h-[calc(100vh-80px)] overflow-hidden px-4 py-10" style={{ color: 'var(--text)' }}>
      {/* Grid dot background */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(var(--grid-dot) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          maskImage: 'radial-gradient(ellipse at center 20%, black, transparent 75%)',
        }}
      />
      {/* Radial glow */}
      <div
        aria-hidden="true"
        className="absolute -top-40 left-1/2 -translate-x-1/2 w-[720px] h-[420px] rounded-full pointer-events-none"
        style={{ background: `radial-gradient(ellipse, color-mix(in srgb, ${C} 16%, transparent), transparent 70%)` }}
      />

      <div className="relative z-10 mx-auto max-w-4xl flex flex-col gap-8">
        {/* Hero header */}
        <header className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <span className="font-mono font-bold text-t-3xs tracking-[.3em] uppercase" style={{ color: C }}>
              🏆 02
            </span>
            <h1
              className="font-display font-black italic uppercase text-5xl md:text-6xl tracking-[.02em]"
              style={{ color: 'var(--text)', textShadow: `0 0 36px color-mix(in srgb, ${C} 35%, transparent)` }}
            >
              PvP Battle
            </h1>
            <p className="text-lg max-w-[52ch]" style={{ color: 'var(--text-muted)' }}>
              Play Pokémon battles against other players on our server
            </p>
          </div>
          <StatusBadge status={status} playerId={playerId} />
        </header>

        {/* Error banner */}
        {error && (
          <div className="px-4 py-3 text-sm rounded-[var(--radius-lg)]" style={{
            background: 'color-mix(in srgb, var(--rose-500) 10%, transparent)',
            border: '1px solid color-mix(in srgb, var(--rose-500) 30%, transparent)',
            color: 'var(--rose-400)',
          }}>
            {error}
          </div>
        )}

        {/* Incoming challenges */}
        {pendingChallenges.length > 0 && (
          <div className="p-4 space-y-2 rounded-[var(--radius-lg)]" style={{
            background: `color-mix(in srgb, ${C} 10%, transparent)`,
            border: `1px solid color-mix(in srgb, ${C} 30%, var(--border))`,
          }}>
            <h3 className="font-semibold" style={{ color: C }}>Incoming Challenges</h3>
            {pendingChallenges.map((ch) => (
              <div key={ch.from} className="flex items-center justify-between p-3 rounded-md" style={{
                background: 'var(--surface-2)', border: `1px solid color-mix(in srgb, ${C} 20%, var(--border))`,
              }}>
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
                    style={{ background: 'var(--surface-3)', color: 'var(--rose-400)', border: '1px solid color-mix(in srgb, var(--rose-500) 40%, transparent)' }}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Main action cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Find Match */}
          <LobbyCard>
            <h2 className="text-lg font-bold mb-1" style={{ color: 'var(--text)' }}>Find Match</h2>
            <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
              Join the matchmaking queue and get paired with another player.
            </p>
            <select
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value)}
              disabled={isSearching}
              className="w-full px-3 py-2 text-sm mb-4 disabled:opacity-50"
              style={inputStyle}
            >
              {BATTLE_FORMATS.map((fmt) => (
                <option key={fmt.value} value={fmt.value}>{fmt.label}</option>
              ))}
            </select>
            {!isSearching ? (
              <button
                onClick={handleFindMatch}
                disabled={!canSearch}
                className="w-full px-4 py-3 rounded-[var(--radius)] text-sm font-bold uppercase tracking-[.1em] disabled:opacity-50 transition-all hover:-translate-y-0.5"
                style={{ background: C, color: '#06070b', border: 'none' }}
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
                  className="w-full px-4 py-2 rounded-[var(--radius)] text-sm font-medium"
                  style={{ background: 'var(--surface-3)', color: 'var(--text)', border: '1px solid var(--border)' }}
                >
                  Cancel
                </button>
              </div>
            )}
          </LobbyCard>

          {/* Challenge Player */}
          <LobbyCard>
            <h2 className="text-lg font-bold mb-1" style={{ color: 'var(--text)' }}>Challenge Player</h2>
            <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
              Send a direct challenge to a specific player.
            </p>
            <select
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value)}
              className="w-full px-3 py-2 text-sm mb-4"
              style={inputStyle}
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
                className="px-4 py-2 rounded-[var(--radius)] text-sm font-medium disabled:opacity-50 transition-all hover:-translate-y-0.5"
                style={{ background: `color-mix(in srgb, ${C} 20%, var(--surface-3))`, color: C, border: `1px solid color-mix(in srgb, ${C} 35%, var(--border))` }}
              >
                Challenge
              </button>
            </div>
          </LobbyCard>
        </div>

        {/* Player ID chip */}
        {playerId && (
          <div className="flex flex-col gap-2">
            <span className="font-mono text-t-4xs tracking-[.2em] uppercase" style={{ color: 'var(--text-muted)' }}>Your Player ID</span>
            <span
              className="font-mono text-sm px-3 py-1.5 rounded-[var(--radius)] self-start"
              style={{
                background: 'var(--surface-2)',
                border: `1px solid color-mix(in srgb, ${C} 20%, var(--border))`,
                color: C,
              }}
            >
              {playerId}
            </span>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Share this ID with friends so they can challenge you directly.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status, playerId }: { status: string; playerId: string | null }) {
  const palettes: Record<string, { bg: string; fg: string; bd: string }> = {
    inBattle: { bg: 'color-mix(in srgb, var(--emerald-500) 20%, transparent)', fg: 'var(--emerald-400)', bd: 'color-mix(in srgb, var(--emerald-500) 30%, transparent)' },
    searching: { bg: 'color-mix(in srgb, var(--amber-500) 20%, transparent)', fg: 'var(--amber-400)', bd: 'color-mix(in srgb, var(--amber-500) 30%, transparent)' },
    connected: { bg: 'color-mix(in srgb, var(--accent) 20%, transparent)', fg: 'var(--accent-bright)', bd: 'color-mix(in srgb, var(--accent) 30%, transparent)' },
    error: { bg: 'color-mix(in srgb, var(--rose-500) 20%, transparent)', fg: 'var(--rose-400)', bd: 'color-mix(in srgb, var(--rose-500) 30%, transparent)' },
    default: { bg: 'color-mix(in srgb, #888 20%, transparent)', fg: '#888', bd: 'color-mix(in srgb, #888 30%, transparent)' },
  };
  const p = palettes[status] || palettes.default;
  const labels: Record<string, string> = {
    inBattle: 'In Battle', searching: 'Searching...', connected: 'Connected',
    connecting: 'Connecting...', error: 'Error',
  };

  return (
    <span className="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border"
      style={{ background: p.bg, color: p.fg, borderColor: p.bd }}>
      {labels[status] || 'Disconnected'}
    </span>
  );
}
