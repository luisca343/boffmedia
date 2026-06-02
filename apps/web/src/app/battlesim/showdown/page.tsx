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

  // Auto-login when connected and challstr arrives
  useEffect(() => {
    if (status === 'authenticating' && challstr && loginUser && loginPass) {
      login(loginUser, loginPass);
    }
  }, [status, challstr, loginUser, loginPass, login]);

  // Auto-scroll lobby chat
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [lobbyChat]);

  const handleLogin = () => {
    if (!loginUser || !loginPass) return;
    login(loginUser, loginPass);
  };

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    sendRaw(`lobby|${chatInput}`);
    setChatInput('');
  };

  const handleFindBattle = () => {
    findBattle(selectedFormat);
  };

  const handleChallenge = () => {
    if (!challengeTarget.trim()) return;
    sendRaw(`|/challenge ${challengeTarget.trim()},${selectedFormat}`);
  };

  const isConnected = status !== 'idle' && status !== 'error';
  const isLoggedIn = status === 'authenticated' && !!username && !username.startsWith('Guest');

  return (
    <div className="flex flex-col gap-4 p-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Showdown Lobby</h1>
          <p className="text-sm text-muted-foreground">
            Play Pokémon battles on the official Showdown server
          </p>
        </div>
        <StatusBadge status={status} username={username} />
      </div>

      {/* Error / Reconnect banner */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-lg p-3 text-sm">
          {error}
        </div>
      )}
      {reconnectInfo && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-600 rounded-lg p-3 text-sm">
          Reconnecting... (attempt {reconnectInfo.attempt}/{reconnectInfo.maxAttempts})
        </div>
      )}

      {/* Incoming challenges */}
      {challenges.length > 0 && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 space-y-2">
          <h3 className="font-semibold text-blue-600">Incoming Challenges</h3>
          {challenges.map((ch) => (
            <div key={ch.from} className="flex items-center justify-between bg-card border rounded-md p-3">
              <div>
                <span className="font-semibold">{ch.from}</span>
                <span className="text-muted-foreground ml-2">challenged you to {ch.format}</span>
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

      {/* Login form (shown when not logged in) */}
      {!isLoggedIn && (
        <div className="bg-card border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-3">Login to Showdown</h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Username"
              value={loginUser}
              onChange={(e) => setLoginUser(e.target.value)}
              className="flex-1 px-3 py-2 bg-background border rounded-md text-sm text-foreground placeholder:text-muted-foreground"
              disabled={!isConnected || !challstr}
            />
            <input
              type="password"
              placeholder="Password"
              value={loginPass}
              onChange={(e) => setLoginPass(e.target.value)}
              className="flex-1 px-3 py-2 bg-background border rounded-md text-sm text-foreground placeholder:text-muted-foreground"
              disabled={!isConnected || !challstr}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
            <button
              onClick={handleLogin}
              disabled={!isConnected || !challstr || !loginUser || !loginPass}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Login
            </button>
          </div>
          {!isConnected && (
            <p className="text-xs text-muted-foreground mt-2">Connecting to Showdown server...</p>
          )}
          {isConnected && !challstr && (
            <p className="text-xs text-muted-foreground mt-2">Waiting for challenge string...</p>
          )}
        </div>
      )}

      {/* Main content (shown when logged in) */}
      {isLoggedIn && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Lobby Chat */}
          <div className="lg:col-span-2 flex flex-col bg-card border rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b">
              <h2 className="font-semibold">Lobby Chat</h2>
            </div>
            <div
              ref={chatRef}
              className="flex-1 h-[400px] overflow-y-auto p-3 space-y-1 text-sm"
            >
              {lobbyChat.length === 0 && (
                <p className="text-muted-foreground text-center py-8">
                  No messages yet. Chat will appear here once connected to the lobby.
                </p>
              )}
              {lobbyChat.map((msg, i) => (
                <div key={i}>
                  <span className="font-semibold text-primary">{msg.sender}: </span>
                  <span
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(msg.message) }}
                  />
                </div>
              ))}
            </div>
            <div className="p-3 border-t flex gap-2">
              <input
                type="text"
                placeholder="Type a message..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                className="flex-1 px-3 py-2 bg-background border rounded-md text-sm text-foreground placeholder:text-muted-foreground"
              />
              <button
                onClick={handleSendChat}
                disabled={!chatInput.trim()}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md text-sm font-medium hover:bg-secondary/80 transition-colors disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </div>

          {/* Actions sidebar */}
          <div className="flex flex-col gap-4">
            {/* Find Battle */}
            <div className="bg-card border rounded-lg p-4">
              <h2 className="font-semibold mb-3">Battle</h2>
              <p className="text-sm text-muted-foreground mb-3">
                Find a random opponent on the official Showdown server.
              </p>
              <select
                value={selectedFormat}
                onChange={(e) => setSelectedFormat(e.target.value)}
                className="w-full px-3 py-2 bg-background border rounded-md text-sm text-foreground mb-3"
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
                className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-md text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                Find Battle
              </button>
            </div>

            {/* Challenge a player */}
            <div className="bg-card border rounded-lg p-4">
              <h2 className="font-semibold mb-3">Challenge Player</h2>
              <p className="text-sm text-muted-foreground mb-3">
                Challenge a specific player to a battle.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Player name"
                  value={challengeTarget}
                  onChange={(e) => setChallengeTarget(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleChallenge()}
                  className="flex-1 px-3 py-2 bg-background border rounded-md text-sm text-foreground placeholder:text-muted-foreground"
                />
                <button
                  onClick={handleChallenge}
                  disabled={!challengeTarget.trim()}
                  className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md text-sm font-medium hover:bg-secondary/80 transition-colors disabled:opacity-50"
                >
                  Challenge
                </button>
              </div>
            </div>

            {/* Online users */}
            <div className="bg-card border rounded-lg p-4">
              <h2 className="font-semibold mb-2">
                Online Users
                {onlineUsers.length > 0 && (
                  <span className="text-xs text-muted-foreground font-normal ml-2">
                    ({onlineUsers.length})
                  </span>
                )}
              </h2>
              {onlineUsers.length === 0 ? (
                <p className="text-xs text-muted-foreground">Loading users...</p>
              ) : (
                <div className="max-h-[200px] overflow-y-auto space-y-0.5">
                  {onlineUsers.map((user) => (
                    <div
                      key={user}
                      className={`text-xs px-2 py-1 rounded ${
                        user === username
                          ? 'bg-primary/10 text-primary font-semibold'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {user} {user === username && '(you)'}
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-2 border-t pt-2">
                Connected as <strong>{username}</strong> — sim3.psim.us
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({
  status,
  username,
}: {
  status: string;
  username: string | null;
}) {
  const isGuest = username?.startsWith('Guest');

  const color =
    status === 'active'
      ? 'bg-green-500/20 text-green-600 border-green-500/30'
      : status === 'authenticated' || status === 'finished'
        ? 'bg-blue-500/20 text-blue-600 border-blue-500/30'
        : status === 'error' || status === 'reconnecting'
          ? 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30'
          : 'bg-gray-500/20 text-gray-600 border-gray-500/30';

  const label =
    status === 'active'
      ? 'In Battle'
      : status === 'authenticated'
        ? `Logged in as ${username}`
        : isGuest && (status === 'authenticating' || status === 'idle')
          ? `Guest (${username}) — Login required`
          : status === 'connecting' || status === 'authenticating'
            ? 'Connecting...'
            : status === 'reconnecting'
              ? 'Reconnecting...'
              : status === 'error'
                ? 'Error'
                : 'Disconnected';

  return (
    <span
      className={`px-3 py-1.5 rounded-full text-xs font-medium border ${color}`}
    >
      {label}
    </span>
  );
}
