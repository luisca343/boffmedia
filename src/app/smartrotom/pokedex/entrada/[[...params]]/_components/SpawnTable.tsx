import { TableBody } from "@/components/ui/table";
import { SpawnInfo } from "../../../_types/spawnInfo";
import PokedexTable, { PokedexCell, PokedexHead, PokedexHeader, PokedexRow } from "../../../_components/PokedexTable";
import { PokemonSprite } from "../../../_components/PokemonSprite";
import { InternalLink } from "@/components/nav/Link";
import { useTranslations } from "next-intl";

export function SpawnTable({spawns}: {spawns: SpawnInfo[]}){
    const t  = useTranslations("");
    const formsTrans  = useTranslations("");
    if(spawns.length == 0) return <div className="  text-surface-50 text-shadow-border1 flex justify-center ">
    <div className=" h-full flex-col justify-center items-center rounded-lg m-2" >
        Este Pokémon no spawnea
    </div>
</div>

    function getRarity(rarity: number){
        if(rarity < 1){
            return t('extremely_rare')
        }
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
        if(rarity < 1){
            return 'bg-pink-800'
        }
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
              <PokedexHead className="w-16"> </PokedexHead>
              <PokedexHead className="text-center">Variante</PokedexHead>
              <PokedexHead className="text-center">Tipo</PokedexHead>
              <PokedexHead className="text-center">Biomas</PokedexHead>
              <PokedexHead className="text-center">Niveles</PokedexHead>
              <PokedexHead className="text-center">Localización</PokedexHead>
              <PokedexHead className="text-center">Horas</PokedexHead>
              <PokedexHead className="text-center">Altura</PokedexHead>
              <PokedexHead className="text-center">Rareza</PokedexHead>
            </PokedexRow>
          </PokedexHeader>
          <TableBody>
                {spawns.map((spawn) => {
                    const fullName = `${spawn.pokemonName} ${spawn.pokemonForm} ${spawn.pokemonPalette || ''}`
                    const biomas = spawn.condition?.stringBiomes?.filter(biome =>
                         !biome.includes('biomesoplenty') && !biome.includes('terraforged')
                    ).map((biome) => {
                        return {biome, translated:t(`${biome.replace(" ", "_").replace(':','_')}`)}
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

                    return (
                      <PokedexRow key={spawn.spawnType}>
                        <PokedexCell hard className="w-16">
                          <PokemonSprite id={spawn.pokemonDex} form={spawn.pokemonForm} palette={spawn.pokemonPalette || 'none'} width={50} height={50} />
                        </PokedexCell>
                        <PokedexCell className="text-center">{getFormPalette(spawn)}</PokedexCell>
                        <PokedexCell className="text-center">{t(spawn.spawnType)}</PokedexCell>
                        <PokedexCell className="text-center">
                          {biomas && biomas.length > 0 ? biomas.map((biome, index) => (
                            <span key={biome.biome} className="hover:text-primary-400 transition-colors">
                              <InternalLink href={`/pokedex/localizacion/${biome.biome}`}>{biome.translated}</InternalLink>
                              {index < biomas.length - 1 ? ', ' : ''}
                            </span>
                          )) : 'Cualquiera'}
                        </PokedexCell>
                        <PokedexCell className="text-center">{`${spawn.minLevel} - ${spawn.maxLevel}`}</PokedexCell>
                        <PokedexCell className="text-center">{stringLocationTypes.join(', ')}</PokedexCell>
                        <PokedexCell className="text-center">{times.join(', ')}</PokedexCell>
                        <PokedexCell className="text-center">{height}</PokedexCell>
                        <PokedexCell className={`text-center font-medium ${getRarityColor(spawn.rarity)}`}>{getRarity(spawn.rarity)}</PokedexCell>
                      </PokedexRow>
                    )
                  })}
                </TableBody>
              </PokedexTable>
            )

    function getFormPalette(spawn: SpawnInfo){
        const form = spawn.pokemonForm === 'base' ? '' : formsTrans(`form_${spawn.pokemonForm}`)
        const palette = spawn.pokemonPalette ? formsTrans(`palette_${spawn.pokemonPalette}`) : ''

        return <div>
            <span>{palette || form ? form : 'Base'}</span>
            <span>{palette}</span>
        </div>
    }
}

