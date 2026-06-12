'use client';

import { useTranslations } from 'next-intl';

import { useMemo, useState, useEffect, useCallback } from 'react';
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

  // Doubles: track which Pokemon we're choosing for and target selection
  const [doublesPhase, setDoublesPhase] = useState<0 | 1>(0);
  const [targetPhase, setTargetPhase] = useState(false);
  const [pendingMove, setPendingMove] = useState<string | null>(null);
  const [firstChoice, setFirstChoice] = useState<string | null>(null);

  // Reset doubles state when a new request arrives
  useEffect(() => {
    setDoublesPhase(0);
    setTargetPhase(false);
    setPendingMove(null);
    setFirstChoice(null);
  }, [bsx.isDoubles, bsx.requestType, bsx.turnText]);

  // In doubles phase 1, use second Pokemon's moves
  const activeMoves = bsx.isDoubles && doublesPhase === 1 ? bsx.bsxMoves2 : bsx.bsxMoves;

  // Handler for move selection in doubles: store move and enter target phase
  const handleDoublesMoveSelect = useCallback((slot: number) => {
    const mech = activeMechanic;
    const mechSuffix = mech ? ` ${mech}` : '';
    setPendingMove(`move ${slot}${mechSuffix}`);
    setActiveMechanic(null);
    setTargetPhase(true);
  }, [activeMechanic, setActiveMechanic]);

  // Handler for target selection in doubles: combine move+target and finalize
  const handleDoublesTargetSelect = useCallback((target: number) => {
    const moveWithTarget = `${pendingMove} ${target}`;
    if (doublesPhase === 0) {
      setFirstChoice(moveWithTarget);
      setPendingMove(null);
      setTargetPhase(false);
      setDoublesPhase(1);
    } else {
      const combined = `${firstChoice}, ${moveWithTarget}`;
      onChoice(combined);
    }
  }, [pendingMove, firstChoice, doublesPhase, onChoice]);

  const hotkeyMoves = useMemo(
    () => {
      if (!inMovePhase || targetPhase) return [];
      if (bsx.isDoubles) {
        return activeMoves.map((m, i) => ({ onClick: () => handleDoublesMoveSelect(i + 1), disabled: m.pp <= 0 }));
      }
      return activeMoves.map((m, i) => ({ onClick: () => onMoveChoice(i + 1), disabled: m.pp <= 0 }));
    },
    [inMovePhase, activeMoves, onMoveChoice, bsx.isDoubles, targetPhase, handleDoublesMoveSelect],
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
    const isDoublesPhase1 = bsx.isDoubles && doublesPhase === 1;
    const currentMoves = activeMoves as BSXKeyMove[];
    const currentMonName = isDoublesPhase1 ? bsx.bsxAlly2?.name : bsx.bsxAlly?.name;

    // Doubles: target selection UI
    if (bsx.isDoubles && targetPhase) {
      const foe1 = bsx.bsxFoe;
      const foe2 = bsx.bsxFoe2;
      const allyMon = isDoublesPhase1 ? bsx.bsxAlly : bsx.bsxAlly2;

      content = (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span
              className="font-mono text-t-4xs tracking-[.1em] uppercase px-2 py-0.5 rounded-[var(--radius-sm)]"
              style={{ background: 'color-mix(in srgb, var(--accent) 15%, transparent)', color: 'var(--accent)', border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)' }}
            >
              {isDoublesPhase1 ? `2. ${bsx.bsxAlly2?.name ?? 'P2'}` : `1. ${bsx.bsxAlly?.name ?? 'P1'}`} — {t('dock.selectTarget')}
            </span>
            <button
              onClick={() => { setTargetPhase(false); setPendingMove(null); }}
              className="font-mono text-t-4xs tracking-[.08em] uppercase px-2 py-0.5 rounded-[var(--radius-sm)] cursor-pointer transition-colors"
              style={{ background: 'var(--surface-2)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
            >
              ← {t('dock.back')}
            </button>
          </div>
          <div className="flex gap-2 flex-wrap">
            {/* Foe targets: slot 1 and slot 2 */}
            <button
              onClick={() => handleDoublesTargetSelect(1)}
              className="bsx-focus flex items-center gap-2 px-4 py-2 rounded-[var(--radius)] font-medium text-t-sm cursor-pointer transition-all"
              style={{ background: 'color-mix(in srgb, var(--rose-400) 12%, var(--surface-2))', border: '1px solid color-mix(in srgb, var(--rose-400) 35%, var(--border))', color: 'var(--text)' }}
            >
              <span className="font-mono text-t-4xs opacity-60">1</span>
              {foe1?.name ?? 'Foe 1'}
            </button>
            <button
              onClick={() => handleDoublesTargetSelect(2)}
              className="bsx-focus flex items-center gap-2 px-4 py-2 rounded-[var(--radius)] font-medium text-t-sm cursor-pointer transition-all"
              style={{ background: 'color-mix(in srgb, var(--rose-400) 12%, var(--surface-2))', border: '1px solid color-mix(in srgb, var(--rose-400) 35%, var(--border))', color: 'var(--text)' }}
            >
              <span className="font-mono text-t-4xs opacity-60">2</span>
              {foe2?.name ?? 'Foe 2'}
            </button>
            {/* Ally target */}
            {allyMon && (
              <button
                onClick={() => handleDoublesTargetSelect(isDoublesPhase1 ? -1 : -2)}
                className="bsx-focus flex items-center gap-2 px-4 py-2 rounded-[var(--radius)] font-medium text-t-sm cursor-pointer transition-all"
                style={{ background: 'color-mix(in srgb, var(--emerald-400) 12%, var(--surface-2))', border: '1px solid color-mix(in srgb, var(--emerald-400) 35%, var(--border))', color: 'var(--text)' }}
              >
                <span className="font-mono text-t-4xs opacity-60">{isDoublesPhase1 ? '3' : '4'}</span>
                {allyMon.name}
              </button>
            )}
          </div>
        </div>
      );
    } else {
      const handleMoveChoose = (i: number) => {
        if (bsx.isDoubles) {
          handleDoublesMoveSelect(i);
        } else {
          onMoveChoice(i);
        }
      };

      content = (
        <div className="flex flex-col gap-3">
          {bsx.isDoubles && (
            <div className="flex items-center gap-2">
              <span
                className="font-mono text-t-4xs tracking-[.1em] uppercase px-2 py-0.5 rounded-[var(--radius-sm)]"
                style={{ background: 'color-mix(in srgb, var(--accent) 15%, transparent)', color: 'var(--accent)', border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)' }}
              >
                {isDoublesPhase1 ? `2. ${bsx.bsxAlly2?.name ?? 'P2'}` : `1. ${bsx.bsxAlly?.name ?? 'P1'}`}
              </span>
              {isDoublesPhase1 && (
                <button
                  onClick={() => { setDoublesPhase(0); setFirstChoice(null); }}
                  className="font-mono text-t-4xs tracking-[.08em] uppercase px-2 py-0.5 rounded-[var(--radius-sm)] cursor-pointer transition-colors"
                  style={{ background: 'var(--surface-2)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
                >
                  ← {t('dock.back')}
                </button>
              )}
            </div>
          )}
          {activeMechanic && (
            <BSXPlanChip
              tag="★"
              action={{ kind: 'move', move: { name: MECHANIC_LABELS[activeMechanic] ?? activeMechanic, type: 'Normal' } }}
              onClear={() => setActiveMechanic(null)}
            />
          )}
          <MovePanel
            moves={currentMoves}
            foe={bsx.bsxFoe ? { types: bsx.bsxFoe.types, tera: bsx.bsxFoe.tera, teraType: bsx.bsxFoe.teraType } : undefined}
            onChooseMove={handleMoveChoose}
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
    }
  } else if (isWaiting && bsx.requestType === 'switch') {
    content = <SwitchPanel bench={bsx.bsxBench} onSwitch={(i) => onChoice(`switch ${i}`)} label={t('dock.forcedSwitch')} />;
  } else if (isWaiting && bsx.requestType === 'team') {
    content = (
      <div className="flex flex-col gap-2">
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{t('dock.teamPreview')}</p>
        <button
          onClick={() => onChoice('team 1')}
          className="bsx-focus self-start px-4 py-2 rounded-md text-sm font-medium transition-colors"
          style={{ background: 'var(--accent)', color: 'var(--text)', border: '1px solid var(--border)' }}
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
              background: 'var(--surface-3)',
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
      className="rounded-[var(--radius)] border border-[var(--border)] p-3 min-h-[96px]"
      style={{ background: 'var(--card-bg)' }}
    >
      <div key={phase} className="bsx-dock-in">
        {content}
      </div>
    </section>
  );
}
