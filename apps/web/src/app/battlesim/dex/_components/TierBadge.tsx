'use client';

interface TierBadgeProps {
  tier: string;
}

const TIER_COLORS: Record<string, string> = {
  'AG': 'bg-red-900 text-red-100',
  'Uber': 'bg-accent-900 text-accent-100',
  'OU': 'bg-secondary-700 text-secondary-100',
  'UUBL': 'bg-secondary-800 text-secondary-100',
  'UU': 'bg-secondary-600 text-secondary-100',
  'RUBL': 'bg-highlight-800 text-highlight-100',
  'RU': 'bg-highlight-700 text-highlight-100',
  'NUBL': 'bg-highlight-700 text-highlight-100',
  'NU': 'bg-highlight-600 text-highlight-100',
  'PUBL': 'bg-yellow-700 text-yellow-100',
  'PU': 'bg-yellow-600 text-yellow-100',
  'LC': 'bg-surface-600 text-surface-100',
  'NFE': 'bg-orange-700 text-orange-100',
};

export default function TierBadge({ tier }: TierBadgeProps) {
  const colorClass = TIER_COLORS[tier] || 'bg-surface-700 text-surface-100';
  
  return (
    <span className={`text-xs px-1.5 py-0.5 rounded ${colorClass}`}>
      {tier}
    </span>
  );
}