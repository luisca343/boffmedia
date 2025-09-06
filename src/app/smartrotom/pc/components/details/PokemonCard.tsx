import { PokemonImage } from '@/lib/PokemonImage';
import { FaStar, FaHeart } from 'react-icons/fa';
import { PiSkullFill, PiStarFill } from 'react-icons/pi';
import { useTranslations } from 'next-intl';
import { createPokemonSpec, createPokemonSpecFromTeam } from '../../utils/pokemonUtils';
import { colors as typeColors } from '@/app/smartrotom/pokedex/entrada/[[...params]]/_components/TypeBadge';
import { PokemonItemImage } from '@/components/common/pokemon/PokemonItemImage';
import { PokemonTypeIcon } from '@/components/common/pokemon/PokemonTypeIcon';
import { getGenderIcon, getHPBarColor, getStatusColor } from '@/lib/smartrotom/pokemonDisplayUtils';

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
    <div className={`bg-white border-4 border-black p-4 ${
      isFainted 
        ? 'bg-gray-300 border-gray-700'
        : ''
    }`}>
      {/* Pokemon Image Section */}
      <div className="flex justify-center mb-4">
        <div className="relative"> 
          {/* Item indicator */}
          {pokemonData.item && pokemonData.item !== 'item.minecraft.air' && pokemonData.item !== 'none' && (
            <div className="absolute -bottom-2 left-0 z-10 bg-white border-2 border-black p-1">
              <PokemonItemImage itemId={pokemonData.item} size={24} />
            </div>
          )}
          
          {/* Pokemon sprite container */}
          <div className={`relative w-32 h-32 bg-gray-200 border-4 border-black flex items-center justify-center ${
            isFainted ? 'opacity-50' : ''
          }`}>
            <PokemonImage
              itemId={
                isFromPC 
                  ? createPokemonSpec(pokemonData)
                  : createPokemonSpecFromTeam(pokemonData)
              }
              size={120}
            />
            
            {/* Shiny indicator */}
            {isShiny && (
              <div className="absolute top-0 right-0 w-6 h-6 bg-black border-2 border-gray-600 flex items-center justify-center">
                <PiStarFill className="text-white text-xs" />
              </div>
            )}
            
            {/* Fainted overlay */}
            {isFainted && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                <PiSkullFill className="text-white text-3xl" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pokemon Info */}
      <div className="text-center space-y-3">
        {/* Name and Level */}
        <div className="space-y-2">
          <div className="flex items-center justify-center space-x-2">
            <h4 className={`text-xl font-mono font-bold ${isFainted ? 'text-gray-500' : 'text-black'} truncate`}>
              {pokemonData.name || pokemonData.species}
            </h4>
            {getGenderIcon(pokemonData.gender, 'card')}
          </div>
          <div className={`bg-white border-2 border-black px-3 py-1 font-mono text-sm ${
            isFainted 
              ? 'bg-gray-200 border-gray-600 text-gray-700' 
              : 'text-black'
          }`}>
            LV.{pokemonData.level} • {pokemonData.species}{pokemonData.form && ` (${pokemonData.form})`}
          </div>
        </div>

        {/* Types display */}
        <div className="flex justify-center gap-2">
          {types.filter((t: string) => t).map((type: string) => (
            <div key={type} className="bg-white border-2 border-black p-1">
              <PokemonTypeIcon type={type} size={32} />
            </div>
          ))}
        </div>

        {/* Pokemon Info */}
        <div className="space-y-2">
          <div className="grid grid-cols-1 gap-2 text-xs">
            <div className="bg-white border-2 border-black p-2">
              <div className="font-mono font-bold text-gray-700">NATURE:</div>
              <div className="text-black font-mono">{t(`pokedex.nature_${pokemonData.nature.toLowerCase()}`)}</div>
            </div>
            <div className="bg-white border-2 border-black p-2">
              <div className="font-mono font-bold text-gray-700">ABILITY:</div>
              <div className="text-black font-mono">{t(`pokedex.ability_${pokemonData.ability.replaceAll(' ', '')}`)}</div>
            </div>
          </div>
        </div>

        {/* HP Display for Team Pokemon */}
        {isFromTeam && (
          <div className="bg-white border-4 border-black p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className={`w-8 h-8 border-2 flex items-center justify-center ${
                  isFainted 
                    ? 'bg-gray-600 border-gray-500' 
                    : 'bg-black border-gray-600'
                }`}>
                  <FaHeart className={`text-sm ${isFainted ? 'text-gray-200' : 'text-white'}`} />
                </div>
                <span className="text-black font-mono font-bold">HP</span>
              </div>
              <div className="text-right">
                <div className="text-black font-mono font-bold">{currentHP}/{maxHP}</div>
                <div className="text-gray-700 font-mono text-xs">{Math.round(hpPercentage)}%</div>
              </div>
            </div>
            
            <div className="bg-gray-200 border-2 border-black h-4 overflow-hidden">
              <div 
                className="h-full transition-all duration-500 bg-black"
                style={{ width: `${Math.max(0, Math.min(100, hpPercentage))}%` }}
              />
            </div>
            
            {pokemonData.status.toUpperCase() !== 'NONE' && (
              <div className="mt-2 flex items-center justify-center">
                <div className="px-3 py-1 border-2 border-black bg-white font-mono text-xs font-bold text-black">
                  {pokemonData.status.toUpperCase()}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}