import { Battle } from "@pkmn/client";
import { ArgType, BattleArgsKWArgsTypes } from "@pkmn/protocol";
import { Scene } from "./Scene";
import { getEventHandler, noAnimEvents, getDefaultTimeout } from "./eventHandlers";

export interface AnimationContext {
  scene: Scene;
  battle: Battle;
  args: ArgType;
  kwArgs: BattleArgsKWArgsTypes;
  data: any;
  pov: 0 | 1;
  acceleration: number;
  skipAnims: boolean;
}

export class AnimationRegistry {
  async runBeforeStateChange(ctx: AnimationContext): Promise<void> {
    const handler = getEventHandler(ctx.args[0]);
    if (handler?.beforeStateChange) {
      await handler.beforeStateChange(ctx);
    }
  }

  async runAfterStateChange(ctx: AnimationContext): Promise<number> {
    const type = ctx.args[0];

    if (noAnimEvents.has(type)) return 0;

    const handler = getEventHandler(type);
    if (handler?.afterStateChange) {
      return handler.afterStateChange(ctx);
    }

    return getDefaultTimeout(ctx.acceleration);
  }
}
