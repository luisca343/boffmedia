import { rotomGET } from "@/services/boffAPI"
import { Pokemon } from "@/types/Pokemon"
import Link from "next/link"
import { ChevronRightIcon, ChevronLeftIcon } from "@heroicons/react/24/outline"
import getPokemonSprite from "../../dexUtils"
import { ArrowRightCircleIcon } from "@heroicons/react/24/solid"

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

            <ArbolEvo params={{id: pokemon.dex.toString()}} />

            
        </div>
    )
}

export async function ArbolEvo({params}: {params: {id: string}}){
    const evotree = await rotomGET(`/pokemon/evotree/${params.id}`)

    function renderTree(tree: any){
        return <div className=" h-full flex-col justify-center items-center" >
          {Object.keys(tree).map((key) => {
            if(!tree[key]) return <h1>TET</h1>
            if(!tree[key].pkm) return <h1>NO PKM</h1>

                return <div key={key} className=' flex flex-row items-center justify-center' style={{height:`${100/Object.keys(tree).length}%`}}>
                    <div className="flex flex-col justify-center items-center">
                        <img src={getPokemonSprite(tree[key].pkm, key, false)} alt={tree[key].pkm} />
                        <span>{tree[key].pkm} {key !='base' && key}</span>
                    </div>
                    {tree[key].evos?.length > 0 &&<ArrowRightCircleIcon width={50}/> }
                    <div className="flex flex-col items-center">
                        {tree[key].evos?.length > 0 && tree[key].evos.map((evo: any) => {
                            return <>{renderTree(evo)}</>
                        }
                    )}
                    </div>
                </div>
        })}
        </div>
    }

    return <div>
        <h1>Arbol de evolucion {params.id}</h1>
        <div className=" bg-zinc-900 text-white">
            {renderTree(evotree)}
        </div>
    </div>
}

