import { rotomGET } from "@/services/boffAPI"
import { Pokemon } from "@/types/Pokemon"
import Link from "next/link"
import { ChevronRightIcon, ChevronLeftIcon } from "@heroicons/react/24/outline"
import getPokemonSprite from "../../dexUtils"
import { ArrowRightCircleIcon } from "@heroicons/react/24/solid"
import { EvoTree } from "../../_components/EvoTree"
import { PokemonSprite } from "../../_components/PokemonSprite"

export default async function EntradaPokedex({params}: {params: {id: string}}) {
    const pokemon = await rotomGET(`/pokemon/dex/${params.id}`) as Pokemon
    const {next, prev} = await rotomGET(`/pokemon/nextprev/${params.id}`) as {next: Pokemon, prev: Pokemon}

    if(!pokemon) return <h1>Pokemon no encontrado {params.id}</h1>
    return (
        <div className="flex flex-col  bg-zinc-900">
            <EntryHeader />
            <BasicInfo />
            <EvoTree params={{id: pokemon.dex.toString()}} />

            
        </div>
    )


    function EntryHeader() {
        return <div className="flex justify-between items-center bg-zinc-900 text-white h-12 p-2 sticky top-0">
            <Link className="flex flex-row" href={`/smartrotom/pokedex/entrada/${prev.dex}`}><ChevronLeftIcon className="w-6"/>#{prev.dex} - {prev.name}</Link>
            <div>#{pokemon.dex} - {pokemon.name}</div>
            <Link className="flex flex-row" href={`/smartrotom/pokedex/entrada/${next.dex}`}>#{next.dex} - {next.name}<ChevronRightIcon className="w-6"/></Link>
        </div>
    }

    function BasicInfo(){
        return <div>
            <PokemonSprite name={pokemon.name} dex={pokemon.dex} form={pokemon.forms[0].name} shiny={false} />
        All Forms
        {pokemon.forms.map(form => (
            <div key={form.name}>
                <PokemonSprite name={pokemon.name} dex={pokemon.dex} form={form.name} shiny={false} />
                {form.name}
            </div>
        ))}</div>
    }



}
