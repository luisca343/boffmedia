import { Battle } from "@pkmn/client";
import { PokemonIdent } from "@pkmn/protocol";


const BattleEffects: {[k: string]: any} = {
    pokeball: {
      url: '/smartrotom/test/pokeball.png',
      w: 100, h: 100,
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
  
export class Scene {
    battle: Battle;
    gameElement: HTMLElement;
    acceleration = 1;
    
    constructor(battle: Battle, gameElement: HTMLElement) {
      this.battle = battle
      this.gameElement = gameElement
    }

  getPokemonSpriteElement(id: string) {
      console.log(`Getting element for ${id}`);
      const wrapper = this.gameElement.querySelector(`#${id}`);
      if (!wrapper) return null;
      console.log('wrapper', wrapper);
  
      const element = wrapper.querySelector('img')
      if (!element) return null;

      return element;
  }
  
    getPosition(id: string) {
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
    
      console.log(`Element: ${id} - ${relativeRect.x}, ${relativeRect.y}, ${relativeRect.width}, ${relativeRect.height}`);
      return relativeRect;
    }
  
    playAnimation(animation: string, position: string) {
      const element = this.gameElement.querySelector(`#${position}`);
      if (!element) return null;
  
      console.log(`Playing animation ${animation} on ${position}`);
    }
  
    showEffect(effect:string, start: ScenePos, end: ScenePos, transition: string, after?: string, additionalCss?: string, callback?: () => void){
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
  
      this.gameElement.appendChild(element);
  
      setTimeout(() => {
        end.x = end.x || 0;
        end.y = end.y || 0;
  
        element.style.left = `${end.x - halfWidth}px`;
        element.style.top = `${end.y - halfHeight}px`;
        element.style.zIndex = `${end.z}`;
        element.style.opacity = `${end.opacity || 0}`;
        element.style.transform = `scale(${end.scale || 1})`;
        
      }, 0);
  
      setTimeout(() => {
        element.remove();
        if (callback) callback();
      }, start.time || 0);
  }

    wait(time: number) {
        /*
        return new Promise<void>((resolve) => {
            setTimeout(() => {
                resolve();
            }, time);
        });*/
    }

    playBattleAnim(anim: string, attacker: PokemonIdent, defender: PokemonIdent) {
        const animFunc = BattleOtherAnims[anim];
        if (!animFunc) return;

        
        animFunc.anim(this, [new PokemonSprite(this, attacker), new PokemonSprite(this, defender)]);
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

        console.log(`Width: ${element.style.width}, Height: ${element.style.height}`);
      
        
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

        if(type === 'ballistic'){
            element.style.transitionTimingFunction = 'cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        } else if(type === 'ballistic2'){
            element.style.transitionTimingFunction = 'cubic-bezier(0.6, -0.28, 0.735, 0.045)';
        } else if(type === 'ballistic2Back'){
            element.style.transitionTimingFunction = 'cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        } else if(type === 'swing'){
            element.style.transitionTimingFunction = 'cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        }

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
}


export const BattleOtherAnims: {[k: string]: {anim: (scene: Scene, args: PokemonSprite[]) => void}} = {
	hitmark: {
		anim(scene, [attacker]) {
		  scene.showEffect('hitmark', {
		    x: attacker.x(),
		    y: attacker.y(),
		    z: attacker.z(),
		    scale: 0.5,
		    opacity: 1,
		  }, {
		    opacity: 0.5,
		    time: 250,
		  }, 'linear', 'fade');
		},
	},
	attack: {
		anim(scene, [attacker, defender]) {
		  scene.showEffect('wisp', {
		    x: attacker.x(),
		    y: attacker.y(),
		    z: attacker.z(),
		    scale: 0.1,
		    opacity: 1,
		  }, {
		    x: defender.x(),
		    y: defender.y(),
		    z: defender.behind(40),
		    scale: 1,
		    opacity: 0.5,
		  }, 'linear');
		},
	},
	contactattack: {
		anim (scene, [attacker, defender])  {
			attacker.anim({
				x: defender.x(),
				y: defender.y() + 80,
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
			defender.delay(450);
			defender.anim({
				z: defender.behind(20),
				time: 100,
			}, 'swing');
			defender.anim({
				time: 300,
			}, 'swing');
			scene.wait(500);
		},
	}
};