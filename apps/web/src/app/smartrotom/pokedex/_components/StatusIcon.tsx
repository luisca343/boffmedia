import Image from "next/image"
import { useTranslations } from "next-intl"
import { PokedexStatus } from "../dexUtils"

export function StatusIcon({palette, seenAt, caughtAt}: {palette: string, seenAt: Date | string, caughtAt: Date | string | undefined | null}){
    const t = useTranslations("pokedex")
    if(caughtAt) {
        if(palette === 'shiny') return <Image height={24} width={24} src={`/smartrotom/img/apps/pokedex/shiny.webp`} alt={t("dexStatus.shiny")}/>
        return <Image height={24} width={24} src={`/smartrotom/img/apps/pokedex/capturado.webp`} alt={t("dexStatus.caught")}/>
    }
    if(seenAt) return <Image height={24} width={24} src={`/smartrotom/img/apps/pokedex/avistado.webp`} alt={t("dexStatus.seen")}/>
    return <Image height={24} width={24} src={`/smartrotom/img/apps/pokedex/desconocido.webp`} alt={t("dexStatus.unknown")}/>
}


export function StatusIconv2({palette, status, width=24, height=24}: {palette: string, status: PokedexStatus, width?: number, height?: number}){
    const t = useTranslations("pokedex")
    if(status === 2) {
        if(palette === 'shiny') return <Image height={ height / 3 } width={ width / 3 } src={`/smartrotom/img/apps/pokedex/shiny.webp`} alt={t("dexStatus.shiny")}/>
        return <Image height={ height / 3} width={ width / 3} src={`/smartrotom/img/apps/pokedex/capturado.webp`} alt={t("dexStatus.caught")}/>
    }
    if(status === 1) return <Image height={ height / 3 } width={width / 3 } src={`/smartrotom/img/apps/pokedex/avistado.webp`} alt={t("dexStatus.seen")}/>
    return 
    <Image height={24} width={24} src={`/smartrotom/img/apps/pokedex/desconocido.webp`} alt={t("dexStatus.unknown")}/>
}