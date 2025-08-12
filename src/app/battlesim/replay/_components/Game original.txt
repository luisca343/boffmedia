"use client"
import { useEffect, useRef, useState } from "react";
import { Battle } from "@pkmn/client";
import { Generations } from '@pkmn/data';
import { Dex } from '@pkmn/sim';
import { ArgType, BattleArgsKWArgType, Num, PokemonDetails, PokemonHPStatus, PokemonIdent, Protocol } from "@pkmn/protocol";
import { LogFormatter } from '@pkmn/view';
import { BattleCanvas } from "../../_components/BattleCanvas";
import { Scene } from "../../_components/Scene";
import { 
  switchAction, 
  turnAction, 
  moveAction, 
  damageAction, 
  healAction, 
  faintAction, 
  missAction 
} from "../../_utils/battleActions";
import { ReplayControls } from "./ReplayControls";
import useViewportWidth from "@/services/useViewPortWidth";
import { ASPECT_RATIO } from "../../_utils/viewUtils";
import { create } from "zustand";

// Battle Store Types and Implementation
interface BattleStore {
  battle: Battle;
  setBattle: (battle: Battle) => void;
}

const useBattleStore = create<BattleStore>((set) => ({
  battle: new Battle(new Generations(Dex as any)),
  setBattle: (battle: Battle) => set({ battle }),
}));

// Custom hooks for battle state management
const useBattle = () => useBattleStore((state) => state.battle);
const useSetBattle = () => useBattleStore((state) => state.setBattle);

// Game Component
export function Game({battleName = 'medalla_doku', replayData}: {battleName?: string, replayData?: any}) {
  // Core state
  const [battleLog, setBattleLog] = useState<string | null>(null);
  const [currentAction, setCurrentAction] = useState<number>(0);
  const [scene, setScene] = useState<Scene | null>(null);
  const [htmlLog, setLog] = useState<string[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [messageBar, setMessageBar] = useState<string[]>([]);
  
  // UI state
  const [turnInput, setTurnInput] = useState<number>(0);
  const [newTurn, setNewTurn] = useState<number>(0);
  const [settingTurn, setSettingTurn] = useState(false);
  const [lastTurn, setLastTurn] = useState<number>(0);
  const [simulatedAttack, setSimulatedAttack] = useState<string>('contactattack');
  const [logVisible, setLogVisible] = useState(false);
  const [pov, setPov] = useState<0 | 1>(0);
  
  // Refs
  const battleCanvasRef = useRef<any>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const processingAction = useRef<boolean>(false);
  
  // Canvas width
  const [, canvasWidth] = useViewportWidth();
  
  // Battle state
  const battle = useBattle();
  const setBattle = useSetBattle();
  
  // Initialize formatter
  const formatter = new LogFormatter('p1', battle);
  
  // Scroll log to bottom when updated
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [htmlLog]);
  
  // Initialize battle data
  useEffect(() => {
    if(replayData) {
      setBattleLog(replayData.replay);
      loadScene();
      return;
    }
    
    fetch(`https://api.boffmedia.es/smartrotom/combates/booststera.txt`)
    .then(response => response.text())
    .then(text => {
      setBattleLog(text);
      loadScene();
    })
    .catch(error => console.error("Error fetching battle log:", error));
  }, []);
  
  // Load initial game data
  useEffect(() => {
    if (battleLog) {
      loadGameData(battle);
    }
  }, [battleLog]);
  
  function loadGameData(battle: Battle) {
    const lines = battleLog ? battleLog.split('\n') : [];
    let started = false;
    let finalTurn = 0;
    
    for (const line of lines) {
      const {args, kwArgs} = Protocol.parseBattleLine(line);
      if(line.includes('|start')) started = true;
      if(!started) battle.add(line);
      if(line.includes('|turn|')) finalTurn++;
    }
    
    setLastTurn(finalTurn);
  }
  
  const loadScene = () => {
    const observer = new MutationObserver((mutations, obs) => {
      const gameElement = document.getElementById('game') as HTMLElement;
      if (gameElement) {
        const battleScene = new Scene(battle, gameElement);
        setScene(battleScene);
        obs.disconnect();
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  };
  
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
    const currBattle = new Battle(new Generations(Dex as any));
    
    let changeTurn = newTurn;
    if(changeTurn < 0) changeTurn = 0;
    if(changeTurn > lastTurn + 1) changeTurn = lastTurn + 1;
    
    if(changeTurn === 0) {
      resetBattle(currBattle, changeTurn);
      return;
    }
    
    setLog([]);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const {args, kwArgs} = Protocol.parseBattleLine(line);
      currBattle.add(line);
      
      if (args[0] === 'turn') {
        const currentTurn = parseInt(args[1]);
        if (currentTurn === changeTurn) {
          updateBattleState(currBattle, changeTurn, i);
          break;
        }
      }
      setLog((prev) => [...prev, formatter.formatHTML(args, kwArgs)]);
    }
    
    if(changeTurn === lastTurn + 1) {
      updateBattleState(currBattle, changeTurn, 0);
    }
  };
  
  const resetBattle = (currBattle: Battle, turn: number) => {
    currBattle.setTurn(turn);
    setLog([]);
    setIsPlaying(false);
    setCurrentAction(0);
    loadGameData(currBattle);
    setBattle(currBattle);
  };
  
  const updateBattleState = (currBattle: Battle, turn: number, actionIndex: number) => {
    currBattle.setTurn(turn);
    setBattle(copyBattle(currBattle));
    setCurrentAction(actionIndex);
    setSettingTurn(false);
    setMessageBar([]);
  };
  
  function setCurrentTurn(turn?: number) {
    if(turn === undefined) turn = turnInput;
    setNewTurn(turn);
    if(isPlaying) {
      setSettingTurn(true);
    } else {
      setCurrentAction(-1);
    }
  }
  
  const clearActions = ['switch', 'move', 'turn'];
  
  async function playAction(line: string) {
    const { args, kwArgs } = Protocol.parseBattleLine(line);
    const currentBattle = copyBattle(battle);
    
    return new Promise<void>(async (resolve) => {
      try {
        const html = formatter.formatHTML(args, kwArgs);
        const params = await getParams(args, kwArgs);
        
        currentBattle.add(args, kwArgs);
        updateBattleLog(html, currentBattle, args[0]);
        
        await performAction(params, html, currentBattle);
        resolve();
      } catch (error) {
        console.error('Error in playAction:', error);
        resolve();
      }
    });
  }
  
  const updateBattleLog = (html: string, currentBattle: Battle, actionType: string) => {
    setLog((prev) => [...prev, html]);
    setBattle(currentBattle);
    
    if(clearActions.includes(actionType)) {
      setMessageBar([html]);
    } else {
      setMessageBar((prev) => [...prev, html]);
    }
  };
  
  async function getParams(args: ArgType, kwArgs: BattleArgsKWArgType): Promise<{ args: ArgType, kwArgs: BattleArgsKWArgType, data?: any }> {
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
  
  async function performAction(params: { args: ArgType, kwArgs: BattleArgsKWArgType, data?: any }, html: string, currentBattle: Battle) {
    if(!scene) return;
    const { args, kwArgs, data } = params;
    let timeout = 500 / scene.acceleration;
    
    try {
      switch (args[0]) {
        case 'switch':
        timeout = handleSwitchAction(args);
        break;
        case 'turn':
        timeout = await handleTurnAction(args, currentBattle);
        break;
        case '-damage':
        timeout = handleDamageAction(args, data);
        break;
        case '-heal':
        timeout = handleHealAction(args, data);
        break;
        case 'move':
        timeout = await handleMoveAction(args, currentBattle);
        break;
        case '-miss':
        timeout = await handleMissAction(args);
        break;
        case 'inactive': case 't:': case '-resisted': case '':
        case 'join': case 'gametype': case 'player': case 'teamsize': case 'gen': case 'tier':
        case 'rated': case 'rule': case 'clearpoke': case 'poke': case 'rule': case 'start': 
        case 'faint':
        timeout = 0;
        break;
        default:
        console.log('Unknown action:', args[0]);
        break;
      }
      
      return await new Promise<void>((resolve) => {
        setTimeout(() => {
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
  
  const handleSwitchAction = async (args: ArgType): Promise<number> => {
    const pokemonIdent = getRelativeIdent(args[1]);
    
    // Ensure Pokemon element is properly displayed after switch
    if (scene) {
      // Wait a brief moment to ensure the switch animation has completed
      await new Promise(resolve => setTimeout(resolve, 100));
      await scene.clearPokemonElement(pokemonIdent);
    }
  
    return 1000 / (scene?.acceleration || 1);
  };

  const ensureInitialPokemonVisibility = async () => {
    if (!scene) return;
    
    // Wait for scene to be ready
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Clear all active Pokemon elements
    const positions = ['p1a', 'p1b', 'p2a', 'p2b'];
    for (const pos of positions) {
      await scene.clearPokemonElement(pos as PokemonIdent);
    }
  };
  
  const handleTurnAction = async (args: ArgType, currentBattle: Battle): Promise<number> => {
    currentBattle.setTurn(parseInt(args[1] as string));
    await turnAction(currentBattle, args[1] as Num);
    return 1000 / (scene?.acceleration || 1);
  };
  
  const handleDamageAction = (args: ArgType, data: any): number => {
    damageAction(battle, scene, getRelativeIdent(args[1]), data.damage as string);
    return 1000 / (scene?.acceleration || 1);
  };
  
  const handleHealAction = (args: ArgType, data: any): number => {
    healAction(battle, scene, getRelativeIdent(args[1]), data.health as number[]);
    return 1000 / (scene?.acceleration || 1);
  };
  
  const handleMoveAction = async (args: ArgType, currentBattle: Battle): Promise<number> => {
    const defender = args[3] as PokemonIdent || args[1] as PokemonIdent;
    await moveAction(currentBattle, scene, getRelativeIdent(args[1]), args[2] as string, getRelativeIdent(defender));
    return 500 / (scene?.acceleration || 1);
  };
  
  const handleMissAction = async (args: ArgType): Promise<number> => {
    await missAction(battle, scene, getRelativeIdent(args[1]));
    return 500 / (scene?.acceleration || 1);
  };
  
  function getRelativeIdent(pokemonIdent: PokemonIdent): PokemonIdent {
    const identCode = pokemonIdent.split(':')[0];
    if(pov === 0) return identCode as PokemonIdent;
    return identCode.includes('1') ? 
    identCode.replace('1', '2') as PokemonIdent : 
    identCode.replace('2', '1') as PokemonIdent;
  }
  
  async function simulateAttack() {
    await moveAction(battle, scene, 'p1a' as PokemonIdent, simulatedAttack, 'p2a' as PokemonIdent);
  }
  
  return (
    <>
    <div className="flex">
    <BattleCanvas 
    battle={battle} 
    pov={pov} 
    messageBar={messageBar} 
    ref={battleCanvasRef} 
    />
    {logVisible && (
      <div 
      className="w-[400px] bg-surface-800 p-2 overflow-y-auto text-surface-50" 
      ref={logRef} 
      style={{height:`${canvasWidth * ASPECT_RATIO}px`}}
      >
      {htmlLog.map((line, index) => (
        <div key={index} dangerouslySetInnerHTML={{ __html: line }} />
      ))}
      </div>
    )}
    </div>
    <ReplayControls 
    battle={battle}
    isPlaying={isPlaying}
    setIsPlaying={setIsPlaying}
    setCurrentTurn={setCurrentTurn}
    pov={pov}
    setPov={setPov}
    simulateAttack={simulateAttack}
    simulatedAttack={simulatedAttack}
    setSimulatedAttack={setSimulatedAttack}
    turnInput={turnInput}
    setTurnInput={setTurnInput}
    lastTurn={lastTurn}
    logVisible={logVisible}
    setLogVisible={setLogVisible}
    />
    {process.env.NODE_ENV === 'development' && (
      <div className="mt-4">
      <h3 className="text-lg font-bold mb-2">Debug Information</h3>
      <div className="bg-surface-800 p-4 rounded">
      <div>Current Action: {currentAction}</div>
      <div>Current Turn: {battle.turn}</div>
      <div>Playing: {isPlaying ? 'Yes' : 'No'}</div>
      <div>Setting Turn: {settingTurn ? 'Yes' : 'No'}</div>
      </div>
      </div>
    )}
    </>
  );
}

function copyBattle(battle: Battle) {
  const newBattle = new Battle(new Generations(Dex as any));
  Object.assign(newBattle, battle);
  return newBattle;
}

export default Game;