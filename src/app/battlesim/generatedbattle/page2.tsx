// @ts-nocheck
"use client"
import { apiGET } from "@/services/boffAPI";
import { PokemonImage, PokemonTeam, PokemonTeamList } from "../_components/PokemonTeam";
import { Battle, Pokemon, Side } from "@pkmn/client"
import { DetailedPokemon, PokemonDetails, PokemonHPStatus, PokemonIdent, Protocol } from "@pkmn/protocol"
import { useEffect, useRef, useState } from "react";
import { Dex } from '@pkmn/sim';
import { Generations } from '@pkmn/data';
import GameCanvas from "../_components/GameCanvas";
import { PokemonSprite, Scene } from "../_components/battle_animations";
import { Input } from "@/components/ui/input";
import { time } from "console";

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
  const [activeMessages, setActiveMessages] = useState([]);
  const [turnInput, setTurnInput] = useState(0);
  


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

  function updateMessage(message: string, replace?: boolean) {
    // If keep is true, append the message to the log, then we set a 1000ms timeout to remove it.
    if(!replace) {
      setActiveMessages(activeMessages => [...activeMessages, message]);
    } else {
      setActiveMessages([message]);
    }
  }

  async function testAttack() {
  
  
    /*
    console.log(`==================== TURN ${turn} ====================`)
    console.log(partida.log[turn].events.length)
    console.log(partida.log[turn].events)*/

    if(!partida.log[turn]) {
      setLog(prevLog => [...prevLog, 'End of battle']);
      return
    }

    for (let index = 0; index < partida.log[turn].events.length; index++) {
      await performAction(index);
    }
    

    /*
    console.log('==================== END TURN ====================')
    console.log(battle)
    console.log('==================== END UPDATE ====================')
    console.log(battle)*/
    
    if(turn < 2) {
      setTurn(turn + 1);
    }
    //setTurn(turn + 1);
  }

  function test2(battle: Battle) {
    console.log(attack)
    scene.playBattleAnim(attack,'p1a' as PokemonIdent, 'p2b' as PokemonIdent);
  }

  function playAudio(url) {
    return new Promise((resolve, reject) => {
      const audio = new Audio(url);
      audio.volume = 0.5;
      audio.play().then(() => {
        audio.onended = () => {
          resolve();
        };
      }).catch((error) => {
        console.error('Error playing audio:', error);
        reject(error);
      });
    });
  }

  async function performAction(index: number = 0) {
        const delay = ms => new Promise(res => setTimeout(res, ms));
        let replaceMessages = false;

          // check if scene is paused
          while(scene.paused) {
            console.log('paused')
            await delay(50);
          }
          //console.log(`----- EVENT ${index} -----`)
          let timeout = 0
          const event = partida.log[turn].events[index];
          const {args, kwArgs, text, line} = event;
          console.log(args, kwArgs, text)
          
          if(text !=='') {
            timeout = 200;
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
            timeout = 500 / scene.acceleration;
            replaceMessages = true;
            
          }
          if(args[0] === 'boost'){
            console.log('boost', args)
            return
          }
          battle.add(line);
          if(args[0] === 'switch') {
            replaceMessages = true;
            timeout = 1500 / scene.acceleration;
            const [, positionIdent, pokemonDetails, hpstatus] = args as [string, PokemonIdent, PokemonDetails, PokemonHPStatus]
            const pos = positionIdent.split(':')[0];
            const name = pokemonDetails.split(',')[0];
    
            const pokemon = battle.getPokemon(positionIdent);
            
            
            const detailedPokemon = Protocol.parseDetails(name, positionIdent, pokemonDetails);
        
            await scene.playEffect('pokeball', positionIdent, async() => {
              setPokemon(prevPokemon => {
                return {...prevPokemon, [pos]: pokemon};
              });
              const audio = new Audio('/battlesim/audio/cries/mewtwo.mp3');
              // After setting the Pokemon, play the audio
              console.log(`https://play.pokemonshowdown.com/audio/cries/${pokemon?.species.id.toLowerCase()}.mp3`)
              return await playAudio(`https://play.pokemonshowdown.com/audio/cries/${pokemon?.species.id.toLowerCase()}.mp3`);
            });
          }
    
          if(args[0] === 'faint'){
            replaceMessages = true
            const [, positionIdent] = args as [string, PokemonIdent]
            const pokemon = battle.getPokemon(positionIdent);
            const pos = positionIdent.split(':')[0];
            const element = scene.getPosition(pos);
    
            if(element){
              const startY = pos.includes('p1') ? element.y + 40 : element.y - 40;
              const startX = pos.includes('p1') ? element.x -150 : element.x + 150;

              await scene.playBattleAnim('faint', pos as PokemonIdent, pos.includes('p1') ? 'p2a' : 'p1a');


    
              await scene.playEffect('pokeball', pos, () => {
                setPokemon(prevPokemon => {
                  return {...prevPokemon, [pos]: null};
                });
              });
            }
          }
          if(args[0] === '-damage') {
            timeout = 500 / scene.acceleration;
          }

          updateMessage(text, replaceMessages);
          battle.currentWeather();
          battle.update();

          await delay(timeout);
  }


  function changeView() {
    
  }

  function changeTurn() {
    setTurn(turnInput);
  }

  return ( <section className="flex flex-col  w-full h-full">
    <div className="flex relative">
      <div className='flex  justify-evenly aspect-[16/4] relative'
      //background-image:url(https://play.pokemonshowdown.com/sprites/gen6bgs/bg-darkmeadow.jpg);display:block;opacity:0.8
      style={{backgroundImage: `url(https://i.imgur.com/qnB4MXd.png)`, backgroundSize: 'cover', width:' 900px', height: '450px', zIndex:'0'}}
      >
        <div className="w-[30%] flex flex-col  bg-slate-800 justify-end bg-opacity-60 p-2 text-center">
        <PokemonTeamList team={battle.sides[0].team} />
            <div className="text-shadow-border1 text-white">{battle.sides[0].name}</div>
            <img className="mx-auto" style={{height:'100px', width:'45px'}} src="https://crafatar.com/renders/body/67d9b543-5ac9-41e1-a8a5-20d7689e24a4" />
            
        </div>
        <GameCanvas pokemon={pokemon} battle={battle}/>
        <div className="w-[30%] flex flex-col bg-slate-800  bg-opacity-60 p-2 text-center">
        <div className="text-shadow-border1 text-white">{battle.sides[1].name}</div>
        <img className="mx-auto" style={{height:'100px', width:'45px', transform: 'scaleX(-1)'}} src="https://crafatar.com/renders/body/e4f3e314-ea7f-4ef6-aa5b-06162c5bf7f6" />
          
        <PokemonTeamList team={battle.sides[1].team} />
        </div>
      </div>

        <div className="w-[400px] h-[450px] overflow-auto  bg-slate-800 text-slate-100" ref={logRef}>
          <div>{log.map((line, index) => {
            if(line.includes('Turn')) return <div key={index} className="font-bold text-2xl  bg-slate-500 text-slate-200"><div key={index} dangerouslySetInnerHTML={{ __html: line }} /></div>
            return <div key={index} dangerouslySetInnerHTML={{ __html: line }} />
          })}</div>
        </div>

        <div className="absolute bottom-2 left-[182px] bg-slate-800 text-slate-100 p-2 bg-opacity-60 rounded-md">
          {activeMessages.length > 0 && activeMessages.map((message, index) => <div key={index} dangerouslySetInnerHTML={{ __html: message }} />)}
        </div>
  </div>
  <button onClick={() => testAttack(battle)}>Start</button>
  <button onClick={() => test2(battle)}>Test</button>
  <button onClick={() => changeView()}>Change View</button>
  <button onClick={() => changeTurn()}>Change Turn</button>

  <Input value={turnInput} onChange={(e) => setTurnInput(e.target.value)} />
  <Input value={attack} onChange={(e) => setAttack(e.target.value)} />
  
</section>
  );


}

