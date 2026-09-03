import { Battle } from "@pkmn/client";
import { ArgType, BattleArgsKWArgsTypes, Protocol } from "@pkmn/protocol";
import { LogFormatter } from "@pkmn/view";
import { Scene } from "./Scene";
import { getEventPayload, EventPayload } from "./eventPayload";
import { AnimationRegistry, AnimationContext } from "./AnimationRegistry";

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
  pov: 0 | 1;
}

export class BattleEventProcessor {
  private formatter: LogFormatter;
  private animationRegistry: AnimationRegistry;

  constructor(public readonly context: BattleEventProcessorContext) {
    this.formatter = new LogFormatter('p1', context.battle);
    this.animationRegistry = new AnimationRegistry();
  }

  async processLine(line: string): Promise<ProcessedBattleEvent> {
    const { args, kwArgs } = Protocol.parseBattleLine(line);
    const html = this.formatter.formatHTML(args, kwArgs);

    const eventPayload = getEventPayload(
      args[0], args, kwArgs as BattleArgsKWArgsTypes, this.context.battle
    );

    this.context.battle.add(args, kwArgs);

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
    const { scene, battle, pov } = this.context;
    return {
      scene,
      battle,
      args,
      kwArgs,
      data,
      pov,
      acceleration: scene.acceleration,
      skipAnims: scene.acceleration >= 3,
    };
  }
}
