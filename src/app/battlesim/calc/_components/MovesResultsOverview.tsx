'use client';

interface MoveResultProps {
  attackerName: string;
  defenderName: string;
  moveName: string;
  moveType: string;
  minDamage: number;
  maxDamage: number;
  minPercent: string;
  maxPercent: string;
  isSelected: boolean;
  onSelect: () => void;
}

const MoveResult = ({ 
  attackerName, 
  defenderName, 
  moveName, 
  moveType,
  minDamage,
  maxDamage,
  minPercent,
  maxPercent,
  isSelected,
  onSelect
}: MoveResultProps) => {
  return (
    <button
      onClick={onSelect}
      className={`block w-full text-left border-b py-0.5 px-2 text-sm transition-colors ${
        isSelected 
          ? 'bg-primary-500/20 text-primary-300 border-primary-500' 
          : 'border-surface-700 text-surface-100 hover:bg-surface-700'
      }`}
    >
      <div className="flex justify-between items-center">
        <div className="font-medium">{moveName} <span className="text-xs text-surface-400">({moveType})</span></div>
        <div className="text-xs">
          {minPercent}-{maxPercent}%
        </div>
      </div>
    </button>
  );
};

interface MovesResultsOverviewProps {
  results: any[];
  selectedResultIndex: number;
  onSelectResult: (index: number) => void;
}

export default function MovesResultsOverview({ 
  results, 
  selectedResultIndex, 
  onSelectResult 
}: MovesResultsOverviewProps) {
  if (!results.length) return null;
  
  // Separate results by direction
  const pokemon1Results = results.filter(r => r.direction === 'attacker-to-defender');
  const pokemon2Results = results.filter(r => r.direction === 'defender-to-attacker');

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
      {/* Both columns in a single container */}
      <div className="border border-surface-700 rounded-md bg-surface-800">
        {/* Header */}
        <div className="bg-surface-700 px-2 py-1 text-xs font-semibold text-primary-300">
          {pokemon1Results[0]?.attacker.name || 'Pokémon 1'}&apos;s Moves <span className="text-surface-400">(select one to show detailed results)</span>
        </div>
        
        {/* Moves list */}
        <div>
          {pokemon1Results.map((result, i) => {
            // Find the overall index of this result in the combined results array
            const overallIndex = results.findIndex(r => 
              r.move.name === result.move.name && r.direction === 'attacker-to-defender'
            );
            
            // Calculate percentages
            const minDamage = Math.min(...result.damage);
            const maxDamage = Math.max(...result.damage);
            const defenderHP = result.defender.stats.hp;
            const minPercent = ((minDamage / defenderHP) * 100).toFixed(1);
            const maxPercent = ((maxDamage / defenderHP) * 100).toFixed(1);
            
            return (
              <MoveResult
                key={`p1-${i}`}
                attackerName={result.attacker.name}
                defenderName={result.defender.name}
                moveName={result.move.name}
                moveType={result.move.type}
                minDamage={minDamage}
                maxDamage={maxDamage}
                minPercent={minPercent}
                maxPercent={maxPercent}
                isSelected={overallIndex === selectedResultIndex}
                onSelect={() => onSelectResult(overallIndex)}
              />
            );
          })}
          {pokemon1Results.length === 0 && (
            <p className="text-xs text-surface-500 p-2">No moves selected</p>
          )}
        </div>
      </div>
      
      {/* Pokémon 2's Moves */}
      <div className="border border-surface-700 rounded-md bg-surface-800">
        {/* Header */}
        <div className="bg-surface-700 px-2 py-1 text-xs font-semibold text-primary-300">
          {pokemon2Results[0]?.attacker.name || 'Pokémon 2'}&apos;s Moves <span className="text-surface-400">(select one to show detailed results)</span>
        </div>
        
        {/* Moves list */}
        <div>
          {pokemon2Results.map((result, i) => {
            // Find the overall index of this result in the combined results array
            const overallIndex = results.findIndex(r => 
              r.move.name === result.move.name && r.direction === 'defender-to-attacker'
            );
            
            // Calculate percentages
            const minDamage = Math.min(...result.damage);
            const maxDamage = Math.max(...result.damage);
            const defenderHP = result.defender.stats.hp;
            const minPercent = ((minDamage / defenderHP) * 100).toFixed(1);
            const maxPercent = ((maxDamage / defenderHP) * 100).toFixed(1);
            
            return (
              <MoveResult
                key={`p2-${i}`}
                attackerName={result.attacker.name}
                defenderName={result.defender.name}
                moveName={result.move.name}
                moveType={result.move.type}
                minDamage={minDamage}
                maxDamage={maxDamage}
                minPercent={minPercent}
                maxPercent={maxPercent}
                isSelected={overallIndex === selectedResultIndex}
                onSelect={() => onSelectResult(overallIndex)}
              />
            );
          })}
          {pokemon2Results.length === 0 && (
            <p className="text-xs text-surface-500 p-2">No moves selected</p>
          )}
        </div>
      </div>
    </div>
  );
}