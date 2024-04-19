
import useTranslation from 'next-translate/useTranslation'
import { Table, TableRow, TableHeader, TableCell, TableBody } from "@/components/ui/table"
import { EvYields, Pokemon } from '@/types/Pokemon'

export function StatsTable({pokemon, formIndex}: {pokemon: Pokemon, formIndex: number }){
    const { t } = useTranslation("smartrotom/pokedex/common")
    const stats = pokemon.forms[formIndex].battleStats ? pokemon.forms[formIndex].battleStats : pokemon.forms[0].battleStats as any
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
    

    return (
        <div className="flex flex-col justify-center items-center text-white w-full ">
            <Table className="text-center border border-zinc-400 border-collapse">
                <TableHeader className="border-b border-zinc-400 ">
                    <TableCell colSpan={8} className="border border-zinc-400">{t('stats')}</TableCell>
                </TableHeader>
                <TableHeader className="border-b border-zinc-400 ">
                    <TableCell className="border border-zinc-400 w-40"></TableCell>
                    <TableCell className="border border-zinc-400" colSpan={2}>Estadística base</TableCell>
                    <TableCell className="border border-zinc-400" colSpan={2}>Nivel 50</TableCell>
                    <TableCell className="border border-zinc-400" colSpan={2} >Nivel 100</TableCell>
                    <TableCell className="border border-zinc-400">PE</TableCell>
                </TableHeader>
                <TableBody>
                    {Object.keys(stats).map((stat) => (
                        <TableRow key={stat} className="w-full hover:bg-inherit">
                            <TableCell className="border border-zinc-400">{t(`stat_${stat.toLowerCase()}`)}</TableCell>
                            <TableCell className="border border-zinc-400">{stats[stat]}</TableCell>
                            <TableCell className="flex flex-row items-center w-full">
                                <div className="m-1 rounded px-2 bg-zinc-400 text-zinc-400 text-start pl-2 bold text-sm" style={{width: `${(stats[stat] / maxStat) * 100}%`}}>-</div>
                            </TableCell>
                            <TableCell className="border border-zinc-400">{calculateStat(stat, stats[stat], 50, 0, 0, 0.9)}</TableCell>
                            <TableCell className="border border-zinc-400">{calculateStat(stat, stats[stat], 50, 31, 252, 1.1)}</TableCell>
                            <TableCell className="border border-zinc-400">{calculateStat(stat, stats[stat], 100, 0, 0, 0.9)}</TableCell>
                            <TableCell className="border border-zinc-400">{calculateStat(stat, stats[stat], 100, 31, 252, 1.1)}</TableCell>
                            <TableCell className="border border-zinc-400">{evYields[stat as keyof EvYields] || 0} </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}