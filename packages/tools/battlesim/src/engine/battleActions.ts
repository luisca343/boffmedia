import { Battle } from "@pkmn/client";
import { Num, PokemonDetails, PokemonHPStatus, PokemonIdent } from "@pkmn/protocol";
import { Scene } from "./Scene";
import type { PopupOptions } from "./SceneEffects";
import { fxLabels } from "./fxLabels";

export async function turnAction(_currentBattle: Battle, _turn: Num) {
  // Nothing to draw: the turn counter is state, and the renderer reads it.
}

export type Position = {
  top: number;
  left: number;
  x?: number;
  y?: number;
};

/** The slot code a scene call addresses: `p1a: Pikachu` → `p1a`. */
export function getPokemonIdentCode(ident: PokemonIdent | string): string {
  return String(ident).split(':')[0];
}

/** The outgoing Pokemon shrinks into its ball. Runs BEFORE `battle.add`. */
export async function recallAction(scene: Scene | null, ident: PokemonIdent | string) {
  if (!scene) return;
  return await scene.playRecall(getPokemonIdentCode(ident));
}

/** The incoming Pokemon grows out of its ball. Runs AFTER the commit. */
export async function summonAction(scene: Scene | null, ident: PokemonIdent | string) {
  if (!scene) return;
  return await scene.playSummon(getPokemonIdentCode(ident));
}

/** @deprecated Kept for callers outside the engine; prefer `summonAction`. */
export async function switchAction(
  scene: Scene | null,
  ident: PokemonIdent,
  _details?: PokemonDetails,
  _hpstatus?: PokemonHPStatus,
) {
  if (!scene) return;
  return await summonAction(scene, ident);
}

export async function moveAction(battle: Battle, scene: Scene | null, attacker: PokemonIdent, moveName: string, defender: PokemonIdent) {
  if (!scene) return;
  const move = battle.get("moves", moveName);
  return await scene.playBattleAnim(
    (move as any)?.id ?? String(moveName).toLowerCase().replace(/[^a-z0-9]/g, ''),
    getPokemonIdentCode(attacker) as PokemonIdent,
    getPokemonIdentCode(defender) as PokemonIdent,
  );
}

export async function prepareMoveAction(battle: Battle, scene: Scene | null, attacker: PokemonIdent, moveName: string, defender: PokemonIdent) {
  if (!scene) return;
  const move = battle.get("moves", moveName);
  return await scene.playPrepareAnim(
    (move as any)?.id ?? String(moveName).toLowerCase().replace(/[^a-z0-9]/g, ''),
    getPokemonIdentCode(attacker) as PokemonIdent,
    getPokemonIdentCode(defender) as PokemonIdent,
  );
}

export async function damageAction(_battle: Battle, scene: Scene | null, ident: PokemonIdent, damageStr: string) {
  if (!scene) return;
  const damage = damageStr?.includes('||') ? damageStr.split('||')[2] : damageStr;
  return scene.showPopup(getPokemonIdentCode(ident) as PokemonIdent, `-${damage}`, 1000, { tone: 'dmg' });
}

export async function healAction(_battle: Battle, scene: Scene | null, ident: PokemonIdent, heal: number[]) {
  if (!scene) return;
  return scene.showPopup(getPokemonIdentCode(ident) as PokemonIdent, `+${heal?.[0] ?? 0}%`, 1000, { tone: 'heal' });
}

export async function faintAction(_battle: Battle, scene: Scene | null, ident: PokemonIdent) {
  if (!scene) return;
  return await scene.playFaint(getPokemonIdentCode(ident));
}

export async function missAction(_battle: Battle, scene: Scene | null, ident: PokemonIdent) {
  if (!scene) return;
  return await scene.showPopup(getPokemonIdentCode(ident) as PokemonIdent, fxLabels().miss, 900, { tone: 'muted' });
}

/** Any catalog word over a Pokémon — crit, effectiveness, status, boosts. */
export async function textPopupAction(scene: Scene | null, ident: PokemonIdent, text: string, duration = 900, opts: PopupOptions = {}) {
  if (!scene) return;
  return await scene.showPopup(getPokemonIdentCode(ident) as PokemonIdent, text, duration, opts);
}

/** Crit: a short shake and the popup, together. */
export async function critAction(scene: Scene | null, ident: PokemonIdent) {
  if (!scene) return;
  const code = getPokemonIdentCode(ident) as PokemonIdent;
  await Promise.all([
    scene.sceneEffects.shake(code, 360),
    scene.showPopup(code, fxLabels().crit, 1000, { tone: 'crit', scale: 1.2 }),
  ]);
}

export async function bannerAction(scene: Scene | null, text: string, duration = 1200) {
  if (!scene) return;
  return await scene.showBanner(text, duration);
}
