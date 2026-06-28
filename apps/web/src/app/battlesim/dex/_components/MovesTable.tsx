'use client';

import PokemonTypeChip from './PokemonTypeChip';

interface MovesTableProps {
  moves: any[];
  onMoveClick: (name: string) => void;
  displayLimit: number;
  onLoadMore: () => void;
  compact?: boolean;
}

export default function MovesTable({
  moves,
  onMoveClick,
  displayLimit,
  onLoadMore,
  compact = false
}: MovesTableProps) {
  const movesToShow = moves.slice(0, displayLimit);

  return (
    <div className="bg-layer-2 rounded-lg p-4">
      {!compact && <h3 className="mb-3 text-ink">Moves</h3>}
      {compact && (
        <h3 className="mb-3 text-ink font-medium flex justify-between">
          <span>Moves</span>
          <span className="text-sm text-ink-muted">
            {Math.min(moves.length, displayLimit)} of {moves.length} shown
          </span>
        </h3>
      )}
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="text-left text-ink-muted text-xs border-b border-edge">
            <th className={compact ? "p-1" : "p-2"}>Name</th>
            <th className={compact ? "p-1" : "p-2"}>Type</th>
            <th className={compact ? "p-1" : "p-2"}>Cat</th>
            <th className={compact ? "p-1" : "p-2"}>Pow</th>
            <th className={compact ? "p-1" : "p-2"}>Acc</th>
            {!compact && <th className="p-2">PP</th>}
            {!compact && <th className="p-2">Description</th>}
          </tr>
        </thead>
        <tbody>
          {movesToShow.map(move => (
            <tr 
              key={move.id} 
              className="border-b border-edge/50 hover:bg-layer-3/30 cursor-pointer"
              onClick={() => onMoveClick(move.name)}
            >
              <td className={`${compact ? "p-1" : "p-2"} font-medium text-ink`}>{move.name}</td>
              <td className={compact ? "p-1" : "p-2"}><PokemonTypeChip type={move.type} small /></td>
              <td className={`${compact ? "p-1" : "p-2"} text-ink ${compact ? "text-xs" : ""}`}>{move.category}</td>
              <td className={`${compact ? "p-1" : "p-2"} text-ink ${compact ? "text-xs" : ""}`}>{move.power || '—'}</td>
              <td className={`${compact ? "p-1" : "p-2"} text-ink ${compact ? "text-xs" : ""}`}>
                {move.accuracy === true ? '100%' : (move.accuracy || '—')}
              </td>
              {!compact && <td className="p-2 text-ink">{move.pp}</td>}
              {!compact && (
                <td className="p-2 text-ink text-xs truncate max-w-[300px]">
                  {move.desc || 'No description'}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {!compact && moves.length > displayLimit && (
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