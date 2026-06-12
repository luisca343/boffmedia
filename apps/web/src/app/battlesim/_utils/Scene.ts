import { Battle } from "@pkmn/client";
import { PokemonIdent } from "@pkmn/protocol";
import { BattleMoveAnims, BattleOtherAnims } from "../_utils/battle-animations-moves";
import { getOffset, getScaleMultiplier } from "../_utils/viewUtils";
import { AnimationProps, ScenePos } from "../types";
import { PokemonSprite } from "./PokemonSprite";
import { SceneEffects } from "./SceneEffects";

/**
 * Main Scene class for managing battle visualization
 */
export class Scene {
  battle: any;
  gameElement: HTMLElement;
  currentAnimations: Promise<void>[] = [];
  acceleration: number;
  sceneEffects: SceneEffects;
  $bg: { animate: () => any; delay: () => any };
  
  constructor(battle: Battle, gameElement: HTMLElement) {
    this.battle = battle;
    this.gameElement = gameElement;
    this.acceleration = 1;
    this.sceneEffects = new SceneEffects(this);
    // Stub for animations that reference scene.$bg (earthquake, scorching sands, etc.)
    const bgStub: any = { animate: () => bgStub, delay: () => bgStub };
    this.$bg = bgStub;
  }

  setAcceleration(acceleration: number) {
    this.acceleration = acceleration;
  }
  
  wait(time: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, time));
  }
  
  backgroundEffect(background: string, duration: number, opacity: number, idontknow?: number) {
    // No-op — background effects not yet implemented
  }
  
  async showPopup(position: PokemonIdent, text: string, duration: number = 1000): Promise<void> {
    return this.sceneEffects.showPopup(position, text, duration);
  }
  
  async playBattleAnim(
    anim: string, 
    attacker: PokemonIdent, 
    defender: PokemonIdent, 
    callback?: () => void
  ): Promise<void> {
    const animFunc = BattleMoveAnims[anim] || BattleOtherAnims[anim];
    
    // Fall back to contact attack if animation not found
    if (animFunc === undefined) {
      return await this.playBattleAnim('contactattack', attacker, defender);
    }
    
    const scaleMulti = getScaleMultiplier();
    const attackerOffset = getOffset(this.battle, attacker, scaleMulti);
    const startingPosition = { top: attackerOffset.top, left: attackerOffset.left };

    const attackerSprite = new PokemonSprite(this, attacker);
    const defenderSprite = new PokemonSprite(this, defender);

    animFunc.anim(this, [attackerSprite, defenderSprite], {startingPosition});
    
    // Wait for all animations to complete
    return await Promise.all(this.currentAnimations).then(() => {
      this.currentAnimations = [];
      
      // Reset sprites to their original positions
      attackerSprite.resetPosition();
      defenderSprite.resetPosition();
    });
  }
  
  async clearPokemonElement(id: PokemonIdent): Promise<void> {
    const sprite = new PokemonSprite(this, id);
    return await sprite.clearElement();
  }
  
  async playEffect(
    effect: string, 
    position: PokemonIdent, 
    callback?: () => void
  ): Promise<void> {
    return this.sceneEffects.playEffect(effect, position, callback);
  }
  
  async showEffect(
    effect: any, 
    start: ScenePos, 
    end: ScenePos, 
    transition: string, 
    after?: string, 
    additionalCss?: any, 
    callback?: () => void
  ): Promise<void> {
    return this.sceneEffects.showEffect(
      effect, start, end, transition, after, additionalCss, callback
    );
  }
  
  destroy(): void {
    this.currentAnimations = [];
    try { this.gameElement.innerHTML = ''; } catch {}
  }

  getPokemonElement(id: string): HTMLElement | null {
    if (id === '') {
      return null;
    }
    return this.gameElement.querySelector(`#${id}`) as HTMLElement;
  }
  
  getPokemonSpriteElement(id: string): HTMLImageElement | null {
    if (id === '') {
      return null;
    }
    const wrapper = this.gameElement.querySelector(`#${id}`);
    if (!wrapper) return null;
    
    return wrapper.querySelector('img') as HTMLImageElement;
  }
}

// This class was moved to its own file
export class ExtraBattleProps {
  mySide: any;
}