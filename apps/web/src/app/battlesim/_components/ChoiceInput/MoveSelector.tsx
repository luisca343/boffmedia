'use client';

import { Protocol } from '@pkmn/protocol';
import { Dex } from '@pkmn/dex';
import { TypeBadgeSmall } from '@/components/shared/pokemon/TypeBadge';

interface MoveSelectorProps {
  request: Protocol.Request;
  makeChoice: (choice: string) => void;
}

interface MoveData {
  name?: string;
  move?: string;
  id: string;
  pp: number;
  maxpp: number;
  target: string;
  disabled: boolean;
}

export function MoveSelector({ request, makeChoice }: MoveSelectorProps) {
  if (!request.active?.[0]?.moves) return null;

  const moves = request.active[0].moves;
  const trapped = request.active[0].trapped;

  return (
    <div className="flex flex-col gap-2 p-3 bg-card rounded-lg border shadow-sm">
      <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
        {trapped ? 'Trapped — must use a move' : 'Choose a move'}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {moves.map((move: MoveData, index: number) => {
          const isDisabled = move.disabled || move.pp <= 0;
          return (
            <button
              key={move.id}
              onClick={() => !isDisabled && makeChoice(`move ${index + 1}`)}
              disabled={isDisabled}
              className={`
                relative flex flex-col gap-1 p-2.5 rounded-md border text-left transition-all
                ${isDisabled
                  ? 'opacity-40 cursor-not-allowed bg-muted'
                  : 'hover:scale-[1.02] hover:shadow-md cursor-pointer active:scale-[0.98]'
                }
              `}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-sm truncate">{move.move || move.name}</span>
                {(() => {
                  const moveData = Dex.moves.get(move.id);
                  return moveData?.exists ? <TypeBadgeSmall type={moveData.type} /> : null;
                })()}
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>PP: {move.pp}/{move.maxpp}</span>
                {move.target && move.target !== 'normal' && move.target !== 'any' && (
                  <span className="capitalize">→ {move.target}</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
