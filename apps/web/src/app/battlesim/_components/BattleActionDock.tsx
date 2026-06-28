'use client';

import { useTranslations } from 'next-intl';

import { useMemo } from 'react';
import { BSXPlanChip } from '@/components/boffmedia/primitives';
import { MovePanel } from './MovePanel';
import { SwitchPanel } from './SwitchPanel';
import { MechanicToggles } from './MechanicToggles';
import { useBattleHotkeys } from '../_hooks/useBattleHotkeys';
import type { ActiveMechanic } from '../_hooks/useChoiceMechanics';
import type { BSXLayout } from '../_hooks/useBSXLayout';
import type { BSXKeyMove } from '../_utils/toBSXMon';

const MECHANIC_LABELS: Record<string, string> = {
  terastallize: 'Teracristalización',
  mega: 'Mega Evolución',
  dynamax: 'Dynamax',
  zmove: 'Movimiento Z',
};

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
          <BSXPlanChip
            tag="★"
            action={{ kind: 'move', move: { name: MECHANIC_LABELS[activeMechanic] ?? activeMechanic, type: 'Normal' } }}
            onClear={() => setActiveMechanic(null)}
          />
        )}
        <MovePanel
          moves={bsx.bsxMoves as BSXKeyMove[]}
          foe={bsx.bsxFoe ? { types: bsx.bsxFoe.types, tera: bsx.bsxFoe.tera, teraType: bsx.bsxFoe.teraType } : undefined}
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
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{t('dock.teamPreview')}</p>
        <button
          onClick={() => onChoice('team 1')}
          className="bsx-focus self-start px-4 py-2 rounded-md text-sm font-medium transition-colors"
          style={{ background: 'var(--secondary)', color: 'var(--text)', border: '1px solid var(--border)' }}
        >
          {t('dock.confirmTeam')}
        </button>
      </div>
    );
  } else {
    content = (
      <div className="flex items-center justify-center gap-4 h-full min-h-[64px]">
        <span
          className="text-sm animate-pulse"
          role="status"
          style={{ color: 'var(--text-dim)' }}
        >
          {t('dock.waitingOpponent')}
        </span>
        {onUndo && (
          <button
            onClick={onUndo}
            className="bsx-focus px-4 py-1.5 rounded-[var(--radius-sm)] text-sm font-medium transition-colors duration-[var(--dur-fast)]"
            style={{
              background: 'var(--layer-3)',
              color: 'var(--text-muted)',
              border: '1px solid var(--border-strong)',
            }}
            title={t('dock.undoHint')}
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
      aria-label="Acciones de combate"
      className="rounded-[var(--radius)] border border-edge p-3 min-h-[96px]"
      style={{ background: 'var(--card-bg)' }}
    >
      <div key={phase} className="bsx-dock-in">
        {content}
      </div>
    </section>
  );
}
