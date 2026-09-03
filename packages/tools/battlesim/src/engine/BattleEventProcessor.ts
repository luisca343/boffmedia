import { Battle } from "@pkmn/client";
import { ArgType, BattleArgsKWArgsTypes, Protocol } from "@pkmn/protocol";
import { LogFormatter } from "@pkmn/view";
import { Scene } from "./Scene";
import { getEventPayload, EventPayload } from "./eventPayload";
import { AnimationRegistry, AnimationContext } from "./AnimationRegistry";
import type { BattleAudioState } from "./BattleAudio";

export interface ProcessedBattleEvent {
  type: string;
  html: string;
  eventPayload: EventPayload;
  args: ArgType;
  kwArgs: BattleArgsKWArgsTypes;
}

export interface BattleEventProcessorContext {
  scene: Scene;
  battle: Battle;
  /**
   * Which side the viewer is on. Read PER EVENT by `buildAnimationContext`,
   * so correcting it takes effect on the very next line without rebuilding
   * anything.
   */
  pov: 0 | 1;
  /**
   * The viewer's own player name, when it is knowable from the protocol.
   *
   * Set it and `pov` becomes SELF-CORRECTING: `|player|p2|You|` is applied to
   * the battle before the opening `|switch|` lines are animated, so the sides
   * are right from the first frame. Without it the pov has to be supplied from
   * outside and is therefore only as timely as whoever supplies it — which is
   * exactly how a Showdown battle ended up animating every move from the wrong
   * side (React laid the field out from the corrected pov while this context
   * was still on the initial guess of 0).
   *
   * Omitted by the local and PvP paths, which are told their side outright.
   */
  viewerName?: string | null;
  audioState?: BattleAudioState;
}

export class BattleEventProcessor {
  private formatter: LogFormatter;
  private animationRegistry: AnimationRegistry;

  constructor(public readonly context: BattleEventProcessorContext) {
    this.formatter = new LogFormatter(context.pov === 1 ? 'p2' : 'p1', context.battle);
    this.animationRegistry = new AnimationRegistry();
  }

  /**
   * Moves the viewer to the other side.
   *
   * The formatter goes with it: it was pinned to 'p1' regardless, so a player
   * on p2 read "Rhydon rival uses Earthquake" about their OWN Pokemon.
   */
  setPov(pov: 0 | 1): void {
    if (this.context.pov === pov) return;
    this.context.pov = pov;
    // MUTATED, never reconstructed. LogFormatter learns the player names from
    // the |player| lines it formats, not from the battle object — so a fresh
    // one mid-stream has already missed them and every later line reads
    // "Player 1" / "Player 2". Verified both ways against @pkmn/view.
    this.formatter.perspective = pov === 1 ? 'p2' : 'p1';
  }

  setViewerName(name: string | null): void {
    this.context.viewerName = name;
    this.syncPov();
  }

  /** Resolves the pov from the battle's own player names. No-op without one. */
  private syncPov(): void {
    const me = this.context.viewerName?.trim();
    if (!me) return;
    const p2 = this.context.battle.p2?.name?.trim();
    const p1 = this.context.battle.p1?.name?.trim();
    // p2 is tested first and p1 only confirms: a spectator matches neither and
    // must stay on 0, which is also the answer while the names are still empty.
    if (p2 && p2 === me) this.setPov(1);
    else if (p1 && p1 === me) this.setPov(0);
  }

  async processLine(line: string): Promise<ProcessedBattleEvent> {
    const { args, kwArgs } = Protocol.parseBattleLine(line);
    const html = this.formatter.formatHTML(args, kwArgs);

    const eventPayload = getEventPayload(
      args[0], args, kwArgs as BattleArgsKWArgsTypes, this.context.battle
    );

    this.context.battle.add(args, kwArgs);
    // AFTER the line is applied and BEFORE the animation context is built, so
    // the `|player|` line that names us is already in `battle` and the switches
    // that follow it in the same frame animate on the right side.
    this.syncPov();

    const ctx = this.buildAnimationContext(args, kwArgs as BattleArgsKWArgsTypes, eventPayload.payload);
    if (ctx) {
      await this.animationRegistry.runBeforeStateChange(ctx);
    }

    return { type: args[0], html, eventPayload, args, kwArgs: kwArgs as BattleArgsKWArgsTypes };
  }

  async runAnimation(event: ProcessedBattleEvent): Promise<number> {
    const ctx = this.buildAnimationContext(event.args, event.kwArgs, event.eventPayload.payload);
    if (!ctx) return 0;
    return this.animationRegistry.runAfterStateChange(ctx);
  }

  private buildAnimationContext(
    args: ArgType,
    kwArgs: BattleArgsKWArgsTypes,
    data: any
  ): AnimationContext | null {
    const { scene, battle, pov, audioState } = this.context;
    return {
      scene,
      battle,
      args,
      kwArgs,
      data,
      pov,
      acceleration: scene.acceleration,
      skipAnims: scene.acceleration >= 3,
      audioState,
    };
  }
}
