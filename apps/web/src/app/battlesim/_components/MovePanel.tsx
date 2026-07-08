'use client';

import { BxKey } from '@/app/(boffmedia)/(herramientas)/pokemon/battlesim/_components/ui/bx-kit';
import type { BxMon } from '@/app/(boffmedia)/(herramientas)/pokemon/battlesim/_lib/bx-helpers';
import type { BSXKeyMove } from '../_utils/toBSXMon';

interface MovePanelProps {
  moves: BSXKeyMove[];
  /** Active foe — drives per-move effectiveness tags. */
  foe?: BxMon | null;
  onChooseMove: (index: number) => void;
  /** Targeting feedback: index of the hovered/focused damaging move, or null. */
  onAimMove?: (index: number | null) => void;
  /** Tera preview flag — moves render with the tera tag when armed. */
  teraArmed?: boolean;
}

export function MovePanel({ moves, foe, onChooseMove, onAimMove, teraArmed }: MovePanelProps) {
  if (moves.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-2">
      {moves.map((move, i) => (
        <BxKey
          key={move.name ?? i}
          move={move}
          hotkey={i + 1}
          tera={teraArmed}
          target={foe ?? null}
          onClick={() => onChooseMove(i + 1)}
          onHover={onAimMove && move.cat !== 'status' ? () => onAimMove(i) : undefined}
          onLeave={onAimMove ? () => onAimMove(null) : undefined}
        />
      ))}
    </div>
  );
}
