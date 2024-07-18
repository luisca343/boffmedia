import { ActiveTeam as ActiveTeamType } from "@/types/Pokemon";
import { PokemonSprite } from "../../pokedex/_components/PokemonSprite";
import { Table } from "@/components/ui/table";
import useTranslation from 'next-translate/useTranslation'

export default function ActiveTeam({team}: {team: ActiveTeamType}){
    const { t: movesTrans } = useTranslation("smartrotom/pokedex/moves")
    const { t: formsTranslation } = useTranslation("smartrotom/pokedex/forms")
    const { t: abilitiesTrans } = useTranslation("smartrotom/pokedex/abilities")

    return(
        <div className="flex flex-col justify-between  h-[90%] w-full">
            {team.map((p, index)=>{
                if(!p) return <div className="w-32" key={index}></div>
                return <div key={index} className="flex flex-row  text-sm 2xl:text-base h-[1/6] w-full">
                    <div className="flex flex-col justify-center items-center w-[15%] text-center">
                        <PokemonSprite showStatus={false} width={75} height={75}  id={p.dex} form={p.form || 'base'} palette={p.palette ||'none'} />
                        <span className="text-center text-xs">{p.name} Nv. {p.level}</span>
                    </div>
                    <div className="flex flex-col justify-center items-center w-[20%] border-dashed border-l  text-center border-black">
                        <span>{abilitiesTrans(`ability_${p.ability.replace(" ", "")}`)}</span>
                        <span>{p.item != 'item.minecraft.air' && p.item}</span>
                    </div>
                    <div className="flex flex-col justify-center items-center w-[25%] border-dashed border-l  text-center border-black">
                        <span>{p.moves.map((m, index) => {
                            if(!m) return <div key={index}> - </div>
                            return <div key={index}>{movesTrans(`attack_${m.toLowerCase().replace(" ", "_")}`)}</div>
                    })}</span>
                    </div>
                    <div className="flex flex-col justify-center items-center w-[40%] text-center border-dashed border-l border-black">
                        <Table>
                            <thead>
                                <tr>
                                    <th></th>
                                    <th>PS</th>
                                    <th>At</th>
                                    <th>Def</th>
                                    <th>AtS</th>
                                    <th>DefS</th>
                                    <th>Vel</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <th>Stats</th>
                                    {p.stats.map((s, i) => <td key={i}>{s}</td>)}
                                </tr>
                                <tr>
                                    <th>IVs</th>
                                    {p.ivs.map((s, i) => <td key={i}>{s}</td>)}
                                </tr>
                                <tr>
                                    <th>EVs</th>
                                    {p.evs.map((s, i) => <td key={i}>{s}</td>)}
                                </tr>
                            </tbody>
                        </Table>
                    </div>
                </div>
        })}
        </div>
    )

}