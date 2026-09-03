import { Battle } from "@pkmn/client";
import { Num, PokemonDetails, PokemonHPStatus, PokemonIdent } from "@pkmn/protocol";
import { Scene } from "./Scene";
import type { PopupOptions } from "./SceneEffects";
import { fxLabels } from "./fxLabels";

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

export  async function switchAction(scene: Scene | null,ident: PokemonIdent, details: PokemonDetails, hpstatus: PokemonHPStatus) {
  if(!scene) return;
  return await scene.playEffect('switch', ident);
}

export async function moveAction(battle :Battle, scene: Scene | null, attacker: PokemonIdent, moveName: string, defender: PokemonIdent) {
  const move = battle.get("moves", moveName);
  if(!scene) return;
  return await scene.playBattleAnim(move.id, getPokemonIdentCode(attacker) as PokemonIdent, getPokemonIdentCode(defender) as PokemonIdent);
}

export async function damageAction(battle :Battle,scene: Scene | null, ident: PokemonIdent, damageStr: string) {
  if(!scene) return;
  const damage = damageStr.includes('||') ? damageStr.split('||')[2] : damageStr;

  return scene.showPopup(getPokemonIdentCode(ident) as PokemonIdent, `-${damage}`, 1000, { tone: 'dmg' });
}

export async function healAction(battle :Battle, scene: Scene | null, ident: PokemonIdent, heal: number[]) {
  if(!scene) return;
  return scene.showPopup(getPokemonIdentCode(ident) as PokemonIdent, `+${heal[0]}%`, 1000, { tone: 'heal' });
}

export async function faintAction(battle :Battle, scene: Scene | null, ident: PokemonIdent) {
  if(!scene) return;
  return await scene.playBattleAnim('faint', getPokemonIdentCode(ident) as PokemonIdent, getPokemonIdentCode(ident) as PokemonIdent);
}

export async function missAction(battle :Battle, scene: Scene | null, ident: PokemonIdent) {
  if(!scene) return;
  return await scene.showPopup(getPokemonIdentCode(ident) as PokemonIdent, fxLabels().miss, 900, { tone: 'muted' });
}

/** Any catalog word over a Pokémon — crit, effectiveness, status, boosts. */
export async function textPopupAction(scene: Scene | null, ident: PokemonIdent, text: string, duration = 900, opts: PopupOptions = {}) {
  if(!scene) return;
  return await scene.showPopup(getPokemonIdentCode(ident) as PokemonIdent, text, duration, opts);
}

/** Crit: a short shake and the popup, together. */
export async function critAction(scene: Scene | null, ident: PokemonIdent) {
  if(!scene) return;
  const code = getPokemonIdentCode(ident) as PokemonIdent;
  await Promise.all([
    scene.sceneEffects.shake(code, 360),
    scene.showPopup(code, fxLabels().crit, 1000, { tone: 'crit', scale: 1.2 }),
  ]);
}

export async function bannerAction(scene: Scene | null, text: string, duration = 1200) {
  if(!scene) return;
  return await scene.sceneEffects.showBanner(text, duration);
}

function getPokemonIdentCode(ident: PokemonIdent) {
  return ident.split(':')[0];
}
