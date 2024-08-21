import { Battle } from "@pkmn/client";
import { Num, PokemonDetails, PokemonHPStatus, PokemonIdent } from "@pkmn/protocol";
import { Scene } from "../_components/Scene";


export async function turnAction(currentBattle: Battle, turn: Num) {
  return await new Promise<void>((resolve) => {
    setTimeout(() => {
      
      resolve();
    }, 100);
  });
}

export type Position = {
  top: number;
  left: number;
  x?: number;
  y?: number;
};

/*
  top: `${povCentered ? 230 * scaleMultiplier : 94 * scaleMultiplier}px`,
  left: `${povCentered ? 90 * scaleMultiplier : 630 * scaleMultiplier}px`,
*/

export  async function switchAction(scene: Scene | null,ident: PokemonIdent, details: PokemonDetails, hpstatus: PokemonHPStatus) {
  if(!scene) return;
  return await scene.playEffect('switch', ident);
}

export async function moveAction(battle :Battle, scene: Scene | null, attacker: PokemonIdent, moveName: string, defender: PokemonIdent) {
  const move = battle.get("moves", moveName);
  if(!scene) return;
  return await scene.playBattleAnim(move.id, getPokemonIdentCode(attacker) as PokemonIdent, getPokemonIdentCode(defender) as PokemonIdent);
  
  //return await scene.playBattleAnim('contactattack', getPokemonIdentCode(attacker) as PokemonIdent, getPokemonIdentCode(defender) as PokemonIdent);
}

export async function damageAction(battle :Battle,scene: Scene | null, ident: PokemonIdent, damageStr: string) {
  if(!scene) return;
  const damage = damageStr.includes('||') ? damageStr.split('||')[2] : damageStr;

  return scene.showPopup(getPokemonIdentCode(ident) as PokemonIdent, `-${damage}` as PokemonHPStatus);
}

export async function healAction(battle :Battle, scene: Scene | null, ident: PokemonIdent, heal: number[]) {
  if(!scene) return;
  return scene.showPopup(getPokemonIdentCode(ident) as PokemonIdent, `+${heal[0]}%` as PokemonHPStatus);
}

export async function faintAction(battle :Battle, scene: Scene | null, ident: PokemonIdent) {
  if(!scene) return;
  return await scene.playBattleAnim('faint', getPokemonIdentCode(ident) as PokemonIdent, getPokemonIdentCode(ident) as PokemonIdent);
}



function getPokemonIdentCode(ident: PokemonIdent) {
  return ident.split(':')[0];
}