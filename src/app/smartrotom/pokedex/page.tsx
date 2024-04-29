import { LastRegistries } from "./_components/LastRegistries";
import MenuHeader from "./_components/MenuHeader";
import { PokedexSection } from "./_components/PokedexSection";
import PokemonSearchBar from "./_components/PokemonSearchBar";
import useTranslation from 'next-translate/useTranslation'
import { PossibleSpawns } from "./_components/PossibleSpawns";
import Link from "next/link";

export default function PokedexMenu(){
    const { t } = useTranslation("smartrotom/pokedex/common")
    return (
        <div className="bg-gray-800  ">
            <MenuHeader />
            <div className="mt-4">
                <PokedexSection title="Búsqueda">
                    <PokemonSearchBar />
                </PokedexSection>

                <PokedexSection title="Últimos Registros">
                    <LastRegistries />
                </PokedexSection>
                <PokedexSection title="Posibles Spawns" btn={<Link href={'/smartrotom/pokedex/spawns'}>Ver más</Link>}>
                    <PossibleSpawns />
                </PokedexSection>
            </div>
        </div>
    )
}