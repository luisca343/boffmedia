import MenuHeader from "./_components/MenuHeader";
import PokemonSearchBar from "./_components/PokemonSearchBar";
import useTranslation from 'next-translate/useTranslation'

export default function PokedexMenu(){
    const { t } = useTranslation("smartrotom/pokedex/common")
    return (
        <div className="bg-gray-800">
            <MenuHeader />
            <PokemonSearchBar />
        </div>
    )
}