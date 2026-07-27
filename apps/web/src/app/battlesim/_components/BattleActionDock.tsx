'use client';

import { useTranslations } from 'next-intl';

import { useMemo } from 'react';
import { BxType } from '@/app/(boffmedia)/(herramientas)/pokemon/battlesim/_components/ui/bx-kit';
import { MovePanel } from './MovePanel';
import { SwitchPanel } from './SwitchPanel';
import { MechanicToggles } from './MechanicToggles';
import { useBattleHotkeys } from '../_hooks/useBattleHotkeys';
import type { ActiveMechanic } from '../_hooks/useChoiceMechanics';
import type { BSXLayout } from '../_hooks/useBSXLayout';
import type { BSXKeyMove } from '../_utils/toBSXMon';



interface BattleActionDockProps {
  bsx: BSXLayout;
  status: string;
  isWaiting: boolean;
  htmlLog: string[];
  /** Raw choice sender (switch / team). */
  onChoice: (choice: string) => void;
  /** Mechanic-aware move sender. */
  onMoveChoice: (slot: number) => void;
  activeMechanic: ActiveMechanic;
  setActiveMechanic: (m: ActiveMechanic) => void;
  /** Extra label for the bench panel (e.g. trapped notice). */
  switchLabel?: string;
  /** Targeting feedback: hovered damaging move index, or null. */
  onAimMove?: (index: number | null) => void;
  /** Undo the submitted choice (PvP/Showdown — only before the turn resolves). */
  onUndo?: () => void;
}

/**
 * Bottom action dock: one stable region for moves, switches, team preview
 * and the waiting state — no layout shift between request phases.
 */
export function BattleActionDock({
  bsx,
  status,
  isWaiting,
  htmlLog,
  onChoice,
  onMoveChoice,
  activeMechanic,
  setActiveMechanic,
  switchLabel,
  onAimMove,
  onUndo,
}: BattleActionDockProps) {
  const t = useTranslations('battlesim');
  const inMovePhase = isWaiting && bsx.requestType === 'move';
  const inSwitchPhase = isWaiting && bsx.requestType === 'switch';

  const hotkeyMoves = useMemo(
    () => (inMovePhase ? bsx.bsxMoves.map((m, i) => ({ onClick: () => onMoveChoice(i + 1), disabled: m.pp <= 0 })) : []),
    [inMovePhase, bsx.bsxMoves, onMoveChoice],
  );
  const hotkeySwitches = useMemo(
    () => ((inMovePhase || inSwitchPhase) ? bsx.bsxBench.map((mon, i) => ({ onClick: () => onChoice(`switch ${i + 1}`), disabled: !!mon.fnt })) : []),
    [inMovePhase, inSwitchPhase, bsx.bsxBench, onChoice],
  );
  const hotkeyMechanics = useMemo(() => {
    if (!inMovePhase) return [];
    const list: Array<{ key: string; toggle: () => void }> = [];
    const toggle = (m: ActiveMechanic) => () => setActiveMechanic(activeMechanic === m ? null : m);
    if (bsx.mechCanTera) list.push({ key: 't', toggle: toggle('terastallize') });
    if (bsx.mechCanMega) list.push({ key: 'm', toggle: toggle('mega') });
    if (bsx.mechCanDyna) list.push({ key: 'd', toggle: toggle('dynamax') });
    if (bsx.mechZMoves) list.push({ key: 'z', toggle: toggle('zmove') });
    return list;
  }, [inMovePhase, bsx.mechCanTera, bsx.mechCanMega, bsx.mechCanDyna, bsx.mechZMoves, activeMechanic, setActiveMechanic]);

  useBattleHotkeys({
    moves: hotkeyMoves,
    switches: hotkeySwitches,
    switchKeyOffset: inMovePhase ? 4 : 0,
    mechanics: hotkeyMechanics,
    onEscape: activeMechanic ? () => setActiveMechanic(null) : undefined,
    enabled: status === 'active' && isWaiting,
  });

  if (status !== 'active') return null;

  let content: React.ReactNode;

  if (isWaiting && bsx.requestType === 'move') {
    content = (
      <div className="flex flex-col gap-3">
        {activeMechanic && (
          <span
            className="inline-flex w-fit items-center gap-2 border border-accent-line bg-accent-soft px-[10px] py-[6px] font-mono text-[10.5px] font-semibold uppercase leading-none tracking-[0.06em] text-accent-bright"
            style={{ clipPath: 'polygon(4px 0,100% 0,calc(100% - 4px) 100%,0 100%)' }}
          >
            <span aria-hidden>★</span>
            {t(`dock.mechanics.${activeMechanic}`)}
            <button
              type="button"
              onClick={() => setActiveMechanic(null)}
              aria-label={t('dock.undo')}
              className="ml-1 text-txt-muted transition-colors hover:text-txt focus-visible:outline-none"
            >
              ✕
            </button>
          </span>
        )}
        <MovePanel
          moves={bsx.bsxMoves as BSXKeyMove[]}
          foe={bsx.bsxFoe}
          onChooseMove={(i) => onMoveChoice(i)}
          onAimMove={onAimMove}
          teraArmed={activeMechanic === 'terastallize'}
        />
        <div className="flex flex-wrap items-start gap-3">
          <MechanicToggles
            bsx={bsx}
            activeMechanic={activeMechanic}
            setActiveMechanic={setActiveMechanic}
            htmlLog={htmlLog}
          />
        </div>
        {bsx.bsxBench.length > 0 && (
          <SwitchPanel
            bench={bsx.bsxBench}
            onSwitch={(i) => onChoice(`switch ${i}`)}
            label={switchLabel ?? t('dock.switch')}
            hotkeyOffset={4}
          />
        )}
      </div>
    );
  } else if (isWaiting && bsx.requestType === 'switch') {
    content = <SwitchPanel bench={bsx.bsxBench} onSwitch={(i) => onChoice(`switch ${i}`)} label={t('dock.forcedSwitch')} />;
  } else if (isWaiting && bsx.requestType === 'team') {
    content = (
      <div className="flex flex-col gap-2">
        <p className="text-sm text-txt-muted">{t('dock.teamPreview')}</p>
        <button
          type="button"
          onClick={() => onChoice('team 1')}
          style={{ clipPath: 'polygon(4px 0,100% 0,calc(100% - 4px) 100%,0 100%)' }}
          className="self-start bg-accent px-4 py-2 font-display text-[13px] font-bold uppercase leading-none tracking-[0.04em] text-accent-ink transition-[filter] hover:brightness-110 focus-visible:outline-none"
        >
          {t('dock.confirmTeam')}
        </button>
      </div>
    );
  } else {
    content = (
      <div className="flex h-full min-h-[64px] items-center justify-center gap-4">
        <span className="animate-[bm-pulse_1.4s_ease-in-out_infinite] font-mono text-[11px] uppercase tracking-[0.1em] text-txt-dim motion-reduce:animate-none" role="status">
          {t('dock.waitingOpponent')}
        </span>
        {onUndo && (
          <button
            type="button"
            onClick={onUndo}
            title={t('dock.undoHint')}
            className="border border-line-2 bg-panel px-4 py-1.5 font-mono text-[11px] font-semibold uppercase leading-none tracking-[0.06em] text-txt-muted transition-colors hover:border-accent-line hover:text-txt focus-visible:outline-none"
          >
            ↩ {t('dock.undo')}
          </button>
        )}
      </div>
    );
  }

  const phase = isWaiting ? bsx.requestType ?? 'waiting' : 'waiting';

  return (
    <section
      aria-label={t('dock.aria')}
      style={{ clipPath: 'polygon(0 0,100% 0,100% calc(100% - 14px),calc(100% - 14px) 100%,0 100%)' }}
      className="min-h-[96px] border border-solid border-line bg-[color-mix(in_srgb,var(--panel)_88%,transparent)] p-3 backdrop-blur-[4px]"
    >
      <div key={phase} className="animate-[bm-menu-in_200ms_ease_both] motion-reduce:animate-none">
        {content}
      </div>
    </section>
  );
}
