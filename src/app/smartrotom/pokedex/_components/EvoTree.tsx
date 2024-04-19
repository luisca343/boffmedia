import { rotomGET } from "@/services/boffAPI"
import { ArrowRightCircleIcon } from "lucide-react"
import getPokemonSprite, { getPokemonName } from "../dexUtils"
import useTranslation from 'next-translate/useTranslation'
import Image from "next/image"
import { Evolution } from "@/types/Pokemon"
import { PokemonSprite } from "./PokemonSprite"



export async function EvoTree({params}: {params: {id: string}}){
    const {tree, depth} = await rotomGET(`/pokemon/evotree/${params.id}`)
    const { t } = useTranslation("smartrotom/pokedex/common")

    function renderTree2(tree: any){
        return <div className=" h-full flex-col justify-center items-center  rounded-lg m-2" >
          {Object.keys(tree).map((key) => {
            const [pkmName, form] = key.split('_')
            const subTree = tree[key]
            const evos = subTree.evos
            if(Object.keys(subTree).length == 0) return <h1>TET</h1>
            if(!subTree.pkm) return <h1>NO PKM</h1>
                return <div key={key} className='w-full flex flex-row items-center ' style={{height:`${100/Object.keys(tree).length}%`}}>
                    <div className="flex flex-col justify-center items-center w-[200px]">
                        <PokemonSprite name={pkmName} dex={subTree.pkm.dex} form={form} shiny={false} />
                        <span className="text-center">{t(`form`, {pokemon: getPokemonName(pkmName, t), form: `${t(`form_${form}`)}`})}</span>
                    </div>
                    <div className="flex flex-col ">
                       {Object.keys(evos)?.length > 0 && Object.keys(evos).map((evo: any, index: number) => {
                            const thisEvos = evos[evo] 
                            return <></>
                       })
                       }
                    </div>
                </div>
        })}
        </div>
    }




    function renderTree(tree: any){
        return <div className=" h-full flex-col justify-center items-center  rounded-lg m-2" >
          {Object.keys(tree).map((key) => {
            const [pkmName, form] = key.split('_')
            const subTree = tree[key]
            const evos = subTree.evos
            if(Object.keys(subTree).length == 0) return <h1>TET</h1>
            if(!subTree.pkm) return <h1>NO PKM</h1>
                return <div key={key} className='w-full flex flex-row items-center ' style={{height:`${100/Object.keys(tree).length}%`}}>
                    <div className="flex flex-col justify-center items-center w-[200px]">
                        <PokemonSprite name={pkmName} dex={subTree.dex} form={form} shiny={false} />
                        <span className="text-center">{t(`form`, {pokemon: getPokemonName(pkmName, t), form: `${t(`form_${form}`)}`})}</span>
                    </div>
                    <div className="flex flex-col ">
                        {Object.keys(evos)?.length > 0 && Object.keys(evos).map((evo: any, index: number) => {
                            const opacity = index % 2 == 0 ? 0.5 : 1
                            const thisEvos = evos[evo] 
                            return (
                            <div key={`${evo}`} className="flex items-center justify-center p-2" >
                                <div className="flex flex-col items-center w-[350px] " >
                                    {thisEvos.methods.map(
                                        (method: Evolution) => {
                                            return getEvolutionMethod(method)
                                        })}
                                </div>
                                {renderTree({[evo]:thisEvos})}
                            </div>)
                        }
                    )}
                    </div>
                </div>
        })}
        </div>
    }

    return <div>
        <div className="  text-white text-shadow-border1 flex justify-center ">
            {depth > 1 ? renderTree(tree) : <div className=" h-full flex-col justify-center items-center bg-zinc-800 rounded-lg m-2" >
                    Este Pokémon no tiene evoluciones
            </div>}
        </div>
    </div>


    function getEvolutionMethod(evolution: Evolution){
        const conditions = [] as string[]

        switch(evolution.evoType){
            case "interact":
                const [modId, itemId] = evolution.item?.itemID.split(':')
                conditions.push(t(`evolution_interact`, {item: t(`item_${itemId}`)}))
                break
            case "leveling":
                if(evolution.level) conditions.push(t(`evolution_level`, {level: evolution.level}))
                else conditions.push(t(`evolution_leveling`))
                break
            default:
                conditions.push(evolution.evoType)
        }

        if(evolution.conditions?.length > 0) {
            evolution.conditions.forEach((condition) => {
                //console.log(condition)
                const conditionType = condition.evoConditionType
                if(conditionType == "friendship") {
                    const value = condition.friendship
                    conditions.push(t(`evolution_friendship`, {value}))
                } 
                else if(conditionType == "time") {
                    const value = condition.time
                    conditions.push(t(`time_${value.toLowerCase()}`))
                }
                else if(conditionType == "moveType") {
                    const type = condition.type
                    conditions.push(t(`evolution_moveType`, {type}))
                }
                else if(conditionType == "biome") {
                    const biomeStrs = condition.biomes as string[]
                    const biomes = [] as string[]
                    biomeStrs.forEach((biome) => {
                        biomes.push(t(`biome_${biome.split(":")[1]}`))
                    })
                    conditions.push(t(`evolution_biome`, {biomes: biomes.join(", ")}))
                }
                else if(conditionType == "evolutionRock") {
                    const evolutionRock = condition.evolutionRock
                    conditions.push(t(`evolution_rock`, {evolutionRock: t(`${evolutionRock}`)}))
                }
                else if(conditionType == "nature") {
                    const natures = condition.natures
                    const nature = natures.map((nature: string) => t(`nature_${nature.toLowerCase()}`)).join(", ")
                    conditions.push(t(`evolution_nature`, {nature}))
                }

                else {
                    conditions.push(condition.evoConditionType)
                }
            })
        }


        return   <div
                    className="flex flex-col text-center  w-[300px] h-[100px] justify-center"
                    style={{
                    backgroundImage: 'url(/smartrotom/img/apps/pokedex/arrow.webp)',
                    backgroundSize: 'contain',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'center',
                    }}
                >
                {conditions.map((condition) => {
                    return <span key={`${condition.toString()}`}>{condition}</span>
                })
                }
            </div>
    }

}




//{Object.keys(evos)?.length > 0 &&  <ArrowRightCircleIcon width={50}/>}