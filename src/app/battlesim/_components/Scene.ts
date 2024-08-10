import { Battle } from "@pkmn/client";
import { PokemonHPStatus, PokemonIdent } from "@pkmn/protocol";
import { BattleMoveAnims, BattleOtherAnims } from "../_utils/battle-animations-moves";
import { BattleEffects } from "../_utils/battle_animations";
import { getImageSize, getOffset, getViewportWidth } from "../_utils/viewUtils";


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
	
	async showPopup(position: PokemonIdent, text: string, duration: number = 1000) {
		const element = document.createElement('div');
		
		const popupWidth = 50;
		
		element.style.position = 'absolute';
		element.style.width = `${popupWidth}px`;
		element.style.left = `${getOffset(position).left + getImageSize() / 2 - popupWidth / 2}px`;
		element.style.top = `${getOffset(position).top + getImageSize() / 2}px`;
		element.style.textAlign = 'center';
		element.style.borderRadius = '5px';
		element.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
		if(text.includes('+')) {
			element.style.color = 'green';
		} else {
			element.style.color = 'red';
		}
		element.style.zIndex = '100';
		element.textContent = text;
		this.gameElement.appendChild(element);
		
		element.style.transition = `all ${duration}ms`;
		setTimeout(() => {
			element.style.top = `${getOffset(position).top}px`;
			element.style.visibility = 'hidden';
		}, 0);
		
		setTimeout(() => {
			element.remove();
		}, duration);
	}
	
	async playEffect(effect: string, position: PokemonIdent, callback: () => void) {
		const pos = position.split(':')[0];
		const element = getOffset(position);
		if(!element) return;
		
		const effectData = this.animsTest[effect];
		if (!effectData) return;
		
		const startY = pos.includes('p1') ? element.top + 40 : element.top;
		const startX = pos.includes('p1') ? element.left -200 : element.left + 200;
		
		effectData.anim(startX, startY , element, callback);
		
		Promise.all(this.currentAnimations).then(() => {
			this.currentAnimations = [];
			//this.animating = false;
		});
	}
	
	async showEffect(effect: string, start: ScenePos, end: ScenePos, transition: string, after?: string, additionalCss?: string, callback?: () => void) {
		const effectData = BattleEffects[effect];
		if (!effectData) return;
		
		let halfWidth = getImageSize() / 2 - effectData.w / 2;
		let halfHeight = getImageSize() / 2 - effectData.h / 2;
		
		if(effect === 'pokeball'){
			halfWidth = 0
			halfHeight = 0
		}
		
		const startX = start.x || 0;
		const startY = start.y || 0;
		
		
		const element = document.createElement('img');
		element.src = effectData.url;
		element.style.position = 'absolute';
		element.style.left = `${startX  + halfWidth}px`;
		element.style.top = `${startY  + halfHeight}px`;
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
			element.style.top = `${endY + halfHeight}px`;
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
		}, switch:{
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
		},
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
				attackElemnt.style.top = getOffset(attackerSprite.position).top + 'px';
				attackElemnt.style.left = getOffset(attackerSprite.position).left + 'px';
				attackerSprite.animationQueue = [];
			}
			
			if(defendElement) {
				defendElement.style.top = getOffset(defenderSprite.position).top + 'px';
				defendElement.style.left = getOffset(defenderSprite.position).left + 'px';
				defenderSprite.animationQueue = [];
			}
			

			return /*new Promise<void>((resolve) => {
				setTimeout(() => {
					resolve();
				}, 500);
			});*/
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
			this.element.style.left = `${getOffset(position).left}px`;
			this.element.style.top = `${getOffset(position).top}px`;
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
		return getOffset(this.position).left;
	}
	
	y() {
		return getOffset(this.position).top;
	}
	
	z():number {
		return this.element?.style.zIndex ? parseInt(this.element.style.zIndex) : 1;
	}
	
	behind(amount: number) {
		return this.z() - amount > 0 ? this.z() - amount : 0;
	}
	
	
	
}