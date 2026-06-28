"use client"
import Link from "next/link";
import { PokemonSprite } from "../../../_components/PokemonSprite";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { getDisplayStatus, getPokemonNameAndForm } from "../../../dexUtils";
import { Pokemon } from "@/types/Pokemon";
import { InternalLink } from "@/components/ui/navigation/Link";
import { useTranslations } from "next-intl";

export function EntryHeader({pokemon, formName, prev, next} : {pokemon: Pokemon, formName: string, prev: {dex: number, name: string, spriteUrl: string}, next: {dex: number, name: string, spriteUrl: string}}) {
    const t = useTranslations("pokedex");
    
    return (
        <header className="flex flex-col bg-base text-ink sm:h-24 z-10 p-2 shadow-md">
            {/* Navigation row */}
            <div className="w-full flex flex-1 justify-between items-center">
                {/* Previous Pokemon */}
                <InternalLink className="flex items-center hover:text-primary-hover transition-colors group" 
                    href={`pokedex/entrada/${prev.dex}`}>
                    <div className="flex items-center">
                        <PokemonSprite 
                            id={prev.dex} 
                            form="base" 
                            palette='none' 
                            width={50} 
                            height={50} 
                            hide={true} 
                            inverted={true}
                            className="transform group-hover:scale-110 transition-transform"
                            url={prev.spriteUrl}
                        />
                        <ChevronLeftIcon className="w-6 h-6"/>
                    </div>
                    <div className="hidden md:block">#{prev.dex} - {getDisplayStatus(prev.dex, 'base', true) ? prev.name : '???'}</div>
                </InternalLink>
                
                {/* Current Pokemon */}
                <div className="flex items-center justify-center text-2xl sm:text-3xl md:text-4xl font-bold">
                    <span className="hidden xs:block">#{pokemon.dex} - </span>
                    <span className="truncate max-w-[200px] sm:max-w-none">
                        {getDisplayStatus(pokemon.dex, formName, true) ? getPokemonNameAndForm(pokemon.name, formName, t) : '???'}
                    </span>
                    <PokemonSprite 
                        id={pokemon.dex} 
                        form={formName} 
                        palette='none' 
                        width={50} 
                        height={50} 
                        hide={true} 
                        inverted={true}
                        url={pokemon.forms[0].spriteUrl}
                    />
                </div>
                
                {/* Next Pokemon */}
                <InternalLink className="flex items-center hover:text-primary-hover transition-colors group" 
                    href={`pokedex/entrada/${next.dex}`}>
                    <div className="hidden md:block text-right">#{next.dex} - {getDisplayStatus(next.dex, 'base', true) ? next.name : '???'}</div>
                    <div className="flex items-center">
                        <ChevronRightIcon className="w-6 h-6"/>
                        <PokemonSprite 
                            id={next.dex} 
                            form="base" 
                            palette='none' 
                            width={50} 
                            height={50} 
                            hide={true} 
                            inverted={true}
                            className="transform group-hover:scale-110 transition-transform"
                            url={next.spriteUrl}
                        />
                    </div>
                </InternalLink>
            </div>
            
            {/* Navigation tabs */}
            <div className="w-full flex justify-evenly items-center scroll-smooth mt-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-primary-600 scrollbar-track-surface-800">
                <Link className="px-2 py-1 hover:text-primary-hover transition-colors whitespace-nowrap" href={`#info`}>Info</Link>
                <Link className="px-2 py-1 hover:text-primary-hover transition-colors whitespace-nowrap" href={`#evotree`}>Árbol evolutivo</Link>
                {pokemon.forms.length > 1 && 
                    <Link className="px-2 py-1 hover:text-primary-hover transition-colors whitespace-nowrap" href={`#forms`}>Formas</Link>
                }
                <Link className="px-2 py-1 hover:text-primary-hover transition-colors whitespace-nowrap" href={`#typedata`}>Tipos</Link>
                <Link className="px-2 py-1 hover:text-primary-hover transition-colors whitespace-nowrap" href={`#stats`}>Estadísticas</Link>
                <Link className="px-2 py-1 hover:text-primary-hover transition-colors whitespace-nowrap" href={`#spawns`}>Localizaciones</Link>
                <Link className="px-2 py-1 hover:text-primary-hover transition-colors whitespace-nowrap" href={`#moves`}>Movimientos</Link>
                <Link className="px-2 py-1 hover:text-primary-hover transition-colors whitespace-nowrap" href={`#palettes`}>Variantes</Link>
            </div>
        </header>
    );
}