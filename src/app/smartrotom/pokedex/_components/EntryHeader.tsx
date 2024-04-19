import Link from "next/link";
import { PokemonSprite } from "./PokemonSprite";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { getPokemonNameAndForm } from "../dexUtils";

export function EntryHeader({pokemon, formName, prev, next, t} : {pokemon: {dex: number, name: string}, formName: string, prev: {dex: number, name: string}, next: {dex: number, name: string}, t: any}) {
    return <header className="flex flex-col bg-zinc-950 text-white h-fit z-10 p-2">
        <div className="w-full flex  justify-between items-center">
            <Link className="flex flex-row items-center hover:text-primary-400" href={`/smartrotom/pokedex/entrada/${prev.dex}`}>
                <PokemonSprite name={prev.name} dex={prev.dex} form="base" shiny={false} width={50} height={50}/>
                <ChevronLeftIcon className="w-6"/>#{prev.dex} - {prev.name}
            </Link>
            <div className="text-2xl flex items-center">
                #{pokemon.dex} - {getPokemonNameAndForm(pokemon.name, formName, t)}
                <PokemonSprite name={pokemon.name} dex={pokemon.dex} form="base" shiny={false} width={50} height={50}/>
            </div>
            <Link className="flex flex-row items-center hover:text-primary-400" href={`/smartrotom/pokedex/entrada/${next.dex}`}>#{next.dex} - {next.name}
                <ChevronRightIcon className="w-6"/>
                <PokemonSprite name={next.name} dex={next.dex} form="base" shiny={false} width={50} height={50}/>
            </Link>
        </div>
        <div className="w-full flex justify-evenly items-center scroll-smooth">
            <Link scroll={true} className=" hover:text-primary-400" href={`#evotree`}>Árbol evolutivo</Link>
            <Link className=" hover:text-primary-400" href={`#typedata`}>Fortalezas y debilidades</Link>
            <Link className=" hover:text-primary-400" href={`#stats`}>Estadísticas</Link>
        </div>
    </header>
}