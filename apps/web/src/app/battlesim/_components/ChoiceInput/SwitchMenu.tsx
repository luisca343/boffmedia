'use client';

import { Protocol } from '@pkmn/protocol';

interface SwitchMenuProps {
  request: Protocol.Request;
  makeChoice: (choice: string) => void;
}

interface PokemonSlot {
  ident: string;
  details: string;
  condition: string;
  active: boolean;
  stats: { atk: number; def: number; spa: number; spd: number; spe: number };
  moves: string[];
}

function parseHpPercent(condition: string): number {
  if (condition.includes('fnt')) return 0;
  const parts = condition.split('/');
  if (parts.length !== 2) return 100;
  const current = parseInt(parts[0]);
  const max = parseInt(parts[1]);
  if (isNaN(current) || isNaN(max) || max === 0) return 100;
  return Math.round((current / max) * 100);
}

function parseStatus(condition: string): string | null {
  if (condition.includes('fnt')) return 'FNT';
  const parts = condition.split(' ');
  if (parts.length > 1) {
    const status = parts[1];
    const statusMap: Record<string, string> = {
      psn: 'PSN', tox: 'TOX', brn: 'BRN', par: 'PAR', slp: 'SLP', frz: 'FRZ',
    };
    return statusMap[status] || status.toUpperCase();
  }
  return null;
}

function getHpBarColor(percent: number): string {
  if (percent > 50) return 'bg-green-500';
  if (percent > 20) return 'bg-yellow-500';
  return 'bg-red-500';
}

function getSpeciesName(ident: string): string {
  // ident format: "p1: PokemonName"
  const parts = ident.split(': ');
  return parts[1] || ident;
}

export function SwitchMenu({ request, makeChoice }: SwitchMenuProps) {
  if (!request.side?.pokemon) return null;

  const pokemon = request.side.pokemon;

  return (
    <div className="flex flex-col gap-2 p-3 bg-card rounded-lg border shadow-sm">
      <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
        Switch a Pokémon
      </div>
      <div className="flex flex-col gap-1.5">
        {pokemon.map((poke: PokemonSlot, index: number) => {
          const isActive = poke.active;
          const isFainted = poke.condition.includes('fnt');
          const isDisabled = isActive || isFainted;
          const hpPercent = parseHpPercent(poke.condition);
          const status = parseStatus(poke.condition);
          const speciesName = getSpeciesName(poke.ident);

          return (
            <button
              key={poke.ident}
              onClick={() => !isDisabled && makeChoice(`switch ${index + 1}`)}
              disabled={isDisabled}
              className={`
                flex items-center gap-3 p-2 rounded-md border transition-all
                ${isDisabled
                  ? 'opacity-40 cursor-not-allowed bg-muted'
                  : 'hover:bg-accent cursor-pointer active:scale-[0.98]'
                }
                ${isActive ? 'ring-2 ring-primary' : ''}
              `}
            >
              {/* Pokemon info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm truncate">{speciesName}</span>
                  {isActive && (
                    <span className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full font-medium">
                      Active
                    </span>
                  )}
                  {status && (
                    <span className={`
                      text-[10px] px-1.5 py-0.5 rounded-full font-medium
                      ${status === 'FNT' ? 'bg-gray-500 text-white' :
                        status === 'PSN' || status === 'TOX' ? 'bg-purple-500 text-white' :
                        status === 'BRN' ? 'bg-orange-500 text-white' :
                        status === 'PAR' ? 'bg-yellow-500 text-black' :
                        status === 'SLP' ? 'bg-gray-400 text-white' :
                        status === 'FRZ' ? 'bg-cyan-400 text-black' :
                        'bg-gray-400 text-white'}
                    `}>
                      {status}
                    </span>
                  )}
                </div>

                {/* HP Bar */}
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${getHpBarColor(hpPercent)}`}
                      style={{ width: `${hpPercent}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-10 text-right">
                    {isFainted ? '0%' : `${hpPercent}%`}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
