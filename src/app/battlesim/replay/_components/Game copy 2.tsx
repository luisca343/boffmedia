/*
"use client"
import { Battle, Pokemon, Side } from "@pkmn/client";
import { PokemonDetails, PokemonHPStatus, PokemonIdent, Protocol } from "@pkmn/protocol";
import { Dex } from '@pkmn/sim';
import { Generations } from '@pkmn/data';
import { useEffect, useState } from "react";
import { PokemonTeamList } from "../../_components_old/PokemonTeam";
import { Sprites } from "@pkmn/img";
import PokemonSprite from "../../_components_old/PokemonSprite";
import { Button } from "@/components/ui/button";
import { set } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { time } from "console";
import { Scene } from "../../_components_old/battle_animations";


export function Game() {
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
|raw|Luisca343's rating: 1069 &rarr; <strong>1097<\/strong><br \/>(+28 for winning)`;
  

  const [battle, setBattle] = useState(new Battle(new Generations(Dex as any)))
  const [viewPoint, setViewPoint] = useState([0,1])
  const [scene, setScene] = useState(null as unknown as Scene)
  const [log, setLog] = useState<string[]>([])

  const [activePokemon, setPokemon]  = useState({} as { [position: string]: Pokemon | null })

  const [participants, setParticipants] = useState([] as any[])
  const [turnInput, setTurnInput] = useState(0)

  useEffect(() => {
    console.log('battle', battle)
    const gameElement = document.querySelector('#game') as HTMLElement;
    if(!gameElement) return;
    console.log('gameElement', gameElement)
    const battleScene = new Scene(battle, gameElement);
    setScene(battleScene);

  }, [])

  useEffect(() => {
    if(!scene) return;
    //playTurn(replay, 0)
  }, [scene])
  

  useEffect(() => {
    console.log('pokemon', activePokemon)
  }, [activePokemon])

  if(!battle) return <>No battle loaded</>
    
// activePokemon = {p1a: Pokemon, p1b: Pokemon, p1c: Pokemon, p2a: Pokemon, p2b: Pokemon, p2c: Pokemon}


  const active1 = battle.sides[0].active
  const active2 = battle.sides[1].active

  console.log(activePokemon)


return (
  <div>
<div className="w-full h-full flex bg-surface-700" id="fullgame">
  <PlayerDataBar battle={battle} side={0} viewPoint={viewPoint} activePokemon={activePokemon}/>
  <div id="game" className="w-full h-full flex flex-col relative z-0">
    <div className="absolute top-1 right-1 bg-surface-800 py-1 px-2 rounded-md text-surface-200 border border-surface-200">Turn {battle.turn}</div>
    {active1.length === 3 ? <>
        <PokemonSprite viewPoint={viewPoint[0]} pokemon={getActiveTeam(0, activePokemon)[0]} id="p1a" className='bottom-[16%] left-[5%]'/>
        <PokemonSprite viewPoint={viewPoint[0]} pokemon={getActiveTeam(0, activePokemon)[1]} id="p1b" className='bottom-[8%] left-[33%]'/>
        <PokemonSprite viewPoint={viewPoint[0]} pokemon={getActiveTeam(0, activePokemon)[2]} id="p1c" className='bottom-[0%] left-[62%]'/>
      </> : <>
        <PokemonSprite viewPoint={viewPoint[0]} pokemon={getActiveTeam(0, activePokemon)[0]} id="p1a" className='bottom-[8%] left-[5%]'/>
        <PokemonSprite viewPoint={viewPoint[0]} pokemon={getActiveTeam(0, activePokemon)[1]} id="p1b" className='bottom-[0%] left-[33%]'/>
      </>
    }

  {active2.length === 3 ? <>
        <PokemonSprite viewPoint={viewPoint[0]} pokemon={getActiveTeam(1, activePokemon)[0]} id="p2a" className='top-[16%] right-[5%]'/>
        <PokemonSprite viewPoint={viewPoint[0]} pokemon={getActiveTeam(1, activePokemon)[1]} id="p2b" className='top-[8%] right-[33%]'/>
        <PokemonSprite viewPoint={viewPoint[0]} pokemon={getActiveTeam(1, activePokemon)[2]} id="p2c" className='top-0 right-[62%]'/>

      
      </> : <>
        <PokemonSprite viewPoint={viewPoint[0]} pokemon={getActiveTeam(1, activePokemon)[0]} id="p2a" className='top-[8%] right-[5%]'/>
        <PokemonSprite viewPoint={viewPoint[0]} pokemon={getActiveTeam(1, activePokemon)[1]} id="p2b" className='top-0 right-[33%]'/>
      </>
    }
  </div>
  <PlayerDataBar battle={battle} side={1} viewPoint={viewPoint} activePokemon={activePokemon}/>
    </div>
        <Button onClick={() => {
        if(viewPoint[0] === 0) setViewPoint([1,0])
        else setViewPoint([0,1])
        }}>Switch</Button>
        <Button onClick={() => {
            playTurn(replay, battle.turn - 1)
        }}> Play Previous Turn</Button>

        <Button onClick={() => {
            playTurn(replay, battle.turn)
        }}> Play Turn</Button>

        <Button onClick={() => {
            playTurn(replay, battle.turn + 1)
        }}> Play Next Turn</Button>

        <Button onClick={() => {
           
        }}> Play All Turns</Button>

        <Input type="number" value={turnInput} onChange={(e) => setTurnInput(parseInt(e.target.value))} />
        <Button onClick={() => {
            playTurn(replay, turnInput)
        }}> Play Turn</Button>

    </div>
    )


    async function playTurn(replay: string, turn: number) {
        const lines = replay.split('\n');
        const b2 = new Battle(new Generations(Dex as any))
        let currentTurn = 0
        for (const line of lines) {
            const delay = (ms: number | undefined) => new Promise(res => setTimeout(res, ms));

            let timeout = 0;

            const { args, kwArgs } = Protocol.parseBattleLine(line);
            b2.add(args, kwArgs);
            if (args[0] === 'turn') {
              currentTurn = parseInt(args[1]);
              if(parseInt(args[1]) === turn + 1) break;
            }

            if(currentTurn < turn) {
              console.log('skipping', currentTurn)
              timeout = 0;
              continue;
            }


            if(args[0] === 'player'){
              const participant = {name: args[2], rating: args[4], avatar: args[3]}

              setParticipants(prevParticipants => {
                return [...prevParticipants, participant]
              })
            }


            if(args[0] === 'move'){
              const poke = b2.getPokemon(args[1]);
              const move = b2.get("moves", args[2]);
              const poke2 = b2.getPokemon(args[3]);
              const attack = Dex.moves.get(move.id);

              let arg3 = args[3] === "" ? args[1].includes('p1') ? 'p2a' : 'p1a' : args[3] as string
      
              await scene.playBattleAnim(move.id, args[1].split(':')[0] as PokemonIdent, arg3.split(':')[0] as PokemonIdent)
              timeout = 500 / scene.acceleration;
              //replaceMessages = true;
              
            }
            if(args[0] === 'switch') {
              timeout = 1500 / scene.acceleration;
              const [, positionIdent, pokemonDetails, hpstatus] = args as [string, PokemonIdent, PokemonDetails, PokemonHPStatus]
              const pos = positionIdent.split(':')[0];
              const name = pokemonDetails.split(',')[0];
              
              console.log('switching', pos, name)

              const pokemon = b2.getPokemon(positionIdent);
              console.log('current pokemon', pokemon)
              
              
              const detailedPokemon = Protocol.parseDetails(name, positionIdent, pokemonDetails);
              console.log('----------------------')
              console.log(positionIdent, detailedPokemon)
              await scene.playEffect('pokeball', positionIdent, async() => {
                setPokemon(prevPokemon => {
                  console.log('setting', pos, pokemon)
                  return {...prevPokemon, [pos]: pokemon};
                });
                const audio = new Audio('/battlesim/audio/cries/mewtwo.mp3');
                // After setting the Pokemon, play the audio
                console.log(`https://play.pokemonshowdown.com/audio/cries/${pokemon?.species.id.toLowerCase()}.mp3`)
                //return await playAudio(`https://play.pokemonshowdown.com/audio/cries/${pokemon?.species.id.toLowerCase()}.mp3`);
              });
            }
        
            await delay(timeout)
        }
        setBattle(b2) // This is a react state update
    }

    

    function getActiveTeam(side: number, activePokemon: { [position: string]: Pokemon | null }) {
      if(side === 0) return [activePokemon?.p1a, activePokemon?.p1b, activePokemon?.p1c].filter(pokemon => pokemon !== null) as Pokemon[];
      else return [activePokemon?.p2a, activePokemon?.p2b, activePokemon?.p2c].filter(pokemon => pokemon !== null) as Pokemon[];
    }
    
    function PlayerDataBar({battle, side, viewPoint, activePokemon} : { side: number, battle: Battle, viewPoint: number[], activePokemon: { [position: string]: Pokemon | null }}) {

      const currTeam = getActiveTeam(side, activePokemon)
        const player = participants[side]

        const battleSide = battle.sides[viewPoint[side]] as Side
        const avatarId = player?.avatar
        const avatarMC = "https://crafatar.com/renders/body/67d9b543-5ac9-41e1-a8a5-20d7689e24a4"
        const avatar =  avatarId ? Sprites.getAvatar(avatarId) : 'https://play.pokemonshowdown.com/sprites/trainers/unknown.png'
          return (
            <div className={`w-[20%] h-full flex justify-center ${viewPoint[viewPoint[side]] === 0 ? 'flex-col' : 'flex-col-reverse'}`}>
              <PokemonTeamList team={currTeam} />
              <div className="text-shadow-border1 text-surface-50 text-center">{player?.name}</div>
              
              {
                avatarId !=0 ? <img className="mx-auto"  src={avatar} />
                : <img className="mx-auto" style={{height:'100px', width:'45px', transform: side === 1 && 'scaleX(-1)'}} src="https://crafatar.com/renders/body/67d9b543-5ac9-41e1-a8a5-20d7689e24a4" />
              }
              
              
            </div>
          )
        }


}
*/