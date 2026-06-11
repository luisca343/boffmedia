'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useShowdownBattle } from '../_hooks/useShowdownBattle';
import { sanitizeHtml } from '../_utils/sanitizeHtml';

export default function ShowdownLobbyPage() {
  const router = useRouter();
  const [loginUser, setLoginUser] = useState('Boffmedia');
  const [loginPass, setLoginPass] = useState('boffmedia');
  const [chatInput, setChatInput] = useState('');
  const [challengeTarget, setChallengeTarget] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('gen9randombattle');
  const chatRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [lobbyChat]);

  const handleLogin = () => { if (loginUser && loginPass) login(loginUser, loginPass); };
  const handleSendChat = () => { if (chatInput.trim()) { sendRaw(`lobby|${chatInput}`); setChatInput(''); } };
  const handleFindBattle = () => findBattle(selectedFormat);
  const handleChallenge = () => { if (challengeTarget.trim()) sendRaw(`|/challenge ${challengeTarget.trim()},${selectedFormat}`); };

  const isConnected = status !== 'idle' && status !== 'error';
  const isLoggedIn = status === 'authenticated' && !!username && !username.startsWith('Guest');

  const cardStyle = { background: 'var(--card-bg)', border: 'var(--card-border)', borderRadius: 'var(--radius-lg)' };
  const inputStyle = { background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 'var(--radius)' };
  const btnStyle = { background: 'var(--accent)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' };

  return (
    <div className="flex flex-col gap-4 p-4 max-w-4xl mx-auto" style={{ color: 'var(--text)', background: 'var(--bg)' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Showdown Lobby</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Play Pokémon battles on the official Showdown server
          </p>
        </div>
        <StatusBadge status={status} username={username} />
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
      {reconnectInfo && (
        <div className="p-3 text-sm rounded-lg" style={{
          background: 'color-mix(in srgb, var(--amber-500) 10%, transparent)',
          border: '1px solid color-mix(in srgb, var(--amber-500) 30%, transparent)',
          color: 'var(--amber-400)'
        }}>
          Reconnecting... (attempt {reconnectInfo.attempt}/{reconnectInfo.maxAttempts})
        </div>
      )}

      {/* Incoming challenges */}
      {challenges.length > 0 && (
        <div className="p-4 space-y-2 rounded-lg" style={{
          background: 'color-mix(in srgb, var(--accent) 10%, transparent)',
          border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)',
        }}>
          <h3 className="font-semibold" style={{ color: 'var(--accent-bright)' }}>Incoming Challenges</h3>
          {challenges.map((ch) => (
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
        <div className="p-4" style={cardStyle}>
          <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--text)' }}>Login to Showdown</h2>
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
              className="px-6 py-2 rounded-md text-sm font-medium disabled:opacity-50"
              style={btnStyle}
            >
              Login
            </button>
          </div>
          {!isConnected && <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>Connecting to Showdown server...</p>}
          {isConnected && !challstr && <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>Waiting for challenge string...</p>}
        </div>
      )}

      {/* Main content */}
      {isLoggedIn && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Lobby Chat */}
          <div className="lg:col-span-2 flex flex-col overflow-hidden" style={cardStyle}>
            <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
              <h2 className="font-semibold" style={{ color: 'var(--text)' }}>Lobby Chat</h2>
            </div>
            <div ref={chatRef} className="flex-1 h-[400px] overflow-y-auto p-3 space-y-1 text-sm" style={{ color: 'var(--text-muted)' }}>
              {lobbyChat.length === 0 && (
                <p className="text-center py-8" style={{ color: 'var(--text-dim)' }}>
                  No messages yet. Chat will appear here once connected to the lobby.
                </p>
              )}
              {lobbyChat.map((msg, i) => (
                <div key={i}>
                  <span style={{ color: 'var(--accent-bright)', fontWeight: 600 }}>{msg.sender}: </span>
                  <span dangerouslySetInnerHTML={{ __html: sanitizeHtml(msg.message) }} />
                </div>
              ))}
            </div>
            <div className="p-3 flex gap-2" style={{ borderTop: '1px solid var(--border)' }}>
              <input
                type="text" placeholder="Type a message..." value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                className="flex-1 px-3 py-2 text-sm" style={inputStyle}
              />
              <button
                onClick={handleSendChat} disabled={!chatInput.trim()}
                className="px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
                style={{ background: 'var(--surface-3)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
              >
                Send
              </button>
            </div>
          </div>

          {/* Actions sidebar */}
          <div className="flex flex-col gap-4">
            <div className="p-4" style={cardStyle}>
              <h2 className="font-semibold mb-3" style={{ color: 'var(--text)' }}>Battle</h2>
              <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>
                Find a random opponent on the official Showdown server.
              </p>
              <select
                value={selectedFormat}
                onChange={(e) => setSelectedFormat(e.target.value)}
                className="w-full px-3 py-2 text-sm mb-3"
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
                className="w-full px-4 py-3 rounded-md text-sm font-semibold" style={btnStyle}
              >
                Find Battle
              </button>
            </div>

            <div className="p-4" style={cardStyle}>
              <h2 className="font-semibold mb-3" style={{ color: 'var(--text)' }}>Challenge Player</h2>
              <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>
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
                  className="px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
                  style={{ background: 'var(--surface-3)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                >
                  Challenge
                </button>
              </div>
            </div>

            <div className="p-4" style={cardStyle}>
              <h2 className="font-semibold mb-2" style={{ color: 'var(--text)' }}>
                Online Users
                {onlineUsers.length > 0 && (
                  <span className="text-xs font-normal ml-2" style={{ color: 'var(--text-muted)' }}>
                    ({onlineUsers.length})
                  </span>
                )}
              </h2>
              {onlineUsers.length === 0 ? (
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Loading users...</p>
              ) : (
                <div className="max-h-[200px] overflow-y-auto space-y-0.5">
                  {onlineUsers.map((user) => (
                    <div
                      key={user}
                      className="text-xs px-2 py-1 rounded"
                      style={{
                        color: user === username ? 'var(--accent-bright)' : 'var(--text-muted)',
                        background: user === username ? 'color-mix(in srgb, var(--accent) 10%, transparent)' : 'transparent',
                        fontWeight: user === username ? 600 : 400,
                      }}
                    >
                      {user} {user === username && '(you)'}
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs mt-2 pt-2" style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--border)' }}>
                Connected as <strong>{username}</strong> — sim3.psim.us
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status, username }: { status: string; username: string | null }) {
  const isGuest = username?.startsWith('Guest');
  const palettes: Record<string, { bg: string; fg: string; bd: string }> = {
    active: { bg: 'color-mix(in srgb, var(--emerald-500) 20%, transparent)', fg: 'var(--emerald-400)', bd: 'color-mix(in srgb, var(--emerald-500) 30%, transparent)' },
    authenticated: { bg: 'color-mix(in srgb, var(--accent) 20%, transparent)', fg: 'var(--accent-bright)', bd: 'color-mix(in srgb, var(--accent) 30%, transparent)' },
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
    <span className="px-3 py-1.5 rounded-full text-xs font-medium border"
      style={{ background: p.bg, color: p.fg, borderColor: p.bd }}>
      {label}
    </span>
  );
}
