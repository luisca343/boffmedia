'use client';

import { BSXKey } from '@/components/boffmedia/primitives';
import type { BSXKeyMove } from '../_utils/toBSXMon';

interface MovePanelProps {
  moves: BSXKeyMove[];
  foe?: { types: string[]; tera: boolean; teraType: string | null };
  onChooseMove: (index: number) => void;
}

export function MovePanel({ moves, foe, onChooseMove }: MovePanelProps) {
  if (moves.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-2">
      {moves.map((move, i) => (
        <BSXKey
          key={i}
          move={move}
          hotkey={String(i + 1)}
          target={foe ? { types: foe.types, tera: foe.tera, teraType: foe.teraType } : undefined}
          onClick={() => onChooseMove(i + 1)}
        />
      ))}
    </div>
  );
}
