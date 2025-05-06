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
      className={`block w-full text-left p-2 border rounded mb-1 hover:bg-blue-50 ${
        isSelected ? 'bg-blue-100 border-blue-400' : ''
      }`}
    >
      <div className="flex justify-between items-center">
        <div className="font-medium">{moveName} <span className="text-xs">({moveType})</span></div>
        <div className="text-sm">
          {minDamage}-{maxDamage} <span className="text-gray-600">({minPercent}-{maxPercent}%)</span>
        </div>
      </div>
      <div className="text-xs text-gray-600">
        {attackerName} → {defenderName}
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
    <div className="mb-4 p-4 border rounded bg-gray-50">
      <h2 className="text-lg font-bold mb-3">Damage Calculations</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pokémon 1's Moves */}
        <div>
          <h3 className="text-md font-semibold mb-2 border-b pb-1">{pokemon1Results[0]?.attacker.name}'s Moves</h3>
          <div className="space-y-1">
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
              <p className="text-sm text-gray-500 p-2">No moves selected</p>
            )}
          </div>
        </div>
        
        {/* Pokémon 2's Moves */}
        <div>
          <h3 className="text-md font-semibold mb-2 border-b pb-1">{pokemon2Results[0]?.attacker.name}'s Moves</h3>
          <div className="space-y-1">
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
              <p className="text-sm text-gray-500 p-2">No moves selected</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}