import { PCPokemon } from '@/types/dto/pc-pokemon.dto'
import { PokemonW } from '@/generated/api'
import { PokemonCard } from './PokemonCard';
import { PokemonStats } from './PokemonStats';
import { PokemonTypeEffectiveness } from './PokemonTypeEffectiveness';
import { PokemonMoves } from './PokemonMoves';
import { getPokemonDefense } from '../../../pokedex/dexUtils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/primitives/dialog";
import { useTranslations } from 'next-intl'
import { FaChevronLeft, FaChevronRight, FaTimes } from 'react-icons/fa'
import { useEffect } from 'react'

interface PokemonDetailsProps {
  pokemon?: PCPokemon | null;
  teamPokemon?: PokemonW | null;
  onClose: () => void;
  onNavigatePrevious?: () => void;
  onNavigateNext?: () => void;
  canNavigatePrevious?: boolean;
  canNavigateNext?: boolean;
}

export default function PokemonDetails({ 
  pokemon, 
  teamPokemon, 
  onClose, 
  onNavigatePrevious, 
  onNavigateNext,
  canNavigatePrevious = false,
  canNavigateNext = false 
}: PokemonDetailsProps) {
  const t = useTranslations();

  // Determine which pokemon data to use
  const activePokemon = pokemon || teamPokemon
  if (!activePokemon) return null

  // Get pokemon data based on type - normalize the structure
  const pokemonData = pokemon ? {
    ...pokemon.pokemon,
    moves: pokemon.pokemon.moves.filter(move => move !== null)
  } : {
    ...teamPokemon!,
    // TeamPokemon now has types array directly
    types: teamPokemon!.types || [],
    gender: teamPokemon!.gender,
    evs: teamPokemon!.evs,
    ivs: teamPokemon!.ivs,
    stats: teamPokemon!.stats,
    hp: teamPokemon!.hp,
    status: teamPokemon!.status
  }

  const isFromTeam = !!teamPokemon
  const isFromPC = !!pokemon

  // Get types from pokemon data - now available for both PC and Team pokemon
  const types: string[] = pokemonData.types || ['normal'];
  
  // Helper to get type color for effectiveness chips
    const isShiny = pokemonData.palette === 'shiny';
    // Calculate HP percentage for team Pokemon
    const maxHP = pokemonData.stats?.[0] || 0;
    const currentHP = isFromTeam ? pokemonData.hp || 0 : maxHP;
    const hpPercentage = maxHP > 0 ? (currentHP / maxHP) * 100 : 0;
    const isFainted = pokemonData.status?.toLowerCase() === 'fainted' || currentHP === 0;

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
    };
    const { weaknesses, resistances, immunities } = getTypeEffectiveness();

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft' && isFromPC && onNavigatePrevious && canNavigatePrevious) {
        event.preventDefault();
        onNavigatePrevious();
      } else if (event.key === 'ArrowRight' && isFromPC && onNavigateNext && canNavigateNext) {
        event.preventDefault();
        onNavigateNext();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFromPC, onNavigatePrevious, onNavigateNext, canNavigatePrevious, canNavigateNext, onClose]);

  return (
      <Dialog open={true} onOpenChange={open => { if (!open) onClose(); }}>
        <DialogContent className="max-w-5xl p-0 bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 rounded-2xl shadow-2xl border-2 border-purple-400/30 overflow-hidden">
          <DialogHeader>
            <DialogTitle>
              <div className="bg-gradient-to-r from-purple-800 to-indigo-800 p-4 relative border-b border-purple-400/30">
                <div className="flex items-center justify-center">
                  {/* Navigation Buttons - Left */}
                  <div className="flex items-center space-x-2">
                    {isFromPC && onNavigatePrevious && (
                      <button
                        onClick={onNavigatePrevious}
                        disabled={!canNavigatePrevious}
                        className={`p-2 rounded-lg border transition-all duration-200 ${
                          canNavigatePrevious 
                            ? 'bg-purple-600 hover:bg-purple-700 border-purple-400/50 text-white hover:scale-105' 
                            : 'bg-gray-600 border-gray-500 text-gray-400 cursor-not-allowed'
                        }`}
                        title="Pokémon anterior (← flecha izquierda)"
                      >
                        <FaChevronLeft className="text-sm" />
                      </button>
                    )}
                  </div>

                  {/* Title */}
                  <div className="text-center mx-8">
                    <h2 className="text-white text-xl font-bold">Información del Pokémon</h2>
                    {isFromPC && (
                      <p className="text-purple-200 text-sm mt-1">
                        Caja {pokemon!.box + 1} • Posición {pokemon!.index + 1}
                      </p>
                    )}
                  </div>

                  {/* Navigation Buttons - Right */}
                  <div className="flex items-center space-x-2">
                    {isFromPC && onNavigateNext && (
                      <button
                        onClick={onNavigateNext}
                        disabled={!canNavigateNext}
                        className={`p-2 rounded-lg border transition-all duration-200 ${
                          canNavigateNext 
                            ? 'bg-purple-600 hover:bg-purple-700 border-purple-400/50 text-white hover:scale-105' 
                            : 'bg-gray-600 border-gray-500 text-gray-400 cursor-not-allowed'
                        }`}
                        title="Siguiente Pokémon"
                      >
                        <FaChevronRight className="text-sm" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="p-6 overflow-y-auto h-[85vh]">
            <div className="flex gap-6">
              {/* Left Column - Pokemon Card */}
              <div className="w-1/2">
                <PokemonCard
                  pokemonData={pokemonData}
                  isFromTeam={isFromTeam}
                  isFromPC={isFromPC}
                  isShiny={isShiny}
                  isFainted={isFainted}
                  currentHP={currentHP}
                  maxHP={maxHP}
                  hpPercentage={hpPercentage}
                  types={types}
                />
              </div>
              {/* Right Column - Stats and other info */}
              <div className="w-1/2 space-y-6">
                <PokemonStats stats={pokemonData.stats} ivs={pokemonData.ivs} evs={pokemonData.evs} />
                <PokemonTypeEffectiveness weaknesses={weaknesses} resistances={resistances} immunities={immunities} />
              </div>
            </div>
            <PokemonMoves moves={pokemonData.moves} />
          </div>
        </DialogContent>
      </Dialog>
  )
}