import { Battle } from "@pkmn/client";
import { Num, PokemonDetails, PokemonHPStatus, PokemonIdent } from "@pkmn/protocol";
import { Scene } from "./Scene";


export async function turnAction(currentBattle: Battle, turn: Num) {
    currentBattle.setTurn(turn);
    return await new Promise<void>((resolve) => {
      setTimeout(() => {

        resolve();
      }, 100);
    });
  }

  export  async function switchAction(ident: PokemonIdent, details: PokemonDetails, hpstatus: PokemonHPStatus) {
    return await new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve();
      }, 1000);
    });
  }

    export async function moveAction(battle :Battle,scene: Scene | null, attacker: PokemonIdent, moveName: string, defender: PokemonIdent) {
        const move = battle.get("moves", moveName);
        if(!scene) return;
        return await scene.playBattleAnim(move.id, attacker.split(':')[0] as PokemonIdent, defender.split(':')[0] as PokemonIdent);
    }
  