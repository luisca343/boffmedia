interface PokemonStatsProps {
  stats: number[];
  ivs?: number[];
  evs?: number[];
}

export function PokemonStats({ stats, ivs, evs }: PokemonStatsProps) {
  const getStatName = (index: number) => {
    const statNames = ['PS', 'Ataque', 'Defensa', 'Ataque Especial', 'Defensa Especial', 'Velocidad'];
    return statNames[index] || `Stat ${index + 1}`;
  };
  const getStatBarColor = (index: number) => {
    const colors = [
      'bg-pink-500',     // HP
      'bg-red-500',      // Attack
      'bg-yellow-500',   // Defense
      'bg-blue-500',     // Sp. Attack
      'bg-green-500',    // Sp. Defense
      'bg-purple-500'    // Speed
    ];
    return colors[index] || 'bg-gray-500';
  };
  return (
    <div>
      <h3 className="text-lg font-bold text-purple-300 mb-4 flex items-center">ESTADÍSTICAS</h3>
      <div className="space-y-3">
        {stats.map((stat, index) => (
          <div key={index} className="flex items-center">
            <div className="w-28 text-right text-sm text-purple-200 font-medium">{getStatName(index)}</div>
            <div className="w-12 text-center text-sm font-bold text-white ml-4">{stat}</div>
            <div className="flex-1 ml-4">
              <div className="bg-purple-900/30 rounded-full h-3">
                <div className={`${getStatBarColor(index)} h-3 rounded-full transition-all duration-300`} style={{ width: `${Math.min((stat / 255) * 100, 100)}%` }}></div>
              </div>
            </div>
            {/* IV and EV values inline */}
            <div className="ml-4 flex flex-col text-xs text-gray-300 w-14">
              <span>IV: <span className="text-blue-300 font-bold">{ivs?.[index]}</span></span>
              <span>EV: <span className="text-green-300 font-bold">{evs?.[index]}</span></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
