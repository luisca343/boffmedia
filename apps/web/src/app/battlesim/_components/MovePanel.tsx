'use client';

import { BSXKey } from '@/components/boffmedia/primitives';
import type { BSXKeyMove } from '../_utils/toBSXMon';

interface MovePanelProps {
  moves: BSXKeyMove[];
  foe?: { types: string[]; tera: boolean; teraType: string | null };
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
        <BSXKey
          key={move.name ?? i}
          move={move}
          hotkey={String(i + 1)}
          tera={teraArmed}
          target={foe ? { types: foe.types, tera: foe.tera, teraType: foe.teraType } : undefined}
          onClick={() => onChooseMove(i + 1)}
          onHover={onAimMove && move.cat !== 'status' ? () => onAimMove(i) : undefined}
          onLeave={onAimMove ? () => onAimMove(null) : undefined}
        />
      ))}
    </div>
  );
}
