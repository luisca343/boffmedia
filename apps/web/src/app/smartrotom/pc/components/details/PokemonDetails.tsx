import { PCPokemon, ExtendedPokemonW } from '@/types/dto/pc-pokemon.dto'
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
import { motion } from 'framer-motion'

interface PokemonDetailsProps {
  pokemon?: PCPokemon | null;
  teamPokemon?: ExtendedPokemonW | null;
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

  // Keyboard navigation - must be called before any early returns
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft' && pokemon && onNavigatePrevious && canNavigatePrevious) {
        event.preventDefault();
        onNavigatePrevious();
      } else if (event.key === 'ArrowRight' && pokemon && onNavigateNext && canNavigateNext) {
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
  }, [pokemon, onNavigatePrevious, onNavigateNext, canNavigatePrevious, canNavigateNext, onClose]);

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
    const maxHP = Number(pokemonData.stats?.[0] || 0);
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

  return (
    <Dialog open={true} onOpenChange={open => { if (!open) onClose(); }}>
      <DialogContent className="max-w-7xl p-0 bg-slate-900/40  border border-slate-500/30 overflow-hidden">
        <DialogHeader>
          <DialogTitle>
            <div className="relative bg-gradient-to-r from-slate-800/80 to-slate-700/80 p-4 border-b border-slate-500/30">
              {/* Background pattern */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 pointer-events-none" />
              <div className="relative flex items-center justify-center space-x-16">
                {/* Navigation Buttons - Left */}
                <div className="flex items-center space-x-2">
                  {isFromPC && onNavigatePrevious && (
                    <motion.button
                      onClick={onNavigatePrevious}
                      disabled={!canNavigatePrevious}
                      className={`p-3 rounded-xl border backdrop-blur-sm transition-all duration-200 ${
                        canNavigatePrevious 
                          ? 'bg-purple-600/20 hover:bg-purple-600/30 border-purple-400/50 text-white hover:scale-105' 
                          : 'bg-slate-600/20 border-slate-500/30 text-slate-400 cursor-not-allowed'
                      }`}
                      title="Pokémon anterior (← flecha izquierda)"
                      whileHover={canNavigatePrevious ? { scale: 1.05 } : {}}
                      whileTap={canNavigatePrevious ? { scale: 0.95 } : {}}
                    >
                      <FaChevronLeft className="text-sm" />
                    </motion.button>
                  )}
                </div>

                {/* Title */}
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-3 mb-1">
                    <h2 className="text-white text-xl font-bold">Información del Pokémon</h2>
                  </div>
                  {isFromPC && (
                    <div className="flex items-center justify-center space-x-2">
                      <PiArchive className="text-purple-300 text-sm" />
                      <p className="text-purple-200 text-sm">
                        Caja {pokemon!.box + 1} • Posición {pokemon!.index + 1}
                      </p>
                    </div>
                  )}
                </div>

                {/* Navigation Buttons - Right */}
                <div className="flex items-center space-x-2">
                  {isFromPC && onNavigateNext && (
                    <motion.button
                      onClick={onNavigateNext}
                      disabled={!canNavigateNext}
                      className={`p-3 rounded-xl border backdrop-blur-sm transition-all duration-200 ${
                        canNavigateNext 
                          ? 'bg-purple-600/20 hover:bg-purple-600/30 border-purple-400/50 text-white hover:scale-105' 
                          : 'bg-slate-600/20 border-slate-500/30 text-slate-400 cursor-not-allowed'
                      }`}
                      title="Siguiente Pokémon (→ flecha derecha)"
                      whileHover={canNavigateNext ? { scale: 1.05 } : {}}
                      whileTap={canNavigateNext ? { scale: 0.95 } : {}}
                    >
                      <FaChevronRight className="text-sm" />
                    </motion.button>
                  )}
                </div>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="p-6 overflow-y-auto max-h-[85vh]">
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