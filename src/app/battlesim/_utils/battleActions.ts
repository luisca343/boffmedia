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

export async function damageAction(battle :Battle,scene: Scene | null, ident: PokemonIdent, damageStr: string) {
  if(!scene) return;
  const damage = damageStr.includes('||') ? damageStr.split('||')[2] : damageStr;

  return scene.showPopup(getPokemonIdentCode(ident) as PokemonIdent, `-${damage}` as PokemonHPStatus);
}

export async function healAction(battle :Battle, scene: Scene | null, ident: PokemonIdent, heal: number[]) {
  if(!scene) return;

  console.log('heal', heal);

  return scene.showPopup(getPokemonIdentCode(ident) as PokemonIdent, `+${heal[0]}%` as PokemonHPStatus);
}



function getPokemonIdentCode(ident: PokemonIdent) {
  return ident.split(':')[0];
}