'use client';

import { BSXTeraBtn } from '@/components/boffmedia/primitives';
import { hasMechanicBeenUsed, ActiveMechanic } from '../_hooks/useChoiceMechanics';

interface MechanicTogglesProps {
  bsx: {
    mechCanTera: boolean;
    mechTeraType: string | null;
    mechCanMega: boolean;
    mechCanDyna: boolean;
    mechZMoves: boolean;
  };
  activeMechanic: ActiveMechanic;
  setActiveMechanic: (m: ActiveMechanic) => void;
  htmlLog: string[];
}

const mechanicBtnStyle = (active: boolean): React.CSSProperties => ({
  background: active ? 'color-mix(in srgb, var(--accent) 20%, var(--surface-2))' : 'var(--surface-2)',
  border: `1px solid ${active ? 'var(--accent-bright)' : 'var(--border)'}`,
  color: 'var(--text)',
  boxShadow: active ? '0 0 0 1px var(--accent-bright) inset' : undefined,
});

export function MechanicToggles({ bsx, activeMechanic, setActiveMechanic, htmlLog }: MechanicTogglesProps) {
  const hasAny = bsx.mechCanTera || bsx.mechCanMega || bsx.mechCanDyna || bsx.mechZMoves;
  if (!hasAny) return null;

  return (
    <div className="flex gap-2 flex-wrap">
      {bsx.mechCanTera && bsx.mechTeraType && (
        <BSXTeraBtn
          type={bsx.mechTeraType}
          armed={activeMechanic === 'terastallize'}
          onToggle={() => setActiveMechanic(activeMechanic === 'terastallize' ? null : 'terastallize')}
          used={hasMechanicBeenUsed(htmlLog)}
          hotkey="T"
        />
      )}
      {bsx.mechCanMega && (
        <button
          className="px-3 py-1.5 rounded-md text-sm font-medium transition-all cursor-pointer"
          style={mechanicBtnStyle(activeMechanic === 'mega')}
          onClick={() => setActiveMechanic(activeMechanic === 'mega' ? null : 'mega')}
          aria-pressed={activeMechanic === 'mega'}
          aria-label="Toggle Mega Evolution"
        >
          Mega
        </button>
      )}
      {bsx.mechCanDyna && (
        <button
          className="px-3 py-1.5 rounded-md text-sm font-medium transition-all cursor-pointer"
          style={mechanicBtnStyle(activeMechanic === 'dynamax')}
          onClick={() => setActiveMechanic(activeMechanic === 'dynamax' ? null : 'dynamax')}
          aria-pressed={activeMechanic === 'dynamax'}
          aria-label="Toggle Dynamax"
        >
          Dynamax
        </button>
      )}
      {bsx.mechZMoves && (
        <button
          className="px-3 py-1.5 rounded-md text-sm font-medium transition-all cursor-pointer"
          style={mechanicBtnStyle(activeMechanic === 'zmove')}
          onClick={() => setActiveMechanic(activeMechanic === 'zmove' ? null : 'zmove')}
          aria-pressed={activeMechanic === 'zmove'}
          aria-label="Toggle Z-Move"
        >
          Z-Move
        </button>
      )}
    </div>
  );
}
