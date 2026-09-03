import { PokemonIdent } from "@pkmn/protocol";
import { BattleEffects } from "./battle_animations";
// M1: Animation table is dynamically imported on first use (39k lines)
// import { BattleMoveAnims, BattleOtherAnims } from "./battle-animations-moves";
import { getImageSize, getOffset, getScaleMultiplier } from "./viewUtils";
import { ScenePos } from "./types";
import { Scene } from "./Scene";
import { PokemonSprite } from "./PokemonSprite";

export type PopupTone = "dmg" | "heal" | "crit" | "status" | "boostUp" | "boostDown" | "info" | "muted";

export interface PopupOptions {
  tone?: PopupTone;
  /** Relative text size — 1.2 for a crit, 0.85 for "resisted". */
  scale?: number;
}

const TONE_COLOR: Record<PopupTone, string> = {
  dmg: "var(--bad)",
  heal: "var(--ok)",
  crit: "var(--warn)",
  status: "var(--warn)",
  boostUp: "var(--ok)",
  boostDown: "var(--bad)",
  info: "var(--text)",
  muted: "var(--muted)",
};

const reducedMotion = () =>
  typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Handles visual effects in the battle scene
 */
export class SceneEffects {
  private scene: Scene;

  constructor(scene: Scene) {
    this.scene = scene;
  }

  /**
   * Shows a text popup over a Pokémon. Tokens only — the popup lives on the
   * field in both hosts and both themes.
   */
  async showPopup(position: PokemonIdent, text: string, duration: number = 1000, opts: PopupOptions = {}): Promise<void> {
    const element = document.createElement('div');
    const scale = getScaleMultiplier();

    const offset = getOffset(this.scene.battle, position, scale);
    const imageSize = getImageSize(scale);

    const left = offset.left + imageSize / 2;
    const top = offset.top + imageSize / 2;

    const tone: PopupTone = opts.tone ?? (text.startsWith('+') ? 'heal' : 'dmg');
    const size = 12 * Math.max(0.8, Math.min(1.6, scale)) * (opts.scale ?? 1);

    element.setAttribute('aria-hidden', 'true');
    element.style.position = 'absolute';
    element.style.left = `${left}px`;
    element.style.top = `${top}px`;
    element.style.transform = 'translateX(-50%)';
    element.style.whiteSpace = 'nowrap';
    element.style.padding = '3px 7px';
    element.style.border = '1px solid var(--line-2)';
    element.style.background = 'color-mix(in srgb, var(--panel) 92%, transparent)';
    element.style.color = TONE_COLOR[tone];
    element.style.fontFamily = '"IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, monospace';
    element.style.fontWeight = '700';
    element.style.fontSize = `${size}px`;
    element.style.lineHeight = '1';
    element.style.letterSpacing = '0.04em';
    element.style.pointerEvents = 'none';
    element.style.zIndex = '100';
    element.textContent = text;
    this.scene.gameElement.appendChild(element);

    const motion = !reducedMotion();
    if (motion) element.style.transition = `top ${duration}ms ease-out, opacity ${duration}ms ease-in`;

    // Animate the popup
    setTimeout(() => {
      if (motion) element.style.top = `${top - imageSize / 2}px`;
      element.style.opacity = '0';
    }, motion ? 0 : Math.max(0, duration - 120));

    // Remove after animation completes
    return new Promise(resolve => {
      setTimeout(() => {
        element.remove();
        resolve();
      }, duration);
    });
  }

  /** A short horizontal shake on a Pokémon's element (crit, flinch). */
  async shake(position: PokemonIdent, duration: number = 360): Promise<void> {
    if (reducedMotion()) return;
    const code = position.split(':')[0];
    const el = this.scene.getPokemonElement(code);
    if (!el || typeof el.animate !== 'function') return;
    const amp = Math.max(3, 6 * getScaleMultiplier());
    const anim = el.animate(
      [
        { transform: 'translateX(0)' },
        { transform: `translateX(-${amp}px)` },
        { transform: `translateX(${amp}px)` },
        { transform: `translateX(-${amp / 2}px)` },
        { transform: 'translateX(0)' },
      ],
      { duration, iterations: 1, easing: 'ease-out' },
    );
    return new Promise((resolve) => { anim.onfinish = () => resolve(); anim.oncancel = () => resolve(); });
  }

  /** A centred field banner (weather, terrain, screens). */
  async showBanner(text: string, duration: number = 1200): Promise<void> {
    const element = document.createElement('div');
    const scale = getScaleMultiplier();
    element.setAttribute('aria-hidden', 'true');
    element.style.position = 'absolute';
    element.style.left = '50%';
    element.style.top = '38%';
    element.style.transform = 'translate(-50%, -50%)';
    element.style.padding = '6px 14px';
    element.style.border = '1px solid var(--accent-line)';
    element.style.background = 'color-mix(in srgb, var(--panel) 90%, transparent)';
    element.style.color = 'var(--text)';
    element.style.fontFamily = '"Saira Condensed", "Saira", system-ui, sans-serif';
    element.style.fontWeight = '800';
    element.style.fontStyle = 'italic';
    element.style.textTransform = 'uppercase';
    element.style.letterSpacing = '0.06em';
    element.style.fontSize = `${18 * Math.max(0.8, Math.min(1.6, scale))}px`;
    element.style.lineHeight = '1';
    element.style.whiteSpace = 'nowrap';
    element.style.pointerEvents = 'none';
    element.style.zIndex = '110';
    element.style.opacity = '0';
    element.textContent = text;
    this.scene.gameElement.appendChild(element);
    const motion = !reducedMotion();
    if (motion) element.style.transition = 'opacity 180ms ease';
    setTimeout(() => { element.style.opacity = '1'; }, 0);
    setTimeout(() => { element.style.opacity = '0'; }, Math.max(0, duration - 200));
    return new Promise((resolve) => setTimeout(() => { element.remove(); resolve(); }, duration));
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

    // M1: Lazy load animation table (39k lines) on first battle use
    const { BattleMoveAnims, BattleOtherAnims } = await import("./battle-animations-moves");
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
