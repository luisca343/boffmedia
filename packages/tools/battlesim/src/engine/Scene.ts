import { Battle } from "@pkmn/client";
import { PokemonIdent } from "@pkmn/protocol";
// M1: Animation table is dynamically imported on first use (39k lines)
// import { BattleMoveAnims, BattleOtherAnims } from "./battle-animations-moves";
import { getCanvasHeight, getCanvasWidth, getOffset, getScaleMultiplier } from "./viewUtils";
import { ScenePos } from "./types";
import { PokemonSprite } from "./PokemonSprite";
import { SceneEffects, type PopupOptions } from "./SceneEffects";

/** `n >= 8` means "get me to the end", not "play it faster". */
export const SKIP_ANIMS_AT = 8;

/**
 * A cancellation token. An animation captures one when it starts and checks it
 * before every DOM write and every `.then` cleanup: a queued transition that
 * belongs to a Pokemon that has since been recalled, fainted, transformed —
 * or to a scene that has been unmounted — must do NOTHING, not reset the
 * sprite that took its place.
 */
export interface SceneToken {
  generation: number;
  slot: number;
  code: string;
}

/**
 * Owns the field's DOM side-effects: the fx nodes it appends, the timers it
 * starts and the generation counters that let it abandon all of them.
 *
 * React owns the sprite elements (keyed by identity, id'd by slot code); the
 * scene only ever animates what it finds by `#slot`.
 */
export class Scene {
  battle: any;
  gameElement: HTMLElement;
  acceleration: number;
  sceneEffects: SceneEffects;
  $bg: { animate: (...args: any[]) => any; delay: (...args: any[]) => any };

  /** Bumped by `destroy()`. Every token from a previous generation is stale. */
  generation = 0;
  destroyed = false;

  private slotGen = new Map<string, number>();
  private timers = new Set<ReturnType<typeof setTimeout>>();
  private fxNodes = new Set<HTMLElement>();
  /**
   * One list per in-flight `play*` call. Calls used to share a single
   * `currentAnimations` array which each of them replaced wholesale on
   * completion, so a fast second animation truncated the first one's wait and
   * `showEffect`'s cleanup `shift()`ed whichever promise happened to be first.
   */
  private collectors: Promise<void>[][] = [];

  constructor(battle: Battle, gameElement: HTMLElement) {
    this.battle = battle;
    this.gameElement = gameElement;
    this.acceleration = 1;
    this.sceneEffects = new SceneEffects(this);
    // Stub for animations that reference scene.$bg (earthquake, scorching sands, etc.)
    const bgStub: any = { animate: () => bgStub, delay: () => bgStub };
    this.$bg = bgStub;
  }

  /** The session swaps the Battle on a resync; the scene follows it. */
  setBattle(battle: Battle): void {
    this.battle = battle;
  }

  setAcceleration(acceleration: number) {
    this.acceleration = acceleration > 0 ? acceleration : 1;
  }

  /** At this speed the viewer is scrubbing, not watching. */
  get skipAnims(): boolean {
    return this.acceleration >= SKIP_ANIMS_AT;
  }

  /** Every authored duration passes through here, so speed applies uniformly. */
  animTime(ms: number): number {
    if (this.skipAnims) return 0;
    return Math.max(0, ms) / this.acceleration;
  }

  // ── cancellation ──────────────────────────────────────────────────────────

  slotGeneration(code: string): number {
    return this.slotGen.get(code) ?? 0;
  }

  /**
   * The Pokemon in this slot is no longer the one an in-flight animation was
   * addressing (switch, drag, replace, faint, forme change, transform).
   */
  bumpSlot(code: string): void {
    if (!code) return;
    this.slotGen.set(code, this.slotGeneration(code) + 1);
  }

  token(code: string): SceneToken {
    return { generation: this.generation, slot: this.slotGeneration(code), code };
  }

  isStale(token: SceneToken | null | undefined): boolean {
    if (!token) return this.destroyed;
    return (
      this.destroyed ||
      token.generation !== this.generation ||
      token.slot !== this.slotGeneration(token.code)
    );
  }

  /** A cancellable sleep. Resolves early — never hangs — when the scene dies. */
  wait(time: number): Promise<void> {
    if (this.destroyed || !(time > 0)) return Promise.resolve();
    return new Promise(resolve => {
      const id = setTimeout(() => {
        this.timers.delete(id);
        resolve();
      }, time);
      this.timers.add(id);
    });
  }

  /** Registers a node the scene appended, so `destroy()` can take it back out. */
  registerFx(el: HTMLElement): void {
    this.fxNodes.add(el);
  }

  removeFx(el: HTMLElement): void {
    this.fxNodes.delete(el);
    el.remove();
  }

  /**
   * Ends the scene: no queued transition, no pending cleanup and no fx node
   * outlives it. The session calls this before replacing the scene and on
   * teardown; without it a remount inherited the old scene's timers, which
   * then wrote styles onto the new scene's sprites.
   */
  destroy(): void {
    this.destroyed = true;
    this.generation++;
    for (const id of this.timers) clearTimeout(id);
    this.timers.clear();
    for (const el of this.fxNodes) {
      try { el.remove(); } catch { /* detached already */ }
    }
    this.fxNodes.clear();
    this.collectors = [];
  }

  // ── promise collection ────────────────────────────────────────────────────

  /** Called by PokemonSprite / SceneEffects to enrol in the running call. */
  track(promise: Promise<void>): void {
    const list = this.collectors[this.collectors.length - 1];
    if (list) list.push(promise);
  }

  /**
   * Runs `fn` and awaits every animation it starts, INCLUDING the ones queued
   * behind those (a sprite's animation queue only schedules step two once step
   * one has finished, so a snapshot taken at call time missed the rest).
   */
  async collect(fn: () => void): Promise<void> {
    const list: Promise<void>[] = [];
    this.collectors.push(list);
    try {
      fn();
      let i = 0;
      // Bounded: a runaway queue must not deadlock the battle pipeline.
      while (i < list.length && i < 256) {
        await list[i++];
        if (this.destroyed) break;
      }
    } finally {
      const idx = this.collectors.indexOf(list);
      if (idx >= 0) this.collectors.splice(idx, 1);
    }
  }

  // ── effects ───────────────────────────────────────────────────────────────

  backgroundEffect(_background: string, _duration: number, _opacity: number, _idontknow?: number) {
    // No-op — background effects not yet implemented
  }

  async showPopup(position: PokemonIdent, text: string, duration: number = 1000, opts?: PopupOptions): Promise<void> {
    if (this.skipAnims) return;
    return this.sceneEffects.showPopup(position, text, duration, opts);
  }

  async showBanner(text: string, duration: number = 1200): Promise<void> {
    if (this.skipAnims) return;
    return this.sceneEffects.showBanner(text, duration);
  }

  async playBattleAnim(
    anim: string,
    attacker: PokemonIdent,
    defender: PokemonIdent,
    callback?: () => void
  ): Promise<void> {
    if (this.skipAnims || this.destroyed) return;
    // M1: Lazy load animation table (39k lines) on first battle use
    const { BattleMoveAnims, BattleOtherAnims } = await import("./battle-animations-moves");
    const animFunc = BattleMoveAnims[anim] || BattleOtherAnims[anim];

    // Fall back to contact attack if animation not found
    if (animFunc === undefined) {
      if (anim === 'contactattack') return;
      return await this.playBattleAnim('contactattack', attacker, defender, callback);
    }

    const data = this.animData(attacker);
    const attackerSprite = new PokemonSprite(this, attacker);
    const defenderSprite = new PokemonSprite(this, defender);

    await this.collect(() => { animFunc.anim(this, [attackerSprite, defenderSprite], data); });

    attackerSprite.resetPosition();
    defenderSprite.resetPosition();
    if (callback) callback();
  }

  /** `|-prepare|` — the wind-up half of a two-turn move, when the table has one. */
  async playPrepareAnim(anim: string, attacker: PokemonIdent, defender: PokemonIdent): Promise<void> {
    if (this.skipAnims || this.destroyed) return;
    const { BattleMoveAnims, BattleOtherAnims } = await import("./battle-animations-moves");
    const entry = BattleMoveAnims[anim] || BattleOtherAnims[anim];
    const prepare = entry?.prepareAnim;
    if (!prepare) return;

    const data = this.animData(attacker);
    const attackerSprite = new PokemonSprite(this, attacker);
    const defenderSprite = new PokemonSprite(this, defender);
    await this.collect(() => { prepare(this, [attackerSprite, defenderSprite], data); });
    attackerSprite.resetPosition();
    defenderSprite.resetPosition();
  }

  /**
   * The outgoing Pokemon shrinks into its ball and the ball flies back to its
   * trainer. Must run BEFORE `battle.add`, while the slot still holds it.
   */
  async playRecall(code: string): Promise<void> {
    if (this.skipAnims || this.destroyed) return;
    return this.playSlotAnim('recall', code);
  }

  /**
   * The ball flies out to the slot and the incoming Pokemon grows out of it.
   * Must run AFTER the commit that mounted the new sprite.
   */
  async playSummon(code: string): Promise<void> {
    if (this.skipAnims || this.destroyed) return;
    // The new <img> mounts at opacity 0; the wrapper starts small so the mon
    // can grow out of the ball rather than pop in at full size.
    const el = this.getPokemonElement(code);
    if (el) {
      el.style.transition = 'none';
      el.style.opacity = '0';
      el.style.transform = 'scale(0.1)';
      void el.offsetHeight;
    }
    return this.playSlotAnim('summon', code, false);
  }

  /** A shrink-and-fade with no ball. */
  async playFaint(code: string): Promise<void> {
    if (this.skipAnims || this.destroyed) return;
    return this.playSlotAnim('faint', code);
  }

  private async playSlotAnim(name: string, code: string, reset = true): Promise<void> {
    const { BattleOtherAnims } = await import("./battle-animations-moves");
    const entry = BattleOtherAnims[name];
    if (!entry) return;
    const sprite = new PokemonSprite(this, code as PokemonIdent, { reset });
    const data = this.animData(code as PokemonIdent);
    await this.collect(() => { entry.anim(this, [sprite, sprite], data); });
  }

  /**
   * Where a Poké Ball is thrown from / returns to: the viewer's trainer stands
   * bottom-left, the opponent's top-right, in canvas pixels.
   */
  trainerPoint(code: string): { left: number; top: number } {
    const w = getCanvasWidth();
    const h = getCanvasHeight();
    return code.startsWith('p2')
      ? { left: w * 0.86, top: h * 0.14 }
      : { left: w * 0.06, top: h * 0.70 };
  }

  private animData(code: PokemonIdent | string) {
    const offset = getOffset(this.battle, String(code).split(':')[0], getScaleMultiplier());
    // `startingPosition` is read by the move table in FIELD units (it multiplies
    // by the scale itself); `trainerPosition` is already in canvas pixels.
    return {
      startingPosition: { top: offset?.top ?? 0, left: offset?.left ?? 0 },
      trainerPosition: this.trainerPoint(String(code).split(':')[0]),
    };
  }

  /**
   * Wipes the inline styles the engine wrote on a slot.
   *
   * NOT part of the switch sequence any more: it used to run AFTER the new
   * Pokemon was already in the slot, which reset that sprite to opacity 1 and
   * left the outgoing one standing for the rest of the 1200 ms sleep.
   */
  async clearPokemonElement(id: PokemonIdent | string): Promise<void> {
    const el = this.getPokemonElement(String(id).split(':')[0]);
    if (!el) return;
    el.style.transition = 'none';
    el.style.transform = 'none';
    el.style.opacity = '1';
  }

  async playEffect(
    effect: string,
    position: PokemonIdent,
    callback?: () => void
  ): Promise<void> {
    if (this.skipAnims || this.destroyed) return;
    return this.sceneEffects.playEffect(effect, position, callback);
  }

  async showEffect(
    effect: any,
    start: ScenePos,
    end: ScenePos,
    transition: string,
    after?: string,
    additionalCss?: any,
    callback?: () => void
  ): Promise<void> {
    return this.sceneEffects.showEffect(
      effect, start, end, transition, after, additionalCss, callback
    );
  }

  getPokemonElement(id: string): HTMLElement | null {
    if (!id || this.destroyed) return null;
    const code = id.split(':')[0];
    if (!/^[a-z0-9_-]+$/i.test(code)) return null;
    try {
      return this.gameElement.querySelector(`#${code}`) as HTMLElement | null;
    } catch {
      return null;
    }
  }

  /**
   * The wrapper INSIDE the slot box. The engine writes `style.transform` on the
   * outer box, so a shake has to live one level down or the two writers fight
   * (the crit shake used to cancel the move animation's translate mid-flight).
   */
  getPokemonInnerElement(id: string): HTMLElement | null {
    const el = this.getPokemonElement(id);
    return (el?.firstElementChild as HTMLElement) ?? null;
  }

  getPokemonSpriteElement(id: string): HTMLImageElement | null {
    const wrapper = this.getPokemonElement(id);
    if (!wrapper) return null;
    return wrapper.querySelector('img') as HTMLImageElement | null;
  }
}

// This class was moved to its own file
export class ExtraBattleProps {
  mySide: any;
}
