
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
    if (effectiveness === 0) return '×0';
    if (effectiveness === 0.25) return '¼';
    if (effectiveness === 0.5) return '½';
    if (effectiveness === 0.33) return '⅓';
    if (effectiveness === 0.66) return '⅔';
    if (effectiveness < 1) return `1/${Math.round(1/effectiveness)}`;
    return `×${effectiveness}`;
  };

  const hasAnyEffectiveness = weaknesses.length > 0 || resistances.length > 0 || immunities.length > 0;

  return (
    <div className="bg-slate-900/40 backdrop-blur-sm rounded-2xl border border-slate-500/30 shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="relative bg-gradient-to-r from-slate-800/80 to-slate-700/80 p-4 border-b border-slate-500/30">
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 via-transparent to-red-500/5 pointer-events-none" />
        <div className="relative flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-yellow-500/20 to-red-500/20 rounded-xl flex items-center justify-center border border-white/20 backdrop-blur-sm">
            <PiShield className="text-yellow-300 text-xl" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Efectividad de Tipos</h3>
            <p className="text-slate-300 text-sm">Debilidades, resistencias e inmunidades</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {!hasAnyEffectiveness ? (
          <div className="text-center text-slate-400 py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-slate-700/30 rounded-2xl flex items-center justify-center">
              <PiShield className="text-3xl opacity-50" />
            </div>
            <h4 className="text-lg font-semibold mb-2">Sin modificadores de tipo</h4>
            <p className="text-sm text-slate-500">Este Pokémon no tiene ventajas o desventajas especiales</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Weaknesses */}
            {weaknesses.length > 0 && (
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <PiShieldWarning className="text-red-400 text-lg" />
                  <h4 className="text-red-400 font-semibold">Débil a</h4>
                  <div className="h-px bg-red-400/30 flex-1" />
                </div>
                <div className="flex flex-wrap gap-3">
                  {weaknesses.map((weakness, index) => {
                    const type = weakness.type.toLowerCase();
                    return (
                      <div key={`weakness-${index}`} className="relative flex items-center justify-center">
                        <div className="relative">
                          <PokemonTypeIcon type={type} size={48} />
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 border-2 border-white rounded-full flex items-center justify-center shadow-lg">
                            <span className="text-white text-xs font-bold">
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
                  <PiShieldCheck className="text-green-400 text-lg" />
                  <h4 className="text-green-400 font-semibold">Resiste a</h4>
                  <div className="h-px bg-green-400/30 flex-1" />
                </div>
                <div className="flex flex-wrap gap-3">
                  {resistances.map((resistance, index) => {
                    const type = resistance.type.toLowerCase();
                    return (
                      <div key={`resistance-${index}`} className="relative flex items-center justify-center">
                        <div className="relative">
                          <PokemonTypeIcon type={type} size={48} />
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 border-2 border-white rounded-full flex items-center justify-center shadow-lg">
                            <span className="text-white text-xs font-bold">
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
                  <PiShield className="text-slate-400 text-lg" />
                  <h4 className="text-slate-400 font-semibold">Inmune a</h4>
                  <div className="h-px bg-slate-400/30 flex-1" />
                </div>
                <div className="flex flex-wrap gap-3">
                  {immunities.map((immunity, index) => {
                    const type = immunity.type.toLowerCase();
                    return (
                      <div key={`immunity-${index}`} className="relative flex items-center justify-center">
                        <div className="relative opacity-60">
                          <PokemonTypeIcon type={type} size={48} />
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-slate-600 border-2 border-white rounded-full flex items-center justify-center shadow-lg">
                            <span className="text-white text-xs font-bold">×0</span>
                          </div>
                          {/* Strikethrough effect */}
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-12 h-0.5 bg-slate-400 transform rotate-45" />
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