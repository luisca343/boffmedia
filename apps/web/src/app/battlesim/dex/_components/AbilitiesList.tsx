'use client';

interface AbilitiesListProps {
  abilities: any[];
  onAbilityClick: (name: string) => void;
  displayLimit: number;
  onLoadMore: () => void;
  compact?: boolean;
}

export default function AbilitiesList({
  abilities,
  onAbilityClick,
  displayLimit,
  onLoadMore,
  compact = false
}: AbilitiesListProps) {
  const abilitiesToShow = abilities.slice(0, displayLimit);

  return (
    <div className="bg-layer-2 rounded-lg p-4">
      {!compact && <h3 className="mb-3 text-ink">Abilities</h3>}
      {compact && (
        <h3 className="mb-3 text-ink font-medium flex justify-between">
          <span>Abilities</span>
          <span className="text-sm text-ink-muted">
            {Math.min(abilities.length, displayLimit)} of {abilities.length} shown
          </span>
        </h3>
      )}
      <div className="space-y-1">
        {abilitiesToShow.map(ability => (
          <div
            key={ability.id}
            className={`${compact ? "p-1.5" : "p-2"} ${compact ? "hover:bg-layer-3" : "bg-layer-3 hover:bg-layer-3"} rounded cursor-pointer flex justify-between`}
            onClick={() => onAbilityClick(ability.name)}
          >
            <div className={`font-medium text-ink ${compact ? "text-sm" : ""}`}>{ability.name}</div>
            <div className="text-xs text-ink line-clamp-1 max-w-[70%]">{ability.desc || 'No description available'}</div>
          </div>
        ))}
      </div>
      {!compact && abilities.length > displayLimit && (
        <div className="mt-6 text-center">
          <button
            onClick={onLoadMore}
            className="px-4 py-2 bg-layer-3 text-ink rounded-md hover:bg-layer-3 transition-colors"
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
}