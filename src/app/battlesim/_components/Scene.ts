import { Battle } from "@pkmn/client";
import { PokemonIdent } from "@pkmn/protocol";

export const offsets: Readonly<Record<string, { top: number; left: number }>> = Object.freeze({
  p1a: { top: 150, left: 10 },
  p1b: { top: 190, left: 150 },
  p1c: { top: 230, left: 10 },
  p2a: { top: 0, left: 140 },
  p2b: { top: 40, left: 250 },
  p2c: { top: 80, left: 250 },
});

export class Scene {
    battle: Battle;
    gameElement: HTMLElement;
    currentAnimations: any[] = [];

    constructor(battle: Battle, gameElement: HTMLElement) {
        this.battle = battle
        this.gameElement = gameElement
      }

    wait(time: number) {
        return new Promise(resolve => setTimeout(resolve, time));
    }

    
  getPokemonSpriteElement(id: string) {
    if(id === '') {
      return null;
    }
    const wrapper = this.gameElement.querySelector(`#${id}`);
    if (!wrapper) return null;
    
    const element = wrapper.querySelector('img')
    if (!element) return null;
    
    return element;
  }

  async playBattleAnim(anim: string, attacker: PokemonIdent, defender: PokemonIdent, callback?: () => void) {
		const animFunc = BattleOtherAnims['contactattack'];
		//const animFunc = BattleMoveAnims[anim] || BattleOtherAnims[anim];
		if (animFunc === undefined) {
			await this.playBattleAnim('contactattack', attacker, defender);
			return;
		}

		const attackerSprite = new PokemonSprite(this, attacker);
		const defenderSprite = new PokemonSprite(this, defender);

    console.log('PLAYING ANIM')
    console.log(attacker)
    console.log(defender)

		animFunc.anim(this, [attackerSprite, defenderSprite]);

    
		return await Promise.all(this.currentAnimations).then(() => {
			this.currentAnimations = [];
      console.log('anim done')

      const attackElemnt = document.getElementById(attackerSprite.position);
      const defendElement = document.getElementById(defenderSprite.position);

      
      if(attackElemnt) {
        attackElemnt.style.top = offsets[attackerSprite.position].top + 'px';
        attackElemnt.style.left = offsets[attackerSprite.position].left + 'px';
        attackerSprite.animationQueue = [];
      }

      if(defendElement) {
        defendElement.style.top = offsets[defenderSprite.position].top + 'px';
        defendElement.style.left = offsets[defenderSprite.position].left + 'px';
        defenderSprite.animationQueue = [];
      }
		
			if(anim === 'faint') {
				console.log('Faint animation completed');
				return;
			}
			return new Promise<void>((resolve) => {
        if(callback) {
          callback();
        }
        resolve();
			});
		});
		
	}
    
}

export interface ScenePos {
  x?: number;
  y?: number;
  z?: number;
  scale?: number;
  xscale?: number;
  yscale?: number;
  opacity?: number;
  time?: number;
  display?: string;
}

export class PokemonSprite {
  scene: Scene;
  position: PokemonIdent;
  element: HTMLImageElement | null;

  startingOffsetLeft: number = 0;
  startingOffsetTop: number = 0;

  animationQueue: any[] = [];

  constructor(scene: Scene, position: PokemonIdent){
      this.scene = scene;
      this.position = position;
      this.element = scene.getPokemonSpriteElement(position);

      this.startingOffsetLeft = this.x();
      this.startingOffsetTop = this.y();

      if (this.element) {
        this.element.style.left = `${offsets[position].left}px`;
        this.element.style.top = `${offsets[position].top}px`;
        this.element.style.right = 'auto';
        this.element.style.bottom = 'auto';
      }

      if(!this.element) return;
  }

  delay(time: number) {
    return this.scene.wait(time);
  }

  playNextAnim() {
    console.log('PLAYING NEXT ANIM')
    if(this.animationQueue.length === 0) return;
    const {animType, transition, type, callback} = this.animationQueue.shift();
    this.anim2(transition, type, callback);
  }

  anim(transition: ScenePos, type?: string, callback?: () => void) {
      if(this.animationQueue.length > 0) {
        this.animationQueue.push({animType: 'sprite', transition, type, callback});
        return;
      } else {
        this.animationQueue.push({animType: 'sprite', transition, type, callback});
        this.playNextAnim();
      }
  }

	async anim2(transition: ScenePos, type?: string, callback?: () => void) {
    // Wait for the animation to complete, instead of event listener, we use setTimeout
    const element = document.getElementById(this.position);
    if (!element) return;
    const animationTime = transition.time || 500;
		const prom = new Promise<void>((resolve) => {
			setTimeout(() => {
        const position = this.position
      
        const x1 = transition.x || 0
        const y1 = transition.y || 0
        const z1 = transition.z || 1
    
        const opacity = transition.opacity !== undefined ? transition.opacity : 1;
      
        element.style.transition = `all ${animationTime}ms`;
        

        const halfWidth = position.includes('p1') ? parseInt(element.style.width) / 4 : -parseInt(element.style.width) / 4;
        const halfHeight = position.includes('p1') ? -parseInt(element.style.width) / 4 : parseInt(element.style.height) / 4;


        // Apply CSS changes immediately to start the animation
        if(x1 >0) element.style.left = `${x1 }px`;
        if(y1 >0) element.style.top = `${y1}px`;
        
        element.style.zIndex = `${z1}`;
        element.style.opacity = `${opacity}`;
        element.style.transform = `scale(${transition.scale || 1})`;
        

				resolve();
        if (callback) callback();
      
        this.animationQueue.shift();
        if (this.animationQueue.length > 0) {
          const next = this.animationQueue[0];
          this.anim2(next.transition, next.type, next.callback);
        } else {
          //this.scene.animating = false;
        }

			}, animationTime);
		});
		
    this.scene.currentAnimations.push(prom);
    



	
	}

  x() {
    return offsets[this.position].left;
  }

  y() {
    return offsets[this.position].top;
  }

  z():number {
    return this.element?.style.zIndex ? parseInt(this.element.style.zIndex) : 1;
  }

  behind(amount: number) {
    return this.z() - amount;
  }

  
  
}






export const BattleOtherAnims: {[k: string]: {anim: (scene: Scene, args: PokemonSprite[]) => void}} = {
	contactattack: {
		anim(scene, [attacker, defender]) {
			attacker.anim({
				x: defender.x(),
				y: defender.y() - 80,
				z: defender.behind(-30),
				time: 400,
			}, 'ballistic');
			attacker.anim({
				x: defender.x(),
				y: defender.y() + 5,
				z: defender.z(),
				time: 100,
			});
			attacker.anim({
				time: 500,
			}, 'ballistic2Back');
			defender.delay(400);
			defender.anim({
				z: defender.behind(20),
				time: 100,
			}, 'swing');
			defender.anim({
				time: 300,
			}, 'swing');
			scene.wait(500);
		},
  },
}