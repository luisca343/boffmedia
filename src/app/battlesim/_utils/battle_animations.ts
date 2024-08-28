import { Battle } from "@pkmn/client";
import { PokemonIdent } from "@pkmn/protocol";
import { BattleMoveAnims, BattleOtherAnims } from "./battle-animations-moves";


export const BattleEffects: {[k: string]: any} = {
	wisp: {
		url:'/battlesim/fx/wisp.png',
		w: 100, h: 100,
	},
	poisonwisp: {
		url:'/battlesim/fx/poisonwisp.png',
		w: 100, h: 100,
	},
	waterwisp: {
		url:'/battlesim/fx/waterwisp.png',
		w: 100, h: 100,
	},
	mudwisp: {
		url:'/battlesim/fx/mudwisp.png',
		w: 100, h: 100,
	},
	blackwisp: {
		url:'/battlesim/fx/blackwisp.png',
		w: 100, h: 100,
	},
	fireball: {
		url:'/battlesim/fx/fireball.png',
		w: 64, h: 64,
	},
	bluefireball: {
		url:'/battlesim/fx/bluefireball.png',
		w: 64, h: 64,
	},
	icicle: {
		url:'/battlesim/fx/icicle.png', // http://opengameart.org/content/icicle-spell
		w: 80, h: 60,
	},
	pinkicicle: {
		url:'/battlesim/fx/icicle-pink.png', // http://opengameart.org/content/icicle-spell, recolored by Kalalokki
		w: 80, h: 60,
	},
	lightning: {
		url:'/battlesim/fx/lightning.png', // by Pokemon Showdown user SailorCosmos
		w: 41, h: 229,
	},
	rocks: {
		url:'/battlesim/fx/rocks.png', // Pokemon Online - Gilad
		w: 100, h: 100,
	},
	rock1: {
		url:'/battlesim/fx/rock1.png', // Pokemon Online - Gilad
		w: 64, h: 80,
	},
	rock2: {
		url:'/battlesim/fx/rock2.png', // Pokemon Online - Gilad
		w: 66, h: 72,
	},
	rock3: {
		url:'/battlesim/fx/rock3.png', // by Pokemon Showdown user SailorCosmos
		w: 66, h: 72,
	},
	leaf1: {
		url:'/battlesim/fx/leaf1.png',
		w: 32, h: 26,
	},
	leaf2: {
		url:'/battlesim/fx/leaf2.png',
		w: 40, h: 26,
	},
	bone: {
		url:'/battlesim/fx/bone.png',
		w: 29, h: 29,
	},
	caltrop: {
		url:'/battlesim/fx/caltrop.png', // by Pokemon Showdown user SailorCosmos
		w: 80, h: 80,
	},
	greenmetal1: {
		url:'/battlesim/fx/greenmetal1.png', // by Pokemon Showdown user Kalalokki
		w: 45, h: 45,
	},
	greenmetal2: {
		url:'/battlesim/fx/greenmetal2.png', // by Pokemon Showdown user Kalalokki
		w: 45, h: 45,
	},
	poisoncaltrop: {
		url:'/battlesim/fx/poisoncaltrop.png', // by Pokemon Showdown user SailorCosmos
		w: 80, h: 80,
	},
	shadowball: {
		url:'/battlesim/fx/shadowball.png',
		w: 100, h: 100,
	},
	energyball: {
		url:'/battlesim/fx/energyball.png',
		w: 100, h: 100,
	},
	electroball: {
		url:'/battlesim/fx/electroball.png',
		w: 100, h: 100,
	},
	mistball: {
		url:'/battlesim/fx/mistball.png',
		w: 100, h: 100,
	},
	iceball: {
		url:'/battlesim/fx/iceball.png',
		w: 100, h: 100,
	},
	flareball: {
		url:'/battlesim/fx/flareball.png',
		w: 100, h: 100,
	},
	moon: {
		url:'/battlesim/fx/moon.png', // by Kalalokki
		w: 100, h: 100,
	},
	pokeball: {
		url:'/battlesim/fx/pokeball.png',
		w: 24, h: 24,
	},
	fist: {
		url:'/battlesim/fx/fist.png', // by Pokemon Showdown user SailorCosmos
		w: 55, h: 49,
	},
	fist1: {
		url:'/battlesim/fx/fist1.png',
		w: 49, h: 55,
	},
	foot: {
		url:'/battlesim/fx/foot.png', // by Pokemon Showdown user SailorCosmos
		w: 50, h: 75,
	},
	topbite: {
		url:'/battlesim/fx/topbite.png',
		w: 108, h: 64,
	},
	bottombite: {
		url:'/battlesim/fx/bottombite.png',
		w: 108, h: 64,
	},
	web: {
		url:'/battlesim/fx/web.png', // by Pokemon Showdown user SailorCosmos
		w: 120, h: 122,
	},
	leftclaw: {
		url:'/battlesim/fx/leftclaw.png',
		w: 44, h: 60,
	},
	rightclaw: {
		url:'/battlesim/fx/rightclaw.png',
		w: 44, h: 60,
	},
	leftslash: {
		url:'/battlesim/fx/leftslash.png', // by Pokemon Showdown user Modeling Clay
		w: 57, h: 56,
	},
	rightslash: {
		url:'/battlesim/fx/rightslash.png', // by Pokemon Showdown user Modeling Clay
		w: 57, h: 56,
	},
	leftchop: {
		url:'/battlesim/fx/leftchop.png', // by Pokemon Showdown user SailorCosmos
		w: 100, h: 130,
	},
	rightchop: {
		url:'/battlesim/fx/rightchop.png', // by Pokemon Showdown user SailorCosmos
		w: 100, h: 130,
	},
	angry: {
		url:'/battlesim/fx/angry.png', // by Pokemon Showdown user SailorCosmos
		w: 30, h: 30,
	},
	heart: {
		url:'/battlesim/fx/heart.png', // by Pokemon Showdown user SailorCosmos
		w: 30, h: 30,
	},
	pointer: {
		url:'/battlesim/fx/pointer.png', // by Pokemon Showdown user SailorCosmos
		w: 100, h: 100,
	},
	sword: {
		url:'/battlesim/fx/sword.png', // by Pokemon Showdown user SailorCosmos
		w: 48, h: 100,
	},
	impact: {
		url:'/battlesim/fx/impact.png', // by Pokemon Showdown user SailorCosmos
		w: 127, h: 119,
	},
	stare: {
		url:'/battlesim/fx/stare.png',
		w: 100, h: 35,
	},
	shine: {
		url:'/battlesim/fx/shine.png', // by Smogon user Jajoken
		w: 127, h: 119,
	},
	feather: {
		url:'/battlesim/fx/feather.png', // Ripped from http://www.clker.com/clipart-black-and-main-50-feather.html
		w: 100, h: 38,
	},
	shell: {
		url:'/battlesim/fx/shell.png', // by Smogon user Jajoken
		w: 100, h: 91.5,
	},
	petal: {
		url:'/battlesim/fx/petal.png', // by Smogon user Jajoken
		w: 60, h: 60,
	},
	gear: {
		url:'/battlesim/fx/gear.png', // by Smogon user Jajoken
		w: 100, h: 100,
	},
	alpha: {
		url:'/battlesim/fx/alpha.png', // Ripped from Pokemon Global Link
		w: 80, h: 80,
	},
	omega: {
		url:'/battlesim/fx/omega.png', // Ripped from Pokemon Global Link
		w: 80, h: 80,
	},
	rainbow: {
		url:'/battlesim/fx/rainbow.png',
		w: 128, h: 128,
	},
	zsymbol: {
		url:'/battlesim/fx/z-symbol.png', // From http://froggybutt.deviantart.com/art/Pokemon-Z-Move-symbol-633125033
		w: 150, h: 100,
	},
	ultra: {
		url:'/battlesim/fx/ultra.png', // by Pokemon Showdown user Modeling Clay
		w: 113, h: 165,
	},
	hitmark: {
		url:'/battlesim/fx/hitmarker.png', // by Pokemon Showdown user Ridaz
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
  
  export interface ScenePos {
      /** - left, + right */
      x?: number;
      /** - down, + up */
      y?: number;
      /** - player, + opponent */
      z?: number;
      scale?: number;
      xscale?: number;
      yscale?: number;
      opacity?: number;
      time?: number;
      display?: string;
  }
  export class BG {
	scene: Scene;
	constructor(scene: Scene) {
	  this.scene = scene;
	}
	showEffect(effect: string, start: ScenePos, end: ScenePos, transition: string, after?: string, additionalCss?: string, callback?: () => void) {
	  this.scene.showEffect(effect, start, end, transition, after, additionalCss, callback);
	}
  
	animate(time: number, opacity: number) {
		return this
	}
  }
  
export class Scene {
    battle: Battle;
    gameElement: HTMLElement;
    acceleration = 1;
    animating = false;
	currentAnimations: any[] = [];
	$bg: any;
    
    constructor(battle: Battle, gameElement: HTMLElement) {
      this.battle = battle
      this.gameElement = gameElement
	  this.$bg = new BG(this);
    }

	

	async playEffect(effect: string, position: PokemonIdent, callback: () => void) {
        const pos = position.split(':')[0];
		const element = this.getPosition(pos);
		if(!element) return;

		const effectData = this.animsTest[effect];
		if (!effectData) return;

		const startY = pos.includes('p1') ? element.y + 40 : element.y - 40;
		const startX = pos.includes('p1') ? element.x -150 : element.x + 150;

		effectData.anim(startX, startY, element, callback);

		Promise.all(this.currentAnimations).then(() => {
			this.currentAnimations = [];
			console.log('All animations completed');
			this.animating = false;
		});
		
	}

	async  playBattleAnim(anim: string, attacker: PokemonIdent, defender: PokemonIdent) {
		this.animating = true;
		
		//const animFunc = BattleMoveAnims['contactattack'] || BattleOtherAnims['contactattack'];
		const animFunc = BattleMoveAnims[anim] || BattleOtherAnims[anim];
		if(anim === 'faint'){
			console.log('faint')
		}
		if (animFunc === undefined) {
			await this.playBattleAnim('contactattack', attacker, defender);
			return;
		}

		const attackerSprite = new PokemonSprite(this, attacker);
		const defenderSprite = new PokemonSprite(this, defender);

		const attackerPos = this.getPosition(attacker);
		const defenderPos = this.getPosition(defender);
		
		animFunc.anim(this, [attackerSprite, defenderSprite]);
		
		// Use Promise.all to wait for all animations to complete
		return await Promise.all(this.currentAnimations).then(() => {
			this.currentAnimations = [];
		
			if(anim === 'faint') {
				console.log('Faint animation completed');
				return;
			}
			return new Promise<void>((resolve) => {
				attackerSprite.anim({
					x: attackerPos.x,
					y: attackerPos.y,
					z: 1,
					opacity: 1,
					scale: 1,
					time: 200,
				}, 'back', () => {
					console.log('Attacker animation completed');
					resolve();
				});
			});
		});



	}

	isAnimating() {
		return this.currentAnimations.length > 0;
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
	
	  getPosition(id: string) {
	  if(id === '') {
		  return {x: 0, y: 0, z:0, width: 0, height: 0};
	  }
  
	  //console.log("LA ID ES "+id)
	  //console.log(this.gameElement)
		const element = this.gameElement.querySelector(`#${id}`);
		
		if (!element) return {x: 0, y: 0, z:0, width: 0, height: 0};
	  
		const rect = element.getBoundingClientRect();
		const parentRect = this.gameElement.getBoundingClientRect();
	  
		const relativeRect = {
		  x: rect.left - parentRect.left + rect.width / 2,
		  y: rect.top - parentRect.top + rect.height / 2,
		  width: rect.width,
		  height: rect.height
		};
  
		if(!relativeRect.x || !relativeRect.y) return {x: 0, y: 0, z:0, width: 0, height: 0}
	  
		return relativeRect;
	  }

    unpause() {
        this.animating = false;
    }

	wait(time: number) {
	  this.animating = true;
	  return new Promise<void>((resolve) => {
		  setTimeout(() => {
			  this.unpause();
			  resolve();
		  }, time);
	  });
	  }

    //
    // TO DO: Implement this function
    //  

    //(`url('https://${Config.routes.client}/fx/bg-space.jpg')`, 1100, 0.8);
    backgroundEffect(url: string, time: number, opacity: number, number2?: number) {
        setTimeout(() => {
			url.includes('#') ? this.gameElement.style.backgroundColor = url : this.gameElement.style.backgroundImage = `url(${url})`;
            this.gameElement.style.transition = `background-image ${time}ms`;
            this.gameElement.style.opacity = `${opacity}`;
        }, 0);

		// Then remove
		setTimeout(() => {
			this.gameElement.style.backgroundImage = '';
			this.gameElement.style.backgroundColor = '';
			this.gameElement.style.opacity = '1';
		}, time);
    }

	async showEffect(effect: string, start: ScenePos, end: ScenePos, transition: string, after?: string, additionalCss?: string, callback?: () => void) {
		const effectData = BattleEffects[effect];
		if (!effectData) return;

	
		const element = document.createElement('img');
		element.src = effectData.url;
		element.style.position = 'absolute';
		element.style.left = `${start.x}px`;
		element.style.top = `${start.y}px`;
		element.style.width = `${effectData.w}px`;
		element.style.height = `${effectData.h}px`;
		element.style.opacity = `${start.opacity || 1}`;
	
		if (additionalCss) {
			element.style.cssText += additionalCss;
		}
	
		this.gameElement.appendChild(element);
	
		// Force reflow/repaint to ensure the initial state is rendered
		element.offsetHeight;
	
		const animationTime = start.time || 500;
	
		element.style.transition = `all ${animationTime}ms`;

		const endX = end.x !== undefined ? end.x : start.x;
		const endY = end.y !== undefined ? end.y : start.y;
		const endOpacity = end.opacity !== undefined ? end.opacity : start.opacity;
		const endScale = end.scale !== undefined ? end.scale : start.scale;
		const endZ = end.z !== undefined ? end.z : start.z;


	
		// Start the animation after a slight delay to ensure the browser has rendered the initial state
		setTimeout(() => {
			element.style.left = `${endX}px`;
			element.style.top = `${endY}px`;
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

  }


export class PokemonSprite {
    scene: Scene;
    position: PokemonIdent;
    element: HTMLImageElement | null;
    startingPosition: ScenePos

	animationQueue: any[] = [];
   
    constructor(scene: Scene, position: PokemonIdent){
        this.scene = scene;
        this.position = position;
        this.element = scene.getPokemonSpriteElement(position);
        this.startingPosition = scene.getPosition(position);

        if(!this.element) return;
    }
	anim(transition: ScenePos, type?: string, callback?: () => void){
		if(this.animationQueue.length > 0) {
			this.animationQueue.push({transition, type, callback});
			return;
		}

		this.animationQueue.push({transition, type, callback});
		this.animOld(transition, type, callback);

	}

	async animOld(transition: ScenePos, type?: string, callback?: () => void) {
		this.scene.animating = true;
	
		const element = document.getElementById(this.position);
		if (!element) return;
		const animationTime = transition.time || 500;
	
		const startingPosition = this.startingPosition;
	
		const x1 = transition.x || startingPosition.x as number;
		const y1 = transition.y || startingPosition.y as number;
		const z1 = transition.z || startingPosition.z as number;

		const opacity = transition.opacity !== undefined ? transition.opacity : 1;
	
		const halfWidth = parseInt(element.style.width) / 2;
		const halfHeight = parseInt(element.style.height) / 2;
	
		element.style.transition = `all ${animationTime}ms`;

		// Apply CSS changes immediately to start the animation
		element.style.left = `${x1 - halfWidth}px`;
		element.style.top = `${y1 - halfHeight}px`;
		element.style.zIndex = `${z1}`;
		element.style.opacity = `${opacity}`;
		element.style.transform = `scale(${transition.scale || 1})`;

		const animId = Math.random().toString(36).substring(7);
	
		// Wait for the animation to complete using the transitionend event
		/*
		await new Promise<void>((resolve) => {
			const onTransitionEnd = () => {
				console.log('TRANSITION ENDED')
				element.removeEventListener('transitionend', onTransitionEnd);
				this.scene.currentAnimations = this.scene.currentAnimations.filter((id) => id !== animId);
				resolve();
			};
			console.log('TRANSITION STARTED')
			element.addEventListener('transitionend', onTransitionEnd);
			this.scene.currentAnimations.push(animId)
		});*/

		// Wait for the animation to complete, instead of event listener, we use setTimeout
		await new Promise<void>((resolve) => {
			setTimeout(() => {
				resolve();
			}, animationTime);
		});
		



		if (callback) callback();
	
		this.startingPosition = this.scene.getPosition(this.position);
		this.animationQueue.shift();
		if (this.animationQueue.length > 0) {
			const next = this.animationQueue[0];
			this.animOld(next.transition, next.type, next.callback);
		} else {
			this.scene.animating = false;
		}
	
	}

    delay(time: number) {
        this.scene.wait(time);
    }

    behind(offset: number) {
        return this.z() - offset;
    }
    x = () => this.scene.getPosition(this.position).x;
    y = () => this.scene.getPosition(this.position).y;
    z = () => 0;


    // TO DO: Implement this function
    
    leftof(amount: number) {
        return this.x() - amount;
    }

    sp = ""

}