import { PokemonIdent } from "@pkmn/protocol";
import { BattleEffects } from "./battle_animations";
// M1: Animation table is dynamically imported on first use (39k lines)
// import { BattleMoveAnims, BattleOtherAnims } from "./battle-animations-moves";
import { getImageSize, getOffset, getScaleMultiplier } from "./viewUtils";
import { ScenePos } from "./types";
import { Scene } from "./Scene";
import { PokemonSprite, easingFor } from "./PokemonSprite";

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
    if (this.scene.destroyed || this.scene.skipAnims) return;
    const code = String(position).split(':')[0];
    const scale = getScaleMultiplier();

    const offset = getOffset(this.scene.battle, code, scale);
    if (!offset) return;
    const imageSize = getImageSize(scale);

    const element = document.createElement('div');
    const left = offset.left + imageSize / 2;
    const top = offset.top + imageSize / 2;

    const tone: PopupTone = opts.tone ?? (text.startsWith('+') ? 'heal' : 'dmg');
    const size = 12 * Math.max(0.8, Math.min(1.6, scale)) * (opts.scale ?? 1);
    const life = this.scene.animTime(duration);

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
    this.scene.registerFx(element);

    const motion = !reducedMotion();
    if (motion) element.style.transition = `top ${life}ms ease-out, opacity ${life}ms ease-in`;

    void this.scene.wait(motion ? 0 : Math.max(0, life - 120)).then(() => {
      if (motion) element.style.top = `${top - imageSize / 2}px`;
      element.style.opacity = '0';
    });

    await this.scene.wait(life);
    this.scene.removeFx(element);
  }

  /**
   * A short horizontal shake (crit, flinch).
   *
   * On the INNER wrapper, never the slot box: the engine's own animations write
   * `style.transform` on the box, and a WAAPI transform on the same node wins
   * and then hands back — which is how a crit mid-move teleported the attacker.
   * With no inner wrapper it degrades to a queued translate on the sprite, which
   * shares the queue with everything else instead of competing with it.
   */
  async shake(position: PokemonIdent, duration: number = 360): Promise<void> {
    if (this.scene.destroyed || this.scene.skipAnims || reducedMotion()) return;
    const code = String(position).split(':')[0];
    const amp = Math.max(3, 6 * getScaleMultiplier());
    const life = this.scene.animTime(duration);

    const inner = this.scene.getPokemonInnerElement(code);
    if (inner && typeof inner.animate === 'function') {
      const anim = inner.animate(
        [
          { transform: 'translateX(0)' },
          { transform: `translateX(-${amp}px)` },
          { transform: `translateX(${amp}px)` },
          { transform: `translateX(-${amp / 2}px)` },
          { transform: 'translateX(0)' },
        ],
        { duration: life, iterations: 1, easing: 'ease-out' },
      );
      return new Promise((resolve) => { anim.onfinish = () => resolve(); anim.oncancel = () => resolve(); });
    }

    // No inner wrapper (or no WAAPI): go through the sprite's own queue.
    const sprite = new PokemonSprite(this.scene, code as PokemonIdent, { reset: false });
    const base = sprite.x();
    const step = life / 4;
    await this.scene.collect(() => {
      sprite
        .anim({ x: base - amp, time: step }, 'linear')
        .anim({ x: base + amp, time: step }, 'linear')
        .anim({ x: base - amp / 2, time: step }, 'linear')
        .anim({ x: base, time: step }, 'linear');
    });
  }

  /** A centred field banner (weather, terrain, screens). */
  async showBanner(text: string, duration: number = 1200): Promise<void> {
    if (this.scene.destroyed || this.scene.skipAnims) return;
    const element = document.createElement('div');
    const scale = getScaleMultiplier();
    const life = this.scene.animTime(duration);
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
    this.scene.registerFx(element);
    const motion = !reducedMotion();
    if (motion) element.style.transition = 'opacity 180ms ease';
    void this.scene.wait(0).then(() => { element.style.opacity = '1'; });
    void this.scene.wait(Math.max(0, life - 200)).then(() => { element.style.opacity = '0'; });
    await this.scene.wait(life);
    this.scene.removeFx(element);
  }

  /**
   * Plays a battle effect at a position
   */
  async playEffect(effect: string, position: PokemonIdent, callback?: () => void): Promise<void> {
    if (this.scene.destroyed || this.scene.skipAnims) return;
    const pos = String(position).split(':')[0] as PokemonIdent;
    const scaleMulti = getScaleMultiplier();
    const offset = getOffset(this.scene.battle, pos, scaleMulti);
    if (!offset) return;

    const data = {
      startingPosition: { top: offset.top, left: offset.left },
      trainerPosition: this.scene.trainerPoint(pos),
    };

    // M1: Lazy load animation table (39k lines) on first battle use
    const { BattleMoveAnims, BattleOtherAnims } = await import("./battle-animations-moves");
    const effectData = BattleMoveAnims[effect] || BattleOtherAnims[effect];
    if (!effectData) return;

    const attackerSprite = new PokemonSprite(this.scene, pos);

    await this.scene.collect(() => {
      effectData.anim(this.scene, [attackerSprite, attackerSprite], data);
    });
    if (callback) callback();
  }

  /**
   * Shows a visual effect with transition.
   *
   * `transition` picks the easing and `after: 'fade'` fades the node out at the
   * end — both were accepted and then ignored, which is half of why the Poké
   * Ball read as a teleport. The half-size offset is computed ONCE and applied
   * to both ends: it used to be zeroed for the ball, used for the start, then
   * reassigned before the end, so the two ends were ~87px apart.
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
    if (this.scene.destroyed || this.scene.skipAnims) return;
    const effectData = BattleEffects[effect];
    if (!effectData) return;

    const startTime = this.scene.animTime(start.time || 0);
    const endTime = this.scene.animTime(end.time === undefined ? 500 : end.time);
    const animationTime = Math.max(0, endTime - startTime);

    const prom = this.scene.wait(startTime + animationTime + 60);
    this.scene.track(prom);

    // ONE offset, both ends. The ball is centred on the sprite box; everything
    // else is authored against the box's own half-size.
    const imageSize = getImageSize();
    const halfWidth = effect === 'pokeball'
      ? imageSize / 2 - effectData.w / 2
      : imageSize / 2;
    const halfHeight = effect === 'pokeball'
      ? (3 * imageSize) / 4 - effectData.h / 2
      : imageSize / 2;

    const startX = start.x || 0;
    const startY = start.y || 0;

    // Create effect element
    const element = document.createElement('img');
    element.src = effectData.url;
    element.setAttribute('aria-hidden', 'true');
    element.style.position = 'absolute';
    element.style.left = `${startX + halfWidth}px`;
    element.style.top = `${startY + halfHeight}px`;
    element.style.width = `${effectData.w}px`;
    element.style.height = `${effectData.h}px`;
    element.style.pointerEvents = 'none';
    element.style.opacity = `${start.opacity === undefined ? 1 : start.opacity}`;
    if (start.scale !== undefined) element.style.transform = `scale(${start.scale})`;
    if (start.z !== undefined) element.style.zIndex = `${start.z}`;

    // Apply any additional CSS
    if (additionalCss) {
      element.style.cssText += additionalCss;
    }

    this.scene.gameElement.appendChild(element);
    this.scene.registerFx(element);

    // Wait the start time before starting the animation
    await this.scene.wait(startTime);
    if (this.scene.destroyed) { this.scene.removeFx(element); return; }

    element.style.transition = `all ${animationTime}ms ${easingFor(transition)}`;

    // Calculate end values
    const endX = end.x !== undefined ? end.x : startX;
    const endY = end.y !== undefined ? end.y : startY;
    const endOpacity = end.opacity !== undefined ? end.opacity : start.opacity;
    const endScale = end.scale !== undefined ? end.scale : start.scale;
    const endZ = end.z !== undefined ? end.z : start.z;

    void this.scene.wait(10).then(() => {
      if (this.scene.destroyed) return;
      element.style.left = `${endX + halfWidth}px`;
      element.style.top = `${endY + halfHeight}px`;
      if (endOpacity !== undefined) element.style.opacity = `${endOpacity}`;
      if (endScale !== undefined) element.style.transform = `scale(${endScale})`;
      if (endZ !== undefined) element.style.zIndex = `${endZ}`;
    });

    if (after === 'fade') {
      const fade = Math.max(60, animationTime * 0.4);
      void this.scene.wait(animationTime).then(() => {
        if (this.scene.destroyed) return;
        element.style.transition = `opacity ${fade}ms ease-out`;
        element.style.opacity = '0';
      });
    }

    await prom;
    this.scene.removeFx(element);
    if (callback) callback();
  }
}
