'use client';

import { TypeBadgeSmall } from '@/components/shared/pokemon/TypeBadge';
import type { BattleRequest } from '../../types';

export type BattleMechanic = 'mega' | 'zmove' | 'dynamax' | 'terastallize';

interface ActionButtonsProps {
  request: BattleRequest;
  activeMechanic: BattleMechanic | null;
  onToggle: (mechanic: BattleMechanic) => void;
  disabled: boolean;
}

export function ActionButtons({ request, activeMechanic, onToggle, disabled }: ActionButtonsProps) {
  const active = request.active?.[0];
  if (!active) return null;

  const buttons: { mechanic: BattleMechanic; label: string; available: boolean; detail?: string }[] = [];

  if (active.canMegaEvo) {
    buttons.push({
      mechanic: 'mega',
      label: 'Mega Evolve',
      available: true,
    });
  }

  if (active.zMoves) {
    buttons.push({
      mechanic: 'zmove',
      label: 'Z-Move',
      available: true,
    });
  }

  if (active.canDynamax) {
    buttons.push({
      mechanic: 'dynamax',
      label: 'Dynamax',
      available: true,
    });
  }

  if (active.canTerastallize) {
    buttons.push({
      mechanic: 'terastallize',
      label: 'Terastallize',
      available: true,
      detail: active.canTerastallize,
    });
  }

  if (buttons.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 p-3 bg-card rounded-lg border shadow-sm">
      <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide w-full">
        Battle Actions
      </div>
      {buttons.map(({ mechanic, label, available, detail }) => {
        const isActive = activeMechanic === mechanic;
        return (
          <button
            key={mechanic}
            onClick={() => onToggle(mechanic)}
            disabled={disabled || !available}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-sm font-medium transition-all
              ${disabled
                ? 'opacity-40 cursor-not-allowed bg-muted'
                : isActive
                  ? 'bg-primary text-primary-foreground border-primary shadow-md'
                  : 'hover:bg-accent cursor-pointer active:scale-[0.98]'
              }
            `}
          >
            <MechanicIcon mechanic={mechanic} />
            <span>{label}</span>
            {mechanic === 'terastallize' && detail && (
              <TypeBadgeSmall type={detail} className="!m-0 !h-5 !text-[10px]" />
            )}
          </button>
        );
      })}
    </div>
  );
}

function MechanicIcon({ mechanic }: { mechanic: BattleMechanic }) {
  const icons: Record<BattleMechanic, string> = {
    mega: 'M',
    zmove: 'Z',
    dynamax: 'D',
    terastallize: 'T',
  };
  return (
    <span className="w-5 h-5 flex items-center justify-center rounded-full bg-background text-xs font-bold">
      {icons[mechanic]}
    </span>
  );
}
