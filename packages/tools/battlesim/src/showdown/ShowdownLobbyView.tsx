'use client';

import { useToolT, BATTLESIM_NS } from '../i18n';
import { useState, useEffect, useCallback } from 'react';
import { useBsimNav } from '../nav';
import { useShowdownBattle } from '../useShowdownBattle';
import { ChatPanel } from '../components/ChatPanel';
import { Button, Input, Select, Banner, toast } from '@boffmedia/ui';
import { cn } from '../lib/cn';
import { bsimErrorText, BsimChip, BsimScreenShell, BsimSection, BSIM_PAGE_NARROW, type BsimChipTone } from '../components/bsim-kit';

const STATUS_TONE: Record<string, BsimChipTone> = {
  active: 'ok', authenticated: 'signal', error: 'bad',
};

export function BsimShowdownView() {
  const t = useToolT(BATTLESIM_NS);
  const nav = useBsimNav();
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
      nav.push('showdownRoom', { roomId: roomid });
    }, [nav]),
  });

  useEffect(() => {
    if (status === 'authenticating' && challstr && loginUser && loginPass) login(loginUser, loginPass);
  }, [status, challstr, loginUser, loginPass, login]);

  const handleLogin = () => { if (loginUser && loginPass) login(loginUser, loginPass); };
  // The relay gives no acknowledgement, so the send used to be silent: the
  // field kept its text and nothing on screen changed. A toast is the honest
  // report of what we know — that it left.
  const handleChallenge = () => {
    const target = challengeTarget.trim();
    if (!target) return;
    sendRaw(`|/challenge ${target},${selectedFormat}`);
    toast.info(t('hub.showdown.challengeSent', { name: target }));
    setChallengeTarget('');
  };

  const isConnected = status !== 'idle' && status !== 'error';
  const isLoggedIn = status === 'authenticated' && !!username && !username.startsWith('Guest');

  let statusLabel = t('showdown.status.disconnected');
  if (status === 'active') statusLabel = t('showdown.status.inBattle');
  else if (status === 'authenticated') statusLabel = t('showdown.status.loggedIn', { name: username ?? '' });
  else if (status === 'connecting' || status === 'authenticating') statusLabel = t('showdown.status.connecting');
  else if (status === 'reconnecting') statusLabel = t('showdown.status.reconnecting');
  else if (status === 'error') statusLabel = t('showdown.status.error');

  return (
    // The bar is the shell's, not this screen's: rendered bare, the Showdown
    // lobby had no title, no seal and — on the launcher, where there is no
    // browser Back — no way out of it at all.
    <BsimScreenShell sub={t('showdown.title')}>
      <div className={cn(BSIM_PAGE_NARROW, 'flex flex-col gap-4 text-txt')}>
      <div className="flex items-center justify-between gap-3">
        <p className="m-0 min-w-0 truncate font-body text-[13px] text-txt-muted">{t('showdown.subtitle')}</p>
        <BsimChip tone={STATUS_TONE[status] ?? 'neutral'} size="md" pulse={status === 'connecting' || status === 'authenticating' || status === 'reconnecting'}>{statusLabel}</BsimChip>
      </div>

      {/* `{error}` used to be printed raw: the relay's codes reached the
          user as `signin_required`. */}
      {error && <Banner tone="error">{bsimErrorText(error, t)}</Banner>}
      {reconnectInfo && (
        <Banner tone="warn" icon="refresh">
          {t('connection.reconnecting', { attempt: reconnectInfo.attempt, max: reconnectInfo.maxAttempts })}
        </Banner>
      )}

      {challenges.length > 0 && (
        <BsimSection icon="bell" title={t('showdown.incomingChallenges')} kicker={String(challenges.length)}>
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
        </BsimSection>
      )}

      {!isLoggedIn && (
        <BsimSection icon="user" title={t('showdown.login.title')}>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input className="flex-1" placeholder={t('showdown.login.username')} value={loginUser} onChange={(e) => setLoginUser(e.target.value)} disabled={!isConnected || !challstr} />
            <Input className="flex-1" type="password" placeholder={t('showdown.login.password')} value={loginPass} onChange={(e) => setLoginPass(e.target.value)} disabled={!isConnected || !challstr} onKeyDown={(e) => e.key === 'Enter' && handleLogin()} />
            <Button variant="pri" onClick={handleLogin} disabled={!isConnected || !challstr || !loginUser || !loginPass}>{t('showdown.login.button')}</Button>
          </div>
          {!isConnected && <p className="mt-2 font-mono text-[11px] text-txt-dim">{t('showdown.login.connecting')}</p>}
          {isConnected && !challstr && <p className="mt-2 font-mono text-[11px] text-txt-dim">{t('showdown.login.waitingChallstr')}</p>}
        </BsimSection>
      )}

      {isLoggedIn && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <BsimSection icon="message" title={t('showdown.lobbyChat')} className="lg:col-span-2" bodyClassName="">
            <ChatPanel messages={lobbyChat} onSend={(msg) => sendRaw(`lobby|${msg}`)} maxHeight={400} placeholder={t('chat.lobbyPlaceholder')} emptyText={t('chat.lobbyEmpty')} />
          </BsimSection>

          <div className="flex flex-col gap-4">
            <BsimSection icon="sword" title={t('showdown.battle.title')}>
              <p className="mb-3 text-[13px] text-txt-muted">{t('showdown.battle.desc')}</p>
              {/* The fallback used to be a single hardcoded English label for a
                  format we had not been told about — a control offering one
                  option that might not exist on the server. The list arrives
                  moments after login; until it does, say so. */}
              {formats.length > 0 ? (
                <Select
                  className="mb-3"
                  value={selectedFormat}
                  onChange={setSelectedFormat}
                  ariaLabel={t('showdown.battle.title')}
                  options={formats.map((f) => ({ value: f.name, label: `${f.section ? `${f.section} — ` : ''}${f.name}` }))}
                />
              ) : (
                <p role="status" className="mb-3 font-mono text-[11px] text-txt-dim">{t('hub.showdown.formatsLoading')}</p>
              )}
              <Button variant="pri" className="w-full" disabled={formats.length === 0} onClick={() => findBattle(selectedFormat)}>{t('showdown.battle.button')}</Button>
            </BsimSection>

            <BsimSection icon="target" title={t('showdown.challenge.title')}>
              <p className="mb-3 text-[13px] text-txt-muted">{t('showdown.challenge.desc')}</p>
              <div className="flex gap-2">
                <Input className="flex-1" placeholder={t('showdown.challenge.placeholder')} value={challengeTarget} onChange={(e) => setChallengeTarget(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleChallenge()} />
                <Button disabled={!challengeTarget.trim()} onClick={handleChallenge}>{t('pvp.challenge.button')}</Button>
              </div>
            </BsimSection>

            <BsimSection icon="users" title={onlineUsers.length > 0 ? t('showdown.online', { count: onlineUsers.length }) : t('showdown.onlineTitle')}>
              {onlineUsers.length === 0 ? (
                <p className="font-mono text-[11px] text-txt-dim">{t('showdown.onlineLoading')}</p>
              ) : (
                <div className="max-h-[200px] space-y-0.5 overflow-y-auto">
                  {onlineUsers.map((user) => (
                    <div key={user} className={cn('min-w-0 truncate px-2 py-1 font-mono text-[11px]', user === username ? 'bg-accent-soft text-accent-bright' : 'text-txt-muted')}>
                      {user}{user === username && ` ${t('showdown.you')}`}
                    </div>
                  ))}
                </div>
              )}
              <p className="mt-2 truncate border-t border-solid border-line pt-2 font-mono text-[11px] text-txt-dim">{t('showdown.connectedAs', { name: username ?? '' })}</p>
            </BsimSection>
          </div>
        </div>
      )}
      </div>
    </BsimScreenShell>
  );
}
