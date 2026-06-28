'use client';

interface StatBarProps {
  label: string;
  value: number;
  maxValue: number;
  color: string;
}

export default function StatBar({ label, value, maxValue, color }: StatBarProps) {
  // Calculate percentage for width, capped at 100%
  const percentage = Math.min(Math.round((value / maxValue) * 100), 100);
  
  return (
    <div>
      <div className="flex justify-between text-xs text-ink mb-1">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="h-2 bg-layer-3 rounded overflow-hidden">
        <div 
          className={`h-full ${color}`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
}