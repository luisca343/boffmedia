import Image from "next/image"

export enum Status {
    UNKNOWN,
    SEEN,
    CAUGHT,
    SHINY
}

export function StatusIcon({palette, seenAt, caughtAt}: {palette: string, seenAt: Date | string, caughtAt: Date | string | undefined | null}){
    if(caughtAt) {
        if(palette === 'shiny') return <Image height={24} width={24} src={`/smartrotom/img/apps/pokedex/shiny.webp`} alt="Shiny"/>
        return <Image height={24} width={24} src={`/smartrotom/img/apps/pokedex/capturado.webp`} alt="Capturado"/>
    }
    if(seenAt) return <Image height={24} width={24} src={`/smartrotom/img/apps/pokedex/avistado.webp`} alt="Avistado"/>
    return <Image height={24} width={24} src={`/smartrotom/img/apps/pokedex/desconocido.webp`} alt="Desconocido"/>
}


export function StatusIconv2({palette, status, width=24, height=24}: {palette: string, status: Status, width?: number, height?: number}){
    if(status === 2) {
        if(palette === 'shiny') return <Image height={ height / 3 } width={ width / 3 } src={`/smartrotom/img/apps/pokedex/shiny.webp`} alt="Shiny"/>
        return <Image height={ height / 3} width={ width / 3} src={`/smartrotom/img/apps/pokedex/capturado.webp`} alt="Capturado"/>
    }
    if(status === 1) return <Image height={ height / 3 } width={width / 3 } src={`/smartrotom/img/apps/pokedex/avistado.webp`} alt="Avistado"/>
    return 
    <Image height={24} width={24} src={`/smartrotom/img/apps/pokedex/desconocido.webp`} alt="Desconocido"/>
}