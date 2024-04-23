import { rotomGET } from "@/services/boffAPI"
import { Movement, Pokemon } from "../../_types/pokemon"
import Link from "next/link"
import  { getForm, getFormName, getPokemonCoverage, getPokemonDefense, getPokemonId, getPokemonNameAndForm } from "../../dexUtils"
import { EvoTree } from "../../_components/EvoTree"
import { PokemonSprite } from "../../_components/PokemonSprite"
import { TypeTable } from "../../_components/TypeTable"
import useTranslation from 'next-translate/useTranslation'
import TypeBadge from "../../_components/TypeBadge"
import { StatsTable } from "../../_components/StatsTable"
import { EntryHeader } from "../../_components/EntryHeader"
import { LevelMovesTable, MovesTable, OtherMovesTable } from "../../_components/MovesTable"
import { SpawnInfo } from "../../_types/spawnInfo"
import { SpawnTable } from "../../_components/SpawnTable"


export default async function EntradaPokedex({params}: any){
    const { t } = useTranslation("smartrotom/pokedex/common")
    const { t: formsTranslation } = useTranslation("smartrotom/pokedex/forms")
    let [pokemonIndex, formIndex] = params.params as [number, number]
    if (pokemonIndex === undefined) {
        pokemonIndex = 0;
    }
    if (formIndex === undefined) {
        formIndex = 0;
    } else {
        formIndex = formIndex - 1;
    }

    const pokemon = await rotomGET(`/pokemon/dex/${pokemonIndex}`) as Pokemon
    const {next, prev} = await rotomGET(`/pokemon/nextprev/${pokemonIndex}`) as {next: Pokemon, prev: Pokemon}
    const moves = await rotomGET(`/pokemon/moves/${pokemonIndex}/${formIndex}`) as Movement[]

    if(!pokemon) return <h1>Pokemon no encontrado {pokemonIndex}</h1>
    if(!pokemon.forms[formIndex]) return <h1>Forma no encontrada {formIndex}</h1>

    const formName = getFormName(pokemon, formIndex)
    
    const spawns = await rotomGET(`/pokemon/spawns/${getPokemonId(pokemon.name, formName)}`) as SpawnInfo[]

    const type1 = pokemon.forms[formIndex]?.types?.[0] ?? pokemon.forms[0]?.types?.[0] as string
    const type2 = pokemon.forms[formIndex]?.types?.[1] ?? pokemon.forms[0]?.types?.[1] as string

    const palettes = pokemon.forms[formIndex].genderProperties?.map((gender) => {
        return gender.palettes.map((palette) => {
            const sprite = palette.sprite?.split(':')[1]
            return {
                name: palette.name,
                sprite
            }
    })})
    return (
        <section className="flex flex-col overflow-hidden text-white">
            <EntryHeader pokemon={pokemon} formName={formName} prev={prev} next={next} t={formsTranslation}/>
            <section className="flex flex-col  bg-gray-800 overflow-auto pt-4">
                <PokedexSection id='info' title="Información">
                    <BasicInfo formName={formName}/>
                </PokedexSection>

                <PokedexSection id='evotree' title="Árbol Evolutivo">
                    <EvoTree params={{id: pokemon.dex.toString()}} />
                </PokedexSection>

                {pokemon.forms.length > 1 && 
                <PokedexSection id='forms' title="Formas Alternativas">
                    <div className="flex flex-wrap justify-center">
                        {pokemon.forms.map((form, index) => {
                            return <Link key={form.name} href={`/smartrotom/pokedex/entrada/${pokemon.dex}/${index + 1}#forms`}>
                                <div className="flex flex-col p-2 justify-center items-center">
                                    <PokemonSprite width={100} height={100} id={pokemonIndex} form={form.name || 'base'} palette='none'/>
                                    {getForm(form.name, formsTranslation) || 'base'}
                                </div>
                            </Link>
        })}
                    </div>
                </PokedexSection>}

                <PokedexSection id='typedata' title="Efectividades">
                    <div className="flex justify-center">
                        <TypeTable className="w-[50%]" list={getPokemonDefense(type1, type2)} title="Daño Recibido" id='deffensive'/>
                        <TypeTable className="w-[50%]" list={getPokemonCoverage(type1, type2)} title="Daño Realizado" id='offensive'/>
                    </div>
                </PokedexSection>
                
                <PokedexSection  id='stats' title="Estadísticas">
                    <StatsTable pokemon={pokemon} formIndex={formIndex} />
                </PokedexSection>
                
                <PokedexSection id='spawns' title="Localizaciones">
                    <SpawnTable spawns={spawns}/>
                </PokedexSection>


                <PokedexSection id='moves' title="Movimientos">
                    <LevelMovesTable pokemon={pokemon} formIndex={formIndex} moveData={moves}/>
                    <OtherMovesTable pokemon={pokemon} formIndex={formIndex} moveData={moves}/>
                </PokedexSection>


                
                <PokedexSection id='palettes' title="Paletas">
                    {palettes && palettes.map((palette, index) => {
                        return <div key={index} className="flex flex-wrap justify-center">
                            {palette.map((palette, index) => {
                                return <div key={index} className="flex flex-col p-2 justify-center items-center">
                                    <PokemonSprite width={80} height={80} id={pokemonIndex} form={formName} palette={palette.name}/>
                                    <span>{formsTranslation(`palette_${palette.name}`)}</span>
                                </div>
                            })}
                        </div>
                    })}
                </PokedexSection>

            </section>
        </section>
    )

    function PokedexSection({title, children, id, className=''}: {title: string, children: any, id?: string, className?: string}){
        return <section className={`flex flex-col justify-center w-[95%] 2xl:w-[90%] m-auto ${className} `} id={id}>
            <div className="text-2xl border-b-2 2xl:border-b border-white  mb-4 mt-2">{title}</div>
            {children}
        </section>
    }

    function BasicInfo({formName}: {formName: string}){
        const types = pokemon.forms[formIndex].types ? pokemon.forms[formIndex].types : pokemon.forms[0].types as any
        const description = formsTranslation(`pixelmon_${pokemon.name.toLowerCase()}_description`).split('_').join('.')
        const rank = pokemon.forms[formIndex].rank ? pokemon.forms[formIndex].rank : pokemon.forms[0].rank as {ranking: number, type1: string, type2: string, tier: string}
        return <section className="flex justify-center items-center">
        <div className="flex flex-col items-center">
            <div className="flex " style={{width:200, height:200}}>
                <PokemonSprite id={pokemonIndex} form={formName} palette='none' width={200} height={200} pixelated={false}/>
            </div> 
            <span className=" text-xl">{description}  </span> 
            <div className="flex justify-center items-center">
                {types.map((type: string) => <TypeBadge key={type} type={type}/>)}
            </div>
            {rank && <div className="text-center">{`Rango ${rank?.tier}`}</div>}
            </div>
        </section>
    }





}
