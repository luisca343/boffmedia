import { rotomGET } from "@/services/boffAPI"
import { ArrowRightCircleIcon } from "lucide-react"
import getPokemonSprite, { getItemSprite, getPokemonName } from "../../../dexUtils"
import useTranslation from 'next-translate/useTranslation'
import Image from "next/image"
import { Evolution } from "@/types/Pokemon"
import { ItemSprite, PokemonSprite } from "../../../_components/PokemonSprite"
import Link from "next/link"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import React from "react"
import { InternalLink } from "@/components/nav/Link"



export async function EvoTree({params}: {params: {id: string}}){
    const {tree, depth} = await rotomGET(`/pokemon/evotree/${params.id}`)
    const { t } = useTranslation("smartrotom/pokedex/forms")
    const { t: evoTrans } = useTranslation("smartrotom/pokedex/common")
    const { t:biomeTrans } = useTranslation("smartrotom/pokedex/spawns")
    const { t:moveTrans } = useTranslation("smartrotom/pokedex/moves")

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
                        <PokemonSprite id={subTree.pkm.dex} form={form} palette='none' width={100} height={100}/>
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
                    <InternalLink href={`/pokedex/entrada/${subTree.dex}/${subTree.index}`} className="flex flex-col justify-center items-center w-[200px] hover:bg-zinc-700 rounded-md">
                        <PokemonSprite id={subTree.dex} form={form} palette='none' width={100} height={100}/>
                        <span className="text-center">{t(`form`, {pokemon: getPokemonName(pkmName, t), form: `${t(`form_${form}`)}`})}</span>
                    </InternalLink>
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

    return <div className="  text-white text-shadow-border1 flex justify-center ">
            {depth > 1 ? renderTree(tree) : <div className=" h-full flex-col justify-center items-center rounded-lg m-2" >
                    Este Pokémon no tiene evoluciones
            </div>}
        </div>
   


    function getEvolutionMethod(evolution: Evolution){
        const conditions = [] as React.ReactNode[]

        switch(evolution.evoType){
            case "interact":
                let [modId, itemId] = evolution.item?.itemID.split(':') || []
                conditions.push(
                    <div className="flex items-center justify-center">
                        <span className='mx-1'>{evoTrans(`evolution_interact`, {item: evoTrans(`item_${itemId}`)})}</span>
                        <ItemSprite name={itemId} width={30} height={30}/>
                    </div>
                )
                break
            case "leveling":
                if(evolution.level) conditions.push(evoTrans(`evolution_level`, {level: evolution.level}))
                else conditions.push(evoTrans(`evolution_leveling`))
                break
            case "trade":
                conditions.push(evoTrans(`evolution_trade`))
                break
            case "ticking":
                conditions.push(evoTrans(`evolution_ticking`))
                break
            case "emptyslot":
                conditions.push(evoTrans(`evolution_emptyslot`))
                break
            default:
                conditions.push(evolution.evoType)
        }

        if(evolution.conditions?.length > 0) {
            evolution.conditions.forEach((condition) => {
                const conditionType = condition.evoConditionType
                if(conditionType == "friendship") {
                    const value = condition.friendship
                    conditions.push(evoTrans(`evolution_friendship`, {value}))
                } 
                else if(conditionType == "time") {
                    const value = condition.time
                    conditions.push(evoTrans(`time_${value.toLowerCase()}`))
                }
                else if(conditionType == "moveType") {
                    const type = condition.type
                    conditions.push(evoTrans(`evolution_moveType`, {type}))
                }
                else if(conditionType == "biome") {
                    const biomeStrs = condition.biomes as string[]
                    const biomes = [] as string[]
                    biomeStrs.forEach((biome) => {
                        if(biome.includes("biomesoplenty") || biome.includes("terraforged")) return
                        biomes.push(biomeTrans(biome.replace(" ", "_").replace(':', '_')))
                    })
                    conditions.push(<HoverCard>
                        <HoverCardTrigger className='underline hover:cursor-pointer'>En Biomas</HoverCardTrigger>
                        <HoverCardContent className="w-96 bg-zinc-800 text-white">{biomes.join(', ')}</HoverCardContent>
                    </HoverCard>)
                }
                else if(conditionType == "evolutionRock") {
                    const evolutionRock = condition.evolutionRock
                    conditions.push(evoTrans(`evolution_rock`, {evolutionRock: t(`${evolutionRock}`)}))
                }
                else if(conditionType == "nature" || conditionType == "evolution_nature") {
                    const natures = condition.natures
                    const nature = natures.map((nature: string) => evoTrans(`nature_${nature.toLowerCase()}`)).join(", ")
                    conditions.push(evoTrans(`evolution_nature`, {nature}))
                }
                else if(conditionType == "party"){
                    const partyMembers = []
                    const withPokemon = condition.withPokemon as string[] || []
                    const withTypes = condition.withTypes as string[] || []
                    const withForms = condition.withForms as string[] || [] 
                    const withPalettes = condition.withPalettes as string[] || []

                    partyMembers.push(...withPokemon)
                    partyMembers.push(...withTypes)
                    partyMembers.push(...withForms)
                    partyMembers.push(...withPalettes)
                    
                    conditions.push(evoTrans(`evolution_party`, {party: partyMembers.join(", ")}))
                }
                else if (conditionType == "heldItem") {
                    const [modId, itemId] = condition.item.itemID.split(':') || []
                    conditions.push(
                        <div className="flex items-center justify-center">
                            <span className='mx-1'>{evoTrans(`evolution_heldItem`, {item: evoTrans(`item_${itemId}`)})}</span>
                            <ItemSprite name={itemId} width={30} height={30}/>
                        </div>
                    )
                }
                else if (conditionType == "critical") {
                    const critical = condition.critical
                    conditions.push(evoTrans(`evolution_critical`, {critical}))
                }
                else if (conditionType == "statRatio") {
                    const stat1 = condition.stat1
                    const stat2 = condition.stat2
                    const ratio = condition.ratio

                    if(ratio === 1){
                        conditions.push(evoTrans(`evolution_statRatio`, {stat1, stat2}))
                    }                 
                }
                else if (conditionType == "move") {
                    const attackName = condition.attackName.toLowerCase().replace(" ", "_")
                    conditions.push(evoTrans(`evolution_move`, {attackName: moveTrans(`attack_${attackName}`)}))
                }
                else if (conditionType == "status") {
                    const status = condition.type.toLowerCase()
                    conditions.push(evoTrans(`evolution_status`, {status: evoTrans(`status_${status}`)}))
                }
                else if(conditionType == "chance") {
                    const chance = condition.chance * 100
                    conditions.push(evoTrans(`evolution_chance`, {chance}))
                }
                else if(conditionType == "moveUses") {
                    const move = condition.move.toLowerCase().replace(" ", "_") as string
                    const uses = condition.uses as number
                    conditions.push(evoTrans(`evolution_moveuses`, {move: moveTrans(`attack_${move}`), uses}))
                }
                else if(conditionType == "gender") {
                    const genders = condition.genders as string[]	
                    conditions.push(evoTrans(`evolution_gender`, {genders: genders?.join(", ")}))
                }
                else if(conditionType == "recoil") {
                    const recoil = condition.recoil as number
                    conditions.push(evoTrans(`evolution_recoil`, {recoil}))
                }
                else if(conditionType == "healthAbsence") {
                    const health = condition.health as number
                    conditions.push(evoTrans(`evolution_healthAbsence`, {health}))
                }
                else if(conditionType == "shiny") {
                    const shiny = condition.shiny as boolean
                    if(shiny) conditions.push(t(`palette_shiny`))
                }
                else if(conditionType == "highAltitude") {
                    const minAltitude = condition.minAltitude as number
                    conditions.push(evoTrans(`evolution_highAltitude`, {minAltitude}))
                }
                else if(conditionType == "weather") {
                    const weather = condition.weather as string
                    conditions.push(evoTrans(`evolution_weather`, {weather: evoTrans(`weather_${weather.toLowerCase()}`)}))
                }
                else if(conditionType == "nuggets") {
                    const nuggets = condition.nuggets as number
                    conditions.push(evoTrans(`evolution_nuggets`, {nuggets}))
                }
                else if(conditionType == "evolutionScroll") {
                    const scroll = condition.evolutionScroll as string
                    conditions.push(evoTrans(`evolution_scroll`, {scroll: t(`${scroll}`)}))
                }
                else if(conditionType == "blocksWalkedOutsideBall") {
                    const blocks = condition.blocksToWalk as number
                    conditions.push(evoTrans(`evolution_blocksWalkedOutsideBall`, {blocks}))
                }
                else if (conditionType == "insideBattle"){
                    conditions.push(evoTrans(`evolution_insideBattle`))
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
                {conditions?.map((condition) => {
                    return <span key={`${condition?.toString()}`}>{condition}</span>
                })
                }
            </div>
    }

}




//{Object.keys(evos)?.length > 0 &&  <ArrowRightCircleIcon width={50}/>}