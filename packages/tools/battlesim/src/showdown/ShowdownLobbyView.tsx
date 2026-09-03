'use client';

import { useToolT, BATTLESIM_NS } from '../i18n';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useBsimNav } from '../nav';
import { useShowdownBattle } from '../useShowdownBattle';
import { ChatPanel } from '../components/ChatPanel';
import { Button, Input, Select, Banner, toast } from '@boffmedia/ui';
import { DkSeg } from '@boffmedia/ui/datakit';
import { cn } from '../lib/cn';
import { getPref, setPref } from '../storage';
import { BSIM_SHOWDOWN_USER_KEY } from '../lib/bsim-data';
import { bsimErrorText, BsimChip, BsimScreenShell, BsimSection, BSIM_PAGE_NARROW, BSIM_SEG_FOCUS, type BsimChipTone } from '../components/bsim-kit';

const STATUS_TONE: Record<string, BsimChipTone> = {
  active: 'ok', authenticated: 'signal', error: 'bad',
};

export function BsimShowdownView() {
  const t = useToolT(BATTLESIM_NS);
  const nav = useBsimNav();
  // EMPTY, and no auto-submit below. These used to be seeded with a shared
  // Boffmedia Showdown account and an effect fired it the instant `challstr`
  // arrived, so every visitor played as the same PS user: one ladder rating,
  // one battle history, and a name in chat that was never theirs. The player
  // brings their own identity now - registered, or an unregistered name.
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginMode, setLoginMode] = useState<'account' | 'guest'>('account');
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

  // The NAME comes back, the password never does. Restoring the name is the
  // whole convenience here; a saved password would be a credential for someone
  // else's service sitting in this tool's storage, which is not ours to keep.
  // Skipped once the field has been touched, so a slow read cannot land on top
  // of what someone is typing.
  const userTouched = useRef(false);
  useEffect(() => {
    let live = true;
    void getPref<string>(BSIM_SHOWDOWN_USER_KEY)
      .then((saved) => {
        if (!live || userTouched.current || !saved) return;
        setLoginUser(saved);
      })
      .catch(() => { /* first run, or storage unavailable */ });
    return () => { live = false; };
  }, []);

  // Declared BEFORE the login derivations that read them: `const` has a
  // temporal dead zone, so leaving these further down (where they used to sit,
  // next to the label they fed) makes `canSubmit` a ReferenceError at render.
  const isConnected = status !== 'idle' && status !== 'error';
  const isLoggedIn = status === 'authenticated' && !!username && !username.startsWith('Guest');

  const guest = loginMode === 'guest';
  const canSubmit = !!loginUser.trim() && (guest || !!loginPass) && isConnected && !!challstr;

  // The control feeds `/search`, so it must only offer what PS will accept a
  // search for — a challenge-only format like Custom Game is in the list but
  // laddering it is refused. Falls back to the whole list rather than an empty
  // control, so a server whose flags we read wrong still leaves a usable
  // screen.
  const formatOptions = useMemo(() => {
    const searchable = formats.filter((f) => f.searchable);
    return searchable.length > 0 ? searchable : formats;
  }, [formats]);

  // `selectedFormat` starts as the format ID `gen9randombattle`, while the
  // options carry PS's display names (`[Gen 9] Random Battle`) — so nothing
  // matched and the select rendered with no selection until it was touched.
  // Settles after one pass: once the value is in the list this does nothing.
  useEffect(() => {
    if (formatOptions.length === 0) return;
    if (formatOptions.some((f) => f.name === selectedFormat)) return;
    setSelectedFormat(formatOptions[0].name);
  }, [formatOptions, selectedFormat]);

  const handleLogin = () => {
    if (!canSubmit) return;
    const name = loginUser.trim();
    void setPref(BSIM_SHOWDOWN_USER_KEY, name).catch(() => { /* non-fatal */ });
    // `undefined`, not '': the relay branches on the property being PRESENT to
    // choose Showdown's unregistered-name path.
    login(name, guest ? undefined : loginPass);
    // Held no longer than the emit needs it.
    setLoginPass('');
  };
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
    <BsimScreenShell>
      <div className={cn(BSIM_PAGE_NARROW, 'flex flex-col gap-4 text-txt')}>
      <div className="flex items-center justify-between gap-3">
        <p className="m-0 min-w-0 truncate font-body text-[0.8125rem] text-txt-muted">{t('showdown.subtitle')}</p>
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
                <span className="min-w-0 truncate text-[0.8125rem]"><b className="text-txt">{ch.from}</b> <span className="text-txt-muted">{t('showdown.challengedYou', { format: ch.format })}</span></span>
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
          <div className="flex flex-col gap-3">
            <DkSeg
              value={loginMode}
              onChange={(v) => setLoginMode(v as 'account' | 'guest')}
              ariaLabel={t('showdown.login.modeLabel')}
              options={[
                { value: 'account', label: t('showdown.login.modeAccount') },
                { value: 'guest', label: t('showdown.login.modeGuest') },
              ]}
              // self-start: DkSeg is inline-flex, which a flex COLUMN stretches
              // to full width - a two-option toggle spanning the panel reads as a
              // pair of buttons, not as one control with a choice in it.
              className={cn(BSIM_SEG_FOCUS, "self-start")}
            />

            <div className="flex flex-col gap-3 sm:flex-row">
              <Input
                className="flex-1"
                autoComplete="username"
                placeholder={guest ? t('showdown.login.guestName') : t('showdown.login.username')}
                value={loginUser}
                onChange={(e) => { userTouched.current = true; setLoginUser(e.target.value); }}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                disabled={!isConnected || !challstr}
              />
              {/* An unregistered name has no password by definition, so the
                  field is ABSENT rather than disabled - nothing to wonder about. */}
              {!guest && (
                <Input
                  className="flex-1"
                  type="password"
                  autoComplete="current-password"
                  placeholder={t('showdown.login.password')}
                  value={loginPass}
                  onChange={(e) => setLoginPass(e.target.value)}
                  disabled={!isConnected || !challstr}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                />
              )}
              <Button variant="pri" onClick={handleLogin} disabled={!canSubmit}>
                {guest ? t('showdown.login.guestButton') : t('showdown.login.button')}
              </Button>
            </div>

            {/* Whose credential this is and where it goes. Asking for a password
                for ANOTHER service without saying so is the part that would be
                wrong, not the asking. */}
            <p className="m-0 font-mono text-[0.6875rem] leading-[1.5] text-txt-dim">
              {guest ? t('showdown.login.guestNotice') : t('showdown.login.notice')}
            </p>
          </div>
          {!isConnected && <p className="mt-2 font-mono text-[0.6875rem] text-txt-dim">{t('showdown.login.connecting')}</p>}
          {isConnected && !challstr && <p className="mt-2 font-mono text-[0.6875rem] text-txt-dim">{t('showdown.login.waitingChallstr')}</p>}
        </BsimSection>
      )}

      {isLoggedIn && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <BsimSection icon="message" title={t('showdown.lobbyChat')} className="lg:col-span-2" bodyClassName="">
            <ChatPanel messages={lobbyChat} onSend={(msg) => sendRaw(`lobby|${msg}`)} maxHeight={400} placeholder={t('chat.lobbyPlaceholder')} emptyText={t('chat.lobbyEmpty')} />
          </BsimSection>

          <div className="flex flex-col gap-4">
            <BsimSection icon="sword" title={t('showdown.battle.title')}>
              <p className="mb-3 text-[0.8125rem] text-txt-muted">{t('showdown.battle.desc')}</p>
              {/* The fallback used to be a single hardcoded English label for a
                  format we had not been told about — a control offering one
                  option that might not exist on the server. The list arrives
                  moments after login; until it does, say so. */}
              {formatOptions.length > 0 ? (
                <Select
                  className="mb-3"
                  value={selectedFormat}
                  onChange={setSelectedFormat}
                  ariaLabel={t('showdown.battle.title')}
                  options={formatOptions.map((f) => ({ value: f.name, label: `${f.section ? `${f.section} — ` : ''}${f.name}` }))}
                />
              ) : (
                <p role="status" className="mb-3 font-mono text-[0.6875rem] text-txt-dim">{t('hub.showdown.formatsLoading')}</p>
              )}
              <Button variant="pri" className="w-full" disabled={formatOptions.length === 0} onClick={() => findBattle(selectedFormat)}>{t('showdown.battle.button')}</Button>
            </BsimSection>

            <BsimSection icon="target" title={t('showdown.challenge.title')}>
              <p className="mb-3 text-[0.8125rem] text-txt-muted">{t('showdown.challenge.desc')}</p>
              <div className="flex gap-2">
                <Input className="flex-1" placeholder={t('showdown.challenge.placeholder')} value={challengeTarget} onChange={(e) => setChallengeTarget(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleChallenge()} />
                <Button disabled={!challengeTarget.trim()} onClick={handleChallenge}>{t('pvp.challenge.button')}</Button>
              </div>
            </BsimSection>

            <BsimSection icon="users" title={onlineUsers.length > 0 ? t('showdown.online', { count: onlineUsers.length }) : t('showdown.onlineTitle')}>
              {onlineUsers.length === 0 ? (
                <p className="font-mono text-[0.6875rem] text-txt-dim">{t('showdown.onlineLoading')}</p>
              ) : (
                <div className="max-h-[12.5rem] space-y-0.5 overflow-y-auto">
                  {onlineUsers.map((user) => (
                    <div key={user} className={cn('min-w-0 truncate px-2 py-1 font-mono text-[0.6875rem]', user === username ? 'bg-accent-soft text-accent-bright' : 'text-txt-muted')}>
                      {user}{user === username && ` ${t('showdown.you')}`}
                    </div>
                  ))}
                </div>
              )}
              <p className="mt-2 truncate border-t border-solid border-line pt-2 font-mono text-[0.6875rem] text-txt-dim">{t('showdown.connectedAs', { name: username ?? '' })}</p>
            </BsimSection>
          </div>
        </div>
      )}
      </div>
    </BsimScreenShell>
  );
}
