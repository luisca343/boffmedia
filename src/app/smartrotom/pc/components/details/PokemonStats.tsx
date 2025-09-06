import { PiChartBar } from 'react-icons/pi';

interface PokemonStatsProps {
  stats: number[];
  ivs?: number[];
  evs?: number[];
}

export function PokemonStats({ stats, ivs, evs }: PokemonStatsProps) {
  const getStatName = (index: number) => {
    const statNames = ['HP', 'ATK', 'DEF', 'SPA', 'SPD', 'SPE'];
    return statNames[index] || `ST${index + 1}`;
  };

  const getStatBarColor = (index: number) => {
    const colors = [
      'bg-pink-400',     // HP
      'bg-red-400',      // Attack
      'bg-yellow-400',   // Defense
      'bg-blue-400',     // Sp. Attack
      'bg-green-400',    // Sp. Defense
      'bg-purple-400'    // Speed
    ];
    return colors[index] || 'bg-gray-400';
  };

  return (
    <div className="bg-white border-4 border-black overflow-hidden">
      {/* Header */}
      <div className="bg-gray-300 border-b-4 border-black p-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-black border-2 border-gray-600 flex items-center justify-center">
            <PiChartBar className="text-white text-lg" />
          </div>
          <div>
            <h3 className="text-black font-mono font-bold text-lg">STATS</h3>
            <p className="text-gray-700 font-mono text-sm">BASE STATS, IVS & EVS</p>
          </div>
        </div>
      </div>

      {/* Stats Content */}
      <div className="p-4">
        <div className="space-y-3">
          {stats.map((stat, index) => (
            <div key={index} className="flex items-center">
              <div className="w-12 text-right text-sm text-black font-mono font-bold">{getStatName(index)}</div>
              <div className="w-12 text-center text-sm font-bold text-black font-mono ml-4">{stat}</div>
              <div className="flex-1 ml-4">
                <div className="bg-gray-200 border-2 border-black h-4">
                  <div 
                    className="bg-black h-full transition-all duration-500" 
                    style={{ width: `${Math.min((stat / 255) * 100, 100)}%` }}
                  />
                </div>
              </div>
              <div className="ml-4 flex flex-col text-xs text-gray-700 font-mono w-16">
                <div className="bg-white border border-black px-1 mb-1">
                  <span>IV:</span>
                  <span className="text-black font-bold ml-1">{ivs?.[index] ?? '-'}</span>
                </div>
                <div className="bg-white border border-black px-1">
                  <span>EV:</span>
                  <span className="text-black font-bold ml-1">{evs?.[index] ?? '-'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}