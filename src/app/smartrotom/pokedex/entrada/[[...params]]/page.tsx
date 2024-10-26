import { rotomGET } from "@/services/boffAPI"
import { Movement, Pokemon } from "../../_types/pokemon"
import  { getForm, getFormName, getPokemonCoverage, getPokemonDefense, getPokemonId, getPokemonNameAndForm } from "../../dexUtils"
import { EvoTree } from "./_components/EvoTree"
import { PokemonSprite } from "../../_components/PokemonSprite"
import { TypeTable } from "./_components/TypeTable"
import TypeBadge from "./_components/TypeBadge"
import { StatsTable } from "./_components/StatsTable"
import { EntryHeader } from "./_components/EntryHeader"
import { LevelMovesTable, MovesTable, OtherMovesTable } from "./_components/MovesTable"
import { SpawnInfo } from "../../_types/spawnInfo"
import { SpawnTable } from "./_components/SpawnTable"
import { Abilities, GenderProperties } from "@/types/Pokemon"
import { PokedexSection } from "../../_components/PokedexSection"
import { InternalLink } from "@/components/nav/Link"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { getTranslations } from "next-intl/server"


export default async function EntradaPokedex({params}: any){
    const formsTranslation  = await getTranslations("");
    
    let [pokemonIndex, formIndex] = params.params as [number, number | string]

    const pokemon = await rotomGET(`/pokemon/dex/${pokemonIndex}`) as Pokemon
    

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
   
       
    

    const {next, prev} = await rotomGET(`/pokemon/nextprev/${pokemonIndex}`) as {next: Pokemon, prev: Pokemon}
    const moves = await rotomGET(`/pokemon/moves/${pokemonIndex}/${formIndex}`) as Movement[]

    if(!pokemon) return <h1>Pokemon no encontrado {pokemonIndex}</h1>
    if(!pokemon.forms[formIndex]) return <h1>Forma no encontrada {formIndex}</h1>

    const formName = getFormName(pokemon, formIndex)
    
    const spawns = await rotomGET(`/pokemon/spawns/${getPokemonId(pokemon.name, formName)}`) as SpawnInfo[]

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
        <section className="flex flex-col overflow-hidden text-main-50 bg-main-800 ">
            <EntryHeader pokemon={pokemon} formName={formName} prev={prev} next={next} t={formsTranslation}/>
            <section className="flex flex-col  bg-main-800 overflow-auto pt-4">
                <PokedexSection id='info' title="Información">
                    <BasicInfo formName={formName}/>
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
                                    {getForm(form.name, formsTranslation) || 'Base'}
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
                    <OtherMovesTable pokemon={pokemon} formIndex={formIndex} moveData={moves}/>
                </PokedexSection>


                
                <PokedexSection id='palettes' title="Variantes">
                    {palettes && palettes.map((palette, index) => {
                        return <div key={index} className="flex flex-wrap justify-center">
                            {palette.map((palette, index) => {
                                return <div key={index} className="flex flex-col p-2 justify-center items-center">
                                    <PokemonSprite width={80} height={80} id={pokemonIndex} form={formName} palette={palette.name} hide={false} showStatus={false}/>
                                    <span>{formsTranslation(`palette_${palette.name}`)}</span>
                                </div>
                            })}
                        </div>
                    })}
                </PokedexSection>

            </section>
        </section>
    )

    function BasicInfo({formName}: {formName: string}){
        const types = pokemon.forms[formIndex as number].types ? pokemon.forms[formIndex as number].types : pokemon.forms[0].types as any
        const description = formsTranslation(`pixelmon_${pokemon.name.toLowerCase()}_description`).split('_').join('.')
        const rank = pokemon.forms[formIndex as number].rank ? pokemon.forms[formIndex as number].rank : pokemon.forms[0].rank as {ranking: number, type1: string, type2: string, tier: string}
        
        const abilities = pokemon.forms[formIndex as number].abilities ? pokemon.forms[formIndex as number].abilities : pokemon.forms[0].abilities as Abilities
        
        return <section className="flex justify-center items-center">
        <div className="flex flex-col items-center">
            <div className="flex " style={{width:200, height:200}}>
                <PokemonSprite id={pokemonIndex} form={formName} palette='none' width={200} height={200} pixelated={false}  showStatus={false}/>
            </div> 
            <span className=" text-xl text-center">{description}  </span> 
            <HoverCard>
                <HoverCardTrigger>
                    <div className="flex justify-center items-center hover:cursor-help">
                        {types.map((type: string) => <TypeBadge key={type} type={type}/>)}
                    </div>
                </HoverCardTrigger>
                <HoverCardContent className="z-[200] bg-main-800 text-main-100 w-128">
                    {rank && <div className="text-center">{`Ficus Rank: ${rank.ranking > 0 ? "#"+rank.ranking : ""}  Tier ${rank?.tier} `}</div>}
                </HoverCardContent>
            </HoverCard>
                <div>
                    <span className="font-bold">Habilidades:</span>
                    {abilities?.abilities.map((ability) => <span className="mx-1" key={ability}>{ability}</span>)}
                </div>
                
                {abilities?.hiddenAbilities && 
                    <div>
                        <span className="font-bold">Habilidad Oculta:</span>
                        {abilities?.hiddenAbilities.map((ability) => <span className="mx-1" key={ability}>{ability}</span>)}
                    </div>
                }
            </div>

        </section>
    }





}
