import PokemonSearchBar from "./_components/PokemonSearchBar";
import useTranslation from 'next-translate/useTranslation'

export default function PokedexMenu(){
    const { t } = useTranslation("smartrotom/pokedex/common")
    return (
        <div>
            <h1>Pokedex</h1>
            <PokemonSearchBar />
            {t('search')}
        </div>
    )
}