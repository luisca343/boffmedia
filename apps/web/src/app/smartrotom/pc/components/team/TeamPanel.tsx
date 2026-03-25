import { PokemonW } from '@boffmedia/shared'
import { TeamSlot } from './TeamSlot';
import { PiUsers, PiInfo } from 'react-icons/pi';
import { SortableContext } from '@dnd-kit/sortable'
import { stablePositionStrategy } from '@/lib/drag-and-drop';

interface TeamPanelProps {
  teamData: (PokemonW | null)[];
  selectedPokemon: PokemonW | null;
  onPokemonClick: (pokemon: PokemonW | null) => void;
  onPokemonMove: (
    source: { type: 'box' | 'team', boxNumber?: number, index: number },
    destination: { type: 'box' | 'team', boxNumber?: number, index: number }
  ) => void;
}

export default function TeamPanel({ 
  teamData, 
  selectedPokemon, 
  onPokemonClick,
  onPokemonMove 
}: TeamPanelProps) {
  const teamSlots = Array.from({ length: 6 }, (_, index) => teamData[index] || null)

  // Generate slot IDs for sortable context
  const slotIds = teamSlots.map((_, index) => `team-slot-${index}`)

  return (
    <div className="bg-slate-900/40 backdrop-blur-sm rounded-b-2xl border border-slate-500/30 border-t-0 shadow-2xl h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="hidden 2xl:block relative bg-gradient-to-r from-slate-800/80 to-slate-700/80 p-3 border-b border-slate-500/30 flex-shrink-0">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/10 pointer-events-none" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-green-500/20 rounded-xl flex items-center justify-center border border-white/20 backdrop-blur-sm">
              <PiUsers className="text-white text-xl" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Equipo Actual</h3>
              <p className="text-slate-300 text-sm font-medium">
                {teamData.length}/6 Pokémon en el equipo
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Team Slots */}
      <SortableContext items={slotIds} strategy={stablePositionStrategy}>
        <div className="flex flex-col justify-between flex-1 p-4 space-y-3 overflow-hidden">
          {teamSlots.map((pokemon, index) => (
            <div
              key={index}
              className="relative"
            >
              <TeamSlot
                id={`team-slot-${index}`}
                pokemon={pokemon}
                index={index}
                isSelected={selectedPokemon === pokemon}
                onClick={() => onPokemonClick(pokemon)}
              />
              {!pokemon && (
                <div className="absolute left-2 top-2 w-5 h-5 bg-slate-700/50 border border-slate-500/30 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <span className="text-slate-400 text-xs font-bold">{index + 1}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </SortableContext>

      {/* Footer Info */}
      <div className="hidden 2xl:block relative p-3 mt-auto flex-shrink-0 bg-slate-800/50 border-t border-slate-500/30">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-green-500/5 pointer-events-none" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <PiInfo className="text-slate-400 text-sm" />
            <span className="text-slate-300 text-xs font-medium">
              Arrastra Pokémon para reorganizar el equipo
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}