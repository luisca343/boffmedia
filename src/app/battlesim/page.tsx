"use client"
import { apiGET } from "@/services/boffAPI";
import { PokemonImage, PokemonTeam } from "./_components/PokemonTeam";
import { Battle, Pokemon, Side } from "@pkmn/client"
import { DetailedPokemon, PokemonDetails, PokemonHPStatus, PokemonIdent, Protocol } from "@pkmn/protocol"
import { useEffect, useRef, useState } from "react";
import { Dex } from '@pkmn/sim';
import { GenerationNum, Generations } from '@pkmn/data';
import { time } from "console";
import PokemonSprite from "./_components/PokemonSprite";
import GameCanvas from "./_components/GameCanvas";

let battle = new Battle(new Generations(Dex as any))

const BattleEffects: {[k: string]: any} = {
  pokeball: {
    url: '/smartrotom/test/pokeball.png',
    w: 100, h: 100,
  },
};


export interface ScenePos {
	/** - left, + right */
	x?: number;
	/** - down, + up */
	y?: number;
	/** - player, + opponent */
	z?: number;
	scale?: number;
	xscale?: number;
	yscale?: number;
	opacity?: number;
	time?: number;
	display?: string;
}

export class Scene {
  battle: Battle;
  gameElement: HTMLElement;
  acceleration = 1;
  

  constructor(battle: Battle, gameElement: HTMLElement) {
    this.battle = battle
    this.gameElement = gameElement

    console.log(battle)
  }

  getPosition(id: string) {
    const element = this.gameElement.querySelector(`#${id}`);
    if (!element) return null;
  
    const rect = element.getBoundingClientRect();
    const parentRect = this.gameElement.getBoundingClientRect();
  
    const relativeRect = {
      x: rect.left - parentRect.left + rect.width / 2,
      y: rect.top - parentRect.top + rect.height / 2,
      width: rect.width,
      height: rect.height
    };
  
    console.log(`Element: ${id} - ${relativeRect.x}, ${relativeRect.y}, ${relativeRect.width}, ${relativeRect.height}`);
    return relativeRect;
  }

  playAnimation(animation: string, position: string) {
    const element = this.gameElement.querySelector(`#${position}`);
    if (!element) return null;

    console.log(`Playing animation ${animation} on ${position}`);
  }

  showEffect(effect:string, start: ScenePos, end: ScenePos, transition: string, after?: string, additionalCss?: string, callback?: () => void){
    const effectData = BattleEffects[effect];
    if (!effectData) return;

    start.x = start.x || 0;
    start.y = start.y || 0;


    const element = document.createElement('img');
    element.src = effectData.url;
    element.style.position = 'absolute';
    element.style.width = `50px`;
    element.style.height = `50px`;
    const halfWidth = parseInt(element.style.width) / 2;
    const halfHeight = parseInt(element.style.height) / 2;
    element.style.left = `${start.x - halfWidth}px`;
    element.style.top = `${start.y - halfHeight}px`;
    element.style.zIndex = `${start.z}`;
    element.style.opacity = `${start.opacity || 1}`;
    element.style.transition = `all ${start.time || 0}ms`;
    element.style.display = start.display || 'block';
    element.style.transform = `scale(${start.scale || 1})`;

    if (additionalCss) {
      element.style.cssText += additionalCss;
    }

    this.gameElement.appendChild(element);

    setTimeout(() => {
      end.x = end.x || 0;
      end.y = end.y || 0;

      element.style.left = `${end.x - halfWidth}px`;
      element.style.top = `${end.y - halfHeight}px`;
      element.style.zIndex = `${end.z}`;
      element.style.opacity = `${end.opacity || 0}`;
      element.style.transform = `scale(${end.scale || 1})`;
      
    }, 0);

    setTimeout(() => {
      element.remove();
      if (callback) callback();
    }, start.time || 0);
}


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

      
        
        //console.log(poke, move, poke2)
      }
    
      battle.add(line);
      if(args[0] === 'switch') {
        timeout = 1000;
        const [, positionIdent, pokemonDetails, hpstatus] = args as [string, PokemonIdent, PokemonDetails, PokemonHPStatus]
        console.log('switch', positionIdent, pokemonDetails, hpstatus)
        const pos = positionIdent.split(':')[0];
        const name = pokemonDetails.split(',')[0];

        const pokemon = battle.getPokemon(positionIdent);
        
        
        const detailedPokemon = Protocol.parseDetails(name, positionIdent, pokemonDetails);
    
        console.log('pokemon', pokemon)

         const element = scene.getPosition(pos);
         if(element){
          const startY = pos.includes('p1') ? element.y + 40 : element.y - 40;

          const startX = pos.includes('p1') ? element.x -150 : element.x + 150;

          
          scene.showEffect('pokeball', {
            opacity: 1,
            x: startX,
            y: startY,
            scale: .7,
            time: 300 / scene.acceleration,
          }, {
            opacity: 0,
            x: element.x,
            y: element.y,
            time: 700 / scene.acceleration,
          }, 'ballistic2', '', '', () => {
            setPokemon(prevPokemon => {
              return {...prevPokemon, [pos]: pokemon};
            });
          });  



         }

    
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
    scene.getPosition('p1a');
  }



  return ( <section className="flex flex-col items-center w-full h-full">
  <div className='flex  w-[90%]   justify-evenly border-black  border aspect-[16/4] relative'
  //background-image:url(https://play.pokemonshowdown.com/sprites/gen6bgs/bg-darkmeadow.jpg);display:block;opacity:0.8
  style={{backgroundImage: `url(https://i.imgur.com/EIKbeGK.png)`
  , backgroundSize: 'cover', opacity: 0.8}}
  >
    <div className="w-[20%] flex flex-col  bg-white bg-opacity-40">
      <div>Player 1</div>
      <PokemonTeam team={battle.sides[0].team} />
    </div>
    <GameCanvas pokemon={pokemon}/>
    <div className="w-[20%] flex flex-col bg-white bg-opacity-40">
      <div>Player 2</div>
      <PokemonTeam team={battle.sides[1].team} />
    </div>
  </div>
  <button onClick={() => testAttack(battle)}>Start</button>
  <div className="h-[30%] overflow-auto" ref={logRef}>
      <div>{log.map((line, index) => (
        <div key={index} dangerouslySetInnerHTML={{ __html: line }} />
      ))}</div>
    </div>
</section>
  );


}

