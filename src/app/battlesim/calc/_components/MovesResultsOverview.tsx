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

interface MovesResultsListProps {
  results: any[];
  direction: 'attacker-to-defender' | 'defender-to-attacker';
  allResults: any[];
  selectedResultIndex: number;
  onSelectResult: (index: number) => void;
}

const MovesResultsList = ({
  results,
  direction,
  allResults,
  selectedResultIndex,
  onSelectResult
}: MovesResultsListProps) => {
  return (
    <div className="border border-surface-700 rounded-md bg-surface-800">
      {/* Header */}
      <div className="bg-surface-700 px-2 py-1 text-xs font-semibold text-primary-300">
        {results[0]?.attacker.name || `Pokémon ${direction === 'attacker-to-defender' ? '1' : '2'}`}&apos;s Moves <span className="text-surface-400">(select one to show detailed results)</span>
      </div>
      
      {/* Moves list */}
      <div>
        {results.map((result, i) => {
          // Find the overall index of this result in the combined results array
          const overallIndex = allResults.findIndex(r => 
            r.move.name === result.move.name && r.direction === direction
          );
          
          // Calculate percentages
          const minDamage = Math.min(...result.damageRange);
          const maxDamage = Math.max(...result.damageRange);
          const defenderHP = result.defender.stats.hp;
          const minPercent = ((minDamage / defenderHP) * 100).toFixed(1);
          const maxPercent = ((maxDamage / defenderHP) * 100).toFixed(1);
          
          return (
            <MoveResult
              key={`${direction === 'attacker-to-defender' ? 'p1' : 'p2'}-${i}`}
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
        {results.length === 0 && (
          <p className="text-xs text-surface-500 p-2">No moves selected</p>
        )}
      </div>
    </div>
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
  // Separate results by direction
  const pokemon1Results = results.filter(r => r.direction === 'attacker-to-defender');
  const pokemon2Results = results.filter(r => r.direction === 'defender-to-attacker');

  return (
    <div className="flex flex-col md:flex-row md:justify-between gap-2 mb-2">
      {/* Pokémon 1's Moves - On mobile: full width, On desktop: half width and aligned left */}
      <div className="w-full md:w-[33%]">
        <MovesResultsList
          results={pokemon1Results}
          direction="attacker-to-defender"
          allResults={results}
          selectedResultIndex={selectedResultIndex}
          onSelectResult={onSelectResult}
        />
      </div>
      
      {/* Pokémon 2's Moves - On mobile: full width, On desktop: half width and aligned right */}
      <div className="w-full md:w-[33%]">
        <MovesResultsList
          results={pokemon2Results}
          direction="defender-to-attacker"
          allResults={results}
          selectedResultIndex={selectedResultIndex}
          onSelectResult={onSelectResult}
        />
      </div>
    </div>
  );
}