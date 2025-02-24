import { PokemonIdent } from "@pkmn/protocol";
import { getOffset, getScaleMultiplier } from "../_utils/viewUtils";
import { AnimationData, ScenePos } from "../types";
import { Scene } from "./Scene";

/**
 * Manages a Pokémon sprite in battle
 */
export class PokemonSprite {
  scene: Scene;
  position: PokemonIdent;
  element: HTMLElement;
  
  startingOffsetLeft: number = 0;
  startingOffsetTop: number = 0;
  
  animationQueue: AnimationData[] = [];
  animCounter: number = 0;
  
  sp: any;
  isMissedPokemon: boolean = false;
  
  constructor(scene: Scene, position: PokemonIdent) {
    this.scene = scene;
    this.position = position;
  
    const element = scene.getPokemonElement(position);
    if (!element) {
      throw new Error(`Element not found for position: ${position}`);
    }
    
    this.startingOffsetLeft = this.x();
    this.startingOffsetTop = this.y();
    
    // Initialize element styles
    element.style.left = `${getOffset(this.scene.battle, position, getScaleMultiplier()).left}px`;
    element.style.top = `${getOffset(this.scene.battle, position, getScaleMultiplier()).top}px`;
    element.style.right = 'auto';
    element.style.bottom = 'auto';
    element.style.position = 'absolute';
    element.style.transition = 'none';
    element.style.opacity = '1';
    element.style.transform = 'none';
  
    this.element = element;
  }
  
  /**
   * Creates a delay in animation
   */
  delay(time: number): this {
    this.scene.wait(time);
    return this;
  }
  
  /**
   * Plays next animation in queue
   */
  playNextAnim(): void {
    if (this.animationQueue.length === 0) return;
    
    const {animType, transition, type, callback} = this.animationQueue[0];
    this.performAnimation(transition, type, callback);
  }
  
  /**
   * Adds animation to queue
   */
  anim(transition: ScenePos, type?: string, callback?: () => void): this {
    this.animCounter++;
    
    const animation: AnimationData = { 
      animType: 'sprite', 
      transition, 
      type, 
      callback 
    };
    
    this.animationQueue.push(animation);
    
    // Start animation if it's the only one in queue
    if (this.animCounter === 1) {
      this.playNextAnim();
    }
    
    return this;
  }

  /**
   * Performs a single animation
   */
  performAnimation(transition: ScenePos, type?: string, callback?: () => void): void {
    const animationTime = transition.time === undefined ? 500 : transition.time;
    
    const prom = new Promise<void>(resolve => setTimeout(() => {
      resolve();
    }, animationTime));
    
    this.scene.currentAnimations.push(prom);
  
    const element = this.scene.getPokemonElement(this.position);
    if (!element) {
      console.log('Element not found');
      return;
    }

    // Apply transition styles
    element.style.transition = `all ${animationTime}ms`;
    element.style.position = 'absolute';
  
    if (transition.x !== undefined) {
      element.style.left = `${transition.x}px`;
    }
    if (transition.y !== undefined) {
      element.style.top = `${transition.y}px`;
    }
    if (transition.opacity !== undefined) {
      element.style.opacity = `${transition.opacity}`;
    }
    if (transition.scale !== undefined) {
      element.style.transform = `scale(${transition.scale})`;
    } else {
      element.style.transform = 'none';
    }

    // Force reflow to ensure transition applies
    element.offsetHeight;

    // Handle animation completion
    prom.then(() => {
      if (callback) {
        callback();
      }
      
      this.animationQueue.shift();
      this.scene.currentAnimations.shift();
      this.animCounter--;
      
      if (this.animationQueue.length > 0) {
        this.playNextAnim();
      } else {
        this.animCounter = 0;
      }
    });
  }

  /**
   * Resets sprite to original position
   */
  resetPosition(): void {
    const element = this.scene.getPokemonElement(this.position);
    if (!element) return;
    
    element.style.top = `${getOffset(this.scene.battle, this.position, getScaleMultiplier()).top}px`;
    element.style.left = `${getOffset(this.scene.battle, this.position, getScaleMultiplier()).left}px`;
    this.animationQueue = [];
  }

  /**
   * Clears element styling
   */
  async clearElement(): Promise<void> {
    this.element.style.transition = 'none';
    this.element.style.transform = 'none';
    this.element.style.opacity = '1';
    this.element.style.borderColor = 'white';
    this.element.style.zIndex = '1';
  }
  
  /**
   * Gets the X position
   */
  x(): number {
    return getOffset(this.scene.battle, this.position, getScaleMultiplier()).left;
  }
  
  /**
   * Gets the Y position
   */
  y(): number {
    return getOffset(this.scene.battle, this.position, getScaleMultiplier()).top;
  }
  
  /**
   * Gets the Z index
   */
  z(): number {
    return this.element?.style.zIndex ? parseInt(this.element.style.zIndex) : 1;
  }
  
  /**
   * Calculates position behind this sprite
   */
  behind(amount: number): number {
    return this.z() - amount > 0 ? this.z() - amount : 0;
  }
  
  /**
   * Calculates position to the left of this sprite
   */
  leftof(offset: number): number {
    return this.x() - offset;
  }
}