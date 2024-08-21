import { TypeBadgeSmall } from "@/app/smartrotom/pokedex/entrada/[[...params]]/_components/TypeBadge";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Pokemon } from "@pkmn/client";

export default function PokemonDetail({pokemon, children, className, offset = 20}: 
    {pokemon: Pokemon, children: any, className?: string, key?: string, offset?: number}) {
    let types;
    try {
        types = pokemon.types;
    } catch (error) {
        return <>{children}</>
    }
    if (!pokemon || !types) return <></>;
    return <HoverCard key={pokemon.name} openDelay={0} closeDelay={0}>
    <HoverCardTrigger  className={className}>
        {children}
    </HoverCardTrigger>
    <HoverCardContent className=" bg-slate-800 bg-opacity-90 text-slate-100 w-128" side="top"   style={{zIndex:'500'}}>
         <span className="font-bold">{pokemon.name}</span> {pokemon.speciesForme} L{pokemon.level}
         <div className="flex">{types.map(type => <TypeBadgeSmall key={type} type={type} />)}</div>
         <br/>
         <div>HP: {pokemon.hp > 0 ? pokemon.hp / pokemon.maxhp * 100 : 0}%</div>
         <span className="flex">Possible abilities: {pokemon.species.abilities[0]} {pokemon.species.abilities[1] && pokemon.species.abilities[1]} {pokemon.species.abilities.H && pokemon.species.abilities.S}</span>
        <span className="flex">Speed: {calculateSpeed(pokemon.species.baseStats.spe, pokemon.level, .9, 0,0 )} - {calculateSpeed(pokemon.species.baseStats.spe, pokemon.level, 1.1, 31, 252)} </span>   
        {pokemon.movesUsedWhileActive.map(move => <div key={move}>{move}</div>)}
        {pokemon.teraType && <div className="flex">Tera Type: {pokemon.teraType}</div>}
    </HoverCardContent>
</HoverCard>
}

function calculateSpeed(base: number, level: number, natureModifier: number, IV: number, EV: number) {
    return Math.floor(
        Math.floor(
            ( 2 * base + IV + Math.floor(EV / 4)) * level / 100 + 5
        ) * natureModifier
    );
}