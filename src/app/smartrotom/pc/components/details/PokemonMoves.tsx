import { PokemonTypeIcon } from '@/components/common/pokemon/PokemonTypeIcon';
import { useTranslations } from 'next-intl';
import { PiSwordFill, PiSparkle, PiGear } from 'react-icons/pi';

interface PokemonMovesProps {
  moves: any[];
}

export function PokemonMoves({ moves }: PokemonMovesProps) {
  const t = useTranslations();
  
  const getMoveTypeColor = (moveType: string) => {
    const moveTypeColors: { [key: string]: string } = {
      physical: 'bg-red-900 border-red-700',
      special: 'bg-blue-900 border-blue-700',
      status: 'bg-slate-900 border-slate-700'
    };
    return moveTypeColors[moveType?.toLowerCase()] || 'bg-purple-900 border-purple-700';
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

  return (
    <div className="bg-white border-4 border-black overflow-hidden">
      {/* Header */}
      <div className="bg-gray-300 border-b-4 border-black p-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-black border-2 border-gray-600 flex items-center justify-center">
            <PiSwordFill className="text-white text-lg" />
          </div>
          <div>
            <h3 className="text-black font-mono font-bold text-lg">MOVIMIENTOS</h3>
            <p className="text-gray-700 font-mono text-sm">
              {moves.filter(m => m).length}/4 MOVIMIENTOS APRENDIDOS
            </p>
          </div>
        </div>
      </div>

      {/* Moves Grid */}
      <div className="p-4">
        {moves.length === 0 ? (
          <div className="text-center text-gray-700 py-8">
            <div className="w-12 h-12 mx-auto mb-4 bg-white border-2 border-black flex items-center justify-center">
              <PiSwordFill className="text-2xl opacity-50" />
            </div>
            <h4 className="font-mono font-bold mb-2">SIN MOVIMIENTOS</h4>
            <p className="font-mono text-xs text-gray-600">ESTE POKÉMON NO TIENE MOVIMIENTOS REGISTRADOS</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }, (_, index) => {
              const move = moves[index];
              const IconComponent = move ? getMoveIcon(move.category) : PiGear;
              
              return (
                <div
                  key={index}
                  className="relative"
                >
                  <div className={`border-4 p-3 text-black font-mono overflow-hidden ${
                    move ? 'bg-white border-black' : 'bg-gray-200 border-gray-600'
                  }`}>
                    {/* Move Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2 min-w-0">
                        {move?.type && (
                          <div className="bg-white border-2 border-black p-1">
                            <PokemonTypeIcon type={move.type} size={20}/>
                          </div>
                        )}
                        <span className="text-xs font-bold truncate">
                          {move ? t(`pokedex.attack_${move.name.toLowerCase().replaceAll(' ', '_')}`) : `SLOT ${index + 1}`}
                        </span>
                      </div>
                      
                      {move?.category && (
                        <div className="flex items-center space-x-1 bg-gray-300 border-2 border-black px-2 py-1">
                          <IconComponent className="text-xs" />
                          <span className="text-xs font-bold">
                            {getCategoryName(move.category)}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Move Stats */}
                    {move ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-gray-200 border border-black p-1">
                            <div className="text-xs text-gray-700 font-mono">POTENCIA:</div>
                            <div className="text-xs text-black font-mono font-bold">{move.power || '-'}</div>
                          </div>
                          <div className="bg-gray-200 border border-black p-1">
                            <div className="text-xs text-gray-700 font-mono">PRECISIÓN:</div>
                            <div className="text-xs text-black font-mono font-bold">
                              {move.accuracy && move.accuracy > 0 ? `${move.accuracy}%` : '-'}
                            </div>
                          </div>
                        </div>
                        
                        {/* PP Info if available */}
                        {move.pp && (
                          <div className="bg-gray-200 border border-black p-1">
                            <div className="text-xs text-gray-700 font-mono">PP:</div>
                            <div className="text-xs text-black font-mono font-bold">{move.pp}</div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <PiGear className="text-gray-500 text-2xl mx-auto mb-2 opacity-50" />
                        <span className="text-gray-600 font-mono text-xs">VACÍO</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}