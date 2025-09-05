import { motion } from 'framer-motion';
import { PiChartBar } from 'react-icons/pi';

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
    <div className="bg-slate-900/40 backdrop-blur-sm rounded-2xl border border-slate-500/30 shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="relative bg-gradient-to-r from-slate-800/80 to-slate-700/80 p-4 border-b border-slate-500/30">
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-blue-500/5 pointer-events-none" />
        
        <div className="relative flex items-center space-x-3">
          <motion.div
            initial={{ rotate: -10, scale: 0.8 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="w-10 h-10 bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-xl flex items-center justify-center border border-white/20 backdrop-blur-sm"
          >
            <PiChartBar className="text-green-300 text-xl" />
          </motion.div>
          <div>
            <h3 className="text-xl font-bold text-white">Estadísticas</h3>
            <p className="text-slate-300 text-sm">Stats base, IVs y EVs</p>
          </div>
        </div>
      </div>

      {/* Stats Content */}
      <div className="p-6">
        <div className="space-y-3">
          {stats.map((stat, index) => (
            <div key={index} className="flex items-center">
              <div className="w-28 text-right text-sm text-slate-300 font-medium">{getStatName(index)}</div>
              <div className="w-12 text-center text-sm font-bold text-white ml-4">{stat}</div>
              <div className="flex-1 ml-4">
                <div className="bg-slate-700/30 rounded-full h-3 border border-slate-600/30">
                  <motion.div 
                    className={`${getStatBarColor(index)} h-3 rounded-full transition-all duration-300`} 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((stat / 255) * 100, 100)}%` }}
                    transition={{ duration: 0.5, delay: index * 0.05 }}
                  />
                </div>
              </div>
              <div className="ml-4 flex flex-col text-xs text-slate-400 w-14">
                <span>IV: <span className="text-blue-300 font-bold">{ivs?.[index] ?? '-'}</span></span>
                <span>EV: <span className="text-green-300 font-bold">{evs?.[index] ?? '-'}</span></span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}