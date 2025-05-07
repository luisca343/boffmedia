'use client';

interface TypeDisplayProps {
  types: string[];
  teraType: string;
  isTerastallized: boolean;
  onTeraTypeChange: (type: string) => void;
  onTerastallizedChange: (isTerastallized: boolean) => void;
}

export default function TypeDisplay({
  types,
  teraType,
  isTerastallized,
  onTeraTypeChange,
  onTerastallizedChange
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
          {types.map((type: string) => {
            if(!type) return null;
            return <div key={type} className="px-2 py-0.5 rounded bg-surface-700 text-xs text-surface-100">
              {type}
            </div>
          })}
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium mb-1 text-surface-200">Tera Type</label>
        <div className="flex flex-col space-y-1">
          <select
            className="w-full p-1 border rounded bg-surface-700 border-surface-600 text-surface-100 text-xs"
            value={teraType}
            onChange={(e) => onTeraTypeChange(e.target.value)}
          >
            {typeOptions.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="terastallized"
              className="w-3 h-3 mr-1"
              checked={isTerastallized}
              onChange={(e) => onTerastallizedChange(e.target.checked)}
            />
            <label htmlFor="terastallized" className="text-xs text-surface-200">Terastallized</label>
          </div>
        </div>
      </div>
    </div>
  );
}