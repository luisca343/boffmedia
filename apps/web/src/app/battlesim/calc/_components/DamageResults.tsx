'use client';

import { getDamageText } from '../_utils/damageUtils';

interface DamageResultsProps {
  result: any;
}

export default function DamageResults({ result }: DamageResultsProps) {
  if (!result) return null;
  const { 
    title,
    damageAmounts
  } = getDamageText(result);
  
  
  return (
    <div className="border border-surface-700 rounded px-2 py-1.5 bg-surface-700 text-xs">
      <span className="font-medium text-primary-300 mb-0.5 text-base">{title}</span>
      
      <div className="text-surface-400 text-xs">
        <span className="mr-1">Possible damage:</span>
        <span className="font-medium text-surface-200">({damageAmounts})</span>
      </div>
    </div>
  );
}