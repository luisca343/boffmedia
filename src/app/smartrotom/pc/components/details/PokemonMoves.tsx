import { PokemonTypeIcon } from '@/components/common/pokemon/PokemonTypeIcon';
import { useTranslations } from 'next-intl';

interface PokemonMovesProps {
  moves: any[];
}

export function PokemonMoves({ moves }: PokemonMovesProps) {
  const t = useTranslations();
  const getMoveTypeColor = (moveType: string) => {
    const moveTypeColors: { [key: string]: string } = {
      physical: 'from-red-600 to-red-700',
      special: 'from-blue-600 to-blue-700',
      status: 'from-gray-600 to-gray-700'
    };
    return moveTypeColors[moveType?.toLowerCase()] || 'from-purple-600 to-purple-700';
  };
  return (
    <div className="mt-6">
      <h3 className="text-lg font-bold text-purple-300 mb-4">MOVIMIENTOS</h3>
      <div className="grid grid-cols-2 gap-4">
        {moves.slice(0, 4).map((move, index) => (
          <div key={index} className="relative">
            <div className={`rounded-xl p-2 text-white font-semibold shadow-md border border-purple-400/20 bg-gradient-to-br ${move ? getMoveTypeColor(move.category) : 'from-gray-600 to-gray-700'}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <PokemonTypeIcon key={move?.type} type={move?.type} size={24}/>
                  <span className="text-sm font-medium">{move ? (t(`pokedex.attack_${move.name.toLowerCase().replaceAll(' ', '_')}`)) : 'Vacío'}</span>
                </div>
                {move?.category && (
                  <div className="bg-white/20 rounded px-2 py-1">
                    <span className="text-xs uppercase font-bold">{move.category === 'PHYSICAL' ? 'FÍS' : move.category === 'SPECIAL' ? 'ESP' : 'EST'}</span>
                  </div>
                )}
              </div>
              {move && (
                <div className="flex justify-between text-xs text-gray-200">
                  <span>Poder: {move.power || '-'}</span>
                  <span>Precisión: {move.accuracy && move.accuracy > 0 ? move.accuracy : '-'}%</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
