import { PokemonImage } from '@/lib/PokemonImage';
import { FaStar, FaMars, FaVenus, FaHeart, FaNeuter } from 'react-icons/fa';
import { useTranslations } from 'next-intl';
import { createPokemonSpec, createPokemonSpecFromTeam } from '../../utils/pokemonUtils';
import { colors as typeColors } from '@/app/smartrotom/pokedex/entrada/[[...params]]/_components/TypeBadge';
import { PokemonItemImage } from '@/components/common/pokemon/PokemonItemImage';
import { PokemonTypeIcon } from '@/components/common/pokemon/PokemonTypeIcon';

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

  const getGenderIcon = (gender?: string) => {
    if (!gender) return null;
    switch (gender.toLowerCase()) {
      case 'male':
        return <FaMars className="text-blue-500 text-sm" />;
      case 'female':
        return <FaVenus className="text-pink-500 text-sm" />;
      case 'genderless':
        return <FaNeuter className="text-gray-500 text-sm" />;
      default:
        return null;
    }
  };

  function getStatusColor(status: string): string {
    switch (status?.toLowerCase()) {
      case 'poisoned':
        return 'text-purple-400';
      case 'burned':
        return 'text-red-400';
      case 'paralyzed':
        return 'text-yellow-400';
      case 'frozen':
        return 'text-blue-400';
      case 'sleeping':
        return 'text-gray-400';
      case 'fainted':
        return 'text-red-600';
      case 'healthy':
      default:
        return 'text-green-400';
    }
  }

  function getHPBarColor(hpPercentage: number): string {
    if (hpPercentage > 50) return 'bg-green-500';
    if (hpPercentage > 20) return 'bg-yellow-500';
    return 'bg-red-500';
  }

  return (
    <div className={`bg-gradient-to-br backdrop-blur-sm rounded-2xl p-4 border h-fit ${
      isFainted 
        ? 'from-red-800/20 via-red-700/20 to-red-800/20 border-red-400/30'
        : 'from-purple-800/20 via-indigo-800/20 to-blue-800/20 border-purple-400/30'
    }`}>
      {/* Pokemon Image */}
      <div className="flex justify-center mb-4">
        <div className={`relative ${isFainted ? 'opacity-50 grayscale' : ''}`}> 
          {pokemonData.item && pokemonData.item !== 'item.minecraft.air' && pokemonData.item !== 'none' && (
            <div className="absolute -bottom-4 left-2">
                <PokemonItemImage itemId={pokemonData.item} size={48} />
            </div>
          )}
          <PokemonImage
            itemId={
              isFromPC 
                ? createPokemonSpec(pokemonData)
                : createPokemonSpecFromTeam(pokemonData)
            }
            size={150}
          />
          {isShiny && (
            <FaStar className="absolute top-6 left-6 text-yellow-400 text-lg z-10 animate-pulse" />
          )}
          {isFainted && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-red-500 text-3xl font-bold">💀</div>
            </div>
          )}
        </div>
      </div>
      <div className="text-center">
        <div className="flex items-center justify-center space-x-2 mb-1">
          <h4 className={`text-xl font-bold ${isFainted ? 'text-red-300' : 'text-white'}`}>{pokemonData.name || pokemonData.species}</h4>
          {getGenderIcon(pokemonData.gender)}
        </div>
        <p className={`text-sm mb-2 ${isFainted ? 'text-red-200' : 'text-purple-200'}`}>Nv. {pokemonData.level} • {pokemonData.species}{pokemonData.form && ` (${pokemonData.form})`}</p>
        {/* Types display with image and color */}
        <div className="flex justify-center gap-2 mb-4">
          {types.filter((t: string) => t).map((type: string) => (
            <PokemonTypeIcon key={type} type={type} />
          ))}
        </div>
        <div className="space-y-2 text-sm text-white">
          <div><span className="font-semibold">Naturaleza:</span> {t(`pokedex.nature_${pokemonData.nature.toLowerCase()}`)}</div>
          <div><span className="font-semibold">Habilidad:</span> {t(`pokedex.ability_${pokemonData.ability.replaceAll(' ', '')}`)}</div>
        </div>
        {/* HP Display for Team Pokemon */}
        {isFromTeam && (
          <div className="mt-4 bg-black/20 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <FaHeart className={`text-sm ${getStatusColor(pokemonData.status)}`} />
                <span className="text-white font-medium">HP</span>
              </div>
              <span className="text-white text-sm">{currentHP}/{maxHP}</span>
            </div>
            <div className="bg-gray-700 rounded-full h-3">
              <div className={`h-full rounded-full transition-all duration-300 ${getHPBarColor(hpPercentage)}`} style={{ width: `${Math.max(0, Math.min(100, hpPercentage))}%` }} />
            </div>
            { pokemonData.status.toUpperCase() !== 'NONE' && (
              <div className="mt-2">
                <span className={`text-sm font-medium ${getStatusColor(pokemonData.status)}`}>Estado: {pokemonData.status.toUpperCase()}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
