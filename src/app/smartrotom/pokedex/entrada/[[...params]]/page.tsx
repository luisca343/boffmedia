import { EvoTree } from "./_components/EvoTree"
import { SpawnInfo } from "../../_types/spawnInfo"
import { GenderProperties, Pokemon } from "@/types/Pokemon"
import { getTranslations } from "next-intl/server"
import { InternalLink } from "@/components/ui/navigation/Link"
import { StatsTable } from "./_components/StatsTable"
import { SpawnTable } from "./_components/SpawnTable"
import { EntryHeader } from "./_components/EntryHeader"
import { BasicInfo } from "./_components/ClientBasicInfo"
import { PokedexSection } from "../../_components/PokedexSection"
import { PokemonService } from "@/services/api/smartrotom/pokemonService"
import { LevelMovesTable, OtherMovesTable } from "./_components/MovesTable"
import { getFormName, getPokemonId } from "../../dexUtils"
import PokemonList from "./_components/PokemonList"
import { FormsSection } from "./_components/FormsSection"
import { TypeEffectivenessSection } from "./_components/TypeEffectivenessSection"
import { PalettesSection } from "./_components/PalettesSection"

export default async function EntradaPokedex({params}: any){
    if(!params.params) return <PokemonList/>
    const t = await getTranslations("pokedex");
    
    let [pokemonIndex, formIndex] = params.params as [number, number | string]
    
    const pokemon = (await PokemonService.getPokemonByDex(pokemonIndex)).data as Pokemon
    
    
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
    
    const {next, prev} = (await PokemonService.getNextPrev(pokemonIndex)).data!
    const moves = await (await PokemonService.getMoves(pokemonIndex, formIndex)).data
    
    if(!pokemon) return <h1>Pokemon no encontrado {pokemonIndex}</h1>
    if(!pokemon.forms[formIndex]) return <h1>Forma no encontrada {formIndex}</h1>
    
    const formName = getFormName(pokemon, formIndex)
    
    const spawns = (await PokemonService.getSpawns(getPokemonId(pokemon.name, formName))).data as SpawnInfo[]


    
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
            <section className="flex flex-col bg-surface-800 overflow-auto p-4">
                <PokedexSection id='info' title="Información">
                    <BasicInfo pokemon={pokemon} formIndex={formIndex} formName={formName} />
                </PokedexSection>
                
                <PokedexSection id='evotree' title="Árbol Evolutivo">
                    <EvoTree params={{id: pokemon.dex.toString()}} />
                </PokedexSection>
                
                {/* Extracted Forms Section */}
                <FormsSection 
                    pokemon={pokemon}
                    pokemonIndex={pokemonIndex}
                    formIndex={formIndex}
                />
                
                {/* Extracted Type Effectiveness Section */}
                <TypeEffectivenessSection
                    type1={type1}
                    type2={type2}
                />
                
                <PokedexSection id='stats' title="Estadísticas">
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
                
                {/* Extracted Palettes Section */}
                <PalettesSection
                    palettes={palettes}
                    pokemonIndex={pokemonIndex}
                    formName={formName}
                />
            </section>
        </section>
    )
}