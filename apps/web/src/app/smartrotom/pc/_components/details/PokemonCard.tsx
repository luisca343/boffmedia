import { PokemonImage } from '@/lib/PokemonImage';
import { FaStar, FaHeart } from 'react-icons/fa';
import { PiSkullFill, PiStarFill } from 'react-icons/pi';
import { useTranslations } from 'next-intl';
import { createPokemonSpec, createPokemonSpecFromTeam } from '../../_utils/pokemonUtils';
import { colors as typeColors } from '@/components/shared/pokemon/TypeBadge';
import { PokemonItemImage } from '@/components/shared/pokemon/PokemonItemImage';
import { PokemonTypeIcon } from '@/components/shared/pokemon/PokemonTypeIcon';
import { getGenderIcon, getHPBarColor, getStatusColor } from '@/lib/smartrotom/pokemonDisplayUtils';
import { motion } from 'framer-motion';

interface PokemonCardProps {
  pokemonData: any;
  isFromTeam: boolean;
  isFromPC: boolean;
  isShiny: boolean;
  isFainted: boolean;
  currentHP: number;
  maxHP: number;
  hpPercentage: number;
  types: string[];
}

export function PokemonCard({ pokemonData, isFromTeam, isFromPC, isShiny, isFainted, currentHP, maxHP, hpPercentage, types }: PokemonCardProps) {
  const t = useTranslations();

  return (
    <motion.div 
      className={`bg-slate-900/40 backdrop-blur-sm rounded-2xl p-4 border border-slate-500/30 shadow-2xl relative overflow-hidden ${
        isFainted 
          ? 'bg-red-900/20 border-red-400/30'
          : ''
      }`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/3 via-transparent to-black/5 pointer-events-none" />
      
      <div className="relative">
        {/* Pokemon Image Section - More compact */}
        <div className="flex justify-center mb-4">
          <div className="relative"> 
            {/* Item indicator - smaller */}
            {pokemonData.item && pokemonData.item !== 'item.minecraft.air' && pokemonData.item !== 'none' && (
              <motion.div 
                className="absolute -bottom-1 left-1 z-10"
                whileHover={{ scale: 1.1 }}
                title={`Held item: ${pokemonData.item}`}
              >
                <PokemonItemImage itemId={pokemonData.item} size={36} />
              </motion.div>
            )}
            
            {/* Pokemon sprite container - more compact */}
            <div className={`relative w-32 h-32 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl flex items-center justify-center ${
              isFainted ? 'opacity-50' : ''
            }`}>
              <motion.div
                animate={
                  isFainted ? { scale: 0.9, opacity: 0.5, filter: "grayscale(1)" } : 
                  { y: [0, -6, 0] }
                }
                transition={
                  isFainted ? { duration: 0.2 } :
                  { duration: 2, ease: "easeInOut", repeat: Infinity }
                }
              >
                <PokemonImage
                  itemId={
                    isFromPC 
                      ? createPokemonSpec(pokemonData)
                      : createPokemonSpecFromTeam(pokemonData)
                  }
                  size={120}
                />
              </motion.div>
              
              {/* Shiny indicator - smaller */}
              {isShiny && (
                <motion.div
                  className="absolute top-1 right-1 w-5 h-5 bg-gradient-to-r from-yellow-300 to-yellow-500 rounded-full flex items-center justify-center shadow-lg"
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                >
                  <PiStarFill className="text-white text-xs" />
                </motion.div>
              )}
              
              {/* Fainted overlay */}
              {isFainted && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-2xl">
                  <PiSkullFill className="text-red-400 text-2xl" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pokemon Info - More compact */}
        <div className="text-center space-y-3">
          {/* Name and Level */}
          <div className="space-y-2">
            <div className="flex items-center justify-center space-x-2">
              <h4 className={`text-lg font-bold ${isFainted ? 'text-red-300' : 'text-white'} truncate`}>
                {pokemonData.name || pokemonData.species}
              </h4>
              {getGenderIcon(pokemonData.gender, 'card')}
            </div>
            <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm border ${
              isFainted 
                ? 'bg-red-500/20 border-red-400/30 text-red-200' 
                : 'bg-blue-500/20 border-blue-400/30 text-blue-200'
            }`}>
              Nv. {pokemonData.level} • {pokemonData.species}{pokemonData.form && ` (${pokemonData.form})`}
            </div>
          </div>

          {/* Types display - more compact */}
          <div className="flex justify-center gap-1">
            {types.filter((t: string) => t).map((type: string) => (
              <motion.div
                key={type}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <PokemonTypeIcon type={type} size={32} />
              </motion.div>
            ))}
          </div>

          {/* Pokemon Info - More compact */}
          <div className="space-y-2">
            <div className="grid grid-cols-1 gap-2 text-xs">
              <div className="bg-slate-800/30 backdrop-blur-sm rounded-lg p-2 border border-slate-600/30">
                <span className="font-semibold text-slate-300">Naturaleza:</span>
                <span className="ml-2 text-white text-xs">{t(`pokedex.nature_${pokemonData.nature.toLowerCase()}`)}</span>
              </div>
              <div className="bg-slate-800/30 backdrop-blur-sm rounded-lg p-2 border border-slate-600/30">
                <span className="font-semibold text-slate-300">Habilidad:</span>
                <span className="ml-2 text-white text-xs">{t(`pokedex.ability_${pokemonData.ability.replaceAll(' ', '')}`)}</span>
              </div>
            </div>
          </div>

          {/* HP Display for Team Pokemon - More compact */}
          {isFromTeam && (
            <motion.div 
              className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-3 border border-slate-600/30"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center backdrop-blur-sm border ${
                    isFainted 
                      ? 'bg-red-500/20 border-red-400/40' 
                      : 'bg-green-500/20 border-green-400/40'
                  }`}>
                    <FaHeart className={`text-xs ${isFainted ? 'text-red-400' : 'text-green-400'}`} />
                  </div>
                  <span className="text-white font-semibold text-sm">PS</span>
                </div>
                <div className="text-right">
                  <div className="text-white font-mono text-sm">{currentHP}/{maxHP}</div>
                  <div className="text-slate-400 text-xs">{Math.round(hpPercentage)}%</div>
                </div>
              </div>
              
              <div className="bg-slate-700/50 rounded-full h-3 border border-slate-600/50 overflow-hidden">
                <motion.div 
                  className={`h-full transition-all duration-500 ${getHPBarColor(hpPercentage)}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(0, Math.min(100, hpPercentage))}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
              
              {pokemonData.status.toUpperCase() !== 'NONE' && (
                <div className="mt-2 flex items-center justify-center">
                  <div className={`px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm border ${getStatusColor(pokemonData.status)} ${getStatusColor(pokemonData.status).replace('border-', 'bg-').replace('/50', '/10')} ${getStatusColor(pokemonData.status).replace('border-', 'text-')}`}>
                    {pokemonData.status.toUpperCase()}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}