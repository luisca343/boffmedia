'use client';

import { GENDER_OPTIONS } from '../../_utils/pokemonData';

interface BasicInfoProps {
  level: number;
  gender: string;
  onLevelChange: (level: number) => void;
  onGenderChange: (gender: string) => void;
}

export default function BasicInfo({
  level,
  gender,
  onLevelChange,
  onGenderChange
}: BasicInfoProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      <div>
        <label className="block text-xs font-medium mb-1 text-ink">Gender</label>
        <select
          className="w-full p-1 border rounded bg-layer-3 border-edge text-ink text-xs"
          value={gender}
          onChange={(e) => onGenderChange(e.target.value)}
        >
          {GENDER_OPTIONS.map(g => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
      </div>
      
      <div>
        <label className="block text-xs font-medium mb-1 text-ink">Level</label>
        <input
          type="number"
          className="w-full p-1 border rounded bg-layer-3 border-edge text-ink text-xs"
          min="1"
          max="100"
          value={level}
          onChange={(e) => onLevelChange(parseInt(e.target.value) || 100)}
        />
      </div>
    </div>
  );
}