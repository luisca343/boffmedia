import { rotomGET } from "@/services/boffAPI"
import { Pokemon } from "@/types/Pokemon"
import Link from "next/link"
import { ChevronRightIcon, ChevronLeftIcon } from "@heroicons/react/24/outline"
import getPokemonSprite from "../../dexUtils"
import { ArrowRightCircleIcon } from "@heroicons/react/24/solid"
import { EvoTree } from "../../_components/EvoTree"

export default async function EntradaPokedex({params}: {params: {id: string}}) {
    const pokemon = await rotomGET(`/pokemon/dex/${params.id}`) as Pokemon
    const {next, prev} = await rotomGET(`/pokemon/nextprev/${params.id}`) as {next: Pokemon, prev: Pokemon}


    if(!pokemon) return <h1>Pokemon no encontrado {params.id}</h1>
    return (
        <div>
            <div className="flex justify-between items-center bg-zinc-900 text-white h-12 p-2">
                <Link className="flex flex-row" href={`/smartrotom/pokedex/entrada/${prev.dex}`}><ChevronLeftIcon className="w-6"/>#{prev.dex} - {prev.name}</Link>
                <div>#{pokemon.dex} - {pokemon.name}</div>
                <Link className="flex flex-row" href={`/smartrotom/pokedex/entrada/${next.dex}`}>#{next.dex} - {next.name}<ChevronRightIcon className="w-6"/></Link>
            </div>
            <img src={getPokemonSprite(pokemon.name, pokemon.forms[0].name, false)} alt={pokemon.name} />
            All Forms
            {pokemon.forms.map(form => (
                <div key={form.name}>
                    <img src={getPokemonSprite(pokemon.name, form.name, false)} alt={pokemon.name} />
                    {form.name}
                </div>
            ))}

            <EvoTree params={{id: pokemon.dex.toString()}} />

            
        </div>
    )
}
