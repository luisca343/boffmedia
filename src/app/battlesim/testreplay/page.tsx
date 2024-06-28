
import { Battle, Pokemon } from "@pkmn/client"
import { Protocol } from "@pkmn/protocol"
import { Dex } from '@pkmn/sim';
import { Generations } from '@pkmn/data';
import PokemonSprite from "../_components/PokemonSprite";
import { PokemonTeamList } from "../_components/PokemonTeam";

let battle = new Battle(new Generations(Dex as any))

export default function Test() {
  const replay = `|j|☆Rougewings
|j|☆Luisca343
|t:|1719248338
|gametype|doubles
|player|p1|Rougewings|170|1047
|player|p2|Luisca343|266|1069
|teamsize|p1|6
|teamsize|p2|6
|gen|9
|tier|[Gen 9] Random Doubles Battle
|rated|
|rule|Species Clause: Limit one of each Pokémon
|rule|HP Percentage Mod: HP is shown in percentages
|rule|Illusion Level Mod: Illusion disguises the Pokémon's true level
|rule|Sleep Clause Mod: Limit one foe put to sleep
|
|t:|1719248338
|start
|switch|p1a: Flamigo|Flamigo, L84, M|275\/275
|switch|p1b: Shaymin|Shaymin-Sky, L77|281\/281
|switch|p2a: Breloom|Breloom, L84, M|238\/238
|switch|p2b: Ampharos|Ampharos, L87, M|298\/298
|turn|1
|
|t:|1719248375
|move|p1b: Shaymin|Protect|p1b: Shaymin
|-singleturn|p1b: Shaymin|Protect
|move|p2a: Breloom|Protect|p2a: Breloom
|-singleturn|p2a: Breloom|Protect
|move|p1a: Flamigo|U-turn|p2a: Breloom
|-activate|p2a: Breloom|move: Protect
|move|p2b: Ampharos|Thunder Wave|p1b: Shaymin
|-activate|p1b: Shaymin|move: Protect
|
|upkeep
|turn|2
|
|t:|1719248399
|switch|p2a: Dondozo|Dondozo, L85, F|394\/394
|move|p1b: Shaymin|Air Slash|p2a: Dondozo
|-damage|p2a: Dondozo|311\/394
|-damage|p1b: Shaymin|253\/281|[from] item: Life Orb
|move|p1a: Flamigo|U-turn|p2a: Dondozo
|-damage|p2a: Dondozo|243\/394
|inactive|Battle timer is ON: inactive players will automatically lose when time's up. (requested by Rougewings)
|
|t:|1719248429
|switch|p1a: Arceus|Arceus-Grass, L74|300\/300|[from] U-turn
|move|p2b: Ampharos|Thunder Wave|p1b: Shaymin
|-status|p1b: Shaymin|par
|
|upkeep
|turn|3
|
|t:|1719248448
|switch|p2a: Breloom|Breloom, L84, M|238\/238
|move|p1a: Arceus|Judgment|p2a: Breloom
|-resisted|p2a: Breloom
|-damage|p2a: Breloom|167\/238
|move|p2b: Ampharos|Thunderbolt|p1b: Shaymin
|-damage|p1b: Shaymin|108\/281 par
|move|p1b: Shaymin|Tailwind|p1b: Shaymin
|-sidestart|p1: Rougewings|move: Tailwind
|
|upkeep
|turn|4
|
|t:|1719248468
|move|p1b: Shaymin|Protect|p1b: Shaymin
|-singleturn|p1b: Shaymin|Protect
|move|p2a: Breloom|Protect|p2a: Breloom
|-singleturn|p2a: Breloom|Protect
|move|p1a: Arceus|Judgment|p2b: Ampharos
|-damage|p2b: Ampharos|178\/298
|move|p2b: Ampharos|Thunderbolt|p1b: Shaymin
|-activate|p1b: Shaymin|move: Protect
|
|upkeep
|turn|5
|
|t:|1719248489
|switch|p2a: Forretress|Forretress, L90, M|281\/281
|move|p1a: Arceus|Judgment|p2b: Ampharos
|-damage|p2b: Ampharos|73\/298
|-enditem|p2b: Ampharos|Sitrus Berry|[eat]
|-heal|p2b: Ampharos|147\/298|[from] item: Sitrus Berry
|move|p1b: Shaymin|Air Slash|p2a: Forretress
|-damage|p2a: Forretress|160\/281
|-damage|p1b: Shaymin|80\/281 par|[from] item: Life Orb
|move|p2b: Ampharos|Thunderbolt|p1b: Shaymin
|-damage|p1b: Shaymin|0 fnt
|faint|p1b: Shaymin
|
|-heal|p2a: Forretress|177\/281|[from] item: Leftovers
|upkeep
|inactive|Rougewings has 120 seconds left.
|
|t:|1719248509
|switch|p1b: Umbreon|Umbreon, L86, F|304\/304
|turn|6
|
|t:|1719248522
|move|p1a: Arceus|Judgment|p2b: Ampharos
|-damage|p2b: Ampharos|30\/298
|move|p1b: Umbreon|Snarl|p2b: Ampharos|[spread] p2a,p2b
|-damage|p2a: Forretress|135\/281
|-damage|p2b: Ampharos|0 fnt
|-unboost|p2a: Forretress|spa|1
|faint|p2b: Ampharos
|move|p2a: Forretress|Body Press|p1b: Umbreon
|-supereffective|p1b: Umbreon
|-damage|p1b: Umbreon|146\/304
|-enditem|p1b: Umbreon|Sitrus Berry|[eat]
|-heal|p1b: Umbreon|222\/304|[from] item: Sitrus Berry
|
|-heal|p2a: Forretress|152\/281|[from] item: Leftovers
|-sideend|p1: Rougewings|move: Tailwind
|upkeep
|inactive|Luisca343 has 120 seconds left.
|
|t:|1719248554
|switch|p2b: Tornadus|Tornadus-Therian, L78, M|251\/251
|turn|7
|
|t:|1719248569
|move|p2b: Tornadus|Bleakwind Storm|p1a: Arceus|[spread] p1a,p1b
|-supereffective|p1a: Arceus
|-damage|p1a: Arceus|100\/300
|-damage|p1b: Umbreon|138\/304
|-unboost|p1a: Arceus|spe|1
|move|p1b: Umbreon|Thunder Wave|p2b: Tornadus
|-status|p2b: Tornadus|par
|move|p1a: Arceus|Will-O-Wisp|p2a: Forretress
|-status|p2a: Forretress|brn
|move|p2a: Forretress|Body Press|p1b: Umbreon
|-supereffective|p1b: Umbreon
|-damage|p1b: Umbreon|67\/304
|
|-heal|p2a: Forretress|169\/281 brn|[from] item: Leftovers
|-damage|p2a: Forretress|152\/281 brn|[from] brn
|upkeep
|turn|8
|inactive|Rougewings has 120 seconds left.
|
|t:|1719248604
|move|p1b: Umbreon|Foul Play|p2b: Tornadus
|-damage|p2b: Tornadus|128\/251 par
|move|p1a: Arceus|Tailwind|p1a: Arceus
|-sidestart|p1: Rougewings|move: Tailwind
|move|p2a: Forretress|Iron Defense|p2a: Forretress
|-boost|p2a: Forretress|def|2
|move|p2b: Tornadus|Bleakwind Storm|p1b: Umbreon|[spread] p1a,p1b
|-supereffective|p1a: Arceus
|-damage|p1a: Arceus|0 fnt
|-damage|p1b: Umbreon|0 fnt
|faint|p1a: Arceus
|faint|p1b: Umbreon
|
|-heal|p2a: Forretress|169\/281 brn|[from] item: Leftovers
|-damage|p2a: Forretress|152\/281 brn|[from] brn
|upkeep
|inactive|Rougewings has 120 seconds left.
|
|t:|1719248620
|switch|p1a: Azelf|Azelf, L83|260\/260
|switch|p1b: Flamigo|Flamigo, L84, M|275\/275
|turn|9
|inactive|Rougewings has 120 seconds left.
|
|t:|1719248649
|switch|p2b: Breloom|Breloom, L84, M|167\/238
|move|p1a: Azelf|Psychic|p2b: Breloom
|-supereffective|p2b: Breloom
|-damage|p2b: Breloom|0 fnt
|faint|p2b: Breloom
|-damage|p1a: Azelf|234\/260|[from] item: Life Orb
|move|p1b: Flamigo|Close Combat|p2a: Forretress
|-damage|p2a: Forretress|86\/281 brn
|-unboost|p1b: Flamigo|def|1
|-unboost|p1b: Flamigo|spd|1
|move|p2a: Forretress|Thunder Wave|p1b: Flamigo
|-status|p1b: Flamigo|par
|
|-heal|p2a: Forretress|103\/281 brn|[from] item: Leftovers
|-damage|p2a: Forretress|86\/281 brn|[from] brn
|upkeep
|inactive|Luisca343 has 120 seconds left.
|
|t:|1719248666
|switch|p2b: Tornadus|Tornadus-Therian, L78, M|211\/251 par
|turn|10
|inactive|Rougewings has 120 seconds left.
|
|t:|1719248690
|-terastallize|p2b: Tornadus|Flying
|move|p1a: Azelf|Protect|p1a: Azelf
|-singleturn|p1a: Azelf|Protect
|move|p1b: Flamigo|Close Combat|p2a: Forretress
|-damage|p2a: Forretress|19\/281 brn
|-unboost|p1b: Flamigo|def|1
|-unboost|p1b: Flamigo|spd|1
|move|p2a: Forretress|Thunder Wave|p1a: Azelf
|-activate|p1a: Azelf|move: Protect
|move|p2b: Tornadus|Bleakwind Storm|p1a: Azelf|[spread] p1b
|-activate|p1a: Azelf|move: Protect
|-supereffective|p1b: Flamigo
|-damage|p1b: Flamigo|0 fnt
|faint|p1b: Flamigo
|
|-heal|p2a: Forretress|36\/281 brn|[from] item: Leftovers
|-damage|p2a: Forretress|19\/281 brn|[from] brn
|upkeep
|inactive|Rougewings has 120 seconds left.
|
|t:|1719248707
|switch|p1b: Persian|Persian, L93, M|272\/272
|turn|11
|inactive|Rougewings has 120 seconds left.
|
|t:|1719248727
|move|p1b: Persian|Knock Off|p2a: Forretress
|-damage|p2a: Forretress|0 fnt
|-enditem|p2a: Forretress|Leftovers|[from] move: Knock Off|[of] p1b: Persian
|faint|p2a: Forretress
|move|p1a: Azelf|Psychic|p2b: Tornadus
|-damage|p2b: Tornadus|55\/251 par
|-damage|p1a: Azelf|208\/260|[from] item: Life Orb
|move|p2b: Tornadus|Bleakwind Storm|p1b: Persian|[spread] p1b
|-miss|p2b: Tornadus|p1a: Azelf
|-damage|p1b: Persian|88\/272
|
|-sideend|p1: Rougewings|move: Tailwind
|upkeep
|
|t:|1719248745
|switch|p2a: Dondozo|Dondozo, L85, F|243\/394
|turn|12
|inactive|Rougewings has 120 seconds left.
|
|t:|1719248779
|switch|p2b: Eiscue|Eiscue, L89, M|278\/278
|-terastallize|p1b: Persian|Normal
|move|p1b: Persian|Double-Edge|p2a: Dondozo
|-damage|p2a: Dondozo|91\/394
|-damage|p1b: Persian|38\/272|[from] Recoil
|move|p1a: Azelf|Psychic|p2b: Eiscue
|-damage|p2b: Eiscue|129\/278
|-enditem|p2b: Eiscue|Sitrus Berry|[eat]
|-heal|p2b: Eiscue|198\/278|[from] item: Sitrus Berry
|-damage|p1a: Azelf|182\/260|[from] item: Life Orb
|move|p2a: Dondozo|Wave Crash|p1a: Azelf
|-damage|p1a: Azelf|32\/260
|-damage|p2a: Dondozo|41\/394|[from] Recoil
|
|upkeep
|turn|13
|
|t:|1719248809
|move|p2b: Eiscue|Protect|p2b: Eiscue
|-singleturn|p2b: Eiscue|Protect
|move|p1b: Persian|Knock Off|p2b: Eiscue
|-activate|p2b: Eiscue|move: Protect
|move|p1a: Azelf|Dazzling Gleam|p2a: Dondozo|[spread] p2a
|-activate|p2b: Eiscue|move: Protect
|-damage|p2a: Dondozo|0 fnt
|faint|p2a: Dondozo
|-damage|p1a: Azelf|6\/260|[from] item: Life Orb
|
|upkeep
|inactive|Luisca343 has 120 seconds left.
|
|t:|1719248819
|switch|p2a: Tornadus|Tornadus-Therian, L78, M, tera:Flying|138\/251 par
|turn|14
|
|t:|1719248836
|move|p1b: Persian|Knock Off|p2a: Tornadus
|-crit|p2a: Tornadus
|-damage|p2a: Tornadus|28\/251 par
|-enditem|p2a: Tornadus|Choice Specs|[from] move: Knock Off|[of] p1b: Persian
|move|p1a: Azelf|Dazzling Gleam|p2a: Tornadus|[spread] p2a,p2b
|-damage|p2a: Tornadus|0 fnt
|-damage|p2b: Eiscue|138\/278
|faint|p2a: Tornadus
|-damage|p1a: Azelf|0 fnt|[from] item: Life Orb
|faint|p1a: Azelf
|move|p2b: Eiscue|Ice Spinner|p1b: Persian
|-damage|p1b: Persian|0 fnt
|faint|p1b: Persian
|
|win|Luisca343
|raw|Rougewings's rating: 1047 &rarr; <strong>1031<\/strong><br \/>(-16 for losing)
|raw|Luisca343's rating: 1069 &rarr; <strong>1097<\/strong><br \/>(+28 for winning)`


  const battle = new Battle(new Generations(Dex as any))
  //Separate replay into lines
  const lines = replay.split('\n')
  const line0 = lines[0]
  
  for(const line of lines) {
    const {args, kwArgs} = Protocol.parseBattleLine( line)
    console.log(args, kwArgs)
    battle.add(args, kwArgs)
    if(args[0] === 'turn' && args[1] === '3') {
      break
    }
  }

  
  //lines.map((line) => {
  //  const {args, kwArgs} = Protocol.parseBattleLine( line)
      //console.log(args, kwArgs)
  //    battle.add(args, kwArgs)
  //    if(args[0] === 'turn') {
   //     return
   //   }
  //})
  return ( <section className="flex flex-col  w-[900px] h-[450px]">
    <Game battle={battle} />
</section>
  );


}


export function PlayerDataBar({team, reverse} : {team: Pokemon[], reverse?: boolean}){
  console.log("TEAM PLAYER DATA BAR")
console.log(team)
  
  return (
    <div className="w-[20%] h-full">
      <PokemonTeamList team={team} />
      <div className="text-shadow-border1 text-white">{battle.sides[0].name}</div>
      <img className="mx-auto" style={{height:'100px', width:'45px', transform: reverse && 'scaleX(-1)'}} src="https://crafatar.com/renders/body/67d9b543-5ac9-41e1-a8a5-20d7689e24a4" />
    </div>
  )
}

export function Game({battle} : {battle: Battle}) {
const team1 = Object.values(battle.p1.team)
const team2 = Object.values(battle.p2.team)

console.log("TEAM 1")
console.log(team1)

console.log("TEAM 2")
console.log(team2)

const active1 = battle.sides[0].active
const active2 = battle.sides[1].active

  return (
  <div className="w-full h-full flex bg-slate-700">
    <PlayerDataBar team={team1}/>
    <div id="game" className="w-full h-full flex flex-col relative">
      <div className="absolute top-1 right-1 bg-slate-800 py-1 px-2 rounded-md text-slate-200 border border-slate-200">Turn {battle.turn}</div>
      {active1.length === 3 ? <>
          <PokemonSprite pokemon={active1[0]} id="p1a" className='bottom-[16%] left-[5%]'/>
          <PokemonSprite pokemon={active1[1]} id="p1b" className='bottom-[8%] left-[33%]'/>
          <PokemonSprite pokemon={active1[2]} id="p1c" className='bottom-[0%] left-[62%]'/>
        </> : <>
          <PokemonSprite pokemon={active1[0]} id="p1a" className='bottom-[8%] left-[5%]'/>
          <PokemonSprite pokemon={active1[1]} id="p1b" className='bottom-[0%] left-[33%]'/>
        </>
      }
 
    {active2.length === 3 ? <>
          <PokemonSprite pokemon={active2[0]} id="p2a" className='top-[16%] right-[5%]'/>
          <PokemonSprite pokemon={active2[1]} id="p2b" className='top-[8%] right-[33%]'/>
          <PokemonSprite pokemon={active2[2]} id="p2c" className='top-0 right-[62%]'/>

        
        </> : <>
          <PokemonSprite pokemon={active2[0]} id="p2a" className='top-[8%] right-[5%]'/>
          <PokemonSprite pokemon={active2[1]} id="p2b" className='top-0 right-[33%]'/>
        </>
      }
    </div>
    <PlayerDataBar team={team2} reverse={true}/>
  </div>
  )
}
