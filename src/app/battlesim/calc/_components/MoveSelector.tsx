'use client';

interface MoveSelectorProps {
  moves: any[];
  selectedMove: string;
  setSelectedMove: (value: string) => void;
  isDisabled: boolean;
  label?: string;
}

export default function MoveSelector({ 
  moves, 
  selectedMove, 
  setSelectedMove,
  isDisabled,
  label = "Move"
}: MoveSelectorProps) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1 text-surface-200">{label}</label>
      <select 
        className="w-full p-1 border rounded bg-surface-700 border-surface-600 text-surface-100 focus:ring-primary-500 focus:border-primary-500 text-xs"
        value={selectedMove} 
        onChange={(e) => setSelectedMove(e.target.value)}
        disabled={isDisabled}
      >
        <option value="">Select Move</option>
        {moves.map(move => (
          <option key={move.id === 'hiddenpower' ? move.id + move.type : move.id} value={move.id}>
            {move.name} ({move.type}, {move.category}, BP: {move.basePower})
          </option>
        ))}
      </select>
    </div>
  );
}