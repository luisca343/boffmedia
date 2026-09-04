import { Battle } from "@pkmn/client";
import { ArgType, BattleArgsKWArgsTypes } from "@pkmn/protocol";
import { Scene } from "./Scene";
import { getEventHandler, noAnimEvents, getDefaultTimeout } from "./eventHandlers";
import type { BattleAudioState } from "./BattleAudio";
import type { TurnLedger } from "./TurnLedger";

export interface AnimationContext {
  scene: Scene;
  battle: Battle;
  args: ArgType;
  kwArgs: BattleArgsKWArgsTypes;
  data: any;
  pov: 0 | 1;
  acceleration: number;
  skipAnims: boolean;
  audioState?: BattleAudioState;
  /**
   * Resolves once React has COMMITTED the state this line produced.
   *
   * The summon half of a switch has to touch an element React has not mounted
   * yet — it is keyed by the incoming Pokemon's identity, so it does not exist
   * until the render that follows `battle.add`. Without this the engine
   * animated the outgoing sprite's node and the new one popped in behind it.
   * A no-op resolve when there is no React on the other end (replay path).
   */
  commit: () => Promise<void>;
  /** What happened this turn, recorded from the protocol. Read-only here. */
  ledger?: TurnLedger;
}

/**
 * Hook order is the whole point: `preApply` sees the state BEFORE the line is
 * applied (the slot still holds the outgoing Pokemon), `postApply` sees it
 * after and returns how long the pipeline should hold before the next line.
 * They were named beforeStateChange/afterStateChange and both ran after the
 * state change, which is why a recall had nothing left to recall.
 */
export class AnimationRegistry {
  async runPreApply(ctx: AnimationContext): Promise<void> {
    const type = ctx.args[0] as string;
    if (noAnimEvents.has(type)) return;
    const handler = getEventHandler(type);
    if (handler?.preApply) {
      await handler.preApply(ctx);
    }
  }

  async runPostApply(ctx: AnimationContext): Promise<number> {
    const type = ctx.args[0] as string;

    if (noAnimEvents.has(type)) return 0;

    const handler = getEventHandler(type);
    if (handler?.postApply) {
      return handler.postApply(ctx);
    }

    return getDefaultTimeout(ctx.acceleration);
  }
}
