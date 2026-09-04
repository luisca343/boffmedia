import { PokemonIdent } from "@pkmn/protocol";
import { getOffset, getScaleMultiplier } from "./viewUtils";
import { AnimationData, ScenePos } from "./types";
import { Scene, SceneToken } from "./Scene";

/** PS transition names → the CSS easing that reads closest to them. */
export const TRANSITION_EASING: Record<string, string> = {
  linear: 'linear',
  accel: 'cubic-bezier(0.55, 0, 1, 0.45)',
  decel: 'cubic-bezier(0, 0.55, 0.45, 1)',
  swing: 'ease-in-out',
  ballistic: 'cubic-bezier(0.3, 0, 0.1, 1)',
  ballisticUnder: 'cubic-bezier(0.6, 0, 0.9, 0.4)',
  ballistic2: 'cubic-bezier(0.6, 0, 0.9, 0.4)',
  ballistic2Back: 'cubic-bezier(0.1, 0.9, 0.4, 1)',
  ballistic2Under: 'cubic-bezier(0.1, 0.9, 0.4, 1)',
  ghost: 'ease-out',
};

export function easingFor(transition?: string): string {
  return (transition && TRANSITION_EASING[transition]) || 'linear';
}

export interface PokemonSpriteOptions {
  /**
   * Snap the element back to its slot and clear transform/opacity first.
   *
   * True for move animations, which are authored from a known origin. FALSE
   * for the summon, whose whole point is to start at scale 0.1 / opacity 0 —
   * the constructor's unconditional reset is what made the incoming Pokemon
   * pop in at full size before growing.
   */
  reset?: boolean;
}

/**
 * A transient handle on one slot's element for the duration of one animation.
 *
 * It captures the scene generation and the slot generation at construction: if
 * the Pokemon it addresses is recalled, faints, transforms, or the whole scene
 * is torn down, every remaining queued transition and every pending `.then`
 * becomes a no-op instead of writing styles onto whatever took its place.
 */
export class PokemonSprite {
  scene: Scene;
  position: PokemonIdent;
  element: HTMLElement | null;
  readonly token: SceneToken;

  startingOffsetLeft: number = 0;
  startingOffsetTop: number = 0;

  animationQueue: AnimationData[] = [];
  animCounter: number = 0;

  sp: any;
  isMissedPokemon: boolean = false;

  constructor(scene: Scene, position: PokemonIdent, options: PokemonSpriteOptions = {}) {
    this.scene = scene;
    this.position = (String(position).split(':')[0]) as PokemonIdent;
    this.token = scene.token(this.position);

    const element = scene.getPokemonElement(this.position);
    this.element = element;

    this.startingOffsetLeft = this.x();
    this.startingOffsetTop = this.y();

    if (!element) return;
    if (options.reset === false) return;

    element.style.left = `${this.startingOffsetLeft}px`;
    element.style.top = `${this.startingOffsetTop}px`;
    element.style.right = 'auto';
    element.style.bottom = 'auto';
    element.style.position = 'absolute';
    element.style.transition = 'none';
    element.style.opacity = '1';
    element.style.transform = 'none';
  }

  /** This sprite's Pokemon is gone, or the scene is. */
  get stale(): boolean {
    return this.scene.isStale(this.token);
  }

  /**
   * A queued pause. It used to call `scene.wait` and throw the promise away,
   * which made all 274 uses of it no-ops — every "wait for the attacker to
   * arrive before flinching" beat in the move table fired immediately.
   */
  delay(time: number): this {
    return this.anim({ time }, 'linear');
  }

  playNextAnim(): void {
    if (this.animationQueue.length === 0) return;
    const animData = this.animationQueue[0];
    const { transition, type, callback } = animData;
    this.performAnimation(transition, type, callback, animData);
  }

  anim(transition: ScenePos, type?: string, callback?: () => void): this {
    if (this.stale) return this;
    this.animCounter++;

    const animation: AnimationData = {
      animType: 'sprite',
      transition,
      type,
      callback,
    };

    this.animationQueue.push(animation);

    // Start animation if it's the only one in queue
    if (this.animCounter === 1) {
      this.playNextAnim();
    }

    return this;
  }

  performAnimation(transition: ScenePos, type?: string, callback?: () => void, animData?: AnimationData): void {
    if (this.stale) return;
    const authored = transition.time === undefined ? 500 : transition.time;
    const animationTime = this.scene.animTime(authored);

    const prom = this.scene.wait(animationTime);
    this.scene.track(prom);

    const element = this.scene.getPokemonElement(this.position);
    if (element) {
      element.style.transition = `all ${animationTime}ms ${easingFor(type)}`;
      element.style.position = 'absolute';

      if (transition.x !== undefined) element.style.left = `${transition.x}px`;
      if (transition.y !== undefined) element.style.top = `${transition.y}px`;
      if (transition.opacity !== undefined) element.style.opacity = `${transition.opacity}`;
      // Only written when asked for: a bare `{ time }` step is a PAUSE, and
      // resetting the transform on it undid the scale the previous step set.
      if (transition.scale !== undefined) element.style.transform = `scale(${transition.scale})`;
      if (transition.z !== undefined) element.style.zIndex = `${transition.z}`;

      // Force reflow to ensure transition applies
      void element.offsetHeight;
    }

    prom.then(() => {
      if (this.stale) return;
      if (callback) callback();

      const idx = animData ? this.animationQueue.indexOf(animData) : 0;
      if (idx >= 0) this.animationQueue.splice(idx, 1);
      this.animCounter--;

      if (this.animationQueue.length > 0) {
        this.playNextAnim();
      } else {
        this.animCounter = 0;
      }
    });
  }

  /** Back to the slot's authored box. No-op once this sprite is stale. */
  resetPosition(): void {
    this.animationQueue = [];
    this.animCounter = 0;
    if (this.stale) return;
    const element = this.scene.getPokemonElement(this.position);
    if (!element) return;
    const offset = getOffset(this.scene.battle, this.position, getScaleMultiplier());
    if (!offset) return;
    element.style.transition = 'none';
    element.style.top = `${offset.top}px`;
    element.style.left = `${offset.left}px`;
    element.style.transform = 'none';
    element.style.opacity = '1';
  }

  async clearElement(): Promise<void> {
    if (this.stale || !this.element) return;
    this.element.style.transition = 'none';
    this.element.style.transform = 'none';
    this.element.style.opacity = '1';
  }

  x(): number {
    return getOffset(this.scene.battle, this.position, getScaleMultiplier())?.left ?? this.startingOffsetLeft;
  }

  y(): number {
    return getOffset(this.scene.battle, this.position, getScaleMultiplier())?.top ?? this.startingOffsetTop;
  }

  z(): number {
    return this.element?.style.zIndex ? parseInt(this.element.style.zIndex) : 1;
  }

  behind(amount: number): number {
    return this.z() - amount > 0 ? this.z() - amount : 0;
  }

  leftof(offset: number): number {
    return this.x() - offset;
  }
}
