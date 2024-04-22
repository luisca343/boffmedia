
import useTranslation from 'next-translate/useTranslation'
import { Table, TableRow, TableHeader, TableCell, TableBody, TableHead, TableFooter } from "@/components/ui/table"
import { BattleStats, EvYields, Pokemon } from '@/types/Pokemon'
import PokedexTable, { PokedexCell, PokedexHeader,PokedexRow } from './PokedexTable'

export function StatsTable({pokemon, formIndex}: {pokemon: Pokemon, formIndex: number }){
    const { t } = useTranslation("smartrotom/pokedex/common")
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
        <div className="flex flex-col justify-center items-center text-zinc-200 w-full ">
            <PokedexTable>
                <PokedexHeader>
                    <TableRow className='hover:bg-zinc-900  font-bold'>
                        <PokedexCell className='w-40'> </PokedexCell>
                        <PokedexCell >Estadística base</PokedexCell>
                        <PokedexCell  colSpan={2}>Nivel 50</PokedexCell>
                        <PokedexCell  colSpan={2} >Nivel 100</PokedexCell>
                        <PokedexCell >PE</PokedexCell>
                    </TableRow>
                </PokedexHeader>
                <TableBody>
                    {Object.keys(stats).map((stat) => {
                        const statValue = stats[stat as keyof BattleStats]
                        const statColor = statValue > 100 ? 'text-green-400' : 'text-red-400'
                        return <PokedexRow key={stat}>
                            <PokedexCell className=" bg-zinc-900 border border-zinc-950 text-zinc-200 font-bold">{t(`stat_${stat.toLowerCase()}`)}</PokedexCell>
                            <PokedexCell className="relative border border-zinc-900 border-collapse">
                                <div className="absolute inset-0  rounded px-2 text-start pl-2 bold text-sm flex justify-start items-center" style={{width: `${(statValue / maxStat) * 100}%`, backgroundColor: getColorStat(statValue)}}>
                                  <div className='text-white text-lg font-bold text-shadow-border1'>{statValue}</div>
                                </div>
                            </PokedexCell>
                            <PokedexCell >{calculateStat(stat, statValue, 50, 0, 0, 0.9)}</PokedexCell>
                            <PokedexCell >{calculateStat(stat, statValue, 50, 31, 252, 1.1)}</PokedexCell>
                            <PokedexCell >{calculateStat(stat, statValue, 100, 0, 0, 0.9)}</PokedexCell>
                            <PokedexCell >{calculateStat(stat, statValue, 100, 31, 252, 1.1)}</PokedexCell>
                            <PokedexCell >{evYields[stat as keyof EvYields] || 0} </PokedexCell>
                        </PokedexRow>
                    })}
                </TableBody>
                <PokedexHeader>
                    <TableRow className='hover:bg-zinc-900 font-bold'>
                        <PokedexCell >Total</PokedexCell>
                        <PokedexCell >{Object.values(stats).reduce((acc, val) => acc + val).toString()}</PokedexCell>
                        <PokedexCell >Min</PokedexCell>
                        <PokedexCell >Max</PokedexCell>
                        <PokedexCell >Min</PokedexCell>
                        <PokedexCell >Max</PokedexCell>
                        <PokedexCell> </PokedexCell>
                    </TableRow>
                </PokedexHeader>
            </PokedexTable>
        </div>
    )
}