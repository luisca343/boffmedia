import { rotomGET, rotomPOST } from "@/services/boffAPI"
import { Pokemon } from "@/types/Pokemon"

export default function getPokemonSpriteOld(name: string, form: string, shiny: boolean){
    const formString = form && form != 'base' ? `_${form.toUpperCase()}` : ''
    const folderString = shiny ? 'Front Shiny' : 'Front'
    return `/smartrotom/img/sprites/${folderString}/${name.toUpperCase()}${formString}.png`
}

export async function getPokemonImage(id: number, form: string, palette: string, uuid = '', hide: boolean){
    const img = await rotomGET(`/pokemon/image/${id}/${form}/${palette}/${uuid}/${hide ? 1 : 0}`)
    return await img.data as any
}

export async function getPokemonSprite(id: number, form: string, palette: string = 'none', uuid = '', hide: boolean){
    const img = await rotomGET(`/pokemon/sprite/${id}/${form}/${palette}/${uuid}/${hide ? 1 : 0}`)
    return await  img.data as any
}

export async function getItemSprite(name: string){
    const img = await rotomGET(`/pokemon/item/sprite/${name}`)
    return await  img.data as any
}

export function getPokemonName(name: string, t: any){
    return t(`pixelmon_${name.toLocaleLowerCase().replace(' ', '_')}`)
}

export function getPokemonId(name: string, form: string){
    if (typeof name !== 'string' || typeof form !== 'string') {
        throw new Error('Both name and form must be strings');
    }

    return `${name.toLowerCase()}_${form.toLowerCase()}`;
}

export function getPokemonNameAndForm(name: string, form: string, t: any){
    return t(`form`, {pokemon: getPokemonName(name, t), form: `${t(`form_${form}`)}`})
}

export function getForm(form: string, t: any){
    return (t(`form_${form || 'base'}`))
}

export function getFormIndex(pokemon: Pokemon, formName: string){
    return pokemon.forms.findIndex(form => form.name == formName)
}

// Damage dealt by a move of a certain type to a pokemon of a certain type
const typeChart = {
    normal : { ghost: 0, rock: 0.5, steel: 0.5 },
    fire : { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
    water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
    grass: { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
    electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
    ice: { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
    fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: 0.5 },
    poison: { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
    ground: { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, rock: 2, bug: 0.5, steel: 2 },
    flying: { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
    psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
    bug: { fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5 },
    rock: { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
    ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
    dragon: { dragon: 2, steel: 0.5, fairy: 0 },
    dark: { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
    steel: { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
    fairy: { fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5, fire: 0.5 }
} as {[key: string]: {[key: string]: number}}
 
export function getEffectifity(moveType: string, targetType: string){
    return typeChart[moveType][targetType] || 1
}


export function getPokemonDefense(type1: string, type2= '') {
    const result = {} as {[key: string]: number}

    for(let type in typeChart){
        const type1Effectiveness = typeChart[type][type1.toLowerCase()] ?? 1;
        const type2Effectiveness = typeChart[type][type2.toLowerCase()] ?? 1;

        result[type] = type1Effectiveness * type2Effectiveness;
    }
    return result
}

export function getPokemonCoverage(type1: string, type2 ='') {
    const result = {} as {[key: string]: number}

    for(let type in typeChart){
        const type1Effectiveness = typeChart[type1.toLowerCase()][type] ?? 1;
        const type2Effectiveness = type2 != '' ? typeChart[type2.toLowerCase()][type] ?? 1 : 0;
        result[type] = type1Effectiveness > type2Effectiveness ? type1Effectiveness : type2Effectiveness 
    }

    return result
}

export function getFormName(pokemon: Pokemon, formIndex: number){
    return pokemon.forms[formIndex].name || 'base'
}


export function getDisplayName(species: string, form: string, palette: string, t: any) {
    //if (form.includes('segment')) form = 'base';
    const formDisplay = form !== 'base' ? t(`form_${form}`) : '';
    const paletteDisplay = palette !== 'none' ? t(`palette_${palette}`) : '';
    return `${species}${formDisplay ? ` ${formDisplay}` : ''}${paletteDisplay ? ` ${paletteDisplay}` : ''}`;
}