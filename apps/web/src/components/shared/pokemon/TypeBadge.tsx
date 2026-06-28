import { useTranslations } from "next-intl";


export const colors = {
    normal: { backgroundColor: "#9fa19f", textColor: "black" },
    fire: { backgroundColor: "#e62829", textColor: "white" },
    water: { backgroundColor: "#2980ef", textColor: "white" },
    grass: { backgroundColor: "#3fa129", textColor: "white" },
    electric: { backgroundColor: "#fac000", textColor: "black" },
    ice: { backgroundColor: "#3fd8ff", textColor: "white" },
    fighting: { backgroundColor: "#ff8000", textColor: "white" },
    poison: { backgroundColor: "#9141cb", textColor: "white" },
    ground: { backgroundColor: "#915121", textColor: "black" },
    flying: { backgroundColor: "#81b9ef", textColor: "white" },
    psychic: { backgroundColor: "#ef4179", textColor: "white" },
    bug: { backgroundColor: "#91a119", textColor: "white" },
    rock: { backgroundColor: "#afa981", textColor: "black" },
    ghost: { backgroundColor: "#704170", textColor: "white" },
    dragon: { backgroundColor: "#5061e1", textColor: "white" },
    dark: { backgroundColor: "#50413f", textColor: "white" },
    steel: { backgroundColor: "#60a1b8", textColor: "white" },
    fairy: { backgroundColor: "#ef71ef", textColor: "white" },

    physical: { backgroundColor: "#ff4400", textColor: "white" },
    special: { backgroundColor: "#2266cc", textColor: "white" },
    status: { backgroundColor: "#999999", textColor: "black" },
} as {[key: string]: {backgroundColor: string, textColor: string}}

export default function TypeBadge({type}: {type: string}){
    const t  = useTranslations("pokedex");
    if(!type) return null
    const typeColors = colors[type.toLowerCase()];
    return <div className={` m-1 h-8 w-32 font-bold text-xl 2xl:text-base min-w-28 flex flex-row items-center  text-ink bg-${type.toLowerCase()} pl-2 pr-2 rounded text-shadow-border2 2xl:text-shadow-border1`}
        style={{backgroundColor: typeColors?.backgroundColor, color: 'white'}}>
            <img src={`/smartrotom/img/types/${type.toLowerCase()}.png`} alt={t(`type_${type.toLowerCase()}`)} className="w-6 h-6 "/>
            <div className='pl-2'>{t(`type_${type.toLowerCase()}`)}</div>
    </div>
}


export function TypeBadgeSmall({type, className}: {type: string, className?: string}){
    const t  = useTranslations("pokedex");
    if(!type) return null
    const typeColors = colors[type.toLowerCase().trim()];
    return <div className={` m-1 h-6 font-bold text-xs inline-flex flex-row items-center whitespace-nowrap text-ink bg-${type.toLowerCase().trim()} pl-1 pr-2 gap-1 rounded text-shadow-border1 ${className}`}
        style={{backgroundColor: typeColors?.backgroundColor, color: 'white'}}>
            <img src={`/smartrotom/img/types/${type.toLowerCase()}.png`} alt={t(`type_${type.toLowerCase().trim()}`)} className="w-4 h-4 shrink-0"/>
            <div>{t(`type_${type.toLowerCase().trim()}`)}</div>
    </div>
}
