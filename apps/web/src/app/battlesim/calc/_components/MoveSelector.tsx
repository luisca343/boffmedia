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
      <label className="block text-xs font-medium mb-1 text-ink">{label}</label>
      <select 
        className="w-full p-1 border rounded bg-layer-3 border-edge text-ink focus:ring-primary focus:border-primary text-xs"
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