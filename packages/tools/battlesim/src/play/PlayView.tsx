'use client';

/**
 * The local-AI screen, in its two halves.
 *
 * WITHOUT a `roomId` in the address it is the SETUP form — pick a format, pick
 * a team, start. WITH one it is that battle, and nothing else: the room's own
 * layer pins `nav.params.roomId` (see `BsimRoot`), so two open battles are two
 * mounts of this component, each reading its own id, both rendering at once
 * with only the active one visible.
 *
 * WHAT MOVED OUT. This screen used to own `useLocalBattle` — the worker and
 * every live session — which meant leaving it destroyed them all. The engine
 * now lives in `RoomsProvider`, above the screen switch, and the tab strip that
 * used to be squeezed into `BattleHeader` is the tool's global bar. What is
 * left here is the setup form and the wiring from one room to `LiveBattle`.
 */

import { Suspense, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Button, Select, cn } from '@boffmedia/ui';
import { DkBack, DkTitle, DkSprite } from '@boffmedia/ui/datakit';
import { unpackTeam } from '@boffmedia/battle-core';
import { spriteUrl, handleSpriteError } from '@boffmedia/tools-pokemon';
import { useToolT, BATTLESIM_NS } from '../i18n';
import { useBsimNav, useBsimBackOrHub } from '../nav';
import { useBsimRooms, shortRoomId, formatLabelFor } from '../rooms/RoomsProvider';
import { LiveBattle } from '../components/LiveBattle';
import { BattleConnectionState } from '../components/BattleConnectionState';
import { BsimSection, BsimErrorState, BSIM_FOCUS_CUT } from '../components/bsim-kit';
import type { EndAction } from '../lib/battle-types';
import { BSIM_FORMATS } from '../lib/bsim-data';
import { useTeams } from '../teambuilder/useTeams';
import { useBattleTeams } from './useBattleTeams';

function Bar({ onBack, title, sub }: { onBack: () => void; title: string; sub?: string }) {
  const t = useToolT(BATTLESIM_NS);
  return (
    <div className="flex min-h-[var(--tool-bar-h,3.625rem)] shrink-0 items-center gap-3 border-b border-solid border-line bg-panel px-3">
      <DkBack onClick={onBack} label={t('battle.header.back')} />
      <DkTitle icon="sword" label={title} sub={sub} />
    </div>
  );
}

function TeamCard({ name, packed, selected, onSelect }: { name: string; packed: string; selected: boolean; onSelect: () => void }) {
  const sets = useMemo(() => unpackTeam(packed) ?? [], [packed]);
  return (
    <button type="button" onClick={onSelect} aria-pressed={selected}
      className={cn('cut-tag cut-tag-edge [--cut-tag:10px] [--cut-line:var(--line)]', BSIM_FOCUS_CUT, 'flex min-h-[4rem] w-full min-w-0 flex-col gap-2 border border-solid border-line bg-panel p-3 text-left transition-[border-color,background] duration-[140ms] hover:border-accent-line hover:[--cut-line:var(--accent-line)] hover:bg-panel-2',
        selected && 'border-accent [--cut-line:var(--accent)] bg-accent-soft')}>
      <b className="truncate font-display text-[0.8125rem] font-bold uppercase leading-none tracking-[0.03em] text-txt">{name}</b>
      <span className="flex flex-wrap gap-1">
        {sets.slice(0, 6).map((s, i) => <DkSprite key={i} src={spriteUrl(s.species)} alt={s.species} size={28} onError={handleSpriteError} />)}
      </span>
    </button>
  );
}

function PlayInner() {
  const t = useToolT(BATTLESIM_NS);
  const nav = useBsimNav();
  const backOrHub = useBsimBackOrHub();

  const { local, openRoom, closeRoom } = useBsimRooms();
  const { createBattle, getSession, getFormat, makeChoice, forfeit, initScene } = local;

  const roomId = nav.params.roomId ?? '';
  const queryFormat = nav.params.format;
  const queryTeam = nav.params.team;
  const [selectedFormat, setSelectedFormat] = useState<string>(
    queryFormat && BSIM_FORMATS.some((f) => f.value === queryFormat) ? queryFormat : BSIM_FORMATS[0].value,
  );

  const { teams } = useTeams();
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const { available: myTeams, needsTeam, blocked, teamsFor } = useBattleTeams(selectedFormat, teams);

  // `?team=<clientId>` preselects that team (the hub's team picker links here).
  useEffect(() => {
    if (!queryTeam || selectedTeamId) return;
    const found = teams.find((tm) => tm.clientId === queryTeam && !tm.deletedAt);
    if (found) {
      setSelectedTeamId(found.clientId);
      if (found.format !== selectedFormat && BSIM_FORMATS.some((f) => f.value === found.format)) setSelectedFormat(found.format);
    }
  }, [queryTeam, teams, selectedTeamId, selectedFormat]);

  /**
   * Start a battle, declare it as a room, and go there.
   *
   * All three in one place because they are one act: a battle that is not a
   * room has no tab and no address, and is therefore unreachable the moment
   * anything else is on screen.
   */
  const start = useCallback((format: string, teamId: string | null) => {
    const id = createBattle(format, teamsFor(teamId));
    openRoom({
      id,
      kind: 'ai',
      label: formatLabelFor(format) ?? '',
      sub: shortRoomId(id),
      tone: 'ok',
      screen: 'play',
      params: { roomId: id },
    });
    nav.replace('play', { roomId: id });
    return id;
  }, [createBattle, teamsFor, openRoom, nav]);

  const handleCreateBattle = () => {
    if (blocked) return;
    start(selectedFormat, selectedTeamId);
  };

  /**
   * Single-click launch from the lobby (`?format=…`).
   *
   * Keyed on the QUERY, not on a boolean: the setup layer is no longer
   * unmounted when a battle covers it, so a `hasLaunched` flag set by the first
   * launch would still be set when the lobby sent the screen a second one.
   */
  const autoLaunched = useRef<string | null>(null);
  useEffect(() => {
    if (roomId || !queryFormat) return;
    const signature = `${queryFormat}|${queryTeam ?? ''}`;
    if (autoLaunched.current === signature) return;
    autoLaunched.current = signature;
    start(queryFormat, selectedTeamId);
  }, [roomId, queryFormat, queryTeam, start, selectedTeamId]);

  const session = roomId ? getSession(roomId) : undefined;
  const state = session?.getState();

  const thisFormat = roomId ? getFormat(roomId) ?? selectedFormat : selectedFormat;
  const formatLabel = formatLabelFor(thisFormat);

  /** Close this room and open a fresh one on the same format. */
  const rematch = useCallback(() => {
    const format = thisFormat;
    const team = selectedTeamId;
    // `silent`: `start` is about to navigate to the replacement, so letting the
    // close pick a neighbour first would be one wasted address change.
    if (roomId) closeRoom(roomId, { silent: true });
    start(format, team);
  }, [thisFormat, selectedTeamId, roomId, closeRoom, start]);

  // Idle / setup — no room in the address.
  if (!roomId || !session || !state) {
    const teamOptions = needsTeam ? myTeams : [];
    return (
      <div className="flex h-[var(--tool-vh,100dvh)] min-h-0 flex-col overflow-hidden bg-base text-txt">
        <Bar onBack={backOrHub} title={t('play.title')} sub={t('play.subtitle')} />
        <div className="min-h-0 flex-1 overflow-y-auto p-[clamp(0.875rem,2vw,2rem)]">
          <div className="mx-auto w-full max-w-[45rem] min-[1600px]:max-w-[51.75rem] min-[2240px]:max-w-[60rem]">
            <BsimSection kicker={t('header.modes.ai')} icon="target" title={t('battle.play.setupTitle')}>
              <div className="grid gap-4">
                <p className="m-0 font-body text-[0.8125rem] leading-[1.5] text-txt-muted">{t('battle.play.setupLead')}</p>
                <Select
                  label={t('battle.play.format')}
                  value={selectedFormat}
                  onChange={(v) => { setSelectedFormat(v); setSelectedTeamId(null); }}
                  ariaLabel={t('app.lobby.formatLabel')}
                  options={BSIM_FORMATS.map((f) => ({ value: f.value, label: f.label }))}
                />
                {needsTeam && (
                  <div className="grid gap-2">
                    <span className="font-mono text-[0.65625rem] font-semibold uppercase leading-none tracking-[0.12em] text-txt-dim">{t('battle.play.team')}</span>
                    {teamOptions.length > 0 ? (
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 min-[1600px]:grid-cols-3">
                        {teamOptions.map((tm) => (
                          <TeamCard key={tm.clientId} name={tm.name} packed={tm.packed} selected={(selectedTeamId ?? teamOptions[0].clientId) === tm.clientId} onSelect={() => setSelectedTeamId(tm.clientId)} />
                        ))}
                      </div>
                    ) : blocked ? (
                      <div className="flex flex-wrap items-center gap-3 border border-solid border-warn bg-warn-soft p-3">
                        <span className="font-body text-[0.78125rem] text-txt">{t('battle.play.noTeams')}</span>
                        <Button size="sm" variant="ghost" icon="layers" onClick={() => nav.replace('hub', { tab: 'equipos' })}>{t('battle.play.createTeam')}</Button>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-3 border border-solid border-line bg-base p-3">
                        <span className="font-body text-[0.78125rem] text-txt-muted">{t('battle.play.sampleHint')}</span>
                        <Button size="sm" variant="ghost" icon="layers" onClick={() => nav.replace('hub', { tab: 'equipos' })}>{t('battle.play.createTeam')}</Button>
                      </div>
                    )}
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-2 border-t border-solid border-line pt-4">
                  <Button variant="pri" size="lg" icon="sword" onClick={handleCreateBattle} disabled={blocked}>{t('battle.play.start')}</Button>
                  <Button variant="ghost" onClick={backOrHub}>{t('battle.play.back')}</Button>
                </div>
              </div>
            </BsimSection>
          </div>
        </div>
      </div>
    );
  }

  if (state.status === 'connecting') {
    return (
      <div className="flex h-[var(--tool-vh,100dvh)] min-h-0 flex-col overflow-hidden bg-base text-txt">
        <Bar onBack={backOrHub} title={t('play.title')} sub={formatLabel} />
        <div className="min-h-0 flex-1 overflow-y-auto">
          <BattleConnectionState kind="connecting" message={t('connection.connectingServer')} />
        </div>
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className="flex h-[var(--tool-vh,100dvh)] min-h-0 flex-col overflow-hidden bg-base text-txt">
        <Bar onBack={backOrHub} title={t('play.title')} sub={formatLabel} />
        <div className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto p-4">
          <BsimErrorState code="worker_failed" lead={state.error ?? undefined} actions={
            <div className="flex flex-wrap justify-center gap-2">
              <Button variant="pri" icon="refresh" onClick={rematch}>{t('battle.play.retry')}</Button>
              <Button variant="ghost" onClick={backOrHub}>{t('battle.play.back')}</Button>
            </div>
          } />
        </div>
      </div>
    );
  }

  const endActions: EndAction[] = [
    { id: 'rematch', label: t('battle.end.rematch'), variant: 'pri', icon: 'sword', onClick: rematch },
    // The session wrote the replay under its roomId (`keepReplay`); the detail view loads local replays by that id.
    { id: 'replay', label: t('battle.end.watchReplay'), variant: 'default', icon: 'play', onClick: () => nav.push('replayDetail', { id: roomId, source: 'local' }) },
    { id: 'lobby', label: t('battle.end.backToLobby'), variant: 'ghost', onClick: backOrHub },
  ];

  return (
    <LiveBattle
      state={state} session={session} pov={0} mode="ai" formatLabel={formatLabel} roomLabel={shortRoomId(roomId)}
      onChoice={(choice) => makeChoice(roomId, choice)}
      onForfeit={() => forfeit(roomId)}
      onBack={backOrHub}
      initScene={(el) => initScene(roomId, el)}
      endActions={endActions}
    />
  );
}

export function BsimPlayView() {
  return (
    <Suspense>
      <PlayInner />
    </Suspense>
  );
}
