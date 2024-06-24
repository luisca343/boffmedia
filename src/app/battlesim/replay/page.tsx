// @ts-nocheck
"use client"
import { apiGET } from "@/services/boffAPI";
import { PokemonImage, PokemonTeam } from "../_components/PokemonTeam";
import { Battle, Pokemon, Side } from "@pkmn/client"
import { DetailedPokemon, PokemonDetails, PokemonHPStatus, PokemonIdent, Protocol } from "@pkmn/protocol"
import { useEffect, useRef, useState } from "react";
import { Dex } from '@pkmn/sim';
import { Generations } from '@pkmn/data';
import GameCanvas from "../_components/GameCanvas";
import { Scene } from "../_components/battle_animations";
import { Input } from "@/components/ui/input";

let battle = new Battle(new Generations(Dex as any))





/*

		this.scene.showEffect('pokeball', {
			opacity: 1,
			x: this.x,
			y: this.y - 40,
			z: this.z,
			scale: .7,
			time: 300 / this.scene.acceleration,
		}, {
			opacity: 0,
			x: this.x,
			y: this.y,
			z: this.behind(50),
			time: 700 / this.scene.acceleration,
		}, 'ballistic2');

*/


export default function Test() {
  // position is the side + the position in the team
  const [pokemon, setPokemon]  = useState({} as { [position: string]: Pokemon | null })
  const [pokemonUpdates, setPokemonUpdates] = useState([]);
  const [activeMessage, setActiveMessage] = useState('');

  const [log, setLog] = useState([] as any[])
  const [scene, setScene] = useState({} as Scene)

  const [attack, setAttack] = useState('contactattack') as string
  
  const logRef = useRef(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [log]);

  useEffect(() => {
    if (pokemonUpdates.length > 0) {
      const [firstUpdate, ...remainingUpdates] = pokemonUpdates;
      setPokemon(firstUpdate);
      setPokemonUpdates(remainingUpdates);
    }
  }, [pokemonUpdates]);
  


  const [partida, setPartida] = useState({} as {team1: Pokemon[], team2: Pokemon[], 
    
    log: {
      [turn: number]: { 
        events: { args: string[]; kwArgs: { [k: string]: any; }, text: string, line: string }[]; 
        t1: { gen: number; w: number; h: number; url: string; pixelated: boolean; }; 
        t2: { gen: number; w: number; h: number; url: string; pixelated: boolean; }; 
      }
    }
  
  }
  )
  const [turn, setTurn] = useState(0)
  const [teamSize, setTeamSize] = useState(1)

  useEffect(() => {
    apiGET('/battlesimulator/battle').then(data => {
      setPartida(data)
    })

    const gens = new Generations(Dex as any);
    
  }, [])

  useEffect(() => {
    if(turn === 0) return
    
    testAttack();
  }, [turn])

  useEffect(() => {
    if(!partida.log) return
    
    const gameElement = document.querySelector('#game') as HTMLElement;
    const battleScene = new Scene(battle, gameElement);
    setScene(battleScene);
  }, [partida])

  if(!partida.log) return <div>loading...</div>

  function playMessage(message: string) {
    setActiveMessage(message);
    setTimeout(() => setActiveMessage(''), 1000);
  }

  async function testAttack() {
  
    const delay = ms => new Promise(res => setTimeout(res, ms));
  
    /*
    console.log(`==================== TURN ${turn} ====================`)
    console.log(partida.log[turn].events.length)
    console.log(partida.log[turn].events)*/

    if(!partida.log[turn]) {
      setLog(prevLog => [...prevLog, 'End of battle']);
      return
    }

    for (let index = 0; index < partida.log[turn].events.length; index++) {
      // check if scene is paused
      while(scene.paused) {
        console.log('paused')
        await delay(100);
      }
      //console.log(`----- EVENT ${index} -----`)
      let timeout = 0
      const event = partida.log[turn].events[index];
      const {args, kwArgs, text, line} = event;
      //console.log(args, kwArgs, text)
      if(text){
        playMessage(text);
      }
      
      if(text !=='') {
        timeout = 100;
        setLog(prevLog => [...prevLog, text]);
      }
      if(args[0] === 'move'){
        const poke = battle.getPokemon(args[1]);
        const move = battle.get("moves", args[2]);
        const poke2 = battle.getPokemon(args[3]);

        
        const attack = Dex.moves.get(move.id);
        if(args[3] === ""){
          args[3] = args[1].includes('p1') ? 'p2a' : 'p1a';
        }

        await scene.playBattleAnim(move.id, args[1].split(':')[0] as PokemonIdent, args[3].split(':')[0] as PokemonIdent)
        //await scene.playBattleAnim('flamethrower', args[1].split(':')[0] as PokemonIdent, args[3].split(':')[0] as PokemonIdent)
        /*
        switch(attack.category) {
          case 'Physical':
            await scene.playBattleAnim('contactattack', args[1].split(':')[0] as PokemonIdent, args[3].split(':')[0] as PokemonIdent)
            break;
          default:
            await scene.playBattleAnim('attack', args[1].split(':')[0] as PokemonIdent, args[3].split(':')[0] as PokemonIdent)
            break;
        }*/

      
        //console.log(poke, move, poke2)
      }
      if(args[0] === 'boost'){
        console.log('boost', args)
        break;
      }
      battle.add(line);
      if(args[0] === 'switch') {
        timeout = 1000;
        const [, positionIdent, pokemonDetails, hpstatus] = args as [string, PokemonIdent, PokemonDetails, PokemonHPStatus]
        const pos = positionIdent.split(':')[0];
        const name = pokemonDetails.split(',')[0];

        const pokemon = battle.getPokemon(positionIdent);
        
        
        const detailedPokemon = Protocol.parseDetails(name, positionIdent, pokemonDetails);
    
        scene.playEffect('pokeball', positionIdent, () => {
          setPokemon(prevPokemon => {
            return {...prevPokemon, [pos]: pokemon};
          });
        });

    
         /*
        setPokemon(prevPokemon => {
          return {...prevPokemon, [pos]: pokemon};
        });*/
      }

      if(args[0] === 'faint'){
        const [, positionIdent] = args as [string, PokemonIdent]
        const pokemon = battle.getPokemon(positionIdent);
        const pos = positionIdent.split(':')[0];
        const element = scene.getPosition(pos);

        if(element){
          const startY = pos.includes('p1') ? element.y + 40 : element.y - 40;
          const startX = pos.includes('p1') ? element.x -150 : element.x + 150;

          scene.showEffect('pokeball', {
            opacity: 1,
            x: element.x,
            y: element.y,
            scale: .7,
            time: 300 / scene.acceleration,
          }, {
            opacity: 0,
            x: startX,
            y: startY,
            time: 700 / scene.acceleration,
          }, 'ballistic2', '', '', () => {
            setPokemon(prevPokemon => {
              return {...prevPokemon, [pos]: null};
            });
          });  
        }
      }
    
      battle.currentWeather();
  
      await delay(timeout);
    }

    /*
    console.log('==================== END TURN ====================')
    console.log(battle)
    console.log('==================== END UPDATE ====================')
    console.log(battle)*/
    battle.update();
    setTurn(turn + 1);
  }

  function test2(battle: Battle) {
    console.log(attack)
    scene.playBattleAnim(attack,'p1a' as PokemonIdent, 'p2b' as PokemonIdent);
  }


  function changeView() {
    
  }


  return ( <section className="flex flex-col items-center w-full h-full">
  <div className='flex  justify-evenly border-black  border aspect-[16/4] relative'
  //background-image:url(https://play.pokemonshowdown.com/sprites/gen6bgs/bg-darkmeadow.jpg);display:block;opacity:0.8
  style={{backgroundImage: `url(https://i.imgur.com/EIKbeGK.png)`, backgroundSize: 'cover', opacity: 0.8, width:' 800px', height: '450px'}}
  >
    <div className="w-[30%] flex flex-col  bg-white bg-opacity-40">
      <div>Player 1</div>
      <PokemonTeam team={battle.sides[0].team} />
    </div>
    <GameCanvas pokemon={pokemon}/>
    <div className="w-[30%] flex flex-col bg-white bg-opacity-40">
      <div>Player 2</div>
      <PokemonTeam team={battle.sides[1].team} />
    </div>
  </div>
  <button onClick={() => testAttack(battle)}>Start</button>
  <button onClick={() => test2(battle)}>Test</button>
  <button onClick={() => changeView()}>Change View</button>
  <Input value={attack} onChange={(e) => setAttack(e.target.value)} />
  <div className="h-[30%] overflow-auto" ref={logRef}>
      <div>{log.map((line, index) => (
        <div key={index} dangerouslySetInnerHTML={{ __html: line }} />
      ))}</div>
    </div>
</section>
  );


}

