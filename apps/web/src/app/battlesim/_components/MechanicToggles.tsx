'use client';

import { BSXTeraBtn } from '@/components/boffmedia/primitives';
import { hasMechanicBeenUsed, ActiveMechanic } from '../_hooks/useChoiceMechanics';

interface MechanicTogglesProps {
  bsx: {
    mechCanTera: boolean;
    mechTeraType: string | null | undefined;
    mechCanMega: boolean;
    mechCanDyna: boolean;
    mechZMoves: boolean;
  };
  activeMechanic: ActiveMechanic;
  setActiveMechanic: (m: ActiveMechanic) => void;
  htmlLog: string[];
}

const MECHANIC_META: Record<string, { label: string; icon: string; color: string; hotkey: string; tooltip: string }> = {
  mega: {
    label: 'Mega',
    icon: '◈',
    color: 'var(--rose-400)',
    hotkey: 'M',
    tooltip: 'Mega Evolucionar este turno',
  },
  dynamax: {
    label: 'Dynamax',
    icon: '▲',
    color: 'var(--cyan-400)',
    hotkey: 'D',
    tooltip: 'Dynamax durante 3 turnos',
  },
  zmove: {
    label: 'Z-Move',
    icon: '⚡',
    color: 'var(--purple-400)',
    hotkey: 'Z',
    tooltip: 'Usar Movimiento Z (una vez por combate)',
  },
};

function MechanicButton({
  mechanic,
  armed,
  onToggle,
}: {
  mechanic: keyof typeof MECHANIC_META;
  armed: boolean;
  onToggle: () => void;
}) {
  const meta = MECHANIC_META[mechanic];
  return (
    <button
      className="bsx-focus flex items-center gap-[.5rem] p-[var(--bsx-pad-md)] flex-1 rounded-[var(--radius)] border font-inherit text-t-xs font-bold cursor-pointer transition-all duration-[var(--dur)] ease-[var(--ease)] whitespace-nowrap min-w-0"
      style={{
        background: armed ? `color-mix(in srgb, ${meta.color} 16%, var(--layer-2))` : 'var(--layer-2)',
        borderColor: `color-mix(in srgb, ${meta.color} 40%, var(--border))`,
        color: 'var(--text)',
        boxShadow: armed ? `0 0 0 1px ${meta.color} inset, 0 0 18px -8px ${meta.color}` : undefined,
      }}
      onClick={onToggle}
      aria-pressed={armed}
      aria-label={meta.tooltip}
      title={meta.tooltip}
    >
      <span
        className="font-mono font-bold text-t-3xs w-[19px] h-[19px] inline-grid place-items-center shrink-0 rounded-[var(--radius-sm)]"
        style={{ background: 'color-mix(in srgb, #000 30%, var(--layer-3))', color: 'var(--text-muted)', border: '1px solid var(--border-strong)' }}
      >
        {meta.hotkey}
      </span>
      <span aria-hidden="true" style={{ color: meta.color }}>{meta.icon}</span>
      <span className="overflow-hidden text-ellipsis">{armed ? `${meta.label} ✓` : meta.label}</span>
    </button>
  );
}

export function MechanicToggles({ bsx, activeMechanic, setActiveMechanic, htmlLog }: MechanicTogglesProps) {
  const hasAny = bsx.mechCanTera || bsx.mechCanMega || bsx.mechCanDyna || bsx.mechZMoves;
  if (!hasAny) return null;

  const toggle = (m: ActiveMechanic) => setActiveMechanic(activeMechanic === m ? null : m);

  return (
    <div className="flex gap-2 flex-wrap">
      {bsx.mechCanTera && bsx.mechTeraType && (
        <BSXTeraBtn
          type={bsx.mechTeraType}
          armed={activeMechanic === 'terastallize'}
          onToggle={() => toggle('terastallize')}
          used={hasMechanicBeenUsed(htmlLog)}
          hotkey="T"
        />
      )}
      {bsx.mechCanMega && (
        <MechanicButton mechanic="mega" armed={activeMechanic === 'mega'} onToggle={() => toggle('mega')} />
      )}
      {bsx.mechCanDyna && (
        <MechanicButton mechanic="dynamax" armed={activeMechanic === 'dynamax'} onToggle={() => toggle('dynamax')} />
      )}
      {bsx.mechZMoves && (
        <MechanicButton mechanic="zmove" armed={activeMechanic === 'zmove'} onToggle={() => toggle('zmove')} />
      )}
    </div>
  );
}
