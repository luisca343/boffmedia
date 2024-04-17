export default function getPokemonSprite(name: string, form: string, shiny: boolean){
    const formString = form && form != 'base' ? `_${form.toUpperCase()}` : ''
    const folderString = shiny ? 'Front Shiny' : 'Front'
    return `/smartrotom/img/sprites/${folderString}/${name.toUpperCase()}${formString}.png`
}

export function getPokemonName(name: string, t: any){
    return t(`pixelmon_${name.toLocaleLowerCase()}`)
}