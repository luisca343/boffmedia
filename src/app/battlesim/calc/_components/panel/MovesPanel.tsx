'use client';

import MoveSelector from '../MoveSelector';

interface MovesPanelProps {
  moves: any[];
  selectedMoves: string[];
  onMoveChange: (index: number, moveId: string) => void;
}

export default function MovesPanel({
  moves,
  selectedMoves,
  onMoveChange
}: MovesPanelProps) {
  return (
    <div>
      <h3 className="text-xs font-medium mb-1 text-primary-400">Moves</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <MoveSelector 
            key={index}
            moves={moves}
            selectedMove={selectedMoves[index]}
            setSelectedMove={(moveId) => onMoveChange(index, moveId)}
            isDisabled={false}
            label={`Move ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}