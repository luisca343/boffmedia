'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Banner, Button, Icon, Input, Spinner, cn, toast } from '@boffmedia/ui';
import { DkSelect } from '@boffmedia/ui/datakit';
import { useToolOnline, useToolSession } from '@boffmedia/tool-kit';

import { useToolT, BATTLESIM_NS } from '../i18n';
import { useBsimNav } from '../nav';
import { usePvPMatchmaking } from '../usePvPMatchmaking';
import { usePvpSocket } from './PvpSocketProvider';
import { BattleSession } from '../engine/BattleSession';
import { BSIM_FORMATS, isTeamFormat } from '../lib/bsim-data';
import { useTeams } from '../teambuilder/useTeams';
import { useTeamValidation } from '../teambuilder/useTeamValidation';
import { bsimErrorText, BsimChip, BsimErrorState, BsimKicker, BsimScreenShell, BsimSection, BSIM_FOCUS_CUT, BSIM_PAGE_NARROW, parseBsimError, type BsimChipTone } from '../components/bsim-kit';

/** The transport's state, as a tone. Anything unlisted is simply "not yet". */
const STATUS_TONE: Record<string, BsimChipTone> = {
  inBattle: 'ok', searching: 'warn', connected: 'signal', error: 'bad',
};

/** How long a search may run before we offer a way out of it. */
const SLOW_QUEUE_MS = 60_000;

const mmss = (ms: number) => {
  const total = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
};

export function BsimPvpView() {
  const t = useToolT(BATTLESIM_NS);
  const nav = useBsimNav();
  const pvp = usePvpSocket();
  const session = useToolSession();
  const online = useToolOnline();
  const {
    status, error, playerId, pendingChallenges, queuePosition, queueStartedAt, teamProblems, notice,
    activeSession, activeRoomId, activeSide,
    connect, joinQueue, leaveQueue, challengePlayer,
    acceptChallenge, rejectChallenge, setActiveSession,
  } = usePvPMatchmaking();

  const [selectedFormat, setSelectedFormat] = useState<string>(
    () => (nav.params.format && BSIM_FORMATS.some((f) => f.value === nav.params.format) ? nav.params.format : BSIM_FORMATS[0].value),
  );
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(nav.params.team ?? null);

  // PvP validates server-side and REJECTS an illegal team (D12), so the packed
  // team travels with the queue request. A random format sends none.
  const { teams } = useTeams();
  const eligible = useMemo(
    () => teams.filter((tm) => tm.format === selectedFormat && !tm.deletedAt && tm.packed),
    [teams, selectedFormat],
  );
  const needsTeam = isTeamFormat(selectedFormat);
  const chosenTeam = eligible.find((tm) => tm.clientId === selectedTeamId) ?? eligible[0] ?? null;
  const packedTeam = needsTeam ? chosenTeam?.packed : undefined;
  const missingTeam = needsTeam && !packedTeam;
  const validation = useTeamValidation(selectedFormat, needsTeam ? (chosenTeam?.packed ?? '') : '', { enabled: needsTeam && !!chosenTeam });

  const [challengeTarget, setChallengeTarget] = useState('');
  const [, forceUpdate] = useState(0);
  const triggerUpdate = useCallback(() => forceUpdate((n) => n + 1), []);

  // Not until the host has resolved the session: connecting during "loading"
  // either fires a doomed ticket request or paints the sign-in wall at someone
  // who is signed in.
  useEffect(() => {
    if (session.status === 'loading') return;
    void connect();
  }, [connect, session.status]);

  // Elapsed time in the queue, ticking once a second and only while searching:
  // an interval that runs on an idle lobby is a re-render a second for nothing.
  const [now, setNow] = useState(() => Date.now());
  const isSearching = status === 'searching';
  useEffect(() => {
    if (!isSearching || !queueStartedAt) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [isSearching, queueStartedAt]);
  const elapsed = isSearching && queueStartedAt ? now - queueStartedAt : 0;
  const slow = elapsed >= SLOW_QUEUE_MS;

  // Challenge feedback. Keyed on `seq` so the same event twice still speaks.
  useEffect(() => {
    if (!notice) return;
    if (notice.kind === 'challengeSent') {
      toast.info(notice.name ? t('hub.challenge.sent', { name: notice.name }) : t('hub.challenge.sentAnon'));
    } else if (notice.kind === 'challengeRejected') {
      toast.warn(t('hub.challenge.rejected', { name: notice.name }));
    } else {
      toast.success(t('hub.challenge.accepted', { name: notice.name }));
    }
  }, [notice, t]);

  useEffect(() => {
    if (status === 'inBattle' && activeRoomId && !activeSession) {
      if (activeSide) pvp.setRoomSide(activeRoomId, activeSide);
      // The PvP server paces this battle exactly as Showdown does — it will not
      // send the next turn until both players have chosen — so the viewer must
      // not be the brake. Without this, anything that arrives while you are
      // still deciding (most importantly the opponent forfeiting, or the
      // battle ending) is queued behind your own choice and never shown.
      const session = new BattleSession(activeRoomId, {
        onUpdate: triggerUpdate, onRequest: () => triggerUpdate(), onBattleEnd: () => triggerUpdate(),
      });
      session.livePaced = true;
      session.status = 'active';
      // Handed to the room screen through the provider. This used to travel on
      // `window.__pvp_sessions`, which nothing owned and nothing cleaned up.
      pvp.setRoomSession(activeRoomId, session);
      setActiveSession(session, activeRoomId);
      nav.push('pvpRoom', { roomId: activeRoomId });
    }
  }, [status, activeRoomId, activeSession, activeSide, setActiveSession, nav, pvp, triggerUpdate]);

  const canSearch = status === 'connected' || status === 'idle';
  const KNOWN_STATUS = ['connecting', 'connected', 'idle', 'searching', 'inBattle', 'error'];
  const statusLabel = t(`pvp.status.${KNOWN_STATUS.includes(status) ? status : 'disconnected'}`);

  const goToTeams = useCallback(() => nav.replace('hub', { tab: 'equipos' }), [nav]);
  const playAi = useCallback(() => nav.replace('play', { format: selectedFormat }), [nav, selectedFormat]);

  // A fatal transport state is the whole screen, not a red string above the
  // controls: there is nothing on this page that works without the socket, and
  // the one useful thing to show is the way out of it.
  // Offline is not a socket error, it is a precondition, and it was the one
  // state this screen did not name: the lobby's mode card says "sin conexión"
  // and the replays list shows an offline banner, but PvP sat on a spinner
  // until the doomed connect timed out into `connect_failed`.
  if (!online) {
    return (
      <BsimScreenShell>
        <BsimErrorState
          code="offline"
          actions={
            <>
              <Button variant="pri" icon="refresh" onClick={() => { pvp.disconnect(); void connect(); }}>{t('hub.queue.retry')}</Button>
              <Button icon="target" onClick={playAi}>{t('hub.gate.playAiInstead')}</Button>
            </>
          }
        />
      </BsimScreenShell>
    );
  }

  const fatal = status === 'error' && !!error ? parseBsimError(error) : null;
  if (fatal && (fatal.code === 'signin_required' || fatal.code === 'connect_failed')) {
    return (
      <BsimScreenShell>
        <BsimErrorState
          code={error ?? undefined}
          actions={
            fatal.code === 'signin_required' ? (
              <>
                <Button variant="pri" icon="user" onClick={session.signIn}>{t('hub.gate.signIn')}</Button>
                <Button icon="target" onClick={playAi}>{t('hub.gate.playAiInstead')}</Button>
              </>
            ) : (
              <>
                <Button variant="pri" icon="refresh" onClick={() => { pvp.disconnect(); void connect(); }}>{t('hub.queue.retry')}</Button>
                <Button icon="target" onClick={playAi}>{t('hub.gate.playAiInstead')}</Button>
              </>
            )
          }
        />
      </BsimScreenShell>
    );
  }

  return (
    <BsimScreenShell>
      <div className={cn(BSIM_PAGE_NARROW, 'flex flex-col gap-4 text-txt')}>
      {/* App surface: the rail names the tool, so this view does not repeat it. */}
      <div className="flex items-center justify-between gap-3">
        <p className="m-0 min-w-0 truncate font-body text-[0.8125rem] text-txt-muted">{t('pvp.subtitle')}</p>
        <BsimChip tone={STATUS_TONE[status] ?? 'neutral'} size="md" pulse={status === 'connecting' || status === 'searching'}>{statusLabel}</BsimChip>
      </div>

      {/* A code the user cannot act on is not an error message. */}
      {error && !fatal && (
        <Banner tone="warn">{bsimErrorText(error, t)}</Banner>
      )}

      {teamProblems.length > 0 && (
        <Banner
          tone="error"
          title={t('hub.queue.teamRejectedTitle')}
          actions={<Button size="sm" icon="edit" onClick={goToTeams}>{t('hub.queue.editTeam')}</Button>}
        >
          <ul className="m-0 grid list-disc gap-1 pl-4 font-mono text-[0.6875rem] leading-[1.45]">
            {teamProblems.slice(0, 6).map((p) => <li key={p}>{p}</li>)}
          </ul>
        </Banner>
      )}

      {pendingChallenges.length > 0 && (
        <BsimSection icon="bell" title={t('pvp.incomingChallenges')} kicker={String(pendingChallenges.length)}>
          <div className="flex flex-col gap-2">
            {pendingChallenges.map((ch) => (
              <div key={ch.from} className="flex items-center justify-between gap-3 border border-solid border-line bg-base px-3 py-2">
                <span className="min-w-0 truncate text-[0.8125rem]"><b className="text-txt">{ch.from}</b> <span className="text-txt-muted">{t('pvp.challengedYou', { format: ch.format })}</span></span>
                <div className="flex flex-none gap-2">
                  <Button size="sm" variant="pri" onClick={() => void acceptChallenge(ch.from, packedTeam)}>{t('pvp.accept')}</Button>
                  <Button size="sm" variant="danger" onClick={() => void rejectChallenge(ch.from)}>{t('pvp.reject')}</Button>
                </div>
              </div>
            ))}
          </div>
        </BsimSection>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <BsimSection icon="search" title={isSearching ? t('hub.queue.title') : t('pvp.findMatch.title')}>
          {isSearching ? (
            <div className="grid gap-3">
              {/* The queue used to be a spinner and the word "searching". It is a
                  wait with no known end, so it says what it knows: where you are,
                  how long it has been, and how to stop. */}
              <div className="flex items-center gap-3">
                <Spinner size={18} />
                <span className="grid min-w-0 gap-[3px]">
                  <b role="status" className="font-display text-[0.875rem]/none font-bold uppercase tracking-[0.04em] text-txt">
                    {queuePosition ? t('hub.queue.position', { n: queuePosition }) : t('hub.queue.positionUnknown')}
                  </b>
                  <span className="font-mono text-[0.6875rem]/none tabular-nums text-txt-dim">
                    {t('hub.queue.elapsed', { time: mmss(elapsed) })}
                  </span>
                </span>
              </div>

              {slow && (
                <Banner
                  tone="info"
                  title={t('hub.queue.slowTitle')}
                  actions={<Button size="sm" variant="pri" icon="target" onClick={playAi}>{t('hub.queue.playAi')}</Button>}
                >
                  {t('hub.queue.slowLead')}
                </Banner>
              )}

              <Button variant="danger" icon="x" className="w-full" onClick={() => leaveQueue()}>{t('hub.queue.cancel')}</Button>
            </div>
          ) : (
            <div className="grid gap-3">
              <p className="m-0 font-body text-[0.8125rem] leading-[1.45] text-txt-muted">{t('pvp.findMatch.desc')}</p>
              <FormatAndTeam
                format={selectedFormat}
                onFormat={(v) => { setSelectedFormat(v); setSelectedTeamId(null); }}
                teamId={chosenTeam?.clientId ?? null}
                onTeam={setSelectedTeamId}
                teams={eligible}
                needsTeam={needsTeam}
                validation={validation}
                onCreateTeam={goToTeams}
                t={t}
              />
              <Button variant="pri" icon="search" className="w-full" disabled={!canSearch || missingTeam} onClick={() => void joinQueue(selectedFormat, packedTeam)}>
                {t('pvp.findMatch.button')}
              </Button>
              {/* A disabled control with no reason beside it is a dead end. */}
              {missingTeam && (
                <DisabledReason reason={t('hub.queue.needsTeam')} action={t('hub.queue.goToTeams')} onAction={goToTeams} />
              )}
            </div>
          )}
        </BsimSection>

        <BsimSection icon="sword" title={t('pvp.challenge.title')}>
          <div className="grid gap-3">
            <p className="m-0 font-body text-[0.8125rem] leading-[1.45] text-txt-muted">{t('pvp.challenge.desc')}</p>
            <div className="flex gap-2">
              <Input
                className="min-w-0 flex-1"
                placeholder={t('pvp.challenge.placeholder')}
                value={challengeTarget}
                onChange={(e) => setChallengeTarget(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && challengeTarget.trim()) void challengePlayer(challengeTarget.trim(), selectedFormat, packedTeam); }}
              />
              <Button
                className="flex-none"
                disabled={!challengeTarget.trim() || !canSearch || missingTeam}
                onClick={() => challengeTarget.trim() && void challengePlayer(challengeTarget.trim(), selectedFormat, packedTeam)}
              >
                {t('pvp.challenge.button')}
              </Button>
            </div>
            {missingTeam && (
              <DisabledReason reason={t('hub.queue.needsTeam')} action={t('hub.queue.goToTeams')} onAction={goToTeams} />
            )}
          </div>
        </BsimSection>
      </div>

      {playerId && (
        <BsimSection icon="user" title={t('pvp.yourId.title')}>
          <p className="m-0 mb-2 inline-block max-w-full truncate border border-solid border-line-2 bg-base px-2 py-1 font-mono text-[0.6875rem] text-txt-muted">{playerId}</p>
          <p className="m-0 font-body text-[0.75rem] text-txt-dim">{t('pvp.yourId.desc')}</p>
        </BsimSection>
      )}
      </div>
    </BsimScreenShell>
  );
}

/* ── pieces ──────────────────────────────────────────────────────────────── */

type T = (key: string, values?: Record<string, string | number | Date>) => string;

function DisabledReason({ reason, action, onAction }: { reason: string; action: string; onAction: () => void }) {
  return (
    <p className="m-0 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[0.6875rem] leading-[1.4] text-warn">
      <Icon name="alert" size={12} className="flex-none" />
      {reason}
      <button
        type="button"
        onClick={onAction}
        className={cn('underline underline-offset-2 transition-colors duration-[140ms] hover:text-accent-bright', 'focus-visible:outline-2 focus-visible:outline-accent-line focus-visible:outline-offset-[3px]')}
      >
        {action}
      </button>
    </p>
  );
}

function FormatAndTeam({
  format, onFormat, teamId, onTeam, teams, needsTeam, validation, onCreateTeam, t,
}: {
  format: string;
  onFormat: (v: string) => void;
  teamId: string | null;
  onTeam: (v: string) => void;
  teams: Array<{ clientId: string; name: string }>;
  needsTeam: boolean;
  validation: { ok: boolean | null; problems: string[]; checking: boolean };
  onCreateTeam: () => void;
  t: T;
}) {
  const checking = validation.checking || validation.ok === null;
  return (
    <div className="grid gap-[0.4375rem]">
      <BsimKicker>{t('app.lobby.formatLabel')}</BsimKicker>
      <DkSelect value={format} onChange={onFormat} ariaLabel={t('app.lobby.formatLabel')} options={BSIM_FORMATS.map((f) => ({ value: f.value, label: f.label }))} />
      {needsTeam && (
        <>
          <BsimKicker className="mt-1">{t('hub.team.label')}</BsimKicker>
          {teams.length > 0 ? (
            <div className="grid gap-[0.4375rem] min-[420px]:grid-cols-[minmax(0,1fr)_auto] min-[420px]:items-center">
              <DkSelect value={teamId ?? ''} onChange={onTeam} ariaLabel={t('hub.team.pickAria')} options={teams.map((tm) => ({ value: tm.clientId, label: tm.name }))} />
              {/* The same pill the lobby and the teambuilder draw — this used
                  to be a verbatim copy of the lobby's markup, one corner size
                  and one border recipe apart from the builder's. */}
              <BsimChip
                tone={checking ? 'checking' : validation.ok ? 'ok' : 'warn'}
                size="md"
                pulse={checking}
              >
                {checking ? t('hub.team.checking') : validation.ok ? t('hub.team.legal') : t('hub.team.problems', { count: validation.problems.length })}
              </BsimChip>
            </div>
          ) : (
            <button
              type="button"
              onClick={onCreateTeam}
              className={cn(
                'cut-tag cut-tag-edge [--cut-tag:8px] [--cut-line:var(--line-2)] hover:[--cut-line:var(--accent-line)]',
                'inline-flex h-8 items-center justify-center gap-[0.375rem] border border-solid border-line-2 bg-panel px-3 font-mono text-[0.625rem] font-semibold uppercase leading-none tracking-[0.1em] text-txt-muted transition-[color,border-color] duration-[140ms] hover:border-accent-line hover:text-accent-bright',
                BSIM_FOCUS_CUT,
              )}
            >
              <Icon name="plus" size={12} />{t('hub.team.create')}
            </button>
          )}
        </>
      )}
    </div>
  );
}
