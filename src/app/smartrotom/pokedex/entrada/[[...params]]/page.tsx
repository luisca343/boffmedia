import { rotomGET } from "@/services/boffAPI"
import { BattleStats, EvYields, Pokemon } from "@/types/Pokemon"
import Link from "next/link"
import { ChevronRightIcon, ChevronLeftIcon } from "@heroicons/react/24/outline"
import getPokemonSprite, { getForm, getFormName, getPokemonCoverage, getPokemonDefense, getPokemonNameAndForm } from "../../dexUtils"
import { ArrowRightCircleIcon } from "@heroicons/react/24/solid"
import { EvoTree } from "../../_components/EvoTree"
import { PokemonSprite } from "../../_components/PokemonSprite"
import { TypeTable } from "../../_components/TypeTable"
import useTranslation from 'next-translate/useTranslation'
import TypeBadge from "../../_components/TypeBadge"
import { StatsTable } from "../../_components/StatsTable"
import { EntryHeader } from "../../_components/EntryHeader"

export default async function EntradaPokedex({params}: any){
    const { t } = useTranslation("smartrotom/pokedex/common")
    let [pokemonIndex, formIndex] = params.params as [string, number]
    if (pokemonIndex === undefined) {
        pokemonIndex = 'missingno';
    }
    if (formIndex === undefined) {
        formIndex = 0;
    } else {
        formIndex = formIndex - 1;
    }

    const pokemon = await rotomGET(`/pokemon/dex/${pokemonIndex}`) as Pokemon
    
    const {next, prev} = await rotomGET(`/pokemon/nextprev/${pokemonIndex}`) as {next: Pokemon, prev: Pokemon}

    if(!pokemon) return <h1>Pokemon no encontrado {pokemonIndex}</h1>
    if(!pokemon.forms[formIndex]) return <h1>Forma no encontrada {formIndex}</h1>

    const formName = getFormName(pokemon, formIndex)
    const type1 = pokemon.forms[formIndex]?.types?.[0] ?? pokemon.forms[0]?.types?.[0] as string
    const type2 = pokemon.forms[formIndex]?.types?.[1] ?? pokemon.forms[0]?.types?.[1] as string

    return (
        <section className="flex flex-col overflow-hidden">
            <EntryHeader pokemon={pokemon} formName={formName} prev={prev} next={next} t={t}/>
            <section className="flex flex-col  bg-zinc-900 overflow-auto">
                <BasicInfo formName={formName}/>

                <section className="flex justify-center  w-[80%] m-auto" id='evotree'>
                    <EvoTree params={{id: pokemon.dex.toString()}} />
                </section>

                <section className="flex justify-center  w-[80%] m-auto" id='typedata'>
                    <TypeTable className="w-[50%]" list={getPokemonDefense(type1, type2)} title="Daño Recibido" id='deffensive'/>
                    <TypeTable className="w-[50%]" list={getPokemonCoverage(type1, type2)} title="Daño Realizado" id='offensive'/>
                </section>
                
                <section className="flex justify-center  w-[80%] m-auto" id='stats'>
                    <StatsTable pokemon={pokemon} formIndex={formIndex} />
                </section>
            </section>
        </section>
    )


    function BasicInfo({formName}: {formName: string}){
        const types = pokemon.forms[formIndex].types ? pokemon.forms[formIndex].types : pokemon.forms[0].types as any
        return <section className="flex">
        <div>
            {types.map((type: string) => <TypeBadge key={type} type={type}/>)}
        </div>
        <div className="flex flex-col justify-center  w-[300px] text-white">
            <div className="flex justify-center"><PokemonSprite name={pokemon.name} dex={pokemon.dex} form={formName} shiny={false} /></div>    
                {pokemon.forms.length > 1 && 
                    <div className="flex flex-col items-center">
                        Formas
                        <div className="flex flex-wrap text-center">
                        {pokemon.forms.map((form, index) => (
                            <Link key={form.name} href={`/smartrotom/pokedex/entrada/${pokemon.dex}/${index + 1}`}>
                                <PokemonSprite name={pokemon.name} dex={pokemon.dex} form={form.name} shiny={false} />
                                {getForm(form.name, t) || 'base'}
                            </Link>
                            ))
                        }
                        </div>
                    </div>
                }
            </div>
        </section>
    }





}
