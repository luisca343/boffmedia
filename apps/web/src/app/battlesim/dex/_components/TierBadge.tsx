'use client';

interface TierBadgeProps {
  tier: string;
}

const TIER_COLORS: Record<string, string> = {
  'AG': 'bg-red-900 text-red-100',
  'Uber': 'bg-secondary-soft text-secondary-hover',
  'OU': 'bg-secondary-active text-secondary-hover',
  'UUBL': 'bg-secondary-soft text-secondary-hover',
  'UU': 'bg-secondary-active text-secondary-hover',
  'RUBL': 'bg-warning-soft text-warning-hover',
  'RU': 'bg-warning text-warning-hover',
  'NUBL': 'bg-warning text-warning-hover',
  'NU': 'bg-warning text-warning-hover',
  'PUBL': 'bg-yellow-700 text-yellow-100',
  'PU': 'bg-yellow-600 text-yellow-100',
  'LC': 'bg-layer-3 text-ink',
  'NFE': 'bg-orange-700 text-orange-100',
};

export default function TierBadge({ tier }: TierBadgeProps) {
  const colorClass = TIER_COLORS[tier] || 'bg-layer-3 text-ink';
  
  return (
    <span className={`text-xs px-1.5 py-0.5 rounded ${colorClass}`}>
      {tier}
    </span>
  );
}