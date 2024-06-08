import Link from "next/link";
import { PokemonSprite } from "../../../_components/PokemonSprite";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { getPokemonNameAndForm } from "../../../dexUtils";
import { Pokemon } from "@/types/Pokemon";
import { InternalLink } from "@/components/nav/Link";

export function EntryHeader({pokemon, formName, prev, next, t} : {pokemon: Pokemon, formName: string, prev: {dex: number, name: string}, next: {dex: number, name: string}, t: any}) {
    return <header className="flex flex-col bg-slate-950 text-white h-24 z-10 p-2 text-xl 2xl:text-lg" >
        <div className="w-full flex flex-1 justify-between items-center">
            <InternalLink className="flex flex-row  items-center hover:text-primary-400" 
                href={`/pokedex/entrada/${prev.dex}`}>
                <PokemonSprite id={prev.dex} form="base" palette='none' width={50} height={50}/>
                <ChevronLeftIcon className="w-6"/>#{prev.dex} - {prev.name}
            </InternalLink>
            <div className="flex items-center justify-center text-4xl 2xl:text-2xl">
                #{pokemon.dex} - {getPokemonNameAndForm(pokemon.name, formName, t)}
                <PokemonSprite id={pokemon.dex} form={formName} palette='none' width={50} height={50}/>
            </div>
            <InternalLink className="flex flex-row items-center hover:text-primary-400" href={`/pokedex/entrada/${next.dex}`}>#{next.dex} - {next.name}
                <ChevronRightIcon className="w-6"/>
                <PokemonSprite id={next.dex} form="base" palette='none' width={50} height={50}/>
            </InternalLink>
        </div>
        <div className="w-full flex justify-evenly items-center scroll-smooth">
            <Link className=" hover:text-primary-400" href={`#info`}>Info</Link>
            <Link className=" hover:text-primary-400" href={`#evotree`}>Árbol evolutivo</Link>
            {pokemon.forms.length > 1 && <Link className=" hover:text-primary-400" href={`#forms`}>Formas</Link>}
            <Link className=" hover:text-primary-400" href={`#typedata`}>Fortalezas y debilidades</Link>
            <Link className=" hover:text-primary-400" href={`#stats`}>Estadísticas</Link>
            <Link className=" hover:text-primary-400" href={`#spawns`}>Localizaciones</Link>
            <Link className=" hover:text-primary-400" href={`#moves`}>Movimientos</Link>
            <Link className=" hover:text-primary-400" href={`#palettes`}>Variantes</Link>
        </div>
    </header>
}