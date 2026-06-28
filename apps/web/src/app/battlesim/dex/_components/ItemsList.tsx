'use client';

import { Icons } from '@pkmn/img';

interface ItemsListProps {
  items: any[];
  onItemClick: (name: string) => void;
  displayLimit: number;
  onLoadMore: () => void;
  compact?: boolean;
}

export default function ItemsList({
  items,
  onItemClick,
  displayLimit,
  onLoadMore,
  compact = false
}: ItemsListProps) {
  const itemsToShow = items.slice(0, displayLimit);

  // Get item icon from @pkmn/img library
  const getItemIconStyle = (itemName: string): React.CSSProperties => {
    try {
      const { style, url, top, left, css } = Icons.getItem(itemName);
      
      // Create a proper React style object using the destructured values
      const styleObj: React.CSSProperties = {
        backgroundImage: url ? `url(${url})` : "url('https://play.pokemonshowdown.com/sprites/itemicons-sheet.png')",
        backgroundPosition: `${left}px ${top}px`,
        backgroundRepeat: "no-repeat",
        backgroundSize: "auto"
      };
      
      return styleObj;
    } catch (error) {
      // Return a blank style object if the item isn't found
      return {};
    }
  };

  return (
    <div className="bg-layer-2 rounded-lg p-4">
      {!compact && <h3 className="mb-3 text-ink">Items</h3>}
      {compact && (
        <h3 className="mb-3 text-ink font-medium flex justify-between">
          <span>Items</span>
          <span className="text-sm text-ink-muted">
            {Math.min(items.length, displayLimit)} of {items.length} shown
          </span>
        </h3>
      )}
      <div className={compact ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2" : "grid grid-cols-1 gap-2"}>
        {itemsToShow.map(item => (
          <div
            key={item.id}
            className={`${compact ? "p-2" : "p-2"} bg-layer-3 rounded cursor-pointer hover:bg-layer-3 flex items-center ${compact ? 'gap-2' : 'gap-3'}`}
            onClick={() => onItemClick(item.name)}
          >
            <div 
              className={`h-6 w-6 bg-layer-3 rounded-full flex items-center justify-center overflow-hidden`}
              style={getItemIconStyle(item.name)}
            >
              {/* Empty span to maintain size if icon fails */}
              <span className="text-xs opacity-0">?</span>
            </div>
            <div className={`font-medium text-ink ${compact ? "text-sm" : ""}`}>{item.name}</div>
            {!compact && (
              <div className="text-xs text-ink line-clamp-1 flex-1">{item.desc || 'No description available'}</div>
            )}
          </div>
        ))}
      </div>
      {!compact && items.length > displayLimit && (
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