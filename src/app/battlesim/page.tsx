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

export class Scene {
  battle: Battle;
  gameElement: HTMLElement;
  

  constructor(battle: Battle, gameElement: HTMLElement) {
    this.battle = battle
    this.gameElement = gameElement


    console.log(`Scene created with battle ${battle}`)
    console.log(`Scene created with gameElement ${gameElement}`)
  }

  getPosition(id: string) {
    const element = this.gameElement.querySelector(`#${id}`);
    if (!element) return null;

    const rect = element.getBoundingClientRect();
    console.log(`Element: ${id} - ${rect.x}, ${rect.y}, ${rect.width}, ${rect.height}`);
    return rect;
  }
}

export default function Test() {
  // position is the side + the position in the team
  const [pokemon, setPokemon]  = useState({} as { [position: string]: Pokemon | null })
  const [pokemonUpdates, setPokemonUpdates] = useState([]);
  const [activeMessage, setActiveMessage] = useState('');

  const [log, setLog] = useState([] as any[])
  const [scene, setScene] = useState({} as Scene)
  
  const gameElementRef = useRef(null);

  useEffect(() => {
  }, []); 



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
        //console.log('MOVE')
        //console.log(args)
        const poke = battle.getPokemon(args[1]);
        //console.log(poke)
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
    
        setPokemon(prevPokemon => {
          return {...prevPokemon, [pos]: pokemon};
        });
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


  function getPosition(id: string) {
    const gameElement = document.querySelector('#game');

    const element = document.querySelector(`#${id}`);
    if (!element || !gameElement) return null;

    const rect = element.getBoundingClientRect();
    console.log(`Element: ${id} - ${rect.x}, ${rect.y}`);
   

  }


  return ( <section className="flex flex-col items-center w-full h-full">
  ACTIVE:
  {battle.getAllActive().map(pokemon => {
    return <div key={pokemon.speciesForme}>{pokemon.speciesForme}</div>

  })}
  <div className='flex h-[840px] w-[1600px]   justify-evenly border-black  border'
  
  //background-image:url(https://play.pokemonshowdown.com/sprites/gen6bgs/bg-darkmeadow.jpg);display:block;opacity:0.8
  style={{backgroundImage: `url(https://i.imgur.com/H3qR14R.png)`
  , backgroundSize: 'cover', opacity: 0.8}}
  >
    <div className="w-[20%] flex flex-col  bg-white bg-opacity-40">
      <div>Player 1</div>
      <PokemonTeam team={partida.team1} />
    </div>
    <GameCanvas pokemon={pokemon} gameElementRef/>
    <div className="w-[20%] flex flex-col bg-white bg-opacity-40">
      <div>Player 2</div>
      <PokemonTeam team={partida.team2} />
    </div>
  </div>
  <button onClick={() => setTurn(turn + 1)}>Next Turn</button>
  <button onClick={() => testAttack(battle)}>Test Attack</button>
  <button onClick={() => test2(battle)}>Test act</button>
  <div className="h-[30%] overflow-auto">
    <div>Turn {turn}</div>
    <div>{log.map((line, index) => (
      <div key={index} dangerouslySetInnerHTML={{ __html: line }} />
    ))}</div>
  </div>
</section>
  );


}


/*

      
      {Object.keys(partida.log).map((key) => (
            <div key={key} className='border m-2 flex justify-around items-center'>
              <img src={partida.log[key].t1.url} alt='pokemon' />
              
              <div className='text-black w-[80%] '>
              <div >Turn {key}</div>
                {partida.log[key].events.map((line, index) => (
                  <div key={index} dangerouslySetInnerHTML={{ __html: line }} />
                ))
              }</div>
              <img src={partida.log[key].t2.url} alt='pokemon' />
            </div>
          ))}

*/


/*

<section className="flex flex-col items-center w-full h-full">
      ACTIVE:
      {battle.getAllActive().map(pokemon => {
        return <div key={pokemon.speciesForme}>{pokemon.speciesForme}</div>

      })}
      <div className='flex h-[60%] w-[80%]   justify-evenly border-black  border'
      
      //background-image:url(https://play.pokemonshowdown.com/sprites/gen6bgs/bg-darkmeadow.jpg);display:block;opacity:0.8
      style={{backgroundImage: `url(https://play.pokemonshowdown.com/sprites/gen6bgs/bg-darkmeadow.jpg)`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.8}}
      >
        <div className="w-[20%] flex flex-col  bg-white bg-opacity-40">
          <div>Player 1</div>
          <PokemonTeam team={partida.team1} />
        </div>
        <div className="w-[60%] flex flex-col relative">
          <div className="w-48 h-48 border border-red-500 absolute bottom-0 left-[10%]" id="p1a">
            <div id='hp'>{partida.team1[0].hp}</div>
            <PokemonImage id={partida.team1[0].speciesForme} side="p1" shiny={false}/>
          </div>

          {teamSize > 1 && (
            <div className="w-48 h-48 border border-red-500 absolute bottom-0 left-[30%]" id="p1b">
              <PokemonImage id={partida.team1[1].speciesForme} side="p1" shiny={false}/>
            </div>
          )}

          {teamSize > 2 && (
            <div className="w-48 h-48 border border-red-500 absolute bottom-0 left-[50%]" id="p1c">
              <PokemonImage id={partida.team1[2].speciesForme} side="p1" shiny={false}/>
            </div>
          )}

          <div className="w-48 h-48 border border-blue-500 absolute top-16 right-[10%]" id="p2a">
            <PokemonImage id={partida.team2[0].speciesForme} side="p2" shiny={false}/>
          </div>
          
          {teamSize > 1 && (
            <div className="w-48 h-48 border border-blue-500 absolute top-0 right-[30%]" id="p2b">
              <PokemonImage id={partida.team2[1].speciesForme} side="p2" shiny={false}/>
            </div>
          )}

          {teamSize > 2 && (
            <div className="w-48 h-48 border border-blue-500 absolute top-0 right-[50%]" id="p2c">
              <PokemonImage id={partida.team2[2].speciesForme} side="p2" shiny={false}/>
            </div>
          )}
          
        </div>
        <div className="w-[20%] flex flex-col bg-white bg-opacity-40">
          <div>Player 2</div>
          <PokemonTeam team={partida.team2} />
        </div>
      </div>
      <button onClick={() => setTurn(turn + 1)}>Next Turn</button>
      <button onClick={() => testAttack(battle)}>Test Attack</button>
      <button onClick={() => test2(battle)}>Test act</button>
      <div>
        <div>Turn {turn}</div>
        <div>{partida.log[turn].events.map((line, index) => (
          <div key={index} dangerouslySetInnerHTML={{ __html: line.text }} />
        ))}</div>
      </div>
    </section>

*/