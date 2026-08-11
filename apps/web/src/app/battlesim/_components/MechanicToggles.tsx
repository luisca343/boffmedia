'use client';

import type { CSSProperties } from 'react';
import { BxTeraBtn, BxKbd } from '@/app/(boffmedia)/(herramientas)/pokemon/battlesim/_components/ui/bx-kit';
import { cn } from '@/lib/utils';
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

const MECHANIC_META: Record<string, { label: string; icon: string; tone: string; hotkey: string; tooltip: string }> = {
  mega: { label: 'Mega', icon: '◈', tone: 'var(--bad)', hotkey: 'M', tooltip: 'Mega Evolucionar este turno' },
  dynamax: { label: 'Dynamax', icon: '▲', tone: 'var(--signal)', hotkey: 'D', tooltip: 'Dynamax durante 3 turnos' },
  zmove: { label: 'Movimiento Z', icon: '⚡', tone: 'var(--accent)', hotkey: 'Z', tooltip: 'Usar Movimiento Z (una vez por combate)' },
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
      type="button"
      onClick={onToggle}
      aria-pressed={armed}
      aria-label={meta.tooltip}
      title={meta.tooltip}
      style={{ ['--tyc']: meta.tone } as CSSProperties}
      className={cn('cut cut-edge-slant [--cut-line:var(--line-2)] [--cut:4px]', 'inline-flex items-center gap-2 border border-solid border-line-2 bg-panel px-3 py-2 font-mono text-[10.5px] font-semibold uppercase leading-none tracking-[0.06em] text-txt-muted transition-[border-color,color,box-shadow]',
        'hover:border-[color-mix(in_srgb,var(--tyc)_60%,transparent)] hover:text-txt',
        armed && 'border-[var(--tyc)] text-txt [box-shadow:0_0_12px_color-mix(in_srgb,var(--tyc)_35%,transparent),inset_0_0_12px_color-mix(in_srgb,var(--tyc)_12%,transparent)]',
      )}
    >
      <BxKbd>{meta.hotkey}</BxKbd>
      <span aria-hidden className="[color:var(--tyc)]">{meta.icon}</span>
      <span>{armed ? `${meta.label} ✓` : meta.label}</span>
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
        <BxTeraBtn
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
