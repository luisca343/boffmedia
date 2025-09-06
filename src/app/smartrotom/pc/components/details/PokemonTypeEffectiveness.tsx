import { colors as typeColors } from '@/app/smartrotom/pokedex/entrada/[[...params]]/_components/TypeBadge';
import { PokemonTypeIcon } from '@/components/common/pokemon/PokemonTypeIcon';
import { PiShield, PiShieldWarning, PiShieldCheck } from 'react-icons/pi';

interface Effectiveness {
  type: string;
  effectiveness: number;
}

interface PokemonTypeEffectivenessProps {
  weaknesses: Effectiveness[];
  resistances: Effectiveness[];
  immunities: Effectiveness[];
}

export function PokemonTypeEffectiveness({ weaknesses, resistances, immunities }: PokemonTypeEffectivenessProps) {
  const getEffectivenessSymbol = (effectiveness: number) => {
    if (effectiveness === 0) return 'x0';
    if (effectiveness === 0.25) return '1/4';
    if (effectiveness === 0.5) return '1/2';
    if (effectiveness === 0.33) return '1/3';
    if (effectiveness === 0.66) return '2/3';
    if (effectiveness < 1) return `1/${Math.round(1/effectiveness)}`;
    return `x${effectiveness}`;
  };

  const hasAnyEffectiveness = weaknesses.length > 0 || resistances.length > 0 || immunities.length > 0;

  return (
    <div className="bg-white border-4 border-black overflow-hidden">
      {/* Header */}
      <div className="bg-gray-300 border-b-4 border-black p-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-black border-2 border-gray-600 flex items-center justify-center">
            <PiShield className="text-white text-lg" />
          </div>
          <div>
            <h3 className="text-black font-mono font-bold text-lg">EFECTIVIDADES DE TIPO</h3>
            <p className="text-gray-700 font-mono text-sm">DEBILIDADES, RESISTENCIAS & INMUNIDADES</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {!hasAnyEffectiveness ? (
          <div className="text-center text-gray-700 py-8">
            <div className="w-12 h-12 mx-auto mb-4 bg-white border-2 border-black flex items-center justify-center">
              <PiShield className="text-2xl opacity-50" />
            </div>
            <h4 className="font-mono font-bold mb-2">NINGÚN MODIFICADOR DE TIPO</h4>
            <p className="font-mono text-xs text-gray-600">ESTE POKÉMON NO TIENE DEBILIDADES, RESISTENCIAS NI INMUNIDADES</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Weaknesses */}
            {weaknesses.length > 0 && (
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <div className="w-6 h-6 bg-black border-2 border-gray-600 flex items-center justify-center">
                    <PiShieldWarning className="text-white text-xs" />
                  </div>
                  <h4 className="text-black font-mono font-bold">DÉBIL A</h4>
                  <div className="h-1 bg-black flex-1" />
                </div>
                <div className="flex flex-wrap gap-3">
                  {weaknesses.map((weakness, index) => {
                    const type = weakness.type.toLowerCase();
                    return (
                      <div key={`weakness-${index}`} className="relative flex items-center justify-center">
                        <div className="relative bg-white border-2 border-black p-2">
                          <PokemonTypeIcon type={type} size={40} />
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-black border-2 border-gray-600 flex items-center justify-center">
                            <span className="text-white text-xs font-mono font-bold">
                              {getEffectivenessSymbol(weakness.effectiveness)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Resistances */}
            {resistances.length > 0 && (
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <div className="w-6 h-6 bg-gray-600 border-2 border-gray-500 flex items-center justify-center">
                    <PiShieldCheck className="text-white text-xs" />
                  </div>
                  <h4 className="text-gray-700 font-mono font-bold">RESISTE</h4>
                  <div className="h-1 bg-gray-600 flex-1" />
                </div>
                <div className="flex flex-wrap gap-3">
                  {resistances.map((resistance, index) => {
                    const type = resistance.type.toLowerCase();
                    return (
                      <div key={`resistance-${index}`} className="relative flex items-center justify-center">
                        <div className="relative bg-white border-2 border-black p-2">
                          <PokemonTypeIcon type={type} size={40} />
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-gray-600 border-2 border-gray-500 flex items-center justify-center">
                            <span className="text-white text-xs font-mono font-bold">
                              {getEffectivenessSymbol(resistance.effectiveness)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Immunities */}
            {immunities.length > 0 && (
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <div className="w-6 h-6 bg-gray-500 border-2 border-gray-400 flex items-center justify-center">
                    <PiShield className="text-white text-xs" />
                  </div>
                  <h4 className="text-gray-600 font-mono font-bold">INMUNE A</h4>
                  <div className="h-1 bg-gray-500 flex-1" />
                </div>
                <div className="flex flex-wrap gap-3">
                  {immunities.map((immunity, index) => {
                    const type = immunity.type.toLowerCase();
                    return (
                      <div key={`immunity-${index}`} className="relative flex items-center justify-center">
                        <div className="relative bg-white border-2 border-black p-2 opacity-60">
                          <PokemonTypeIcon type={type} size={40} />
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-gray-500 border-2 border-gray-400 flex items-center justify-center">
                            <span className="text-white text-xs font-mono font-bold">x0</span>
                          </div>
                          {/* Strikethrough effect - Gen 1 style */}
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-10 h-1 bg-black" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}