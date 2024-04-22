import { TableBody } from "@/components/ui/table";
import { SpawnInfo } from "../_types/spawnInfo";
import useTranslation from 'next-translate/useTranslation'
import PokedexTable, { PokedexCell, PokedexHead, PokedexHeader, PokedexRow } from "./PokedexTable";
import { PokemonSprite } from "./PokemonSprite";

export function SpawnTable({spawns}: {spawns: SpawnInfo[]}){
    const { t } = useTranslation("smartrotom/pokedex/spawns")
    if(spawns.length == 0) return <div className="  text-white text-shadow-border1 flex justify-center ">
    <div className=" h-full flex-col justify-center items-center bg-zinc-800 rounded-lg m-2" >
        Este Pokémon no spawnea
    </div>
</div>

    function getRarity(rarity: number){
        if(rarity <= 10){
        return t('ultra_rare')
        }

        if(rarity <= 100){
        return t('rare')
        }

        if(rarity <= 200){
        return t('uncommon')
        }
        
        if(rarity <= 300){
        return t('common')
        }
        return rarity.toString()
    }

    function getRarityColor(rarity: number){
        if(rarity <= 10){
        return 'bg-purple-600'
        }

        if(rarity <= 100){
        return 'bg-red-800'
        }

        if(rarity <= 200){
        return 'bg-yellow-800'
        }
        
        if(rarity <= 300){
        return 'bg-green-800'
        }
        return ''
    }


    return (
        <PokedexTable>
            <PokedexHeader>
                <PokedexRow>
                    <PokedexHead> </PokedexHead>
                    <PokedexHead> Forma </PokedexHead>
                    <PokedexHead> Tipo </PokedexHead>
                    <PokedexHead> Biomas </PokedexHead>
                    <PokedexHead> Niveles </PokedexHead>
                    <PokedexHead> Localización </PokedexHead>
                    <PokedexHead> Horas </PokedexHead>
                    <PokedexHead> Altura </PokedexHead>
                    <PokedexHead> Rareza </PokedexHead>

                </PokedexRow>
            </PokedexHeader>
            <TableBody>
                {spawns.map((spawn) => {
                    const fullName = `${spawn.pokemonName} ${spawn.pokemonForm} ${spawn.pokemonPalette || ''}`
                    const biomas = spawn.condition?.stringBiomes?.filter(biome =>
                         !biome.includes('biomesoplenty') && !biome.includes('terraforged')
                    ).map((biome) => {
                        return t(`${biome.replace(" ", "_").replace(':','_')}`)
                    })
                    const stringLocationTypes = spawn.stringLocationTypes?.map((location) => {
                        return t(`${location.replace(" ", "_").replace(':','_').toLowerCase()}`)
                    })

                    let height = spawn.condition?.minY || spawn.condition?.maxY ? '' : 'Cualquiera'
                    if(spawn.condition?.minY) {
                        height += `> ${spawn.condition.minY} `
                    } 
                    if(spawn.condition?.maxY) {
                        height += `< ${spawn.condition.maxY}`
                    }

                    const times = spawn.condition?.times?.map((time) => {
                        return t(`${time.toLowerCase()}`)
                    }) || [t("anytime")]
                    

                    return <PokedexRow key={spawn.spawnType}>
                        <PokedexHead className="h-50 w-12">
                        <PokemonSprite id={spawn.pokemonDex} form={spawn.pokemonForm} palette={spawn.pokemonPalette || 'none'} width={50} height={50}/>
                        </PokedexHead>
                        <PokedexCell>{spawn.pokemonPalette || 'Base'}</PokedexCell>
                        <PokedexCell>{t(spawn.spawnType)}</PokedexCell>
                        <PokedexCell>{biomas?.join(', ') || 'Cualquiera'}</PokedexCell>
                        <PokedexCell>{`${spawn.minLevel} - ${spawn.maxLevel}`}</PokedexCell>
                        <PokedexCell>{stringLocationTypes.join(', ')}</PokedexCell>
                        <PokedexCell>{times.join(', ')}</PokedexCell>
                        <PokedexCell>{height}</PokedexCell>
                        <PokedexCell className={getRarityColor(spawn.rarity)}>{getRarity(spawn.rarity)}</PokedexCell>
                    </PokedexRow>
                })}
            </TableBody>
        </PokedexTable>
    )
}