'use client';

interface TierBadgeProps {
  tier: string;
}

const TIER_COLORS: Record<string, string> = {
  'AG': 'bg-red-900 text-red-100',
  'Uber': 'bg-purple-900 text-purple-100',
  'OU': 'bg-blue-700 text-blue-100',
  'UUBL': 'bg-blue-800 text-blue-100',
  'UU': 'bg-blue-600 text-blue-100',
  'RUBL': 'bg-green-800 text-green-100',
  'RU': 'bg-green-700 text-green-100',
  'NUBL': 'bg-green-700 text-green-100',
  'NU': 'bg-green-600 text-green-100',
  'PUBL': 'bg-yellow-700 text-yellow-100',
  'PU': 'bg-yellow-600 text-yellow-100',
  'LC': 'bg-gray-600 text-gray-100',
  'NFE': 'bg-orange-700 text-orange-100',
};

export default function TierBadge({ tier }: TierBadgeProps) {
  const colorClass = TIER_COLORS[tier] || 'bg-gray-700 text-gray-100';
  
  return (
    <span className={`text-xs px-1.5 py-0.5 rounded ${colorClass}`}>
      {tier}
    </span>
  );
}