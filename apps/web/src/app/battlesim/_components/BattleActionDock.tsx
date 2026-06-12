'use client';

import { useTranslations } from 'next-intl';

import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { BSXPlanChip } from '@/components/boffmedia/primitives';
import { MovePanel } from './MovePanel';
import { SwitchPanel } from './SwitchPanel';
import { MechanicToggles } from './MechanicToggles';
import { useBattleHotkeys } from '../_hooks/useBattleHotkeys';
import type { ActiveMechanic } from '../_hooks/useChoiceMechanics';
import type { BSXLayout } from '../_hooks/useBSXLayout';
import type { BSXKeyMove } from '../_utils/toBSXMon';
import type { BSXMon } from '@/components/boffmedia/primitives';

// PS move target types that don't need explicit target selection in doubles/triples.
// Spread moves, field effects, and self-targeting moves resolve automatically.
const NO_TARGET_NEEDED = new Set([
  'self', 'allAdjacentFoes', 'allAdjacent', 'allySide', 'foeSide',
  'all', 'allyTeam', 'allies', 'randomNormal', 'scripted',
]);

const MECHANIC_LABELS: Record<string, string> = {
  terastallize: 'Teracristalización',
  mega: 'Mega Evolución',
  dynamax: 'Dynamax',
  zmove: 'Movimiento Z',
};

// Foe adjacency in triples per attacker phase.
// Phase 0 = left edge (P1a): adjacent to foes at target=2 and target=3.
// Phase 1 = center (P1b): adjacent to all foes.
// Phase 2 = right edge (P1c): adjacent to foes at target=1 and target=2.
function isTripleFoeAdjacent(phase: number, foeTarget: 1 | 2 | 3): boolean {
  if (phase === 0) return foeTarget === 2 || foeTarget === 3;
  if (phase === 1) return true;
  return foeTarget === 1 || foeTarget === 2; // phase 2
}

// Returns the PS target loc for clicking an ally in doubles/triples.
// Phase 0 (P1a choosing): adjacent ally = P1b → -2
// Phase 1 (P1b choosing): adjacent allies = P1a → -1 (and P1c → -3 in triples)
// Phase 2 (P1c choosing): adjacent ally = P1b → -2
function allyTargetLoc(phase: number, allySlot: 1 | 2 | 3): number {
  // allySlot 1 = P1a (target -1), 2 = P1b (target -2), 3 = P1c (target -3)
  return -allySlot;
}

// Whether a given ally slot is adjacent to the current attacker in doubles/triples.
// Doubles: P1a (phase 0) can target P1b (-2); P1b (phase 1) can target P1a (-1).
// Triples: same as foe adjacency but for negative positions.
function isAllyAdjacent(isTriple: boolean, phase: number, allySlot: 1 | 2 | 3): boolean {
  const attackerPos = phase + 1; // phase 0 → pos 1, phase 1 → pos 2, phase 2 → pos 3
  const allyPos = allySlot;
  if (attackerPos === allyPos) return false; // can't target self here (handled by adjacentAllyOrSelf)
  if (!isTriple) return Math.abs(allyPos - attackerPos) === 1;
  return Math.abs(allyPos - attackerPos) === 1;
}

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

  // Multi-phase tracking for doubles (0|1) and triples (0|1|2).
  const [multiPhase, setMultiPhase] = useState(0);
  const [targetPhase, setTargetPhase] = useState(false);
  const [pendingSlot, setPendingSlot] = useState<number | null>(null);
  const [pendingMechanic, setPendingMechanic] = useState<string | null>(null);
  const [pendingMoveTarget, setPendingMoveTarget] = useState<string | null>(null);
  // Accumulated choices for the current turn (one entry per completed phase).
  const [pendingChoices, setPendingChoices] = useState<string[]>([]);

  const maxPhase = bsx.isTriple ? 2 : bsx.isDoubles ? 1 : 0;

  // Reset state on every new request (isWaiting transitions false→true).
  const prevIsWaiting = useRef(false);
  useEffect(() => {
    if (isWaiting && !prevIsWaiting.current) {
      setMultiPhase(0);
      setTargetPhase(false);
      setPendingSlot(null);
      setPendingMechanic(null);
      setPendingMoveTarget(null);
      setPendingChoices([]);
    }
    prevIsWaiting.current = isWaiting;
  }, [isWaiting]);

  // Pick the active move list for the current phase.
  const activeMoves = useMemo(() => {
    if (multiPhase === 2) return bsx.bsxMoves3;
    if (multiPhase === 1) return bsx.bsxMoves2;
    return bsx.bsxMoves;
  }, [bsx, multiPhase]);

  // Per-phase mechanic flags.
  const phaseBsx = useMemo(() => {
    if (!bsx.isDoubles) return bsx;
    if (multiPhase === 2) return {
      ...bsx,
      mechCanTera: bsx.mechCanTera3, mechCanMega: bsx.mechCanMega3,
      mechCanDyna: bsx.mechCanDyna3, mechZMoves: bsx.mechZMoves3, mechTeraType: bsx.mechTeraType3,
    };
    if (multiPhase === 1) return {
      ...bsx,
      mechCanTera: bsx.mechCanTera2, mechCanMega: bsx.mechCanMega2,
      mechCanDyna: bsx.mechCanDyna2, mechZMoves: bsx.mechZMoves2, mechTeraType: bsx.mechTeraType2,
    };
    return bsx;
  }, [bsx, multiPhase]);

  // Commit a single choice for the current phase; advance or submit.
  const commitChoice = useCallback((choice: string) => {
    if (multiPhase < maxPhase) {
      setPendingChoices(prev => [...prev, choice]);
      setMultiPhase(prev => prev + 1);
    } else {
      const all = [...pendingChoices, choice];
      onChoice(all.join(', '));
    }
  }, [multiPhase, maxPhase, pendingChoices, onChoice]);

  // Move handler for multi (doubles/triples).
  const handleMultiMoveSelect = useCallback((slot: number, move: BSXKeyMove) => {
    const mech = activeMechanic;
    setActiveMechanic(null);

    const needsTarget = !NO_TARGET_NEEDED.has(move.target ?? 'normal');
    if (!needsTarget) {
      const choice = mech ? `move ${slot} ${mech}` : `move ${slot}`;
      commitChoice(choice);
    } else {
      setPendingSlot(slot);
      setPendingMechanic(mech);
      setPendingMoveTarget(move.target ?? null);
      setTargetPhase(true);
    }
  }, [activeMechanic, setActiveMechanic, commitChoice]);

  // Target selection handler: PS order is move SLOT TARGET MECHANIC.
  const handleMultiTargetSelect = useCallback((target: number) => {
    if (pendingSlot === null) return;
    const choice = pendingMechanic
      ? `move ${pendingSlot} ${target} ${pendingMechanic}`
      : `move ${pendingSlot} ${target}`;
    setTargetPhase(false);
    setPendingSlot(null);
    setPendingMechanic(null);
    setPendingMoveTarget(null);
    commitChoice(choice);
  }, [pendingSlot, pendingMechanic, commitChoice]);

  // Switch handler for multi.
  const handleMultiSwitchSelect = useCallback((psIndex: number) => {
    commitChoice(`switch ${psIndex}`);
  }, [commitChoice]);

  // Shift handler (triples edge slots only).
  const handleTripleShift = useCallback(() => {
    commitChoice('shift');
  }, [commitChoice]);

  // Go back one phase.
  const handleBack = useCallback(() => {
    if (targetPhase) {
      setTargetPhase(false);
      setPendingSlot(null);
      setPendingMechanic(null);
      setPendingMoveTarget(null);
    } else if (multiPhase > 0) {
      setPendingChoices(prev => prev.slice(0, -1));
      setMultiPhase(prev => prev - 1);
    }
  }, [targetPhase, multiPhase]);

  const hotkeyMoves = useMemo(
    () => {
      if (!inMovePhase || targetPhase) return [];
      if (bsx.isDoubles) {
        return activeMoves.map((m, i) => ({ onClick: () => handleMultiMoveSelect(i + 1, m), disabled: m.pp <= 0 }));
      }
      return activeMoves.map((m, i) => ({ onClick: () => onMoveChoice(i + 1), disabled: m.pp <= 0 }));
    },
    [inMovePhase, activeMoves, onMoveChoice, bsx.isDoubles, targetPhase, handleMultiMoveSelect],
  );
  const hotkeySwitches = useMemo(
    () => ((inMovePhase || inSwitchPhase) ? bsx.bsxBench.map((mon, i) => ({
      onClick: () => {
        const psIdx = bsx.bsxBenchSwitchIndices[i];
        if (bsx.isDoubles && inMovePhase) {
          handleMultiSwitchSelect(psIdx);
        } else {
          onChoice(`switch ${psIdx}`);
        }
      },
      disabled: !!mon.fnt,
    })) : []),
    [inMovePhase, inSwitchPhase, bsx.isDoubles, bsx.bsxBench, bsx.bsxBenchSwitchIndices, onChoice, handleMultiSwitchSelect],
  );
  const hotkeyMechanics = useMemo(() => {
    if (!inMovePhase) return [];
    const list: Array<{ key: string; toggle: () => void }> = [];
    const toggle = (m: ActiveMechanic) => () => setActiveMechanic(activeMechanic === m ? null : m);
    if (phaseBsx.mechCanTera) list.push({ key: 't', toggle: toggle('terastallize') });
    if (phaseBsx.mechCanMega) list.push({ key: 'm', toggle: toggle('mega') });
    if (phaseBsx.mechCanDyna) list.push({ key: 'd', toggle: toggle('dynamax') });
    if (phaseBsx.mechZMoves) list.push({ key: 'z', toggle: toggle('zmove') });
    return list;
  }, [inMovePhase, phaseBsx, activeMechanic, setActiveMechanic]);

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
    const currentMoves = activeMoves as BSXKeyMove[];

    // Target selection UI (doubles + triples)
    if (bsx.isDoubles && targetPhase) {
      const foe1 = bsx.bsxFoe;
      const foe2 = bsx.bsxFoe2;
      const foe3 = bsx.bsxFoe3;
      // Which ally can be targeted by the current attacker.
      const attackerSlot = (multiPhase + 1) as 1 | 2 | 3;
      const _allAllySlots: Array<{ mon: BSXMon | null; slot: 1 | 2 | 3 }> = [
        { mon: bsx.bsxAlly, slot: 1 },
        { mon: bsx.bsxAlly2, slot: 2 },
        { mon: bsx.isTriple ? bsx.bsxAlly3 : null, slot: 3 },
      ];
      const allyOptions = _allAllySlots.filter(
        ({ slot }) => slot !== attackerSlot && isAllyAdjacent(bsx.isTriple, multiPhase, slot),
      );

      content = (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span
              className="font-mono text-t-4xs tracking-[.1em] uppercase px-2 py-0.5 rounded-[var(--radius-sm)]"
              style={{ background: 'color-mix(in srgb, var(--accent) 15%, transparent)', color: 'var(--accent)', border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)' }}
            >
              {multiPhase + 1}. {[bsx.bsxAlly?.name, bsx.bsxAlly2?.name, bsx.bsxAlly3?.name][multiPhase] ?? `P${multiPhase + 1}`} — {t('dock.selectTarget')}
            </span>
            <button
              onClick={handleBack}
              className="font-mono text-t-4xs tracking-[.08em] uppercase px-2 py-0.5 rounded-[var(--radius-sm)] cursor-pointer transition-colors"
              style={{ background: 'var(--surface-2)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
            >
              ← {t('dock.back')}
            </button>
          </div>
          <div className="flex gap-2 flex-wrap">
            {/* Foe targets — visual order: target=3 (left), target=2 (center), target=1 (right) */}
            {bsx.isTriple && foe3 && (
              <FoeTargetButton
                mon={foe3}
                target={3}
                disabled={!isTripleFoeAdjacent(multiPhase, 3)}
                onClick={() => handleMultiTargetSelect(3)}
              />
            )}
            {foe2 && (
              <FoeTargetButton
                mon={foe2}
                target={2}
                disabled={bsx.isTriple && !isTripleFoeAdjacent(multiPhase, 2)}
                onClick={() => handleMultiTargetSelect(2)}
              />
            )}
            {foe1 && (
              <FoeTargetButton
                mon={foe1}
                target={1}
                disabled={bsx.isTriple && !isTripleFoeAdjacent(multiPhase, 1)}
                onClick={() => handleMultiTargetSelect(1)}
              />
            )}
            {/* Ally targets */}
            {allyOptions.map(({ mon, slot }) => mon && (
              <AllyTargetButton
                key={slot}
                mon={mon}
                onClick={() => handleMultiTargetSelect(allyTargetLoc(multiPhase, slot))}
              />
            ))}
            {/* Self target (adjacentAllyOrSelf moves) */}
            {pendingMoveTarget === 'adjacentAllyOrSelf' && (() => {
              const selfSlot = multiPhase + 1 as 1 | 2 | 3;
              const selfMon = [bsx.bsxAlly, bsx.bsxAlly2, bsx.bsxAlly3][multiPhase];
              return selfMon ? (
                <AllyTargetButton
                  key="self"
                  mon={selfMon}
                  onClick={() => handleMultiTargetSelect(allyTargetLoc(multiPhase, selfSlot))}
                />
              ) : null;
            })()}
          </div>
        </div>
      );
    } else {
      const handleMoveChoose = (i: number) => {
        if (bsx.isDoubles) {
          handleMultiMoveSelect(i, activeMoves[i - 1]);
        } else {
          onMoveChoice(i);
        }
      };

      const phaseLabel = bsx.isDoubles
        ? `${multiPhase + 1}. ${[bsx.bsxAlly?.name, bsx.bsxAlly2?.name, bsx.bsxAlly3?.name][multiPhase] ?? `P${multiPhase + 1}`}`
        : null;

      content = (
        <div className="flex flex-col gap-3">
          {phaseLabel && (
            <div className="flex items-center gap-2">
              <span
                className="font-mono text-t-4xs tracking-[.1em] uppercase px-2 py-0.5 rounded-[var(--radius-sm)]"
                style={{ background: 'color-mix(in srgb, var(--accent) 15%, transparent)', color: 'var(--accent)', border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)' }}
              >
                {phaseLabel}
              </span>
              {multiPhase > 0 && (
                <button
                  onClick={handleBack}
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
            foe={bsx.bsxFoe ? { types: bsx.bsxFoe.types, tera: !!bsx.bsxFoe.tera, teraType: bsx.bsxFoe.teraType ?? null } : undefined}
            onChooseMove={handleMoveChoose}
            onAimMove={onAimMove}
            teraArmed={activeMechanic === 'terastallize'}
          />
          {/* Shift to center — triples edge slots only */}
          {bsx.isTriple && (multiPhase === 0 || multiPhase === 2) && (
            <button
              onClick={handleTripleShift}
              className="bsx-focus self-start px-3 py-1.5 rounded-[var(--radius-sm)] font-mono text-t-4xs tracking-[.08em] uppercase cursor-pointer transition-all"
              style={{ background: 'color-mix(in srgb, var(--amber-400) 12%, var(--surface-2))', border: '1px solid color-mix(in srgb, var(--amber-400) 35%, var(--border))', color: 'var(--amber-400)' }}
            >
              ⇄ {t('dock.shift')}
            </button>
          )}
          <div className="flex flex-wrap items-start gap-3">
            <MechanicToggles
              bsx={phaseBsx}
              activeMechanic={activeMechanic}
              setActiveMechanic={setActiveMechanic}
              htmlLog={htmlLog}
            />
          </div>
          {bsx.bsxBench.length > 0 && (
            <SwitchPanel
              bench={bsx.bsxBench as any}
              onSwitch={(i) => {
                const psIdx = bsx.bsxBenchSwitchIndices[i - 1];
                if (bsx.isDoubles) handleMultiSwitchSelect(psIdx);
                else onChoice(`switch ${psIdx}`);
              }}
              label={switchLabel ?? t('dock.switch')}
              hotkeyOffset={4}
            />
          )}
        </div>
      );
    }
  } else if (isWaiting && bsx.requestType === 'switch') {
    content = (
      <SwitchPanel
        bench={bsx.bsxBench as any}
        onSwitch={(i) => onChoice(`switch ${bsx.bsxBenchSwitchIndices[i - 1]}`)}
        label={t('dock.forcedSwitch')}
      />
    );
  } else if (isWaiting && bsx.requestType === 'team') {
    // For triples, send all 6 in order; for singles/doubles, send default "team 1".
    const teamChoice = bsx.isTriple ? 'team 1 2 3 4 5 6' : 'team 1';
    content = (
      <div className="flex flex-col gap-2">
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{t('dock.teamPreview')}</p>
        <button
          onClick={() => onChoice(teamChoice)}
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

// ── Target buttons ──────────────────────────────────────────────────────────

function MonSprite({ id, name }: { id: string; name: string }) {
  return (
    <img
      src={`/smartrotom/test/sprites/gen5/${id}.png`}
      alt={name}
      width={40}
      height={40}
      className="object-contain"
      style={{ imageRendering: 'pixelated' }}
      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
    />
  );
}

function HpBar({ hp }: { hp: number }) {
  const color = hp > 50 ? 'var(--emerald-400)' : hp > 20 ? 'var(--amber-400)' : 'var(--rose-400)';
  return (
    <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: 'var(--surface-3)' }}>
      <div className="h-full rounded-full" style={{ width: `${hp}%`, background: color }} />
    </div>
  );
}

function FoeTargetButton({ mon, target, disabled, onClick }: {
  mon: BSXMon; target: number; disabled?: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="bsx-focus flex flex-col items-center gap-0.5 px-3 py-2 rounded-[var(--radius)] cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      style={{ background: 'color-mix(in srgb, var(--rose-400) 12%, var(--surface-2))', border: '1px solid color-mix(in srgb, var(--rose-400) 35%, var(--border))', color: 'var(--text)', minWidth: 72 }}
    >
      <MonSprite id={mon.id} name={mon.name} />
      <span className="font-medium text-t-xs leading-tight text-center">{mon.name}</span>
      <HpBar hp={mon.hp} />
      {mon.status && (
        <span className="font-mono text-t-4xs uppercase opacity-60">{mon.status}</span>
      )}
    </button>
  );
}

function AllyTargetButton({ mon, onClick }: { mon: BSXMon; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="bsx-focus flex flex-col items-center gap-0.5 px-3 py-2 rounded-[var(--radius)] cursor-pointer transition-all"
      style={{ background: 'color-mix(in srgb, var(--emerald-400) 12%, var(--surface-2))', border: '1px solid color-mix(in srgb, var(--emerald-400) 35%, var(--border))', color: 'var(--text)', minWidth: 72 }}
    >
      <MonSprite id={mon.id} name={mon.name} />
      <span className="font-medium text-t-xs leading-tight text-center">{mon.name}</span>
      <HpBar hp={mon.hp} />
      {mon.status && (
        <span className="font-mono text-t-4xs uppercase opacity-60">{mon.status}</span>
      )}
    </button>
  );
}
