import { Battle } from "@pkmn/client";
import { ArgType, BattleArgsKWArgsTypes, PokemonDetails, PokemonHPStatus, PokemonIdent } from "@pkmn/protocol";
import { AnimationContext } from "./AnimationRegistry";
import { switchAction, faintAction, turnAction, moveAction, damageAction, healAction, missAction } from "./battleActions";
import { getRelativeIdent } from "./replayUtils";

export interface EventHandler {
  getPayload?(args: ArgType, kwArgs: BattleArgsKWArgsTypes, battle: Battle): any;
  beforeStateChange?(ctx: AnimationContext): Promise<void>;
  afterStateChange?(ctx: AnimationContext): Promise<number>;
}

const defaultTimeout = (accel: number) => 300 / accel;

export const eventHandlers: Record<string, EventHandler> = {
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
    afterStateChange: async (ctx) => {
      return 600 / ctx.acceleration;
    },
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
        ctx.battle, ctx.scene,
        getRelativeIdent(ctx.args[1] as PokemonIdent, ctx.pov),
        ctx.args[2] as string,
        getRelativeIdent(defender, ctx.pov)
      );
      return 1500 / ctx.acceleration;
    },
  },

  '-damage': {
    getPayload: (args, kwArgs, battle) => {
      const damage = battle.damagePercentage(args[1] as PokemonIdent, args[2] as PokemonHPStatus);
      return { damage };
    },
    afterStateChange: async (ctx) => {
      if (ctx.skipAnims) return 50;
      damageAction(
        ctx.battle, ctx.scene,
        getRelativeIdent(ctx.args[1] as PokemonIdent, ctx.pov),
        ctx.data?.damage as string
      );
      return 800 / ctx.acceleration;
    },
  },

  '-heal': {
    getPayload: (args, kwArgs, battle) => {
      const fromEffect = kwArgs.from && battle.get('conditions', kwArgs.from);
      const revival = fromEffect?.id === 'revivalblessing';
      const poke = battle.getPokemon(args[1] as PokemonIdent, revival)!;
      const health = poke.healthParse(args[2] as string);
      return { health };
    },
    afterStateChange: async (ctx) => {
      if (ctx.skipAnims) return 50;
      healAction(
        ctx.battle, ctx.scene,
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
        ctx.battle, ctx.scene,
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

  '-terastallize': {
    afterStateChange: async (ctx) => {
      if (ctx.skipAnims) return 50;
      const pokemonIdent = getRelativeIdent(ctx.args[1] as PokemonIdent, ctx.pov);
      const teraType = ctx.args[2] as string;
      await ctx.scene.showPopup(pokemonIdent, `Terastallized ${teraType}!`, 1500);
      return 1500 / ctx.acceleration;
    },
  },

  '-mega': {
    afterStateChange: async (ctx) => {
      if (ctx.skipAnims) return 50;
      const pokemonIdent = getRelativeIdent(ctx.args[1] as PokemonIdent, ctx.pov);
      const species = ctx.args[2] as string;
      await ctx.scene.showPopup(pokemonIdent, `Mega Evolved${species ? ` into ${species}` : ''}!`, 1500);
      return 1500 / ctx.acceleration;
    },
  },

  '-primal': {
    afterStateChange: async (ctx) => {
      if (ctx.skipAnims) return 50;
      const pokemonIdent = getRelativeIdent(ctx.args[1] as PokemonIdent, ctx.pov);
      await ctx.scene.showPopup(pokemonIdent, 'Primal Reversion!', 1500);
      return 1500 / ctx.acceleration;
    },
  },

  '-burst': {
    afterStateChange: async (ctx) => {
      if (ctx.skipAnims) return 50;
      const pokemonIdent = getRelativeIdent(ctx.args[1] as PokemonIdent, ctx.pov);
      const species = ctx.args[2] as string;
      await ctx.scene.showPopup(pokemonIdent, `Ultra Burst${species ? ` into ${species}` : ''}!`, 1500);
      return 1500 / ctx.acceleration;
    },
  },

  '-zpower': {
    afterStateChange: async (ctx) => {
      if (ctx.skipAnims) return 50;
      const pokemonIdent = getRelativeIdent(ctx.args[1] as PokemonIdent, ctx.pov);
      await ctx.scene.showPopup(pokemonIdent, 'Z-Move!', 1000);
      return 1000 / ctx.acceleration;
    },
  },

  '-zbroken': {
    afterStateChange: async (ctx) => {
      if (ctx.skipAnims) return 50;
      const pokemonIdent = getRelativeIdent(ctx.args[1] as PokemonIdent, ctx.pov);
      await ctx.scene.showPopup(pokemonIdent, 'Z-Broken!', 1000);
      return 1000 / ctx.acceleration;
    },
  },

  '-message': {
    afterStateChange: async (ctx) => {
      return 0;
    },
  },
};

export const noAnimEvents = new Set([
  'inactive', 't:', '-resisted', '', 'join', 'gametype', 'player',
  'teamsize', 'gen', 'tier', 'rated', 'rule', 'clearpoke', 'poke', 'start',
]);

export function getEventHandler(type: string): EventHandler | undefined {
  return eventHandlers[type];
}

export function getDefaultTimeout(accel: number): number {
  return defaultTimeout(accel);
}
