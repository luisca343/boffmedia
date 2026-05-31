import { Battle } from "@pkmn/client";
import { Scene } from "../_utils/Scene";
import { ArgType, Num, PokemonIdent } from "@pkmn/protocol";
import { 
  turnAction, 
  moveAction, 
  damageAction, 
  healAction, 
  missAction 
} from "../_utils/battleActions";
import { getRelativeIdent } from "../_utils/replayUtils";

export function useBattleActions(battle: Battle, scene: Scene | null, pov: 0 | 1) {
  const handleSwitchAction = async (args: ArgType): Promise<number> => {
    const pokemonIdent = getRelativeIdent(args[1] as PokemonIdent, pov);
    
    if (scene) {
      await new Promise(resolve => setTimeout(resolve, 100));
      await scene.clearPokemonElement(pokemonIdent);
    }
  
    return 1000 / (scene?.acceleration || 1);
  };

  const handleTurnAction = async (args: ArgType, currentBattle: Battle): Promise<number> => {
    currentBattle.setTurn(parseInt(args[1] as string));
    await turnAction(currentBattle, args[1] as Num);
    return 1000 / (scene?.acceleration || 1);
  };
  
  const handleDamageAction = (args: ArgType, data: any): number => {
    damageAction(battle, scene, getRelativeIdent(args[1] as PokemonIdent, pov), data.damage as string);
    return 1000 / (scene?.acceleration || 1);
  };
  
  const handleHealAction = (args: ArgType, data: any): number => {
    healAction(battle, scene, getRelativeIdent(args[1] as PokemonIdent, pov), data.health as number[]);
    return 1000 / (scene?.acceleration || 1);
  };
  
  const handleMoveAction = async (args: ArgType, currentBattle: Battle): Promise<number> => {
    const defender = args[3] as PokemonIdent || args[1] as PokemonIdent;
    await moveAction(currentBattle, scene, getRelativeIdent(args[1] as PokemonIdent, pov), args[2] as string, getRelativeIdent(defender, pov));
    return 500 / (scene?.acceleration || 1);
  };
  
  const handleMissAction = async (args: ArgType): Promise<number> => {
    await missAction(battle, scene, getRelativeIdent(args[1] as PokemonIdent, pov));
    return 500 / (scene?.acceleration || 1);
  };

  return {
    handleSwitchAction,
    handleTurnAction,
    handleDamageAction,
    handleHealAction,
    handleMoveAction,
    handleMissAction,
  };
}