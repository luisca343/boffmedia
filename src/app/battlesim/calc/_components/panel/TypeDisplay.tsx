'use client';

interface TypeDisplayProps {
  types: string[];
  teraType: string;
  onTeraTypeChange: (type: string) => void;
}

export default function TypeDisplay({
  types,
  teraType,
  onTeraTypeChange
}: TypeDisplayProps) {
  const typeOptions = [
    'Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice', 'Fighting', 'Poison',
    'Ground', 'Flying', 'Psychic', 'Bug', 'Rock', 'Ghost', 'Dragon',
    'Dark', 'Steel', 'Fairy'
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
      <div>
        <label className="block text-xs font-medium mb-1 text-surface-200">Type</label>
        <div className="flex space-x-1">
          {types.map((type: string) => (
            <div key={type} className="px-2 py-0.5 rounded bg-surface-700 text-xs text-surface-100">
              {type}
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium mb-1 text-surface-200">Tera Type</label>
        <select
          className="w-full p-1 border rounded bg-surface-700 border-surface-600 text-surface-100 text-xs"
          value={teraType}
          onChange={(e) => onTeraTypeChange(e.target.value)}
        >
          {typeOptions.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>
    </div>
  );
}