'use client';

import type { CSSProperties } from 'react';
import { useState, useCallback } from 'react';
import { Icon, IconButton, Button, cn } from '@boffmedia/ui';
import { DkBack } from '@boffmedia/ui/datakit';
import { usePkmnNameLocale, usePkmnNameMode } from '@boffmedia/pkmn-names';
import { useToolT, BATTLESIM_NS } from '../i18n';
import { BxRing, BxScore } from './bx-kit';
import { BSIM_FOCUS } from './bsim-kit';
import type { BSXScore } from '../useBSXLayout';
import type { BattleLayoutKind } from '../lib/battle-layout';
import { useBattleAudioState, useBattleAudioControls } from '../lib/BattleAudioProvider';

/** `labelKey` is a key id under `battlesim.header.modes` — never copy. */
const MODE_META: Record<string, { labelKey: string; tone: string }> = {
  ai: { labelKey: 'ai', tone: 'var(--info)' },
  pvp: { labelKey: 'pvp', tone: 'var(--warn)' },
  showdown: { labelKey: 'showdown', tone: 'var(--accent)' },
  replay: { labelKey: 'replay', tone: 'var(--ok)' },
};

interface BattleHeaderProps {
  mode: 'ai' | 'pvp' | 'showdown' | 'replay';
  /** Omitted by the embedded replay player, which has no tool to go back to. */
  onBack?: () => void;
  roomLabel?: string;
  formatLabel?: string;
  you?: BSXScore | null;
  foe?: BSXScore | null;
  turn: number;
  /** Remaining seconds per side — rings render only when provided. */
  timerYou?: number | null;
  timerFoe?: number | null;
  timerMax?: number;
  spectatorCount?: number;
  layout: BattleLayoutKind;
  /** Tablet: the log/chat drawer toggle. */
  onToggleRail?: () => void;
  railOpen?: boolean;
  railUnread?: number;
  /**
   * Desktop fullscreen: collapse the log rail so the field takes the screen.
   * Passed only where hiding the rail actually buys the field something — the
   * tablet and mobile rails already float over it, so they get `onToggleRail`.
   */
  onToggleLog?: () => void;
  logHidden?: boolean;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  showForfeit?: boolean;
  onForfeit?: () => void;
}

function MiniScore({ score, foe, right }: { score: BSXScore; foe?: boolean; right?: boolean }) {
  const t = useToolT(BATTLESIM_NS);
  return (
    <span className={cn('flex items-center gap-[0.375rem]', right && 'flex-row-reverse')} title={score.name}>
      <b className={cn('grid h-7 w-7 flex-none place-items-center border border-solid font-display text-[0.6875rem] font-extrabold leading-none', foe ? 'border-[color-mix(in_srgb,var(--bad)_45%,transparent)] bg-bad-soft text-bad' : 'border-accent-line bg-accent-soft text-accent-bright')}>{score.av}</b>
      <span className="flex gap-[3px]">
        {score.team.map((m, i) => <i key={i} aria-hidden className={cn('h-[0.375rem] w-[0.375rem] [clip-path:polygon(50%_0,100%_50%,50%_100%,0_50%)]', m.fnt ? 'bg-line-2' : (m.hp ?? 100) < 35 ? 'bg-warn' : 'bg-ok')} />)}
      </span>
      <span className="sr-only">{foe ? t('battle.foe') : t('battle.you')} {score.name}: {t('battle.score.alive', { alive: score.alive, total: score.total })}</span>
    </span>
  );
}

/**
 * Audio control button in the battle header.
 *
 * Toggles mute and acts as the autoplay unlock trigger (requires user gesture).
 * Shows a speaker icon when unmuted, a muted speaker icon when muted.
 */
function AudioControlButton() {
  const t = useToolT(BATTLESIM_NS);
  const audioState = useBattleAudioState();
  const { setMuted, unlockAutoplay } = useBattleAudioControls();

  const handleClick = useCallback(async () => {
    // Unlock autoplay on any click (required by browser)
    if (!audioState.autoplayUnlocked) {
      await unlockAutoplay();
    }
    // Toggle mute
    setMuted(!audioState.muted);
  }, [audioState.muted, audioState.autoplayUnlocked, setMuted, unlockAutoplay]);

  const iconName = audioState.muted ? 'mute' : 'volume';
  const label = audioState.muted ? t('audio.unmute') : t('audio.mute');

  return (
    <IconButton
      name={iconName}
      label={label}
      variant="ghost"
      size="sm"
      onClick={handleClick}
    />
  );
}

/**
 * The one 58px bar over the battle: back, mode kicker, format/room, the VS
 * score plates with per-side timers around the turn counter, then the
 * rail/fullscreen/forfeit controls.
 *
 * IT NO LONGER CARRIES TABS. It used to squeeze a strip of battle tabs in
 * beside the score plates — a tab control that only existed once you were
 * already in a battle, and only ever listed local AI battles. `BsimTabBar` is
 * that control now, above every screen; stacking the two would have put one
 * tab bar directly on top of another.
 */
/**
 * Safely renders the audio control button if the context is available.
 *
 * Some battle contexts don't have audio (replays in modals, embedded players),
 * so this wrapper prevents errors when the provider isn't mounted.
 */
function SafeAudioControl() {
  try {
    useBattleAudioState();
    return <AudioControlButton />;
  } catch {
    // Context not available; skip audio control
    return null;
  }
}

/**
 * Flip the language of MOVE, ABILITY AND ITEM names without leaving the battle.
 *
 * The full three-way setting (auto · es · en) lives in the hub, but mid-battle
 * the only thing anyone wants is the flip itself — you are reading a move you
 * do not recognise and you want the other name for it, now, without walking out
 * of the room to a settings panel. So this shows the language currently in
 * effect and switches to the other one, which also pins the choice: an explicit
 * pick outranks `auto`, exactly as picking one in the hub does.
 */
function NamesToggle() {
  const t = useToolT(BATTLESIM_NS);
  const locale = usePkmnNameLocale();
  const [, setMode] = usePkmnNameMode();
  const other = locale === 'es' ? 'en' : 'es';
  return (
    <button
      type="button"
      onClick={() => setMode(other)}
      aria-label={t('app.lobby.names.label')}
      title={`${t('app.lobby.names.label')}: ${t(`app.lobby.names.${locale}`)}`}
      className={cn(
        BSIM_FOCUS,
        'flex h-8 flex-none items-center gap-[0.3125rem] border border-solid border-line-2 bg-base px-2 font-mono text-[0.625rem] font-bold uppercase leading-none tracking-[0.08em] text-txt-muted transition-colors duration-[140ms] hover:border-accent-line hover:text-txt',
      )}
    >
      <Icon name="globe" size={13} />
      {locale.toUpperCase()}
    </button>
  );
}

export function BattleHeader({
  mode, onBack, roomLabel, formatLabel, you, foe, turn, timerYou, timerFoe, timerMax = 60,
  spectatorCount, layout, onToggleRail, railOpen, railUnread = 0, onToggleLog, logHidden = false,
  isFullscreen, onToggleFullscreen, showForfeit, onForfeit,
}: BattleHeaderProps) {
  const t = useToolT(BATTLESIM_NS);
  const meta = MODE_META[mode];
  const mobile = layout === 'mobile';
  const desktop = layout === 'desktop';

  return (
    <header
      aria-label={t('header.aria')}
      className="flex min-h-[var(--tool-bar-h,3.625rem)] shrink-0 items-center gap-2 border-b border-solid border-line bg-panel px-2 sm:gap-3 sm:px-3"
    >
      {onBack && <DkBack onClick={onBack} label={t('battle.header.back')} />}
      <span
        style={{ ['--tyc']: meta.tone } as CSSProperties}
        className="cut cut-edge-slant [--cut:3px] flex-none border border-solid border-[color-mix(in_srgb,var(--tyc)_45%,transparent)] [--cut-line:color-mix(in_srgb,var(--tyc)_45%,transparent)] bg-[color-mix(in_srgb,var(--tyc)_14%,transparent)] px-2 py-1 font-mono text-[0.625rem] font-bold uppercase leading-none tracking-[0.12em] text-[var(--tyc)]"
      >
        {t(`header.modes.${meta.labelKey}`)}
      </span>
      {desktop && (formatLabel || roomLabel) && (
        <span className="flex min-w-0 items-center gap-2">
          {formatLabel && <span className="truncate font-mono text-[0.625rem] uppercase tracking-[0.06em] text-txt-dim">{formatLabel}</span>}
          {roomLabel && <span className="max-w-[14ch] truncate border border-solid border-line-2 bg-base px-2 py-1 font-mono text-[0.625rem] leading-none text-txt-muted" title={roomLabel}>{roomLabel}</span>}
        </span>
      )}

      <span className="min-w-0 flex-1" />

      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        {you && (!desktop ? <MiniScore score={you} /> : <BxScore name={you.name} av={you.av} team={you.team} tag={t('battle.you')} />)}
        {timerYou != null && <BxRing sec={timerYou} max={timerMax} size={mobile ? 30 : 36} label={t('battle.header.timerYou', { sec: timerYou })} />}
        <span className="cut cut-edge-slant [--cut:3px] [--cut-line:var(--line-2)] flex-none border border-solid border-line-2 bg-base px-2 py-[0.375rem] font-mono text-[0.6875rem] font-bold uppercase leading-none tracking-[0.08em] text-txt" aria-label={t('battle.turn', { turn })}>
          {mobile ? t('battle.turnShort', { turn }) : t('battle.turn', { turn })}
        </span>
        {timerFoe != null && <BxRing sec={timerFoe} max={timerMax} size={mobile ? 30 : 36} label={t('battle.header.timerFoe', { sec: timerFoe })} />}
        {foe && (!desktop ? <MiniScore score={foe} foe right /> : <BxScore name={foe.name} av={foe.av} team={foe.team} tag={t('battle.foe')} right foe />)}
      </div>

      <span className="min-w-0 flex-1" />

      <div className="flex flex-none items-center gap-1 sm:gap-2">
        {spectatorCount != null && spectatorCount > 0 && !mobile && (
          <span className="inline-flex items-center gap-1 whitespace-nowrap border border-solid border-line-2 bg-base px-2 py-1 font-mono text-[0.625rem] leading-none text-txt-muted" title={t('battle.header.spectators', { count: spectatorCount })}>
            <Icon name="eye" size={12} />{spectatorCount}
          </span>
        )}
        {onToggleRail && layout === 'tablet' && (
          <span className="relative">
            <IconButton name="list" label={t('battle.header.openLog')} variant={railOpen ? 'default' : 'ghost'} size="sm" aria-pressed={railOpen} onClick={onToggleRail} />
            {railUnread > 0 && !railOpen && (
              <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center bg-accent px-1 font-mono text-[0.5625rem] font-bold leading-none text-accent-ink" aria-label={t('battle.rail.unread', { count: railUnread })}>{railUnread}</span>
            )}
          </span>
        )}
        {onToggleLog && desktop && (
          <span className="relative">
            <IconButton
              name="list"
              label={logHidden ? t('battle.header.openLog') : t('battle.header.hideLog')}
              variant={logHidden ? 'ghost' : 'default'}
              size="sm"
              aria-pressed={!logHidden}
              onClick={onToggleLog}
            />
            {railUnread > 0 && logHidden && (
              <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center bg-accent px-1 font-mono text-[0.5625rem] font-bold leading-none text-accent-ink" aria-label={t('battle.rail.unread', { count: railUnread })}>{railUnread}</span>
            )}
          </span>
        )}
        <NamesToggle />
        <SafeAudioControl />
        {onToggleFullscreen && (
          <IconButton name={isFullscreen ? 'exitFullscreen' : 'fullscreen'} label={isFullscreen ? t('header.exitFullscreen') : t('header.fullscreen')} variant="ghost" size="sm" onClick={onToggleFullscreen} />
        )}
        {showForfeit && onForfeit && (
          mobile
            ? <IconButton name="skull" label={t('header.forfeit')} variant="danger" size="sm" onClick={onForfeit} />
            : <Button variant="danger" size="sm" onClick={onForfeit}>{t('header.forfeit')}</Button>
        )}
      </div>
    </header>
  );
}
