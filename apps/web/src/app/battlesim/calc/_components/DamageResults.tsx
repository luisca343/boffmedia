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
    <div className="border border-edge rounded px-2 py-1.5 bg-layer-3 text-xs">
      <span className="font-medium text-primary-hover mb-0.5 text-base">{title}</span>
      
      <div className="text-ink-muted text-xs">
        <span className="mr-1">Possible damage:</span>
        <span className="font-medium text-ink">({damageAmounts})</span>
      </div>
    </div>
  );
}