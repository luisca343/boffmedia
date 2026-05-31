import { useEffect, useRef } from 'react';
import { Battle } from "@pkmn/client";
import { Generations } from '@pkmn/data';
import { Dex } from '@pkmn/sim';
import { ArgType, BattleArgsKWArgsTypes, BattleArgsKWArgType, PokemonDetails, PokemonHPStatus, PokemonIdent, Protocol } from "@pkmn/protocol";
import { LogFormatter } from '@pkmn/view';
import { Scene } from "../_utils/Scene";
import { switchAction, faintAction } from "../_utils/battleActions";
import { useBattleActions } from './useBattleActions';

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
  setSettingTurn: (setting: boolean) => void
) {
  const battleActions = useBattleActions(battle, scene, pov);
  const formatter = new LogFormatter('p1', battle);
  const cancelledRef = useRef(false);

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
    if(isPlaying && currentAction !== -1) {
      const lines = battleLog ? battleLog.split('\n') : [];
      if(lines.length === 0 || currentAction >= lines.length) {
        setIsPlaying(false);
        return;
      }
      const action = lines[currentAction];
      playAction(action);
      return;
    }
    
    if(currentAction === -1 || newTurn === -1) {
      handleTurnChange();
    }
  }, [currentAction, isPlaying]);

  const handleTurnChange = () => {
    const lines = battleLog ? battleLog.split('\n') : [];
    const currBattle = new Battle(new Generations(Dex as any) as any);
    
    let changeTurn = newTurn;
    if(changeTurn < 0) changeTurn = 0;
    if(changeTurn > lastTurn + 1) changeTurn = lastTurn + 1;
  
    if(changeTurn === 0) {
      resetBattle(currBattle, changeTurn);
      return;
    }
    
    setHtmlLog([]);
    
    // If we're going to the state after the last turn (battle end)
    if(changeTurn === lastTurn + 1) {
      // Process ALL actions to ensure the win action is included
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue; // Skip empty lines
        
        const {args, kwArgs} = Protocol.parseBattleLine(line);
        currBattle.add(line);
        
        // If this is a win action, make sure we properly set the winner
        if (args[0] === 'win') {
          console.log("Processing win action:", args[1]);
          currBattle.winner = args[1] as string;
        }
        
        setHtmlLog((prev) => [...prev, formatter.formatHTML(args, kwArgs)]);
      }
      
      // Set current action to the last action (not 0)
      const lastActionIndex = lines.filter(line => line.trim()).length;
      updateBattleState(currBattle, changeTurn, lastActionIndex);
      return;
    }
    
    // Normal turn change logic (existing code)
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue; // Skip empty lines
      
      const {args, kwArgs} = Protocol.parseBattleLine(line);
      currBattle.add(line);
      
      if (args[0] === 'turn') {
        const currentTurn = parseInt(args[1]);
        if (currentTurn === changeTurn) {
          updateBattleState(currBattle, changeTurn, i);
          break;
        }
      }
      setHtmlLog((prev) => [...prev, formatter.formatHTML(args, kwArgs)]);
    }
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
          let nextAction = settingTurn ? -1 : currentAction + 1;
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