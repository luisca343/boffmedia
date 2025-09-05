import { PokemonTypeIcon } from '@/components/common/pokemon/PokemonTypeIcon';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { PiSwordFill, PiSparkle, PiGear } from 'react-icons/pi';

interface PokemonMovesProps {
  moves: any[];
}

export function PokemonMoves({ moves }: PokemonMovesProps) {
  const t = useTranslations();
  
  const getMoveTypeColor = (moveType: string) => {
    const moveTypeColors: { [key: string]: string } = {
      physical: 'from-red-600/80 to-red-700/80',
      special: 'from-blue-600/80 to-blue-700/80',
      status: 'from-gray-600/80 to-gray-700/80'
    };
    return moveTypeColors[moveType?.toLowerCase()] || 'from-purple-600/80 to-purple-700/80';
  };

  const getMoveIcon = (moveType: string) => {
    const iconMap = {
      physical: PiSwordFill,
      special: PiSparkle,
      status: PiGear
    };
    return iconMap[moveType?.toLowerCase()] || PiGear;
  };

  const getCategoryName = (category: string) => {
    const categoryMap = {
      'PHYSICAL': 'FÍS',
      'SPECIAL': 'ESP',
      'STATUS': 'EST'
    };
    return categoryMap[category] || category;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const moveVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="bg-slate-900/40 backdrop-blur-sm rounded-2xl border border-slate-500/30 shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="relative bg-gradient-to-r from-slate-800/80 to-slate-700/80 p-4 border-b border-slate-500/30">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-red-500/5 pointer-events-none" />
        
        <div className="relative flex items-center space-x-3">
          <motion.div
            initial={{ rotate: -10, scale: 0.8 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="w-10 h-10 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-xl flex items-center justify-center border border-white/20 backdrop-blur-sm"
          >
            <PiSwordFill className="text-orange-300 text-xl" />
          </motion.div>
          <div>
            <h3 className="text-xl font-bold text-white">Movimientos</h3>
            <p className="text-slate-300 text-sm">
              {moves.filter(m => m).length}/4 movimientos aprendidos
            </p>
          </div>
        </div>
      </div>

      {/* Moves Grid */}
      <div className="p-6">
        {moves.length === 0 ? (
          <motion.div 
            className="text-center text-slate-400 py-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="w-16 h-16 mx-auto mb-4 bg-slate-700/30 rounded-2xl flex items-center justify-center">
              <PiSwordFill className="text-3xl opacity-50" />
            </div>
            <h4 className="text-lg font-semibold mb-2">Sin movimientos</h4>
            <p className="text-sm text-slate-500">Este Pokémon no tiene movimientos registrados</p>
          </motion.div>
        ) : (
          <motion.div 
            className="grid grid-cols-2 gap-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {Array.from({ length: 4 }, (_, index) => {
              const move = moves[index];
              const IconComponent = move ? getMoveIcon(move.category) : PiGear;
              
              return (
                <motion.div
                  key={index}
                  variants={moveVariants}
                  className="relative"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className={`relative rounded-xl p-4 text-white font-semibold shadow-lg border border-white/10 backdrop-blur-sm overflow-hidden ${
                    move ? `bg-gradient-to-br ${getMoveTypeColor(move.category)}` : 'bg-slate-700/50'
                  }`}>
                    {/* Background pattern */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/10 pointer-events-none" />
                    
                    <div className="relative">
                      {/* Move Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2 min-w-0">
                          {move?.type && (
                            <PokemonTypeIcon type={move.type} size={24}/>
                          )}
                          <span className="text-sm font-medium truncate">
                            {move ? t(`pokedex.attack_${move.name.toLowerCase().replaceAll(' ', '_')}`) : `Slot ${index + 1}`}
                          </span>
                        </div>
                        
                        {move?.category && (
                          <div className="flex items-center space-x-1 bg-black/20 backdrop-blur-sm rounded-lg px-2 py-1 border border-white/10">
                            <IconComponent className="text-xs" />
                            <span className="text-xs uppercase font-bold">
                              {getCategoryName(move.category)}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Move Stats */}
                      {move ? (
                        <div className="space-y-2 ">
                          <div className="flex justify-between items-center">
                            <div className="text-xs text-white/80">
                              <span className="font-medium">Poder:</span>
                              <span className="ml-1 font-mono">{move.power || '-'}</span>
                            </div>
                            <div className="text-xs text-white/80">
                              <span className="font-medium">Precisión:</span>
                              <span className="ml-1 font-mono">
                                {move.accuracy && move.accuracy > 0 ? `${move.accuracy}%` : '-'}
                              </span>
                            </div>
                          </div>
                          
                          {/* PP Info if available */}
                          {move.pp && (
                            <div className="text-xs text-white/60">
                              <span className="font-medium">PP:</span>
                              <span className="ml-1 font-mono">{move.pp}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <PiGear className="text-slate-500 text-2xl mx-auto mb-2 opacity-50" />
                          <span className="text-slate-500 text-xs">Vacío</span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
}