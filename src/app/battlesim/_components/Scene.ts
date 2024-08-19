import { Battle } from "@pkmn/client";
import { PokemonHPStatus, PokemonIdent } from "@pkmn/protocol";
import { BattleMoveAnims, BattleOtherAnims } from "../_utils/battle-animations-moves";
import { BattleEffects } from "../_utils/battle_animations";
import { SCALE_WIDTH, getImageSize, getOffset, getScaleMultiplier, TARGET_WIDTH} from "../_utils/viewUtils";
import { Position } from "../_utils/battleActions";

export class BG {
	animate(test:any) {
		return this;
	}
}

export class Scene {
	battle: Battle;
	gameElement: HTMLElement;
	currentAnimations: any[] = [];
	acceleration: number = 1;
	$bg = new BG();
	
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

		const left = getOffset(this.battle, position, getScaleMultiplier()).left + getImageSize() / 2 - popupWidth / 2;
		const top = getOffset(this.battle, position, getScaleMultiplier()).top + getImageSize() / 2;

		element.style.position = 'absolute';
		element.style.width = `${popupWidth}px`;
		element.style.left = `${left}px`;
		element.style.top = `${top}px`;
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
			element.style.top = `${top - getImageSize() * getScaleMultiplier() / 2}px`;
			element.style.visibility = 'hidden';
		}, 0);
		
		setTimeout(() => {
			element.remove();
		}, duration);
	}
	
	
	async playBattleAnim(anim: string, attacker: PokemonIdent, defender: PokemonIdent, callback?: () => void) {
		console.log('playBattleAnim', anim, attacker, defender);
		const animFunc = BattleMoveAnims[anim] || BattleOtherAnims[anim];
		//const animFunc = BattleMoveAnims[anim] || BattleOtherAnims[anim];
		if (animFunc === undefined) {
			await this.playBattleAnim('contactattack', attacker, defender);
			return;
		}
		
		const startingPosition = attacker.includes('p1') ? {top: 275, left: 180}  : {top: 90, left: 630};

		const attackerSprite = new PokemonSprite(this, attacker);
		const defenderSprite = new PokemonSprite(this, defender);

		 animFunc.anim(this, [attackerSprite, defenderSprite], {startingPosition});
		
		
		return await Promise.all(this.currentAnimations).then(() => {
			this.currentAnimations = [];
			
			const attackElemnt = document.getElementById(attackerSprite.position);
			const defendElement = document.getElementById(defenderSprite.position);
			
			
			if(attackElemnt) {
				attackElemnt.style.top = getOffset(this.battle,attackerSprite.position, getScaleMultiplier()).top + 'px';
				attackElemnt.style.left = getOffset(this.battle,attackerSprite.position, getScaleMultiplier()).left + 'px';
				attackerSprite.animationQueue = [];
			}
			
			if(defendElement) {
				defendElement.style.top = getOffset(this.battle,defenderSprite.position, getScaleMultiplier()).top + 'px';
				defendElement.style.left = getOffset(this.battle,defenderSprite.position, getScaleMultiplier()).left + 'px';
				defenderSprite.animationQueue = [];
			}
		});
		
	}
	
	async clearPokemonElement(id: PokemonIdent) {
		const sprite = new PokemonSprite(this, id);
		
		return await sprite.clearElement();
	}
	
	async playEffect(effect: string, position: PokemonIdent,  callback?: () => void) {
		const pos = position.split(':')[0];
		const element = getOffset(this.battle, pos, getScaleMultiplier());
		if(!element) return;
		
		const startingPosition = position.includes('p1') ? {top: 275, left: 180}  : {top: 90, left: 630};

		//const effectData = this.animsTest[effect];
		const effectData = BattleMoveAnims[effect] || BattleOtherAnims[effect];
		if (!effectData) return;

		
		const startY = pos.includes('p1') ? element.top + 40 : element.top;
		const startX = pos.includes('p1') ? element.left -200 : element.left + 200;

		const attackerSprite = new PokemonSprite(this, pos);

		
		effectData.anim(attackerSprite.scene, [attackerSprite, attackerSprite], {startingPosition});
		
		return await Promise.all(this.currentAnimations).then(() => {
			this.currentAnimations = [];
		});
	}
	
	async showEffect(effect: string, start: ScenePos, end: ScenePos, transition: string, after?: string, additionalCss?: string, callback?: () => void) {
		const effectData = BattleEffects[effect];
		if (!effectData) return;
		const startTime = start.time || 0;
		const endTime = end.time || 500;
		const animationTime = endTime - startTime;

		const prom = new Promise<void>(resolve => setTimeout(() => {
			resolve();
		}, animationTime + 300));
		
		this.currentAnimations.push(prom);
		
		let halfWidth = getImageSize() / 2 //- effectData.w / 2;
		let halfHeight = getImageSize() / 2 //- effectData.h / 2;
		
		if(effect === 'pokeball'){
			halfWidth = 0
			halfHeight = 0
		}
		
		const startX = start.x || 0;
		const startY = start.y || 0;
		
		const left = (startX  + halfWidth);
		const top = (startY  + halfHeight);

		
		const element = document.createElement('img');
		element.src = effectData.url;
		element.style.position = 'absolute';
		element.style.left = `${left}px`;
		element.style.top = `${top}px`;
		element.style.width = `${effectData.w}px`;
		element.style.height = `${effectData.h}px`;
		element.style.opacity = `${start.opacity || 1}`;

		if(effect === 'pokeball'){
			halfWidth = getImageSize() / 2
			halfHeight = getImageSize()
		}
		if (additionalCss) {
			element.style.cssText += additionalCss;
		}
		
		this.gameElement.appendChild(element);
		
		
		// Wait the start time before starting the animation

		await this.wait(startTime);
		
		element.style.transition = `all ${animationTime}ms`;
		
		const endX = end.x !== undefined ? end.x : start.x  || 0
		const endY = end.y !== undefined ? end.y : start.y  || 0
		const endOpacity = end.opacity !== undefined ? end.opacity : start.opacity;
		const endScale = end.scale !== undefined ? end.scale : start.scale;
		const endZ = end.z !== undefined ? end.z : start.z;
		

		if(effect === 'pokeball'){
			halfWidth = 0
			halfHeight = 0
		}

		// Start the animation after a slight delay to ensure the browser has rendered the initial state
		setTimeout(() => {
			element.style.left = `${endX + halfWidth}px`;
			element.style.top = `${endY + halfHeight}px`;
			element.style.opacity = `${endOpacity}`;
			element.style.transform = `scale(${endScale})`;
			element.style.zIndex = `${endZ}`;
		}, 10); // A slight delay
		
		
		prom.then(() => {
			element.remove();
			if (callback) callback();
			this.currentAnimations.shift();
		});
	}
	
	getPokemonElement(id: string) {
		if(id === '') {
			return null;
		}
		const element = this.gameElement.querySelector(`#${id}`);
		return element;
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
	element: HTMLElement
	
	startingOffsetLeft: number = 0;
	startingOffsetTop: number = 0;
	
	animationQueue: any[] = [];
	animCounter: number = 0;
	
	leftof(offset: number) {
		return this.x() - offset;
	}
	
	
	constructor(scene: Scene, position: PokemonIdent){
		this.scene = scene;
		this.position = position;
	
		const element = scene.getPokemonElement(position) as HTMLElement;
		if (!element) {
			throw new Error(`Element not found for position: ${position}`);
		}
		
		this.startingOffsetLeft = this.x();
		this.startingOffsetTop = this.y();
		
		if (element) {
			element.style.left = `${getOffset(this.scene.battle, position, getScaleMultiplier()).left}px`;
			element.style.top = `${getOffset(this.scene.battle, position, getScaleMultiplier()).top}px`;
			element.style.right = 'auto';
			element.style.bottom = 'auto';
	
			element.style.position = 'absolute';
			element.style.transition = 'none';
			element.style.opacity = '1';
			element.style.transform = 'none';
	
		}
	
		this.element = element as HTMLElement;
		console.log('ELEMENT', this.element);
		
		if (!this.element) return;
	}
	
	delay(time: number) {
		this.scene.wait(time);
		return this;
	}
	
	playNextAnim() {
		if(this.animationQueue.length === 0 ) {}
		const {animType, transition, type, callback} = this.animationQueue.shift();
		this.performAnimation(transition, type, callback);
	}
	
	anim(transition: ScenePos, type?: string, callback?: () => void) {
		this.animCounter++;
		if (this.animationQueue.length > 0 || this.animCounter > 1) {
			this.animationQueue.push({ animType: 'sprite', transition, type, callback });
			return;
		} else {
			this.animationQueue.push({ animType: 'sprite', transition, type, callback });
			this.playNextAnim();
		}
	}

	performAnimation(transition: ScenePos, type?: string, callback?: () => void) {
		const animationTime = transition.time === undefined ? 500 : transition.time;
		const prom = new Promise<void>(resolve => setTimeout(() => {
			resolve();
		}, animationTime));
		this.scene.currentAnimations.push(prom);
	
		const element = this.scene.gameElement.querySelector(`#${this.position}`) as HTMLElement;
		if (!element) {
			console.log('Element not found');
			return;
		}

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

		element.offsetHeight;

		console.log("POST", this.position, element.style.left, element.style.top);
	
		prom.then(() => {
			//this.clearElement(element);
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

	async clearElement() {
		this.element.style.transition = 'none';
		this.element.style.transform = 'none';
		this.element.style.opacity = '1';
		this.element.style.borderColor = 'white';
		this.element.style.zIndex = '1';

		


	}




	/*
	async anim2(transition: ScenePos, type?: string, callback?: () => void) {
		const currentTime = new Date().getTime();
		const animationTime = transition.time === undefined ? 500 : transition.time;
		const prom = new Promise<void>(resolve => setTimeout(() => {
			resolve();
		}, animationTime ));
		this.scene.currentAnimations.push(prom);
	
		
		const element = document.getElementById(this.position);
		if (!element) return;

	
		element.style.transition = `all ${animationTime}ms`;

		element.style.position = 'absolute';

		const opacity = transition.opacity !== undefined ? transition.opacity : 1;
		const scale = transition.scale || 1;
		

		if(transition.x) {
			element.style.left = `${transition.x}px`;
		}

		if(transition.y) {
			element.style.top = `${transition.y}px`;
		}

		if(transition.z) {
			element.style.zIndex = `${transition.z}`;
		}
	
		element.style.opacity = `${opacity}`;
		element.style.transform = `scale('${scale}')`;
		element.style.borderColor = 'red';

		// Apply transition property
	
		// Force reflow to ensure the transition is applied
		element.offsetHeight;
	
		// Wait for the animation to complete before executing the callback
	
		prom.then(() => {
			element.style.transition = 'none';
			element.style.transform = 'none';
			element.style.opacity = '1';
			element.style.borderColor = 'white';
			if (callback) {
				callback();
			}
			this.animationQueue.shift();
			this.scene.currentAnimations.shift();
			this.animCounter--;
			if (this.animationQueue.length > 0) {
				const next = this.animationQueue[0];
				this.anim2(next.transition, next.type, next.callback);
			} else {
				this.animCounter = 0;
			}
		});
	}*/
	
	x() {
		return getOffset(this.scene.battle,this.position, getScaleMultiplier()).left;
	}
	
	y() {
		return getOffset(this.scene.battle,this.position, getScaleMultiplier()).top;
	}
	
	z():number {
		return this.element?.style.zIndex ? parseInt(this.element.style.zIndex) : 1;
	}
	
	behind(amount: number) {
		return this.z() - amount > 0 ? this.z() - amount : 0;
	}
	
	
	
}