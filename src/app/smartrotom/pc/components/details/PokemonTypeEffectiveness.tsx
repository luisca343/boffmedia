import { colors as typeColors } from '@/app/smartrotom/pokedex/entrada/[[...params]]/_components/TypeBadge';
import { PokemonTypeIcon } from '@/components/common/pokemon/PokemonTypeIcon';

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
  return (
    <div>
      <h3 className="text-lg font-bold text-yellow-300 mb-4">DEBILIDADES Y RESISTENCIAS</h3>
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
              <PokemonTypeIcon type={type} />
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
  );
}
