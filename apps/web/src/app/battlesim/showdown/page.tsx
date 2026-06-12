'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useShowdownBattle } from '../_hooks/useShowdownBattle';
import { ChatPanel } from '../_components/ChatPanel';

const C = 'var(--purple-400)';

function LobbyCard({ title, children, className = '' }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`relative overflow-hidden rounded-[var(--radius-lg)] p-5 flex flex-col gap-3 ${className}`}
      style={{
        background: `linear-gradient(150deg, color-mix(in srgb, ${C} 12%, var(--surface)), var(--surface) 60%)`,
        border: `1px solid color-mix(in srgb, ${C} 25%, var(--border))`,
      }}
    >
      <span
        aria-hidden="true"
        className="absolute top-0 left-0 h-0.5 w-2/5"
        style={{ background: `linear-gradient(90deg, ${C}, transparent)` }}
      />
      {title && (
        <h2 className="font-semibold text-sm uppercase tracking-[.1em] font-mono" style={{ color: C }}>{title}</h2>
      )}
      {children}
    </div>
  );
}

export default function ShowdownLobbyPage() {
  const router = useRouter();
  const [loginUser, setLoginUser] = useState('Boffmedia');
  const [loginPass, setLoginPass] = useState('boffmedia');
  const [challengeTarget, setChallengeTarget] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('gen9randombattle');

  const {
    status,
    username,
    lobbyChat,
    challenges,
    formats,
    onlineUsers,
    error,
    reconnectInfo,
    challstr,
    login,
    findBattle,
    acceptChallenge,
    rejectChallenge,
    sendRaw,
  } = useShowdownBattle(undefined, {
    autoCreateSession: false,
    onBattleFound: useCallback(
      (roomid: string) => {
        router.push(`/battlesim/showdown/battle/${encodeURIComponent(roomid)}`);
      },
      [router],
    ),
  });

  useEffect(() => {
    if (status === 'authenticating' && challstr && loginUser && loginPass) {
      login(loginUser, loginPass);
    }
  }, [status, challstr, loginUser, loginPass, login]);

  const handleLogin = () => { if (loginUser && loginPass) login(loginUser, loginPass); };
  const handleSendChat = (msg: string) => sendRaw(`lobby|${msg}`);
  const handleFindBattle = () => findBattle(selectedFormat);
  const handleChallenge = () => { if (challengeTarget.trim()) sendRaw(`|/challenge ${challengeTarget.trim()},${selectedFormat}`); };

  const isConnected = status !== 'idle' && status !== 'error';
  const isLoggedIn = status === 'authenticated' && !!username && !username.startsWith('Guest');

  const inputStyle = { background: 'var(--surface-2)', border: `1px solid color-mix(in srgb, ${C} 20%, var(--border))`, color: 'var(--text)', borderRadius: 'var(--radius)' };
  const btnPrimary = { background: C, color: '#06070b', border: 'none' };

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

      <div className="relative z-10 mx-auto max-w-5xl flex flex-col gap-8">
        {/* Hero header */}
        <header className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <span className="font-mono font-bold text-t-3xs tracking-[.3em] uppercase" style={{ color: C }}>
              🌐 03
            </span>
            <h1
              className="font-display font-black italic uppercase text-5xl md:text-6xl tracking-[.02em]"
              style={{ color: 'var(--text)', textShadow: `0 0 36px color-mix(in srgb, ${C} 35%, transparent)` }}
            >
              Showdown Lobby
            </h1>
            <p className="text-lg max-w-[52ch]" style={{ color: 'var(--text-muted)' }}>
              Play Pokémon battles on the official Showdown server
            </p>
          </div>
          <StatusBadge status={status} username={username} />
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
        {reconnectInfo && (
          <div className="px-4 py-3 text-sm rounded-[var(--radius-lg)]" style={{
            background: 'color-mix(in srgb, var(--amber-500) 10%, transparent)',
            border: '1px solid color-mix(in srgb, var(--amber-500) 30%, transparent)',
            color: 'var(--amber-400)',
          }}>
            Reconnecting... (attempt {reconnectInfo.attempt}/{reconnectInfo.maxAttempts})
          </div>
        )}

        {/* Incoming challenges */}
        {challenges.length > 0 && (
          <div className="p-4 space-y-2 rounded-[var(--radius-lg)]" style={{
            background: `color-mix(in srgb, ${C} 10%, transparent)`,
            border: `1px solid color-mix(in srgb, ${C} 30%, var(--border))`,
          }}>
            <h3 className="font-semibold" style={{ color: C }}>Incoming Challenges</h3>
            {challenges.map((ch) => (
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

        {/* Login form */}
        {!isLoggedIn && (
          <LobbyCard title="Login to Showdown">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text" placeholder="Username" value={loginUser}
                onChange={(e) => setLoginUser(e.target.value)}
                className="flex-1 px-3 py-2 text-sm"
                style={inputStyle}
                disabled={!isConnected || !challstr}
              />
              <input
                type="password" placeholder="Password" value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
                className="flex-1 px-3 py-2 text-sm"
                style={inputStyle}
                disabled={!isConnected || !challstr}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
              <button
                onClick={handleLogin}
                disabled={!isConnected || !challstr || !loginUser || !loginPass}
                className="px-6 py-2 rounded-[var(--radius)] text-sm font-bold uppercase tracking-[.08em] disabled:opacity-50 transition-all hover:-translate-y-0.5"
                style={btnPrimary}
              >
                Login
              </button>
            </div>
            {!isConnected && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Connecting to Showdown server...</p>}
            {isConnected && !challstr && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Waiting for challenge string...</p>}
          </LobbyCard>
        )}

        {/* Main content — post-login */}
        {isLoggedIn && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Lobby Chat */}
            <LobbyCard title="Lobby Chat" className="lg:col-span-2">
              <ChatPanel
                messages={lobbyChat}
                onSend={handleSendChat}
                maxHeight={400}
                placeholder="Type a message..."
                emptyText="No messages yet. Chat will appear here once connected to the lobby."
              />
            </LobbyCard>

            {/* Sidebar */}
            <div className="flex flex-col gap-4">
              <LobbyCard title="Battle">
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Find a random opponent on the official Showdown server.
                </p>
                <select
                  value={selectedFormat}
                  onChange={(e) => setSelectedFormat(e.target.value)}
                  className="w-full px-3 py-2 text-sm"
                  style={inputStyle}
                >
                  {formats.length > 0
                    ? formats.map((f) => (
                        <option key={f.name} value={f.name}>
                          {f.section ? `${f.section} — ` : ''}{f.name}
                        </option>
                      ))
                    : <option value="gen9randombattle">Gen 9 Random Battle</option>
                  }
                </select>
                <button
                  onClick={handleFindBattle}
                  className="w-full px-4 py-2.5 rounded-[var(--radius)] text-sm font-bold uppercase tracking-[.08em] transition-all hover:-translate-y-0.5"
                  style={btnPrimary}
                >
                  Find Battle
                </button>
              </LobbyCard>

              <LobbyCard title="Challenge Player">
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Challenge a specific player to a battle.
                </p>
                <div className="flex gap-2">
                  <input
                    type="text" placeholder="Player name" value={challengeTarget}
                    onChange={(e) => setChallengeTarget(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleChallenge()}
                    className="flex-1 px-3 py-2 text-sm" style={inputStyle}
                  />
                  <button
                    onClick={handleChallenge} disabled={!challengeTarget.trim()}
                    className="px-4 py-2 rounded-[var(--radius)] text-sm font-medium disabled:opacity-50 transition-all hover:-translate-y-0.5"
                    style={{ background: `color-mix(in srgb, ${C} 20%, var(--surface-3))`, color: C, border: `1px solid color-mix(in srgb, ${C} 35%, var(--border))` }}
                  >
                    Challenge
                  </button>
                </div>
              </LobbyCard>

              <LobbyCard title={onlineUsers.length > 0 ? `Online Users (${onlineUsers.length})` : 'Online Users'}>
                {onlineUsers.length === 0 ? (
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Loading users...</p>
                ) : (
                  <div className="max-h-[200px] overflow-y-auto space-y-0.5">
                    {onlineUsers.map((user) => (
                      <div
                        key={user}
                        className="text-xs px-2 py-1 rounded"
                        style={{
                          color: user === username ? C : 'var(--text-muted)',
                          background: user === username ? `color-mix(in srgb, ${C} 10%, transparent)` : 'transparent',
                          fontWeight: user === username ? 600 : 400,
                        }}
                      >
                        {user} {user === username && '(you)'}
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs pt-2" style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--border)' }}>
                  Connected as <strong>{username}</strong> — sim3.psim.us
                </p>
              </LobbyCard>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status, username }: { status: string; username: string | null }) {
  const isGuest = username?.startsWith('Guest');
  const palettes: Record<string, { bg: string; fg: string; bd: string }> = {
    active: { bg: 'color-mix(in srgb, var(--emerald-500) 20%, transparent)', fg: 'var(--emerald-400)', bd: 'color-mix(in srgb, var(--emerald-500) 30%, transparent)' },
    authenticated: { bg: `color-mix(in srgb, ${C} 20%, transparent)`, fg: C, bd: `color-mix(in srgb, ${C} 30%, transparent)` },
    error: { bg: 'color-mix(in srgb, var(--amber-500) 20%, transparent)', fg: 'var(--amber-400)', bd: 'color-mix(in srgb, var(--amber-500) 30%, transparent)' },
    default: { bg: 'color-mix(in srgb, #888 20%, transparent)', fg: '#888', bd: 'color-mix(in srgb, #888 30%, transparent)' },
  };
  const p = palettes[status] || palettes.default;

  let label = 'Disconnected';
  if (status === 'active') label = 'In Battle';
  else if (status === 'authenticated') label = `Logged in as ${username}`;
  else if (isGuest && (status === 'authenticating' || status === 'idle')) label = `Guest (${username}) — Login required`;
  else if (status === 'connecting' || status === 'authenticating') label = 'Connecting...';
  else if (status === 'reconnecting') label = 'Reconnecting...';
  else if (status === 'error') label = 'Error';
  else if (status === 'finished') label = 'Finished';

  return (
    <span className="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border"
      style={{ background: p.bg, color: p.fg, borderColor: p.bd }}>
      {label}
    </span>
  );
}
