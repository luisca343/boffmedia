'use client';

interface HpControlProps {
  currentHp: number;
  maxHp: number;
  currentHpPercent: number;
  onHpChange: (hp: number) => void;
  onHpPercentChange: (percent: number) => void;
}

export default function HpControl({
  currentHp,
  maxHp,
  currentHpPercent,
  onHpChange,
  onHpPercentChange
}: HpControlProps) {
  return (
    <div className="mb-2">
      <label className="block text-xs font-medium mb-1 text-surface-200">
        Current HP: <span className="font-medium text-primary-300">{currentHp} / {maxHp} ({currentHpPercent}%)</span>
      </label>
      <div className="flex items-center space-x-1 text-xs">
        <input
          type="number"
          className="w-full p-1 h-6 border rounded bg-surface-700 border-surface-600 text-surface-100 text-xs"
          value={currentHp}
          onChange={(e) => onHpChange(parseInt(e.target.value) || 0)}
        />
        <span className="text-surface-400">/</span>
        <input
          type="number"
          className="w-full p-1 h-6 border rounded bg-surface-700 border-surface-600 text-surface-100 text-xs"
          value={currentHpPercent}
          onChange={(e) => onHpPercentChange(parseInt(e.target.value) || 0)}
          min="0"
          max="100"
        />
        <span className="text-surface-400">%</span>
      </div>
      
      {/* HP Bar visualization */}
      <div className="w-full h-1.5 bg-surface-700 mt-1 rounded overflow-hidden">
        <div 
          className="h-full bg-green-500" 
          style={{ 
            width: `${currentHpPercent}%`,
            backgroundColor: currentHpPercent > 50 ? '#10B981' : currentHpPercent > 20 ? '#F59E0B' : '#EF4444'
          }}
        />
      </div>
    </div>
  );
}