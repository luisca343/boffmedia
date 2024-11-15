import { LastRegistries } from "./_components/LastRegistries";
import MenuHeader from "./_components/MenuHeader";
import { PokedexSection } from "./_components/PokedexSection";
import PokemonSearchBar from "./_components/PokemonSearchBar";
import { PossibleSpawns } from "./_components/PossibleSpawns";
import Link from "next/link";
import { InternalLink } from "@/components/nav/Link";

export default function PokedexMenu(){
    return (
        <div className="bg-surface-800  ">
            <MenuHeader />
            <div className="mt-4">
                <PokedexSection title="Búsqueda">
                    <PokemonSearchBar />
                </PokedexSection>

                <PokedexSection title="Últimos Registros">
                    <LastRegistries />
                </PokedexSection>
                <PokedexSection title="Posibles Spawns" btn={<InternalLink href={'/pokedex/spawns'}>Ver más</InternalLink>}>
                    <PossibleSpawns spawns={[]}/>
                </PokedexSection>
            </div>
        </div>
    )
}