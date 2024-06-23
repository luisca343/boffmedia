import { Battle } from "@pkmn/client";
import { PokemonIdent } from "@pkmn/protocol";
import { BattleMoveAnims, BattleOtherAnims } from "./battle-animations.moves";


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
  
    playAnimation(animation: string, position: string) {
      const element = this.gameElement.querySelector(`#${position}`);
      if (!element) return null;
  
    }
  
    async showEffect(effect:string, start: ScenePos, end: ScenePos, transition: string, after?: string, additionalCss?: string, callback?: () => void){
		
        let startTime = start.time || 0;
        let endTime = end.time || startTime + 500;
    
        const effectData = BattleEffects[effect];
        if (!effectData) return;
    
        start.x = start.x || 0;
        start.y = start.y || 0;
    
        const element = document.createElement('img');
        element.src = effectData.url;
        element.style.position = 'absolute';
        element.style.width = `50px`;
        element.style.height = `50px`;
        const halfWidth = parseInt(element.style.width) / 2;
        const halfHeight = parseInt(element.style.height) / 2;
        element.style.left = `${start.x - halfWidth}px`;
        element.style.top = `${start.y - halfHeight}px`;
        element.style.zIndex = `${start.z}`;
        element.style.opacity = `${start.opacity || 1}`;
        element.style.transition = `all ${start.time || 0}ms`;
        element.style.display = start.display || 'block';
        element.style.transform = `scale(${start.scale || 1})`;
		
    
        if (additionalCss) {
            element.style.cssText += additionalCss;
        }
    
    
        // Wait for start.time before starting the animation
        const prom = new Promise<void>(resolve => {
			setTimeout(() => {
				resolve();
			}, endTime);
		}).then(() => {
			element.remove();
			this.currentAnimations = this.currentAnimations.filter(p => p !== prom);
			if (callback) callback();
		});
		this.currentAnimations.push(prom);

        // Start the animation
			this.gameElement.appendChild(element);
		setTimeout(() => {
			// Start the animation
			end.x = end.x || 0;
			end.y = end.y || 0;
	
			element.style.left = `${end.x - halfWidth}px`;
			element.style.top = `${end.y - halfHeight}px`;
			element.style.zIndex = `${end.z}`;
			element.style.opacity = `${end.opacity || 0}`;
			element.style.transform = `scale(${end.scale || 1})`;
		}, startTime || 0);
    
        if (additionalCss) {
            element.style.cssText += additionalCss;
        }
    

		if (after === 'explode') {
			if (end.scale) end.scale *= 3;
			if (end.xscale) end.xscale *= 3;
			if (end.yscale) end.yscale *= 3;
			end.opacity = 0;

            element.style.transform = `scale(${end.scale || 1})`;
            element.style.transform = `scaleX(${end.xscale || 1})`;
            element.style.transform = `scaleY(${end.yscale || 1})`;
            element.style.opacity = `${end.opacity || 0}`;
            element.style.transition = `all ${endTime || 0}ms`;
            
            
			
		}
        
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

animsTest: {[k: string]: { anim: (startX: any, startY: any, element: any, callback: (() => void) | undefined) => void }} = {
	pokeball:{
		anim: (startX: any, startY: any, element:any,callback: (() => void) | undefined) => {
			this.showEffect('pokeball', {
				opacity: 1,
				x: startX,
				y: startY,
				scale: .7,
				time: 300 / this.acceleration,
			  }, {
				opacity: 0,
				x: element.x,
				y: element.y,
				time: 700 / this.acceleration,
			  }, 'ballistic2', '', '', callback); 
		}
	} 
}


	async playEffect(effect: string, position: PokemonIdent, callback: () => void) {
		console.log('playEffect', effect, position);
        const pos = position.split(':')[0];
		const element = this.getPosition(pos);
		if(!element) return;
		console.log('element', element);

		const effectData = this.animsTest[effect];
		if (!effectData) return;
		console.log('effectData', effectData);

		const startY = pos.includes('p1') ? element.y + 40 : element.y - 40;
		const startX = pos.includes('p1') ? element.x -150 : element.x + 150;

		console.log('startX', startX, 'startY', startY);
		console.log('element', element);

		effectData.anim(startX, startY, element, callback);

		Promise.all(this.currentAnimations).then(() => {
			this.currentAnimations = [];
			console.log('All animations completed');
			this.animating = false;
		});
		
	}

	async  playBattleAnim(anim: string, attacker: PokemonIdent, defender: PokemonIdent) {
		if(this.animating) {
			return;
		}

		this.animating = true;
		
		console.log('playBattleAnim', anim, attacker, defender);
		const animFunc = BattleMoveAnims[anim] || BattleOtherAnims[anim];
		if (!animFunc) await this.playBattleAnim('contactattack', attacker, defender);
		
		animFunc.anim(this, [new PokemonSprite(this, attacker), new PokemonSprite(this, defender)]);
		
		// Use Promise.all to wait for all animations to complete
		Promise.all(this.currentAnimations).then(() => {
			this.currentAnimations = [];
			console.log('All animations completed');
			this.animating = false;
		});

	}

    unpause() {
        this.animating = false;
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

        setTimeout(() => {
            url.includes('#') ? this.gameElement.style.backgroundColor = url : this.gameElement.style.backgroundImage = `url(${url})`;
            this.gameElement.style.transition = `background-image ${time}ms`;
            this.gameElement.style.opacity = `1`;
        }, time);
    }


  }


export class PokemonSprite {
    scene: Scene;
    position: PokemonIdent;
    element: HTMLImageElement | null;
    startingPosition: ScenePos
   
    constructor(scene: Scene, position: PokemonIdent){
        this.scene = scene;
        this.position = position;
        this.element = scene.getPokemonSpriteElement(position);
        this.startingPosition = scene.getPosition(position);

        if(!this.element) return;
    }


    anim(transition: ScenePos, type?: string) {
        const element = document.getElementById(this.position);

        if(!element) return;
    
        let tX = transition.x || this.startingPosition.x || 0;
        let tY = transition.y || this.startingPosition.y || 0;
        let tZ = transition.z || 0;
        let tScale = transition.scale || 1;
        let tTime = transition.time || 0;
        let tDisplay = transition.display || 'block';
        let tOpacity = transition.opacity || 1;

      
        const prom = new Promise(resolve => setTimeout(resolve, tTime + 100));
		this.scene.currentAnimations.push(prom);

        
      element.style.position = 'absolute';
      const halfWidth = parseInt(element.style.width) / 2;
      const halfHeight = parseInt(element.style.height) / 2;
      element.style.left = `${tX - halfWidth}px`;
      element.style.top = `${tY - halfHeight}px`;
      element.style.zIndex = `${tZ}`;
        element.style.opacity = `${tOpacity}`;
        element.style.transition = `all ${tTime}ms`;
        element.style.display = tDisplay;
        element.style.transform = `scale(${tScale})`;

		

        setTimeout(() => {
            element.style.left = `${tX - halfWidth}px`;
            element.style.top = `${tY - halfHeight}px`;
            element.style.zIndex = `${tZ}`;
            element.style.opacity = `${tOpacity}`;
            element.style.transform = `scale(${tScale})`;

        }, 0);
        

        setTimeout(() => {
            element.style.display = tDisplay;
            element.style.transition = `all ${tTime}ms`;
            element.style.zIndex = `${tZ}`;
            element.style.opacity = `${tOpacity}`;
            element.style.transform = `scale(${tScale})`;
            element.style.left = `${tX - halfWidth}px`;
            element.style.top = `${tY - halfHeight}px`;
            

        }, tTime);
        
        
    

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