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
    <div className="bg-surface-800 rounded-lg p-4">
      {!compact && <h3 className="mb-3 text-surface-300">Moves</h3>}
      {compact && (
        <h3 className="mb-3 text-surface-300 font-medium flex justify-between">
          <span>Moves</span>
          <span className="text-sm text-surface-400">
            {Math.min(moves.length, displayLimit)} of {moves.length} shown
          </span>
        </h3>
      )}
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="text-left text-surface-400 text-xs border-b border-surface-700">
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
              className="border-b border-surface-700/50 hover:bg-surface-700/30 cursor-pointer"
              onClick={() => onMoveClick(move.name)}
            >
              <td className={`${compact ? "p-1" : "p-2"} font-medium text-surface-100`}>{move.name}</td>
              <td className={compact ? "p-1" : "p-2"}><PokemonTypeChip type={move.type} small /></td>
              <td className={`${compact ? "p-1" : "p-2"} text-surface-300 ${compact ? "text-xs" : ""}`}>{move.category}</td>
              <td className={`${compact ? "p-1" : "p-2"} text-surface-300 ${compact ? "text-xs" : ""}`}>{move.power || '—'}</td>
              <td className={`${compact ? "p-1" : "p-2"} text-surface-300 ${compact ? "text-xs" : ""}`}>
                {move.accuracy === true ? '100%' : (move.accuracy || '—')}
              </td>
              {!compact && <td className="p-2 text-surface-300">{move.pp}</td>}
              {!compact && (
                <td className="p-2 text-surface-300 text-xs truncate max-w-[300px]">
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
            className="px-4 py-2 bg-surface-700 text-surface-200 rounded-md hover:bg-surface-600 transition-colors"
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
}