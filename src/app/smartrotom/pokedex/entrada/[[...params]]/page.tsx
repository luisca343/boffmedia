import { Pokemon } from "../../_types/pokemon"
import { EvoTree } from "./_components/EvoTree"
import { SpawnInfo } from "../../_types/spawnInfo"
import { GenderProperties } from "@/types/Pokemon"
import { getTranslations } from "next-intl/server"
import { TypeTable } from "./_components/TypeTable"
import { InternalLink } from "@/components/nav/Link"
import { StatsTable } from "./_components/StatsTable"
import { SpawnTable } from "./_components/SpawnTable"
import { EntryHeader } from "./_components/EntryHeader"
import { BasicInfo } from "./_components/ClientBasicInfo"
import { PokemonSprite } from "../../_components/PokemonSprite"
import { PokedexSection } from "../../_components/PokedexSection"
import { pokemonService } from "@/services/api/smartrotom/pokemonService"
import { LevelMovesTable, OtherMovesTable } from "./_components/MovesTable"
import  { getForm, getFormName, getPokemonCoverage, getPokemonDefense, getPokemonId } from "../../dexUtils"


export default async function EntradaPokedex({params}: any){
    const t = await getTranslations("pokedex");
    
    let [pokemonIndex, formIndex] = params.params as [number, number | string]
    
    const pokemon = (await pokemonService.getPokemonByDex(pokemonIndex)).data as Pokemon
    
    
    
    if (pokemonIndex === undefined) {
        pokemonIndex = 0;
    }
    
    if (formIndex === undefined ) {
        formIndex = 0;
    } else if(!parseInt(formIndex+"")) {
        formIndex = pokemon.forms.findIndex((form) => form.name === formIndex) 
        formIndex = formIndex === -1 ? 0 : formIndex
    } else {
        formIndex = parseInt(formIndex+"") - 1;
    }
    
    const {next, prev} = (await pokemonService.getNextPrev(pokemonIndex)).data!
    const moves = await (await pokemonService.getMoves(pokemonIndex, formIndex)).data
    
    if(!pokemon) return <h1>Pokemon no encontrado {pokemonIndex}</h1>
    if(!pokemon.forms[formIndex]) return <h1>Forma no encontrada {formIndex}</h1>
    
    const formName = getFormName(pokemon, formIndex)
    
    const spawns = (await pokemonService.getSpawnByPokemon(getPokemonId(pokemon.name, formName))).data as SpawnInfo[]
    
    const type1 = pokemon.forms[formIndex]?.types?.[0] ?? pokemon.forms[0]?.types?.[0] as string
    const type2 = pokemon.forms[formIndex]?.types?.[1] ?? pokemon.forms[0]?.types?.[1] as string
    
    const genderProperties = pokemon.forms[formIndex].genderProperties as GenderProperties[]
    const palettes = genderProperties?.map((gender) => {
        return gender.palettes.map((palette) => {
            const sprite = typeof palette.sprite === 'object' ? palette.sprite.resource?.split(':')[1] : palette.sprite?.split(':')[1]
            return {
                name: palette.name,
                sprite
            }
        })})
        return (
            <section className="flex flex-col overflow-hidden text-surface-50">
            <EntryHeader pokemon={pokemon} formName={formName} prev={prev} next={next} />
            <section className="flex flex-col  bg-surface-800 overflow-auto p-4">
            <PokedexSection id='info' title="Información">
            <BasicInfo pokemon={pokemon} formIndex={formIndex} formName={formName} />
            </PokedexSection>
            
            <PokedexSection id='evotree' title="Árbol Evolutivo">
            <EvoTree params={{id: pokemon.dex.toString()}} />
            </PokedexSection>
            
            {pokemon.forms.length > 1 && 
                <PokedexSection id='forms' title="Formas Alternativas">
                <div className="flex flex-wrap justify-center">
                {pokemon.forms.map((form, index) => {
                    return <InternalLink key={form.name} 
                    href={`/pokedex/entrada/${pokemon.dex}/${index + 1}#forms`}>
                    <div className="flex flex-col p-2 justify-center items-center">
                    <PokemonSprite width={100} height={100} id={pokemonIndex} form={form.name || 'base'} palette='none'/>
                    {getForm(form.name, t) || 'Base'}
                    </div>
                    </InternalLink>
                })}
                </div>
                </PokedexSection>}
                
                <PokedexSection id='typedata' title="Efectividades">
                <div className="flex justify-center">
                <TypeTable className="w-[50%]" list={getPokemonDefense(type1, type2)} title="Daño Recibido" id='deffensive'/>
                <TypeTable className="w-[50%]" list={getPokemonCoverage(type1, type2)} title="Daño Realizado" id='offensive'/>
                </div>
                </PokedexSection>
                
                <PokedexSection  id='stats' title="Estadísticas">
                <StatsTable pokemon={pokemon} formIndex={formIndex} />
                </PokedexSection>
                
                <PokedexSection id='spawns' title="Localizaciones">
                <SpawnTable spawns={spawns}/>
                </PokedexSection>
                
                <PokedexSection id='moves' title="Movimientos">
                <LevelMovesTable pokemon={pokemon} formIndex={formIndex} moveData={moves}/>
                <div className="mt-8" />
                <OtherMovesTable pokemon={pokemon} formIndex={formIndex} moveData={moves}/>
                </PokedexSection>
                
                <PokedexSection id='palettes' title="Variantes">
                {palettes && palettes.map((palette, index) => {
                    return <div key={index} className="flex flex-wrap justify-center">
                    {palette.map((palette, index) => {
                        return <div key={index} className="flex flex-col p-2 justify-center items-center">
                        <PokemonSprite width={80} height={80} id={pokemonIndex} form={formName} palette={palette.name} hide={true} showStatus={false}/>
                        <span>{t(`palette_${palette.name}`)}</span>
                        </div>
                    })}
                    </div>
                })}
                </PokedexSection>
                
                </section>
                </section>
            )
        }
        