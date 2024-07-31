import { Battle } from "@pkmn/client";
import { PokemonIdent } from "@pkmn/protocol";
import { BattleMoveAnims } from "../_components_old/battle-animations.moves";

const BattleEffects: {[k: string]: any} = {
	wisp: {
		url:'/smartrotom/test/fx/wisp.png',
		w: 100, h: 100,
	},
	poisonwisp: {
		url:'/smartrotom/test/fx/poisonwisp.png',
		w: 100, h: 100,
	},
	waterwisp: {
		url:'/smartrotom/test/fx/waterwisp.png',
		w: 100, h: 100,
	},
	mudwisp: {
		url:'/smartrotom/test/fx/mudwisp.png',
		w: 100, h: 100,
	},
	blackwisp: {
		url:'/smartrotom/test/fx/blackwisp.png',
		w: 100, h: 100,
	},
	fireball: {
		url:'/smartrotom/test/fx/fireball.png',
		w: 64, h: 64,
	},
	bluefireball: {
		url:'/smartrotom/test/fx/bluefireball.png',
		w: 64, h: 64,
	},
	icicle: {
		url:'/smartrotom/test/fx/icicle.png', // http://opengameart.org/content/icicle-spell
		w: 80, h: 60,
	},
	pinkicicle: {
		url:'/smartrotom/test/fx/icicle-pink.png', // http://opengameart.org/content/icicle-spell, recolored by Kalalokki
		w: 80, h: 60,
	},
	lightning: {
		url:'/smartrotom/test/fx/lightning.png', // by Pokemon Showdown user SailorCosmos
		w: 41, h: 229,
	},
	rocks: {
		url:'/smartrotom/test/fx/rocks.png', // Pokemon Online - Gilad
		w: 100, h: 100,
	},
	rock1: {
		url:'/smartrotom/test/fx/rock1.png', // Pokemon Online - Gilad
		w: 64, h: 80,
	},
	rock2: {
		url:'/smartrotom/test/fx/rock2.png', // Pokemon Online - Gilad
		w: 66, h: 72,
	},
	rock3: {
		url:'/smartrotom/test/fx/rock3.png', // by Pokemon Showdown user SailorCosmos
		w: 66, h: 72,
	},
	leaf1: {
		url:'/smartrotom/test/fx/leaf1.png',
		w: 32, h: 26,
	},
	leaf2: {
		url:'/smartrotom/test/fx/leaf2.png',
		w: 40, h: 26,
	},
	bone: {
		url:'/smartrotom/test/fx/bone.png',
		w: 29, h: 29,
	},
	caltrop: {
		url:'/smartrotom/test/fx/caltrop.png', // by Pokemon Showdown user SailorCosmos
		w: 80, h: 80,
	},
	greenmetal1: {
		url:'/smartrotom/test/fx/greenmetal1.png', // by Pokemon Showdown user Kalalokki
		w: 45, h: 45,
	},
	greenmetal2: {
		url:'/smartrotom/test/fx/greenmetal2.png', // by Pokemon Showdown user Kalalokki
		w: 45, h: 45,
	},
	poisoncaltrop: {
		url:'/smartrotom/test/fx/poisoncaltrop.png', // by Pokemon Showdown user SailorCosmos
		w: 80, h: 80,
	},
	shadowball: {
		url:'/smartrotom/test/fx/shadowball.png',
		w: 100, h: 100,
	},
	energyball: {
		url:'/smartrotom/test/fx/energyball.png',
		w: 100, h: 100,
	},
	electroball: {
		url:'/smartrotom/test/fx/electroball.png',
		w: 100, h: 100,
	},
	mistball: {
		url:'/smartrotom/test/fx/mistball.png',
		w: 100, h: 100,
	},
	iceball: {
		url:'/smartrotom/test/fx/iceball.png',
		w: 100, h: 100,
	},
	flareball: {
		url:'/smartrotom/test/fx/flareball.png',
		w: 100, h: 100,
	},
	moon: {
		url:'/smartrotom/test/fx/moon.png', // by Kalalokki
		w: 100, h: 100,
	},
	pokeball: {
		url:'/smartrotom/test/fx/pokeball.png',
		w: 24, h: 24,
	},
	fist: {
		url:'/smartrotom/test/fx/fist.png', // by Pokemon Showdown user SailorCosmos
		w: 55, h: 49,
	},
	fist1: {
		url:'/smartrotom/test/fx/fist1.png',
		w: 49, h: 55,
	},
	foot: {
		url:'/smartrotom/test/fx/foot.png', // by Pokemon Showdown user SailorCosmos
		w: 50, h: 75,
	},
	topbite: {
		url:'/smartrotom/test/fx/topbite.png',
		w: 108, h: 64,
	},
	bottombite: {
		url:'/smartrotom/test/fx/bottombite.png',
		w: 108, h: 64,
	},
	web: {
		url:'/smartrotom/test/fx/web.png', // by Pokemon Showdown user SailorCosmos
		w: 120, h: 122,
	},
	leftclaw: {
		url:'/smartrotom/test/fx/leftclaw.png',
		w: 44, h: 60,
	},
	rightclaw: {
		url:'/smartrotom/test/fx/rightclaw.png',
		w: 44, h: 60,
	},
	leftslash: {
		url:'/smartrotom/test/fx/leftslash.png', // by Pokemon Showdown user Modeling Clay
		w: 57, h: 56,
	},
	rightslash: {
		url:'/smartrotom/test/fx/rightslash.png', // by Pokemon Showdown user Modeling Clay
		w: 57, h: 56,
	},
	leftchop: {
		url:'/smartrotom/test/fx/leftchop.png', // by Pokemon Showdown user SailorCosmos
		w: 100, h: 130,
	},
	rightchop: {
		url:'/smartrotom/test/fx/rightchop.png', // by Pokemon Showdown user SailorCosmos
		w: 100, h: 130,
	},
	angry: {
		url:'/smartrotom/test/fx/angry.png', // by Pokemon Showdown user SailorCosmos
		w: 30, h: 30,
	},
	heart: {
		url:'/smartrotom/test/fx/heart.png', // by Pokemon Showdown user SailorCosmos
		w: 30, h: 30,
	},
	pointer: {
		url:'/smartrotom/test/fx/pointer.png', // by Pokemon Showdown user SailorCosmos
		w: 100, h: 100,
	},
	sword: {
		url:'/smartrotom/test/fx/sword.png', // by Pokemon Showdown user SailorCosmos
		w: 48, h: 100,
	},
	impact: {
		url:'/smartrotom/test/fx/impact.png', // by Pokemon Showdown user SailorCosmos
		w: 127, h: 119,
	},
	stare: {
		url:'/smartrotom/test/fx/stare.png',
		w: 100, h: 35,
	},
	shine: {
		url:'/smartrotom/test/fx/shine.png', // by Smogon user Jajoken
		w: 127, h: 119,
	},
	feather: {
		url:'/smartrotom/test/fx/feather.png', // Ripped from http://www.clker.com/clipart-black-and-white-feather.html
		w: 100, h: 38,
	},
	shell: {
		url:'/smartrotom/test/fx/shell.png', // by Smogon user Jajoken
		w: 100, h: 91.5,
	},
	petal: {
		url:'/smartrotom/test/fx/petal.png', // by Smogon user Jajoken
		w: 60, h: 60,
	},
	gear: {
		url:'/smartrotom/test/fx/gear.png', // by Smogon user Jajoken
		w: 100, h: 100,
	},
	alpha: {
		url:'/smartrotom/test/fx/alpha.png', // Ripped from Pokemon Global Link
		w: 80, h: 80,
	},
	omega: {
		url:'/smartrotom/test/fx/omega.png', // Ripped from Pokemon Global Link
		w: 80, h: 80,
	},
	rainbow: {
		url:'/smartrotom/test/fx/rainbow.png',
		w: 128, h: 128,
	},
	zsymbol: {
		url:'/smartrotom/test/fx/z-symbol.png', // From http://froggybutt.deviantart.com/art/Pokemon-Z-Move-symbol-633125033
		w: 150, h: 100,
	},
	ultra: {
		url:'/smartrotom/test/fx/ultra.png', // by Pokemon Showdown user Modeling Clay
		w: 113, h: 165,
	},
	hitmark: {
		url:'/smartrotom/test/fx/hitmarker.png', // by Pokemon Showdown user Ridaz
		w: 100, h: 100,
	},
	protect: {
		rawHTML: '<div class="turnstatus-protect" style="display:none;position:absolute" />',
		w: 100, h: 70,
	},
	auroraveil: {
		rawHTML: '<div class="sidecondition-auroraveil" style="display:none;position:absolute" />',
		w: 100, h: 50,
	},
	reflect: {
		rawHTML: '<div class="sidecondition-reflect" style="display:none;position:absolute" />',
		w: 100, h: 50,
	},
	safeguard: {
		rawHTML: '<div class="sidecondition-safeguard" style="display:none;position:absolute" />',
		w: 100, h: 50,
	},
	lightscreen: {
		rawHTML: '<div class="sidecondition-lightscreen" style="display:none;position:absolute" />',
		w: 100, h: 50,
	},
	mist: {
		rawHTML: '<div class="sidecondition-mist" style="display:none;position:absolute" />',
		w: 100, h: 50,
	},
};

const width = 175;
const height = 175;

export const offsets: Readonly<Record<string, { top: number; left: number }>> = Object.freeze({
  p1a: { top: 150, left: 10, x: 10 + width / 2, y: 150 + width / 2 },
  p1b: { top: 190, left: 150, x: 150 + width / 2, y: 190 + width / 2 },

  p2b: { top: 0, left: 140, x: 140 + width / 2, y: 0 + width / 2 },
  p2a: { top: 40, left: 250, x: 250 + width / 2, y: 40 + width / 2 },
});

export class Scene {
    battle: Battle;
    gameElement: HTMLElement;
    currentAnimations: any[] = [];
    acceleration: number = 1;

    constructor(battle: Battle, gameElement: HTMLElement) {
        this.battle = battle
        this.gameElement = gameElement
      }

    wait(time: number) {
        return new Promise(resolve => setTimeout(resolve, time));
    }

	backgroundEffect(background:string, duration: number, opacity: number) {
	}

    async playEffect(effect: string, position: PokemonIdent, callback: () => void) {
      const pos = position.split(':')[0];
      const element = offsets[pos];
      if(!element) return;

      const effectData = this.animsTest[effect];
      console.log(effect);
      console.log(effectData);
      if (!effectData) return;

      const startY = pos.includes('p1') ? element.top + 40 : element.top;
      const startX = pos.includes('p1') ? element.left -200 : element.left + 200;

      effectData.anim(startX, startY , element, callback);

      Promise.all(this.currentAnimations).then(() => {
        this.currentAnimations = [];
        console.log('All animations completed');
        //this.animating = false;
      });
    }

    async showEffect(effect: string, start: ScenePos, end: ScenePos, transition: string, after?: string, additionalCss?: string, callback?: () => void) {
      const effectData = BattleEffects[effect];
      if (!effectData) return;
	  
	  const halfWidth = 175 / 2;

	  const startX = start.x || 0;
	  const startY = start.y || 0;
  
    
      const element = document.createElement('img');
      element.src = effectData.url;
      element.style.position = 'absolute';
      element.style.left = `${startX  + halfWidth}px`;
      element.style.top = `${startY  + halfWidth}px`;
      element.style.width = `${effectData.w}px`;
      element.style.height = `${effectData.h}px`;
      element.style.opacity = `${start.opacity || 1}`;
    
      if (additionalCss) {
        element.style.cssText += additionalCss;
      }
    
      this.gameElement.appendChild(element);
    
    
      const animationTime = start.time || 500;
    
      element.style.transition = `all ${animationTime}ms`;
  
      const endX = end.x !== undefined ? end.x : start.x  || 0
      const endY = end.y !== undefined ? end.y : start.y  ||0
      const endOpacity = end.opacity !== undefined ? end.opacity : start.opacity;
      const endScale = end.scale !== undefined ? end.scale : start.scale;
      const endZ = end.z !== undefined ? end.z : start.z;
  
      // Start the animation after a slight delay to ensure the browser has rendered the initial state
      setTimeout(() => {
        element.style.left = `${endX + halfWidth}px`;
        element.style.top = `${endY + halfWidth}px`;
        element.style.opacity = `${endOpacity}`;
        element.style.transform = `scale(${endScale})`;
        element.style.zIndex = `${endZ}`;
      }, 10); // A slight delay
    
      // Wait for the animation to complete before executing the callback
      const prom = new Promise<void>(resolve => setTimeout(() => {
        resolve();
  
        
      }, animationTime + 300));
    
      this.currentAnimations.push(prom);
    
      prom.then(() => {
        // Remove the element from the DOM after the animation
        element.remove();
        if (callback) callback();
      });
    }


    animsTest: {[k: string]: { anim: (startX: any, startY: any, element: any, callback: (() => void) | undefined) => void }} = {
      pokeball:{
        anim: (startX: any, startY: any, element:any,callback: (() => void) | undefined) => {
          this.showEffect('pokeball', {
            opacity: 1,
            x: startX,
            y: startY,
            scale: .7,
            time: 500 / this.acceleration,
            }, {
            opacity: 0,
            x: element.x,
            y: element.y,
            time: 1000 / this.acceleration,
            }, 'ballistic2', '', '', callback); 
        }
      } 
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
	const animFunc = BattleMoveAnims[anim] || BattleOtherAnims[anim];
		//const animFunc = BattleMoveAnims[anim] || BattleOtherAnims[anim];
		if (animFunc === undefined) {
			await this.playBattleAnim('contactattack', attacker, defender);
			return;
		}

		const attackerSprite = new PokemonSprite(this, attacker);
		const defenderSprite = new PokemonSprite(this, defender);

		animFunc.anim(this, [attackerSprite, defenderSprite]);

    
		return await Promise.all(this.currentAnimations).then(() => {
			this.currentAnimations = [];

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
			}
      
			return new Promise<void>((resolve) => {
        if(callback) {
          //wait 500ms before calling callback
          setTimeout(() => {
            callback();
            resolve();
          }, 500);
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

  leftof(offset: number) {
	return this.x() - offset;
  }

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
    return this.z() - amount > 0 ? this.z() - amount : 0;
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