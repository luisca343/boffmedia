import { PokemonW } from '@/generated/api'
import { TeamSlot } from './TeamSlot';
import { PiUsers, PiInfo } from 'react-icons/pi';
import { SortableContext } from '@dnd-kit/sortable'
import { noReorderStrategy, stablePositionStrategy } from '@/lib/drag-and-drop';

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
    <div className="bg-white border-4 border-black h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-gray-300 border-b-4 border-black p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-black border-2 border-gray-600 flex items-center justify-center">
                <PiUsers className="text-white text-lg" />
              </div>
              <div>
                <h3 className="text-black font-mono font-bold text-lg">CURRENT TEAM</h3>
                <p className="text-gray-700 font-mono text-xs">
                  {teamData.length}/6 POKEMON IN PARTY
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Team Slots */}
        <SortableContext items={slotIds} strategy={stablePositionStrategy}>
          <div className="flex flex-col justify-between flex-1 p-3 space-y-2 overflow-hidden">
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
                  <div className="absolute left-2 top-2 w-4 h-4 bg-white border border-black flex items-center justify-center">
                    <span className="text-black text-xs font-mono font-bold">{index + 1}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </SortableContext>

        {/* Footer Info */}
        <div className="bg-gray-300 border-t-4 border-black p-2">
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-2">
              <PiInfo className="text-black text-sm" />
              <span className="text-black font-mono text-xs">
                DRAG POKEMON TO REORGANIZE PARTY
              </span>
            </div>
          </div>
        </div>
        
      </div>
  )
}