import PokemonSearchBar from "./_components/PokemonSearchBar";
import useTranslation from 'next-translate/useTranslation'

export default function PokedexMenu(){
    const { t } = useTranslation("smartrotom/pokedex/common")
    return (
        <div className="bg-gray-800">
            <header className="flex flex-col bg-slate-950 text-white h-12 z-10 p-2 text-xl 2xl:text-lg" >
            </header>
            <PokemonSearchBar />
            {t('search')}
        </div>
    )
}