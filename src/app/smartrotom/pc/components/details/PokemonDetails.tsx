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
import { PiArchive, PiInfo } from 'react-icons/pi'
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
      <DialogContent className="max-w-7xl p-0 bg-gray-300 border-4 border-black overflow-hidden">
        <DialogHeader>
          <DialogTitle>
            <div className="bg-gray-400 border-b-4 border-black p-4">
              <div className="flex items-center justify-center space-x-16">
                {/* Navigation Buttons - Left */}
                <div className="flex items-center space-x-2">
                  {isFromPC && onNavigatePrevious && (
                    <button
                      onClick={onNavigatePrevious}
                      disabled={!canNavigatePrevious}
                      className={`p-2 border-2 transition-all duration-150 active:scale-95 ${
                        canNavigatePrevious 
                          ? 'bg-gray-600 hover:bg-gray-500 border-gray-500 hover:border-gray-400 text-white' 
                          : 'bg-gray-700 border-gray-600 text-gray-400 cursor-not-allowed'
                      }`}
                      title="POKÉMON ANTERIOR (← LEFT ARROW)"
                    >
                      <FaChevronLeft className="text-sm" />
                    </button>
                  )}
                </div>

                {/* Title */}
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-3 mb-1">
                    <div className="w-8 h-8 bg-black border-2 border-gray-600 flex items-center justify-center">
                      <PiInfo className="text-white text-lg" />
                    </div>
                    <h2 className="text-black font-mono font-bold text-xl">INFORMACIÓN DEL POKÉMON</h2>
                  </div>
                  {isFromPC && (
                    <div className="flex items-center justify-center space-x-2">
                      <PiArchive className="text-gray-700 text-sm" />
                      <p className="text-gray-700 font-mono text-sm">
                        CAJA {pokemon!.box + 1} • SLOT {pokemon!.index + 1}
                      </p>
                    </div>
                  )}
                </div>

                {/* Navigation Buttons - Right */}
                <div className="flex items-center space-x-2">
                  {isFromPC && onNavigateNext && (
                    <button
                      onClick={onNavigateNext}
                      disabled={!canNavigateNext}
                      className={`p-2 border-2 transition-all duration-150 active:scale-95 ${
                        canNavigateNext 
                          ? 'bg-gray-600 hover:bg-gray-500 border-gray-500 hover:border-gray-400 text-white' 
                          : 'bg-gray-700 border-gray-600 text-gray-400 cursor-not-allowed'
                      }`}
                      title="SIGUIENTE POKÉMON (→ RIGHT ARROW)"
                    >
                      <FaChevronRight className="text-sm" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="p-6 overflow-y-auto max-h-[85vh] bg-gray-100">
          <div className="space-y-6">
            <div className="grid grid-cols-5 gap-6">
              <div className="col-span-2">
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
              
              <div className="col-span-3">
                <PokemonStats 
                  stats={pokemonData.stats} 
                  ivs={pokemonData.ivs} 
                  evs={pokemonData.evs} 
                />
              </div>
            </div>

                <PokemonTypeEffectiveness 
                  weaknesses={weaknesses} 
                  resistances={resistances} 
                  immunities={immunities} 
                />
              
                <PokemonMoves moves={pokemonData.moves} />

          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}