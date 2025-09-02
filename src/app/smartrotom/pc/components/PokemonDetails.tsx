import { PCPokemon } from '@/types/dto/pc-pokemon.dto'
import { PokemonW } from '@/generated/api'
import { PokemonImage } from '@/lib/PokemonImage'
import { FaTimes, FaStar, FaMars, FaVenus } from 'react-icons/fa'
import { colors as typeColors } from '@/app/smartrotom/pokedex/entrada/[[...params]]/_components/TypeBadge'
import { createPokemonSpec, createPokemonSpecFromTeam } from '../utils/pokemonUtils'
import { getPokemonDefense } from '../../pokedex/dexUtils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/primitives/dialog";
import { useTranslations } from 'next-intl'

interface PokemonDetailsProps {
  pokemon?: PCPokemon | null;
  teamPokemon?: PokemonW | null;
  onClose: () => void;
}

export default function PokemonDetails({ pokemon, teamPokemon, onClose }: PokemonDetailsProps) {
  const t = useTranslations();

  // Determine which pokemon data to use
  const activePokemon = pokemon || teamPokemon
  if (!activePokemon) return null

  // Get pokemon data based on type - normalize the structure
  const pokemonData = pokemon ? {
    ...pokemon.pokemon,
    moves: pokemon.pokemon.moves.filter(move => move !== null) as string[]
  } : {
    ...teamPokemon!,
    types: [] as string[], // TeamPokemon doesn't have types
    gender: undefined,
    evs: teamPokemon!.evs.map(ev => parseInt(ev)),
    ivs: teamPokemon!.ivs.map(iv => parseInt(iv)),
    stats: teamPokemon!.stats.map(stat => parseInt(stat))
  }

  const isFromTeam = !!teamPokemon
  const isFromPC = !!pokemon

  // Get types from pokemon data
  const types: string[] = pokemonData.types || ['normal'];
  // Helper to get type color for effectiveness chips
  const getTypeColor = (type: string) => {
    const typeColorsMap: { [key: string]: string } = {
      fire: 'bg-red-500',
      water: 'bg-blue-500',
      grass: 'bg-green-500',
      electric: 'bg-yellow-500',
      psychic: 'bg-pink-500',
      ice: 'bg-cyan-500',
      dragon: 'bg-purple-600',
      dark: 'bg-gray-800',
      fighting: 'bg-red-700',
      poison: 'bg-purple-500',
      ground: 'bg-yellow-600',
      flying: 'bg-indigo-400',
      bug: 'bg-green-400',
      rock: 'bg-yellow-800',
      ghost: 'bg-purple-700',
      steel: 'bg-gray-400',
      fairy: 'bg-pink-300',
      normal: 'bg-gray-500'
    }
    return typeColorsMap[type] || 'bg-gray-500'
  }
  const isShiny = pokemonData.palette === 'shiny'

  const getGenderIcon = (gender?: string) => {
    if (!gender) return null
    switch (gender.toLowerCase()) {
      case 'male':
        return <FaMars className="text-blue-500 text-sm" />
      case 'female':
        return <FaVenus className="text-pink-500 text-sm" />
      default:
        return null
    }
  }

  const getStatName = (index: number) => {
    const statNames = ['PS', 'Ataque', 'Defensa', 'Ataque Especial', 'Defensa Especial', 'Velocidad']
    return statNames[index] || `Stat ${index + 1}`
  }

  const getStatBarColor = (index: number) => {
    const colors = [
      'bg-pink-500',     // HP
      'bg-blue-500',     // Attack
      'bg-pink-500',     // Defense
      'bg-pink-500',     // Sp. Attack
      'bg-pink-500',     // Sp. Defense
      'bg-pink-500'      // Speed
    ]
    return colors[index] || 'bg-gray-500'
  }

  // Get type effectiveness for this Pokemon using types array
  const getTypeEffectiveness = () => {
    const type1 = types[0] || 'normal';
    const type2 = types[1] || '';
    const defense = getPokemonDefense(type1, type2);

    const weaknesses = [];
    const resistances = [];
    const immunities = [];

    for (const [type, effectiveness] of Object.entries(defense)) {
      if (effectiveness > 1) {
        weaknesses.push({ type, effectiveness });
      } else if (effectiveness < 1 && effectiveness > 0) {
        resistances.push({ type, effectiveness });
      } else if (effectiveness === 0) {
        immunities.push({ type, effectiveness });
      }
    }

    return { weaknesses, resistances, immunities };
  }

  // Get type effectiveness for rendering
  const { weaknesses, resistances, immunities } = getTypeEffectiveness();

  return (
    <Dialog open={true} onOpenChange={open => { if (!open) onClose(); }}>
      <DialogContent className="max-w-3xl p-0 bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 rounded-2xl shadow-2xl border-2 border-purple-400/30 overflow-hidden">
        <DialogHeader>
          <DialogTitle>
            <div className="bg-gradient-to-r from-purple-800 to-indigo-800 p-4 text-center relative border-b border-purple-400/30">
              <h2 className="text-white text-xl font-bold">Información</h2>
            </div>
          </DialogTitle>
        </DialogHeader>
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="flex gap-6">
            {/* Left Column - Pokemon Card */}
            <div className="w-1/2">
              <div className="bg-gradient-to-br from-purple-800/20 via-indigo-800/20 to-blue-800/20 backdrop-blur-sm rounded-2xl p-4 border border-purple-400/30 h-fit">
                {/* Pokemon Image */}
                <div className="flex justify-center mb-4">
                  <div className="relative">
                    {isShiny && (
                      <FaStar className="absolute -top-2 -left-2 text-yellow-400 text-lg z-10" />
                    )}
                    <PokemonImage
                      itemId={
                        isFromPC 
                          ? createPokemonSpec({
                              species: pokemonData.species,
                              form: pokemonData.form,
                              palette: pokemonData.palette || 'none',
                              level: pokemonData.level
                            })
                          : createPokemonSpecFromTeam(teamPokemon!)
                      }
                      size={150}
                    />
                  </div>
                </div>

                <div className="text-center">
                  <h4 className="text-xl font-bold text-white mb-1">
                    {pokemonData.name || pokemonData.species}
                  </h4>
                  <p className="text-purple-200 text-sm mb-4">Nv. {pokemonData.level}</p>
                  {/* Types display with image and color */}
                  <div className="flex justify-center gap-2 mb-4">
                    {types.filter((t: string) => t).map((type: string, idx: number) => {
                      const color = typeColors[type.toLowerCase()]?.backgroundColor || '#9fa19f';
                      return (
                        <div key={type} className="relative flex items-center justify-center">
                          <div style={{backgroundColor: color, borderColor: color}} className="w-12 h-12 rounded-full border-2 flex items-center justify-center shadow">
                            <img src={`/smartrotom/img/types/${type}.png`} alt={type} className="w-8 h-8" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-center mb-4">
                    <div className="bg-purple-500/50 rounded-full p-2">
                      {getGenderIcon(pokemonData.gender)}
                    </div>
                  </div>
                  <div className="space-y-2 text-sm text-white">
                    <div><span className="font-semibold">Naturaleza:</span> {t(`pokedex.nature_${pokemonData.nature.toLowerCase()}`)}</div>
                    <div><span className="font-semibold">Habilidad:</span> {t(`pokedex.ability_${pokemonData.ability.replaceAll(' ', '')}`)}</div>
                    {pokemonData.item && pokemonData.item !== 'item.minecraft.air' && (
                      <div><span className="font-semibold">Objeto:</span> {t(`pokedex.item_${pokemonData.item.toLowerCase().replaceAll(' ', '_')}`)}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Stats and other info */}
            <div className="w-1/2 space-y-6">
              {/* Stats Section */}
              <div>
                <h3 className="text-lg font-bold text-purple-300 mb-4 flex items-center">
                  STATS
                </h3>
                <div className="space-y-2">
                  {pokemonData.stats.map((stat, index) => (
                    <div key={index} className="flex items-center">
                      <div className="w-24 text-right text-sm text-purple-200 font-medium">
                        {getStatName(index)}
                      </div>
                      <div className="w-12 text-center text-sm font-bold text-white ml-4">
                        {stat}
                      </div>
                      <div className="flex-1 ml-4">
                        <div className="bg-purple-900/30 rounded-full h-3">
                          <div 
                            className={`${getStatBarColor(index)} h-3 rounded-full transition-all duration-300`}
                            style={{ width: `${Math.min((stat / 255) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Type Effectiveness Section */}
              <div>
                <h3 className="text-lg font-bold text-yellow-300 mb-4">
                  DEBILIDADES Y RESISTENCIAS
                </h3>
                <div className="flex flex-wrap gap-3 justify-start">
                  {/* Weaknesses */}
                  {weaknesses.map((weakness, index) => {
                    const type = weakness.type.toLowerCase();
                    const color = typeColors[type]?.backgroundColor || '#e62829';
                    return (
                      <div key={`weakness-${index}`} className="relative flex items-center justify-center">
                        <div style={{backgroundColor: color, borderColor: '#e62829'}} className="w-12 h-12 rounded-full border-2 flex items-center justify-center shadow">
                          <img src={`/smartrotom/img/types/${type}.png`} alt={type} className="w-8 h-8" />
                        </div>
                        <span className="absolute top-0 right-0 text-xs rounded-full w-8 h-8 flex items-center justify-center border border-white" style={{backgroundColor: '#e62829', color: 'white', transform: 'translate(35%,-35%)'}}>
                          ×{Number(weakness.effectiveness)}
                        </span>
                      </div>
                    );
                  })}
                  {/* Resistances */}
                  {resistances.map((resistance, index) => {
                    const type = resistance.type.toLowerCase();
                    const color = typeColors[type]?.backgroundColor || '#3fa129';
                    let symbol = '';
                    if (resistance.effectiveness === 0.5) symbol = '½';
                    else if (resistance.effectiveness === 0.25) symbol = '¼';
                    else if (resistance.effectiveness === 0.33) symbol = '⅓';
                    else if (resistance.effectiveness === 0.66) symbol = '⅔';
                    else symbol = resistance.effectiveness < 1 ? `1/${Math.round(1/resistance.effectiveness)}` : String(resistance.effectiveness);
                    return (
                      <div key={`resistance-${index}`} className="relative flex items-center justify-center">
                        <div style={{backgroundColor: color, borderColor: '#3fa129'}} className="w-12 h-12 rounded-full border-2 flex items-center justify-center shadow">
                          <img src={`/smartrotom/img/types/${type}.png`} alt={type} className="w-8 h-8" />
                        </div>
                        <span className="absolute top-0 right-0 text-base rounded-full w-8 h-8 flex items-center justify-center border border-white" style={{backgroundColor: '#3fa129', color: 'white', transform: 'translate(35%,-35%)'}}>
                          ×{symbol}
                        </span>
                      </div>
                    );
                  })}
                  {/* Immunities */}
                  {immunities.map((immunity, index) => {
                    const type = immunity.type.toLowerCase();
                    const color = typeColors[type]?.backgroundColor || '#9fa19f';
                    return (
                      <div key={`immunity-${index}`} className="relative flex items-center justify-center">
                        <div style={{backgroundColor: color, borderColor: '#9fa19f'}} className="w-12 h-12 rounded-full border-2 flex items-center justify-center shadow">
                          <img src={`/smartrotom/img/types/${type}.png`} alt={type} className="w-8 h-8" />
                        </div>
                        <span className="absolute top-0 right-0 text-xs rounded-full w-8 h-8 flex items-center justify-center border border-white" style={{backgroundColor: '#9fa19f', color: 'white', transform: 'translate(35%,-35%)'}}>
                          ×0
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section - Moves */}
          <div className="mt-6">
            <h3 className="text-lg font-bold text-purple-300 mb-4">
              MOVIMIENTOS
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {pokemonData.moves.map((move, index) => (
                <div key={index} className="relative">
                  <div className={`rounded-xl p-4 text-white font-semibold text-center shadow-md flex items-center justify-between bg-gradient-to-br from-purple-800/40 via-indigo-800/40 to-blue-800/40 border border-purple-400/20`}>
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                        <div className="w-4 h-4 bg-white/40 rounded-full"></div>
                      </div>
                      <span className="text-sm">{move ? (t(`pokedex.attack_${move.toLowerCase().replaceAll(' ', '_')}`)) : ' - '}</span>
                    </div>
                    <div className="bg-white/20 rounded p-1">
                      <div className="w-4 h-4 bg-white/40 rounded"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}