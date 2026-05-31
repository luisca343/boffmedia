import { useEffect, useRef } from 'react';
import { Battle } from "@pkmn/client";
import { Generations } from '@pkmn/data';
import { Dex } from '@pkmn/sim';
import { ArgType, BattleArgsKWArgsTypes, BattleArgsKWArgType, PokemonDetails, PokemonHPStatus, PokemonIdent, Protocol } from "@pkmn/protocol";
import { LogFormatter } from '@pkmn/view';
import { Scene } from "../_utils/Scene";
import { switchAction, faintAction } from "../_utils/battleActions";
import { useBattleActions } from './useBattleActions';
import { ReplayTimeline, ReplayEvent } from '../_utils/replayTimeline';

export function useBattleFlow(
  battle: Battle,
  setBattle: (battle: Battle) => void,
  battleLog: string | null,
  currentAction: number,
  scene: Scene | null,
  isPlaying: boolean,
  newTurn: number,
  lastTurn: number,
  settingTurn: boolean,
  pov: 0 | 1,
  setCurrentAction: (action: number) => void,
  setHtmlLog: React.Dispatch<React.SetStateAction<string[]>>,
  setIsPlaying: (playing: boolean) => void,
  setMessageBar: React.Dispatch<React.SetStateAction<string[]>>,
  setSettingTurn: (setting: boolean) => void,
  timeline: ReplayTimeline | null = null
) {
  const battleActions = useBattleActions(battle, scene, pov);
  const formatter = new LogFormatter('p1', battle);
  const cancelledRef = useRef(false);

  // Refs for latest values — effect reads these without adding to deps
  const battleLogRef = useRef(battleLog);
  battleLogRef.current = battleLog;
  const newTurnRef = useRef(newTurn);
  newTurnRef.current = newTurn;
  const lastTurnRef = useRef(lastTurn);
  lastTurnRef.current = lastTurn;
  const settingTurnRef = useRef(settingTurn);
  settingTurnRef.current = settingTurn;
  const povRef = useRef(pov);
  povRef.current = pov;
  const currentActionRef = useRef(currentAction);
  currentActionRef.current = currentAction;
  const sceneRef = useRef(scene);
  sceneRef.current = scene;
  const timelineRef = useRef(timeline);
  timelineRef.current = timeline;

  // Cleanup on unmount — cancel pending async chains
  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      if (scene) {
        scene.dispose();
      }
    };
  }, [scene]);

  const clearActions = ['switch', 'move', 'turn'];

  // Main battle flow control
  useEffect(() => {
    const tl = timelineRef.current;
    if(isPlaying && currentAction !== -1) {
      if(!tl || tl.events.length === 0 || currentAction >= tl.events.length) {
        setIsPlaying(false);
        return;
      }
      const event = tl.events[currentAction];
      playActionFromEvent(event);
      return;
    }
    
    if(currentAction === -1 || newTurnRef.current === -1) {
      handleTurnChange();
    }
  }, [currentAction, isPlaying]);

  const handleTurnChange = () => {
    const tl = timelineRef.current;
    const currBattle = new Battle(new Generations(Dex as any) as any);
    
    let changeTurn = newTurnRef.current;
    if(changeTurn < 0) changeTurn = 0;
    if(changeTurn > lastTurnRef.current + 1) changeTurn = lastTurnRef.current + 1;
  
    if(changeTurn === 0) {
      resetBattle(currBattle, changeTurn);
      return;
    }
    
    setHtmlLog([]);
    
    if (!tl) return;
    
    // If we're going to the state after the last turn (battle end)
    if(changeTurn === lastTurnRef.current + 1) {
      for (const event of tl.events) {
        currBattle.add(event.args, event.kwArgs);
        if (event.actionType === 'win') {
          currBattle.winner = event.args[1] as string;
        }
        setHtmlLog((prev) => [...prev, event.html]);
      }
      const lastActionIndex = tl.events.length;
      updateBattleState(currBattle, changeTurn, lastActionIndex);
      return;
    }
    
    // Use turnIndices for O(1) lookup
    const turnStartIndex = tl.turnIndices.get(changeTurn);
    if (turnStartIndex === undefined) {
      // Turn not found, go to end
      updateBattleState(currBattle, changeTurn, tl.events.length);
      return;
    }
    
    // Process events up to the target turn
    for (let i = 0; i <= turnStartIndex; i++) {
      const event = tl.events[i];
      currBattle.add(event.args, event.kwArgs);
      setHtmlLog((prev) => [...prev, event.html]);
    }
    updateBattleState(currBattle, changeTurn, turnStartIndex);
  };

  const resetBattle = (currBattle: Battle, turn: number) => {
    // Create a completely new battle instance
    const freshBattle = new Battle(new Generations(Dex as any) as any);
    
    // Set turn to 0
    freshBattle.setTurn(turn);
    
    // Reset HTML log and message bar
    setHtmlLog([]);
    setMessageBar([]);
    
    // Stop playback
    setIsPlaying(false);
    
    // Reset current action to start
    setCurrentAction(0);
    
    // Clear scene if available
    if (scene) {
      // Clear any active Pokemon on the field
      Object.keys(freshBattle.sides).forEach(side => {
        const sideObj = freshBattle.sides[side as keyof typeof freshBattle.sides];
        if (sideObj && typeof sideObj === 'object' && 'active' in sideObj) {
          const activePokemon = sideObj.active[0];
          if (activePokemon) {
            const pokemonIdent = `${side}a:` as PokemonIdent;
            scene.clearPokemonElement(pokemonIdent);
          }
        }
      });
    }
    
    // Process initial setup lines from the battle log
    if (battleLog) {
      const lines = battleLog.split('\n');
      let startFound = false;
      
      for (const line of lines) {
        // Only process lines until 'start' command is found
        if (line.includes('|start')) {
          startFound = true;
          freshBattle.add(line);
          break;
        }
        
        // Add setup commands to the fresh battle
        if (!startFound) {
          freshBattle.add(line);
        }
      }
    }
    
    // Update the battle state
    setBattle(freshBattle);
    setSettingTurn(false);
  };

  const updateBattleState = (currBattle: Battle, turn: number, actionIndex: number) => {
    currBattle.setTurn(turn);
    setBattle(copyBattle(currBattle));
    setCurrentAction(actionIndex);
    setSettingTurn(false);
    setMessageBar([]);
  };

  async function playAction(line: string) {
    const { args, kwArgs } = Protocol.parseBattleLine(line);
    const currentBattle = copyBattle(battle);
    
    return new Promise<void>(async (resolve) => {
      try {
        if (cancelledRef.current) { resolve(); return; }
        const html = formatter.formatHTML(args, kwArgs);
        const params = await getParams(args, kwArgs as BattleArgsKWArgsTypes);
        
        currentBattle.add(args, kwArgs);
        updateBattleLog(html, currentBattle, args[0]);
        
        await performAction(params, currentBattle);
        resolve();
      } catch (error) {
        console.error('Error in playAction:', error);
        resolve();
      }
    });
  }

  async function playActionFromEvent(event: ReplayEvent) {
    const currentBattle = copyBattle(battle);
    
    return new Promise<void>(async (resolve) => {
      try {
        if (cancelledRef.current) { resolve(); return; }
        const params = await getParams(event.args, event.kwArgs as BattleArgsKWArgsTypes);
        
        currentBattle.add(event.args, event.kwArgs);
        updateBattleLog(event.html, currentBattle, event.actionType);
        
        await performAction(params, currentBattle);
        resolve();
      } catch (error) {
        console.error('Error in playActionFromEvent:', error);
        resolve();
      }
    });
  }

  const updateBattleLog = (html: string, currentBattle: Battle, actionType: string) => {
    setHtmlLog((prev) => [...prev, html]);
    setBattle(currentBattle);
    
    if(clearActions.includes(actionType)) {
      setMessageBar([html]);
    } else {
      setMessageBar((prev) => [...prev, html]);
    }
  };

  async function performAction(params: any, currentBattle: Battle) {
    if(!scene || cancelledRef.current) return;
    const { args, kwArgs, data } = params;
    let timeout = 500 / scene.acceleration;
    
    try {
      switch (args[0]) {
        case 'switch':
          timeout = await battleActions.handleSwitchAction(args);
          break;
        case 'turn':
          timeout = await battleActions.handleTurnAction(args, currentBattle);
          break;
        case '-damage':
          timeout = battleActions.handleDamageAction(args, data);
          break;
        case '-heal':
          timeout = battleActions.handleHealAction(args, data);
          break;
        case 'move':
          timeout = await battleActions.handleMoveAction(args, currentBattle);
          break;
        case '-miss':
          timeout = await battleActions.handleMissAction(args);
          break;
        case 'win':
          currentBattle.winner = args[1] as string;
          timeout = 0;
          break;
        case 'inactive': case 't:': case '-resisted': case '':
        case 'join': case 'gametype': case 'player': case 'teamsize': case 'gen': case 'tier':
        case 'rated': case 'rule': case 'clearpoke': case 'poke': case 'rule': case 'start': 
        case 'faint':
          timeout = 0;
          break;
        default:
          break;
      }
      
      if (cancelledRef.current) return;
      
      return await new Promise<void>((resolve) => {
        const timerId = setTimeout(() => {
          if (cancelledRef.current) { resolve(); return; }
          let nextAction = settingTurnRef.current ? -1 : currentActionRef.current + 1;
          setCurrentAction(nextAction);
          resolve();
        }, timeout);
      });
    } catch (error) {
      console.error('Error in performAction:', error);
      throw error;
    }
  }

  async function getParams(args: ArgType, kwArgs: BattleArgsKWArgsTypes): Promise<{ args: ArgType, kwArgs: BattleArgsKWArgsTypes, data?: any }> {
    switch (args[0]) {
      case 'switch':
        try {
          // First perform the switch animation
          await switchAction(scene, getRelativeIdent(args[1]), args[2] as PokemonDetails, args[3] as PokemonHPStatus);
          
          // Then ensure the Pokemon is visible by clearing any animation states
          const pokemonIdent = getRelativeIdent(args[1]);
          if (scene) {
            await scene.clearPokemonElement(pokemonIdent);
          }

          // Play the cry sound
          const pokemon = battle.getPokemon(args[1] as PokemonIdent);
          if (pokemon?.baseSpeciesForme) {
            const audio = new Audio(`https://play.pokemonshowdown.com/audio/cries/${pokemon.baseSpeciesForme.toLowerCase()}.mp3`);
            audio.play().catch(console.error);
          }

          return { args, kwArgs };
        } catch (error) {
          console.error('Error during switch:', error);
          return { args, kwArgs };
        }
      case '-damage':
      const damage = battle.damagePercentage(args[1] as PokemonIdent, args[2] as PokemonHPStatus);
      return { args, kwArgs, data: { damage } };
      case '-heal':
        
      const fromEffect = kwArgs.from && battle.get('conditions', kwArgs.from);
      const revival = fromEffect?.id === 'revivalblessing';
      const poke = battle.getPokemon(args[1], revival)!;
      const health = poke.healthParse(args[2]);
      return { args, kwArgs, data: { health } };
      case 'faint':
      await faintAction(battle, scene, getRelativeIdent(args[1]));
      return { args, kwArgs };
      default:
      return { args, kwArgs };
    }
  }
    
  
    function getRelativeIdent(pokemonIdent: PokemonIdent): PokemonIdent {
      const identCode = pokemonIdent.split(':')[0];
      if(pov === 0) return identCode as PokemonIdent;
      return identCode.includes('1') ? 
      identCode.replace('1', '2') as PokemonIdent : 
      identCode.replace('2', '1') as PokemonIdent;
    }


  return {
    handleTurnChange,
    playAction,
    updateBattleState,
    resetBattle
  };
}

function copyBattle(battle: Battle) {
  const newBattle = new Battle(new Generations(Dex as any) as any);
  Object.assign(newBattle, battle);
  return newBattle;
}