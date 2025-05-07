'use client';

import { getDamageText } from '../_utils/damageUtils';

interface DamageResultsProps {
  result: any;
}

export default function DamageResults({ result }: DamageResultsProps) {
  if (!result) return null;
  
  const { 
    title,
    damageAmounts,
    minPercent,
    maxPercent
  } = getDamageText(result);
  
  return (
    <div className="border border-surface-700 rounded px-2 py-1.5 bg-surface-700 text-xs">
      <h3 className="font-medium text-primary-300 mb-0.5">{title}</h3>
      
      <div className="mb-0.5 text-surface-400">
        <span className="mr-1">Damage:</span>
        <span className="font-medium text-surface-200">{minPercent}% - {maxPercent}%</span>
      </div>
      
      <div className="text-surface-400 text-xs">
        <span className="mr-1">Possible damage:</span>
        <span className="font-medium text-surface-200">{damageAmounts}</span>
      </div>
    </div>
  );
}