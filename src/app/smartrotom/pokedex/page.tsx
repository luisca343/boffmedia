import PokemonSearchBar from "./_components/PokemonSearchBar";
import useTranslation from 'next-translate/useTranslation'

export default function PokedexMenu(){
    const { t } = useTranslation("smartrotom/pokedex/common")
    return (
        <div className="bg-gray-800 p-4">
            <h1>Pokedex</h1>
            <PokemonSearchBar />
            {t('search')}
        </div>
    )
}