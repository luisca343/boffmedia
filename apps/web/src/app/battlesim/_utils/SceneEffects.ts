import { PokemonIdent } from "@pkmn/protocol";
import { BattleEffects } from "../_utils/battle_animations";
import { BattleMoveAnims, BattleOtherAnims } from "../_utils/battle-animations-moves";
import { getImageSize, getOffset, getScaleMultiplier } from "../_utils/viewUtils";
import { ScenePos } from "../types";
import { Scene } from "./Scene";
import { PokemonSprite } from "./PokemonSprite";

/**
 * Handles visual effects in the battle scene
 */
export class SceneEffects {
  private scene: Scene;
  
  constructor(scene: Scene) {
    this.scene = scene;
  }
  
  /**
   * Shows a text popup over a Pokemon
   */
  async showPopup(position: PokemonIdent, text: string, duration: number = 1000): Promise<void> {
    const element = document.createElement('div');
    const popupWidth = 50;

    const offset = getOffset(this.scene.battle, position, getScaleMultiplier());
    const imageSize = getImageSize();
    
    const left = offset.left + imageSize / 2 - popupWidth / 2;
    const top = offset.top + imageSize / 2;

    // Set up popup styling
    element.style.position = 'absolute';
    element.style.width = `${popupWidth}px`;
    element.style.left = `${left}px`;
    element.style.top = `${top}px`;
    element.style.textAlign = 'center';
    element.style.borderRadius = '5px';
    element.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
    
    // Color based on text content
    if(text.includes('+')) {
      element.style.color = 'green';
    } else {
      element.style.color = 'red';
    }
    
    element.style.zIndex = '100';
    element.textContent = text;
    this.scene.gameElement.appendChild(element);
    
    element.style.transition = `all ${duration}ms`;

    // Animate the popup
    setTimeout(() => {
      element.style.top = `${top - imageSize * getScaleMultiplier() / 2}px`;
      element.style.visibility = 'hidden';
    }, 0);
    
    // Remove after animation completes
    return new Promise(resolve => {
      setTimeout(() => {
        element.remove();
        resolve();
      }, duration);
    });
  }
  
  /**
   * Plays a battle effect at a position
   */
  async playEffect(effect: string, position: PokemonIdent, callback?: () => void): Promise<void> {
    const pos = position.split(':')[0] as PokemonIdent;
    const scaleMulti = getScaleMultiplier();
    const offset = getOffset(this.scene.battle, pos, scaleMulti);
    if (!offset) return;
    
    const startingPosition = { top: offset.top, left: offset.left };

    // Find effect data
    const effectData = BattleMoveAnims[effect] || BattleOtherAnims[effect];
    if (!effectData) return;

    const attackerSprite = new PokemonSprite(this.scene, pos);
    
    // Play the effect animation
    effectData.anim(this.scene, [attackerSprite, attackerSprite], {startingPosition});
    
    return await Promise.all(this.scene.currentAnimations).then(() => {
      this.scene.currentAnimations = [];
      if (callback) callback();
    });
  }
  
  /**
   * Shows a visual effect with transition
   */
  async showEffect(
    effect: any, 
    start: ScenePos, 
    end: ScenePos, 
    transition: string, 
    after?: string, 
    additionalCss?: any, 
    callback?: () => void
  ): Promise<void> {
    const effectData = BattleEffects[effect];
    if (!effectData) return;

    const startTime = start.time || 0;
    const endTime = end.time || 500;
    const animationTime = endTime - startTime;

    const prom = new Promise<void>(resolve => setTimeout(() => {
      resolve();
    }, animationTime + 300));
    
    this.scene.currentAnimations.push(prom);
    
    // Calculate offsets based on effect type
    let halfWidth = getImageSize() / 2;
    let halfHeight = getImageSize() / 2;
    
    if (effect === 'pokeball') {
      halfWidth = 0;
      halfHeight = 0;
    }
    
    const startX = start.x || 0;
    const startY = start.y || 0;
    
    const left = (startX + halfWidth);
    const top = (startY + halfHeight);

    // Create effect element
    const element = document.createElement('img');
    element.src = effectData.url;
    element.style.position = 'absolute';
    element.style.left = `${left}px`;
    element.style.top = `${top}px`;
    element.style.width = `${effectData.w}px`;
    element.style.height = `${effectData.h}px`;
    element.style.opacity = `${start.opacity || 1}`;

    // Special case for pokeball
    if (effect === 'pokeball') {
      halfWidth = getImageSize() / 2;
      halfHeight = 3 * getImageSize() / 4;
    }
    
    // Apply any additional CSS
    if (additionalCss) {
      element.style.cssText += additionalCss;
    }
    
    this.scene.gameElement.appendChild(element);
    
    // Wait the start time before starting the animation
    await this.scene.wait(startTime);
    
    element.style.transition = `all ${animationTime}ms`;
    
    // Calculate end values
    const endX = end.x !== undefined ? end.x : start.x || 0;
    const endY = end.y !== undefined ? end.y : start.y || 0;
    const endOpacity = end.opacity !== undefined ? end.opacity : start.opacity;
    const endScale = end.scale !== undefined ? end.scale : start.scale;
    const endZ = end.z !== undefined ? end.z : start.z;

    // Start the animation after a slight delay
    setTimeout(() => {
      element.style.left = `${endX + halfWidth}px`;
      element.style.top = `${endY + halfHeight}px`;
      element.style.opacity = `${endOpacity}`;
      
      if (endScale !== undefined) {
        element.style.transform = `scale(${endScale})`;
      }
      
      if (endZ !== undefined) {
        element.style.zIndex = `${endZ}`;
      }
    }, 10);
    
    // Clean up after animation completes
    return prom.then(() => {
      element.remove();
      if (callback) callback();
      this.scene.currentAnimations.shift();
    });
  }
}