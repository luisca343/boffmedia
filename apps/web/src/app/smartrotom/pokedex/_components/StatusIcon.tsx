import { useTranslations } from "next-intl"
import { ASSET, staticAsset } from '@/lib/assets'
import { PokedexStatus } from "../dexUtils"
import { ArtImage } from "@/components/boffmedia/ui/tools/ArtImage"

function StatusImage({ src, alt, width, height }: { src: string; alt: string; width: number; height: number }) {
    return <ArtImage src={src} alt={alt} width={width} height={height} fit="contain" />
}

export function StatusIcon({palette, seenAt, caughtAt}: {palette: string, seenAt: Date | string, caughtAt: Date | string | undefined | null}){
    const t = useTranslations("pokedex")
    if(caughtAt) {
        if(palette === 'shiny') return <StatusImage height={24} width={24} src={staticAsset(ASSET.smartrotom.img, 'apps/pokedex/shiny.webp')} alt={t("dexStatus.shiny")}/>
        return <StatusImage height={24} width={24} src={staticAsset(ASSET.smartrotom.img, 'apps/pokedex/capturado.webp')} alt={t("dexStatus.caught")}/>
    }
    if(seenAt) return <StatusImage height={24} width={24} src={staticAsset(ASSET.smartrotom.img, 'apps/pokedex/avistado.webp')} alt={t("dexStatus.seen")}/>
    return <StatusImage height={24} width={24} src={staticAsset(ASSET.smartrotom.img, 'apps/pokedex/desconocido.webp')} alt={t("dexStatus.unknown")}/>
}


export function StatusIconv2({palette, status, width=24, height=24}: {palette: string, status: PokedexStatus, width?: number, height?: number}){
    const t = useTranslations("pokedex")
    if(status === 2) {
        if(palette === 'shiny') return <StatusImage height={ height / 3 } width={ width / 3 } src={staticAsset(ASSET.smartrotom.img, 'apps/pokedex/shiny.webp')} alt={t("dexStatus.shiny")}/>
        return <StatusImage height={ height / 3} width={ width / 3} src={staticAsset(ASSET.smartrotom.img, 'apps/pokedex/capturado.webp')} alt={t("dexStatus.caught")}/>
    }
    if(status === 1) return <StatusImage height={ height / 3 } width={width / 3 } src={staticAsset(ASSET.smartrotom.img, 'apps/pokedex/avistado.webp')} alt={t("dexStatus.seen")}/>
    return
    <StatusImage height={24} width={24} src={staticAsset(ASSET.smartrotom.img, 'apps/pokedex/desconocido.webp')} alt={t("dexStatus.unknown")}/>
}
