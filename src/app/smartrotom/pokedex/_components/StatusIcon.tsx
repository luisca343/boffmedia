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