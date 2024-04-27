import { LastRegistries } from "./_components/LastRegistries";
import MenuHeader from "./_components/MenuHeader";
import { PokedexSection } from "./_components/PokedexSection";
import PokemonSearchBar from "./_components/PokemonSearchBar";
import useTranslation from 'next-translate/useTranslation'
import { PossibleSpawns } from "./_components/PossibleSpawns";

export default function PokedexMenu(){
    const { t } = useTranslation("smartrotom/pokedex/common")
    return (
        <div className="bg-gray-800">
            <MenuHeader />
            <div className=" mt-4">
                <PokedexSection title="Últimos Registros">
                    <LastRegistries />
                </PokedexSection>

                <PokedexSection title="Búsqueda">
                    <PokemonSearchBar />
                </PokedexSection>

                
                <PokedexSection title="Posibles Spawns">
                    <PossibleSpawns />
                </PokedexSection>
            </div>
        </div>
    )
}