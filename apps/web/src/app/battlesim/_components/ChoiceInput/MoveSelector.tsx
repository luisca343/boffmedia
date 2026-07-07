'use client';

import { Dex } from '@pkmn/dex';
import { TypeBadgeSmall } from '@/components/shared/pokemon/TypeBadge';
import type { BattleMechanic } from './ActionButtons';
import type { BattleRequest } from '../../types';

interface MoveSelectorProps {
  request: BattleRequest;
  makeChoice: (choice: string) => void;
  activeMechanic?: BattleMechanic | null;
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

interface ZMoveData {
  name: string;
  id: string;
  target: string;
  disabled?: boolean;
}

interface MaxMoveData {
  id: string;
  target: string;
  disabled?: boolean;
}

export function MoveSelector({ request, makeChoice, activeMechanic }: MoveSelectorProps) {
  const active = request.active?.[0];
  if (!active?.moves) return null;

  const trapped = active.trapped;
  const isZMove = activeMechanic === 'zmove' && active.zMoves;
  const isDynamax = activeMechanic === 'dynamax' && active.maxMoves;

  const moves = active.moves as unknown as MoveData[];
  const zMoves = active.zMoves;
  const maxMoves = active.maxMoves;

  const headerText = trapped
    ? 'Trapped — must use a move'
    : isZMove
      ? 'Choose a Z-Move'
      : isDynamax
        ? 'Choose a Max Move'
        : 'Choose a move';

  return (
    <div className="flex flex-col gap-2 p-3 bg-card rounded-lg border shadow-sm">
      <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
        {headerText}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {moves.map((move: MoveData, index: number) => {
          if (isZMove && zMoves) {
            return renderZMove(zMoves[index], index, makeChoice);
          }
          if (isDynamax && maxMoves) {
            return renderMaxMove(maxMoves[index], index, move, makeChoice);
          }
          return renderRegularMove(move, index, makeChoice);
        })}
      </div>
    </div>
  );
}

function renderRegularMove(move: MoveData, index: number, makeChoice: (choice: string) => void) {
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
}

function renderZMove(zMove: ZMoveData | null | undefined, index: number, makeChoice: (choice: string) => void) {
  if (!zMove) {
    return (
      <button
        key={`z-${index}`}
        disabled
        className="relative flex flex-col gap-1 p-2.5 rounded-md border text-left opacity-40 cursor-not-allowed bg-muted"
      >
        <span className="font-semibold text-sm">No Z-Move</span>
      </button>
    );
  }

  const moveData = Dex.moves.get(zMove.id);
  return (
    <button
      key={zMove.id}
      onClick={() => makeChoice(`move ${index + 1}`)}
      className="relative flex flex-col gap-1 p-2.5 rounded-md border text-left transition-all hover:scale-[1.02] hover:shadow-md cursor-pointer active:scale-[0.98]"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold text-sm truncate">{zMove.name}</span>
        {moveData?.exists ? <TypeBadgeSmall type={moveData.type} /> : null}
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="text-yellow-500 font-medium">Z-Move</span>
        {zMove.target && zMove.target !== 'normal' && zMove.target !== 'any' && (
          <span className="capitalize">→ {zMove.target}</span>
        )}
      </div>
    </button>
  );
}

function renderMaxMove(maxMove: MaxMoveData | undefined, index: number, regularMove: MoveData, makeChoice: (choice: string) => void) {
  if (!maxMove) {
    return renderRegularMove(regularMove, index, makeChoice);
  }

  const moveData = Dex.moves.get(maxMove.id);
  const isDisabled = maxMove.disabled || regularMove.pp <= 0;

  return (
    <button
      key={maxMove.id}
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
        <span className="font-semibold text-sm truncate">{moveData?.exists ? moveData.name : maxMove.id}</span>
        {moveData?.exists ? <TypeBadgeSmall type={moveData.type} /> : null}
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="text-purple-500 font-medium">Max</span>
        {maxMove.target && maxMove.target !== 'normal' && maxMove.target !== 'any' && (
          <span className="capitalize">→ {maxMove.target}</span>
        )}
      </div>
    </button>
  );
}
