import useTranslation from 'next-translate/useTranslation'

const colors = {
    normal: { backgroundColor: "gray", textColor: "black" },
    fire: { backgroundColor: "red", textColor: "white" },
    water: { backgroundColor: "blue", textColor: "white" },
    grass: { backgroundColor: "green", textColor: "white" },
    electric: { backgroundColor: "yellow", textColor: "black" },
    ice: { backgroundColor: "blue", textColor: "white" },
    fighting: { backgroundColor: "red", textColor: "white" },
    poison: { backgroundColor: "purple", textColor: "white" },
    ground: { backgroundColor: "yellow", textColor: "black" },
    flying: { backgroundColor: "blue", textColor: "white" },
    psychic: { backgroundColor: "purple", textColor: "white" },
    bug: { backgroundColor: "green", textColor: "white" },
    rock: { backgroundColor: "gray", textColor: "black" },
    ghost: { backgroundColor: "purple", textColor: "white" },
    dragon: { backgroundColor: "blue", textColor: "white" },
    dark: { backgroundColor: "gray", textColor: "white" },
    steel: { backgroundColor: "gray", textColor: "black" },
    fairy: { backgroundColor: "pink", textColor: "black" }
} as {[key: string]: {backgroundColor: string, textColor: string}}

export default function TypeBadge({type}: {type: string}){
    const { t } = useTranslation("smartrotom/pokedex/common")
    const typeColors = colors[type.toLowerCase()];
    return <div className={`m-1 w-16 h-8 flex flex-row items-center justify-center text-white bg-${type.toLowerCase()} p-1 rounded`}  
        style={{backgroundColor: typeColors.backgroundColor, color: typeColors.textColor}}>
        {t(`type_${type.toLowerCase()}`)}
    </div>
}