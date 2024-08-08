import { Battle } from "@pkmn/client";
import { Num, PokemonDetails, PokemonHPStatus, PokemonIdent } from "@pkmn/protocol";
import { Scene } from "./Scene";


export async function turnAction(currentBattle: Battle, turn: Num) {
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

export async function moveAction(battle :Battle, scene: Scene | null, attacker: PokemonIdent, moveName: string, defender: PokemonIdent) {
  const move = battle.get("moves", moveName);
  if(!scene) return;
  return await scene.playBattleAnim(move.id, getPokemonIdentCode(attacker) as PokemonIdent, getPokemonIdentCode(defender) as PokemonIdent);
}

export async function damageAction(battle :Battle,scene: Scene | null, ident: PokemonIdent, hpstatus: PokemonHPStatus) {
  if(!scene) return;

  return scene.showPopup(getPokemonIdentCode(ident) as PokemonIdent, hpstatus.split('/')[0]+'%' as PokemonHPStatus);
}



function getPokemonIdentCode(ident: PokemonIdent) {
  return ident.split(':')[0];
}