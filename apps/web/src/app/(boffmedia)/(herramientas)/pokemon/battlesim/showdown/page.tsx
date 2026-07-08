'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useShowdownBattle } from '@/app/battlesim/_hooks/useShowdownBattle';
import { ChatPanel } from '@/app/battlesim/_components/ChatPanel';
import { Panel, Button, Input, Select, Badge } from '@/components/boffmedia/primitives';
import { cn } from '@/lib/utils';

const STATUS_TONE: Record<string, 'ok' | 'warn' | 'info' | 'bad' | 'default'> = {
  active: 'ok', authenticated: 'info', error: 'warn',
};

export default function ShowdownLobbyPage() {
  const t = useTranslations('battlesim');
  const router = useRouter();
  const [loginUser, setLoginUser] = useState('Boffmedia');
  const [loginPass, setLoginPass] = useState('boffmedia');
  const [challengeTarget, setChallengeTarget] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('gen9randombattle');

  const {
    status, username, lobbyChat, challenges, formats, onlineUsers, error, reconnectInfo, challstr,
    login, findBattle, acceptChallenge, rejectChallenge, sendRaw,
  } = useShowdownBattle(undefined, {
    autoCreateSession: false,
    onBattleFound: useCallback((roomid: string) => {
      router.push(`/pokemon/battlesim/showdown/battle/${encodeURIComponent(roomid)}`);
    }, [router]),
  });

  useEffect(() => {
    if (status === 'authenticating' && challstr && loginUser && loginPass) login(loginUser, loginPass);
  }, [status, challstr, loginUser, loginPass, login]);

  const handleLogin = () => { if (loginUser && loginPass) login(loginUser, loginPass); };
  const handleChallenge = () => { if (challengeTarget.trim()) sendRaw(`|/challenge ${challengeTarget.trim()},${selectedFormat}`); };

  const isConnected = status !== 'idle' && status !== 'error';
  const isLoggedIn = status === 'authenticated' && !!username && !username.startsWith('Guest');

  let statusLabel = t('showdown.status.disconnected');
  if (status === 'active') statusLabel = t('showdown.status.inBattle');
  else if (status === 'authenticated') statusLabel = t('showdown.status.loggedIn', { name: username ?? '' });
  else if (status === 'connecting' || status === 'authenticating') statusLabel = t('showdown.status.connecting');
  else if (status === 'reconnecting') statusLabel = t('showdown.status.reconnecting');
  else if (status === 'error') statusLabel = t('showdown.status.error');

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 p-4 text-txt">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-[clamp(24px,3.5vw,34px)]">{t('showdown.title')}</h1>
          <p className="mt-1 text-txt-muted">{t('showdown.subtitle')}</p>
        </div>
        <Badge tone={STATUS_TONE[status] ?? 'default'}>{statusLabel}</Badge>
      </div>

      {error && <div className="border border-solid border-[color-mix(in_srgb,var(--bad)_40%,transparent)] bg-bad-soft px-3 py-2 font-mono text-[12px] text-bad">{error}</div>}
      {reconnectInfo && (
        <div className="border border-solid border-[color-mix(in_srgb,var(--warn)_40%,transparent)] bg-warn-soft px-3 py-2 font-mono text-[12px] text-warn">
          {t('connection.reconnecting', { attempt: reconnectInfo.attempt, max: reconnectInfo.maxAttempts })}
        </div>
      )}

      {challenges.length > 0 && (
        <Panel title={t('showdown.incomingChallenges')}>
          <div className="flex flex-col gap-2">
            {challenges.map((ch) => (
              <div key={ch.from} className="flex items-center justify-between gap-3 border border-solid border-line bg-base px-3 py-2">
                <span className="min-w-0 truncate text-[13px]"><b className="text-txt">{ch.from}</b> <span className="text-txt-muted">{t('showdown.challengedYou', { format: ch.format })}</span></span>
                <div className="flex flex-none gap-2">
                  <Button size="sm" variant="pri" onClick={() => acceptChallenge(ch.from)}>{t('pvp.accept')}</Button>
                  <Button size="sm" variant="danger" onClick={() => rejectChallenge(ch.from)}>{t('pvp.reject')}</Button>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {!isLoggedIn && (
        <Panel title={t('showdown.login.title')}>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input className="flex-1" placeholder={t('showdown.login.username')} value={loginUser} onChange={(e) => setLoginUser(e.target.value)} disabled={!isConnected || !challstr} />
            <Input className="flex-1" type="password" placeholder={t('showdown.login.password')} value={loginPass} onChange={(e) => setLoginPass(e.target.value)} disabled={!isConnected || !challstr} onKeyDown={(e) => e.key === 'Enter' && handleLogin()} />
            <Button variant="pri" onClick={handleLogin} disabled={!isConnected || !challstr || !loginUser || !loginPass}>{t('showdown.login.button')}</Button>
          </div>
          {!isConnected && <p className="mt-2 font-mono text-[11px] text-txt-dim">{t('showdown.login.connecting')}</p>}
          {isConnected && !challstr && <p className="mt-2 font-mono text-[11px] text-txt-dim">{t('showdown.login.waitingChallstr')}</p>}
        </Panel>
      )}

      {isLoggedIn && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Panel title={t('showdown.lobbyChat')} className="lg:col-span-2" bodyClassName="p-0">
            <ChatPanel messages={lobbyChat} onSend={(msg) => sendRaw(`lobby|${msg}`)} maxHeight={400} placeholder={t('chat.lobbyPlaceholder')} emptyText={t('chat.lobbyEmpty')} />
          </Panel>

          <div className="flex flex-col gap-4">
            <Panel title={t('showdown.battle.title')}>
              <p className="mb-3 text-[13px] text-txt-muted">{t('showdown.battle.desc')}</p>
              <Select
                className="mb-3"
                value={selectedFormat}
                onChange={setSelectedFormat}
                ariaLabel={t('showdown.battle.title')}
                options={formats.length > 0
                  ? formats.map((f) => ({ value: f.name, label: `${f.section ? `${f.section} — ` : ''}${f.name}` }))
                  : [{ value: 'gen9randombattle', label: 'Gen 9 Random Battle' }]}
              />
              <Button variant="pri" className="w-full" onClick={() => findBattle(selectedFormat)}>{t('showdown.battle.button')}</Button>
            </Panel>

            <Panel title={t('showdown.challenge.title')}>
              <p className="mb-3 text-[13px] text-txt-muted">{t('showdown.challenge.desc')}</p>
              <div className="flex gap-2">
                <Input className="flex-1" placeholder={t('showdown.challenge.placeholder')} value={challengeTarget} onChange={(e) => setChallengeTarget(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleChallenge()} />
                <Button disabled={!challengeTarget.trim()} onClick={handleChallenge}>{t('pvp.challenge.button')}</Button>
              </div>
            </Panel>

            <Panel title={onlineUsers.length > 0 ? t('showdown.online', { count: onlineUsers.length }) : t('showdown.onlineTitle')}>
              {onlineUsers.length === 0 ? (
                <p className="font-mono text-[11px] text-txt-dim">{t('showdown.onlineLoading')}</p>
              ) : (
                <div className="max-h-[200px] space-y-0.5 overflow-y-auto">
                  {onlineUsers.map((user) => (
                    <div key={user} className={cn('px-2 py-1 font-mono text-[11px]', user === username ? 'bg-accent-soft text-accent-bright' : 'text-txt-muted')}>
                      {user}{user === username && ` ${t('showdown.you')}`}
                    </div>
                  ))}
                </div>
              )}
              <p className="mt-2 border-t border-solid border-line pt-2 font-mono text-[11px] text-txt-dim">{t('showdown.connectedAs', { name: username ?? '' })}</p>
            </Panel>
          </div>
        </div>
      )}
    </div>
  );
}
