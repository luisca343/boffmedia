import { Table, TableRow, TableHeader, TableCell, TableBody, TableHead, TableFooter } from "@/components/ui/table"
import { BattleStats, EvYields, Pokemon } from '@/types/Pokemon'
import PokedexTable, { PokedexCell, PokedexHead, PokedexHeader,PokedexRow } from '../../../_components/PokedexTable'
import { useTranslations } from "next-intl";

export function StatsTable({pokemon, formIndex}: {pokemon: Pokemon, formIndex: number }){
  const t  = useTranslations("");
    const stats = pokemon.forms[formIndex].battleStats ? pokemon.forms[formIndex].battleStats : pokemon.forms[0].battleStats as BattleStats
    if(!stats) return <h1>Stats not found</h1>
    let evYields = pokemon.forms[formIndex].evYields ? pokemon.forms[formIndex].evYields : pokemon.forms[0].evYields as EvYields 
    if(!evYields) evYields = {hp: 0, attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0} as EvYields
    

    const maxStat = 255

    function calculateStat(statName:string, base: number, level: number, iv: number, ev: number, nature: number){
        if(statName === 'HP'){
            return Math.floor((2 * base + iv + Math.floor(ev / 4)) * level / 100 + level + 10)
        } else {
            return Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level / 100 + 5) * nature)
        }
    }


    
    function getColorStat(stat: number){
        let maloInicio = '#ff0000'
        let maloFin = '#ffa500'
    
        let intermedioInicio = '#ffa500'
        let intermedioFin = '#aaff00'
    
        let buenoInicio = '#aaff00'
        let buenoFin = '#00ffc3'
    
        let increibleInicio = '#00ffc3'
        let increibleFin = '#4fc7ff'
    
    
        if(stat < 75){
          return lerpColor(maloInicio, maloFin, stat / 75)
        }else if(stat < 100){
          return lerpColor(intermedioInicio, intermedioFin, (stat - 75) / 25)
        }else if(stat < 140){
          return lerpColor(buenoInicio, buenoFin, (stat - 100) / 40)
        } else {
          return lerpColor(increibleInicio, increibleFin, (stat - 140) / 115)
        }
      }

      function lerpColor(a: string, b: string, amount: number): string {
        const ah = parseInt(a.replace(/#/g, ''), 16);
        const ar = ah >> 16,
          ag = (ah >> 8) & 0xff,
          ab = ah & 0xff;
        const bh = parseInt(b.replace(/#/g, ''), 16);
        const br = bh >> 16,
          bg = (bh >> 8) & 0xff,
          bb = bh & 0xff;
        const rr = ar + amount * (br - ar),
          rg = ag + amount * (bg - ag),
          rb = ab + amount * (bb - ab);
      
        return `#${(((1 << 24) + (rr << 16) + (rg << 8) + rb) | 0).toString(16).slice(1)}`;
      }
    
      return (
        <div className="flex flex-col justify-center items-center text-surface-200 w-full">
          <PokedexTable>
            <PokedexHeader>
              <PokedexRow>
                <PokedexHead> </PokedexHead>
                <PokedexHead >Estadística Base</PokedexHead>
                <PokedexHead colSpan={2} className="text-center">Nivel 50</PokedexHead>
                <PokedexHead colSpan={2} className="text-center">Nivel 100</PokedexHead>
                <PokedexHead className="text-center">PE</PokedexHead>
              </PokedexRow>
            </PokedexHeader>
            <TableBody>
              {Object.keys(stats).map((stat: any) => {
                const statValue = stats[stat as keyof BattleStats]
                return (
                  <PokedexRow key={stat}>
                    <PokedexCell hard className="font-medium w-40">{t(`stat_${stat.toLowerCase()}`)}</PokedexCell>
                    <PokedexCell className="relative p-0 h-10 w-96">
                      <div
                        className="absolute inset-0 flex items-center px-3"
                        style={{
                          width: `${((statValue + 5) / (maxStat + 5)) * 100}%`,
                          backgroundColor: getColorStat(statValue)
                        }}
                      >
                        <span className="text-surface-50 text-lg font-bold text-shadow-border1">{statValue}</span>
                      </div>
                    </PokedexCell>
                    <PokedexCell className="text-center">{calculateStat(stat, statValue, 50, 0, 0, 0.9)}</PokedexCell>
                    <PokedexCell className="text-center">{calculateStat(stat, statValue, 50, 31, 252, 1.1)}</PokedexCell>
                    <PokedexCell className="text-center">{calculateStat(stat, statValue, 100, 0, 0, 0.9)}</PokedexCell>
                    <PokedexCell className="text-center">{calculateStat(stat, statValue, 100, 31, 252, 1.1)}</PokedexCell>
                    <PokedexCell className="text-center">{evYields?.[stat as keyof EvYields] ?? 0}</PokedexCell>
                  </PokedexRow>
                )
              })}
            </TableBody>
            <PokedexHeader>
              <PokedexRow>
                <PokedexCell hard>Total</PokedexCell>
                <PokedexCell hard className="font-bold text-lg">{Object.values(stats).reduce((acc, val) => acc + val).toString()}</PokedexCell>
                <PokedexCell hard className="text-center">Min</PokedexCell>
                <PokedexCell hard className="text-center">Max</PokedexCell>
                <PokedexCell hard className="text-center">Min</PokedexCell>
                <PokedexCell hard className="text-center">Max</PokedexCell>
                <PokedexCell hard> </PokedexCell>
              </PokedexRow>
            </PokedexHeader>
          </PokedexTable>
        </div>
      )
}