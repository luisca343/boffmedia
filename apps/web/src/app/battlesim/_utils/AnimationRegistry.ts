import { Battle } from "@pkmn/client";
import { ArgType, BattleArgsKWArgsTypes, PokemonDetails, PokemonHPStatus, PokemonIdent } from "@pkmn/protocol";
import { Scene } from "./Scene";
import { switchAction, faintAction, turnAction, moveAction, damageAction, healAction, missAction } from "./battleActions";
import { getRelativeIdent } from "./replayUtils";

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

export type AnimationPhase = 'beforeStateChange' | 'afterStateChange';

export interface AnimationHandler {
  beforeStateChange?(ctx: AnimationContext): Promise<void>;
  afterStateChange?(ctx: AnimationContext): Promise<number>; // returns timeout
}

const defaultTimeout = (accel: number) => 300 / accel;

const handlers: Record<string, AnimationHandler> = {
  'switch': {
    beforeStateChange: async (ctx) => {
      const pokemonIdent = getRelativeIdent(ctx.args[1] as PokemonIdent, ctx.pov);
      await switchAction(ctx.scene, pokemonIdent, ctx.args[2] as PokemonDetails, ctx.args[3] as PokemonHPStatus);
    },
    afterStateChange: async (ctx) => {
      if (ctx.skipAnims) return 100;
      const pokemonIdent = getRelativeIdent(ctx.args[1] as PokemonIdent, ctx.pov);
      await ctx.scene.clearPokemonElement(pokemonIdent);
      const pokemon = ctx.battle.getPokemon(ctx.args[1] as PokemonIdent);
      if (pokemon?.baseSpeciesForme) {
        const audio = new Audio(`https://play.pokemonshowdown.com/audio/cries/${pokemon.baseSpeciesForme.toLowerCase()}.mp3`);
        audio.play().catch(console.error);
      }
      return 1200 / ctx.acceleration;
    },
  },

  'faint': {
    beforeStateChange: async (ctx) => {
      await faintAction(ctx.battle, ctx.scene, getRelativeIdent(ctx.args[1] as PokemonIdent, ctx.pov));
    },
    afterStateChange: async () => 0,
  },

  'turn': {
    afterStateChange: async (ctx) => {
      if (ctx.skipAnims) return 50;
      ctx.battle.setTurn(parseInt(ctx.args[1] as string));
      await turnAction(ctx.battle, ctx.args[1] as any);
      return 500 / ctx.acceleration;
    },
  },

  'move': {
    afterStateChange: async (ctx) => {
      if (ctx.skipAnims) return 100;
      const defender = (ctx.args[3] as PokemonIdent) || (ctx.args[1] as PokemonIdent);
      await moveAction(
        ctx.battle,
        ctx.scene,
        getRelativeIdent(ctx.args[1] as PokemonIdent, ctx.pov),
        ctx.args[2] as string,
        getRelativeIdent(defender, ctx.pov)
      );
      return 1500 / ctx.acceleration;
    },
  },

  '-damage': {
    afterStateChange: async (ctx) => {
      if (ctx.skipAnims) return 50;
      damageAction(
        ctx.battle,
        ctx.scene,
        getRelativeIdent(ctx.args[1] as PokemonIdent, ctx.pov),
        ctx.data?.damage as string
      );
      return 800 / ctx.acceleration;
    },
  },

  '-heal': {
    afterStateChange: async (ctx) => {
      if (ctx.skipAnims) return 50;
      healAction(
        ctx.battle,
        ctx.scene,
        getRelativeIdent(ctx.args[1] as PokemonIdent, ctx.pov),
        ctx.data?.health as number[]
      );
      return 800 / ctx.acceleration;
    },
  },

  '-miss': {
    afterStateChange: async (ctx) => {
      if (ctx.skipAnims) return 50;
      await missAction(
        ctx.battle,
        ctx.scene,
        getRelativeIdent(ctx.args[1] as PokemonIdent, ctx.pov)
      );
      return 800 / ctx.acceleration;
    },
  },

  'win': {
    afterStateChange: async (ctx) => {
      ctx.battle.winner = ctx.args[1] as string;
      return 0;
    },
  },
};

// Events with no animation — timeout = 0
const noAnimEvents = new Set([
  'inactive', 't:', '-resisted', '', 'join', 'gametype', 'player',
  'teamsize', 'gen', 'tier', 'rated', 'rule', 'clearpoke', 'poke', 'start',
]);

export class AnimationRegistry {
  async runBeforeStateChange(ctx: AnimationContext): Promise<void> {
    const handler = handlers[ctx.args[0]];
    if (handler?.beforeStateChange) {
      await handler.beforeStateChange(ctx);
    }
  }

  async runAfterStateChange(ctx: AnimationContext): Promise<number> {
    const type = ctx.args[0];

    // No-animation events
    if (noAnimEvents.has(type)) return 0;

    const handler = handlers[type];
    if (handler?.afterStateChange) {
      return handler.afterStateChange(ctx);
    }

    // Default timeout for unknown events
    return defaultTimeout(ctx.acceleration);
  }
}
