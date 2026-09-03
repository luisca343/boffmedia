import { Battle } from "@pkmn/client";
import { ArgType, BattleArgsKWArgsTypes, PokemonDetails, PokemonHPStatus, PokemonIdent } from "@pkmn/protocol";
import { AnimationContext } from "./AnimationRegistry";
import {
  switchAction, faintAction, turnAction, moveAction, damageAction, healAction, missAction,
  textPopupAction, critAction, bannerAction,
} from "./battleActions";
import { getRelativeIdent } from "./replayUtils";
import { fxLabels } from "./fxLabels";
import { playCry } from "./BattleAudio";

export interface EventHandler {
  getPayload?(args: ArgType, kwArgs: BattleArgsKWArgsTypes, battle: Battle): any;
  beforeStateChange?(ctx: AnimationContext): Promise<void>;
  afterStateChange?(ctx: AnimationContext): Promise<number>;
}

const defaultTimeout = (accel: number) => 300 / accel;

const toId = (s: unknown) => String(s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
/** "move: Stealth Rock" → "stealthrock"; "Sandstorm" → "sandstorm". */
const effectId = (s: unknown) => toId(String(s ?? "").split(":").pop());

const rel = (ctx: AnimationContext, i = 1) => getRelativeIdent(ctx.args[i] as PokemonIdent, ctx.pov);

const arrows = (n: number, up: boolean) => (up ? "▲" : "▼").repeat(Math.max(1, Math.min(3, n)));

export const eventHandlers: Record<string, EventHandler> = {
  'switch': {
    beforeStateChange: async (ctx) => {
      const pokemonIdent = getRelativeIdent(ctx.args[1] as PokemonIdent, ctx.pov);
      const details = ctx.args[2] as PokemonDetails;
      await switchAction(ctx.scene, pokemonIdent, details, ctx.args[3] as PokemonHPStatus);

      // Play cry on switch-in if audio is available
      if (ctx.audioState) {
        // Extract species id from details string (format: "species[, details...]")
        const speciesId = (details as string).split(',')[0].trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        if (speciesId) {
          await playCry(speciesId, ctx.audioState);
        }
      }
    },
    afterStateChange: async (ctx) => {
      if (ctx.skipAnims) return 100;
      const pokemonIdent = getRelativeIdent(ctx.args[1] as PokemonIdent, ctx.pov);
      await ctx.scene.clearPokemonElement(pokemonIdent);
      return 1200 / ctx.acceleration;
    },
  },

  'faint': {
    beforeStateChange: async (ctx) => {
      await faintAction(ctx.battle, ctx.scene, getRelativeIdent(ctx.args[1] as PokemonIdent, ctx.pov));

      // Play cry on faint if audio is available
      if (ctx.audioState) {
        const pokemonIdent = ctx.args[1] as PokemonIdent;
        const pokemon = ctx.battle.getPokemon(pokemonIdent);
        if (pokemon?.species?.id) {
          await playCry(pokemon.species.id, ctx.audioState);
        }
      }
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
      // |-miss|SOURCE|TARGET — the popup belongs over the one that was missed.
      const target = (ctx.args[2] as PokemonIdent) || (ctx.args[1] as PokemonIdent);
      await missAction(ctx.battle, ctx.scene, getRelativeIdent(target, ctx.pov));
      return 800 / ctx.acceleration;
    },
  },

  '-crit': {
    afterStateChange: async (ctx) => {
      if (ctx.skipAnims) return 50;
      await critAction(ctx.scene, rel(ctx));
      return 500 / ctx.acceleration;
    },
  },

  '-supereffective': {
    afterStateChange: async (ctx) => {
      if (ctx.skipAnims) return 50;
      void textPopupAction(ctx.scene, rel(ctx), fxLabels().super, 1000, { tone: 'crit', scale: 1.1 });
      return 500 / ctx.acceleration;
    },
  },

  '-resisted': {
    afterStateChange: async (ctx) => {
      if (ctx.skipAnims) return 50;
      void textPopupAction(ctx.scene, rel(ctx), fxLabels().resisted, 900, { tone: 'muted', scale: 0.9 });
      return 400 / ctx.acceleration;
    },
  },

  '-immune': {
    afterStateChange: async (ctx) => {
      if (ctx.skipAnims) return 50;
      await textPopupAction(ctx.scene, rel(ctx), fxLabels().immune, 900, { tone: 'muted' });
      return 400 / ctx.acceleration;
    },
  },

  '-status': {
    afterStateChange: async (ctx) => {
      if (ctx.skipAnims) return 50;
      await textPopupAction(ctx.scene, rel(ctx), fxLabels().status(String(ctx.args[2])), 1000, { tone: 'status' });
      return 500 / ctx.acceleration;
    },
  },

  '-curestatus': {
    afterStateChange: async (ctx) => {
      if (ctx.skipAnims) return 50;
      void textPopupAction(ctx.scene, rel(ctx), fxLabels().cured, 900, { tone: 'heal' });
      return 400 / ctx.acceleration;
    },
  },

  '-boost': {
    afterStateChange: async (ctx) => {
      if (ctx.skipAnims) return 50;
      const n = parseInt(String(ctx.args[3] ?? "1"), 10) || 1;
      void textPopupAction(ctx.scene, rel(ctx), `${arrows(n, true)} ${fxLabels().stat(String(ctx.args[2]))}`, 900, { tone: 'boostUp' });
      return 450 / ctx.acceleration;
    },
  },

  '-unboost': {
    afterStateChange: async (ctx) => {
      if (ctx.skipAnims) return 50;
      const n = parseInt(String(ctx.args[3] ?? "1"), 10) || 1;
      void textPopupAction(ctx.scene, rel(ctx), `${arrows(n, false)} ${fxLabels().stat(String(ctx.args[2]))}`, 900, { tone: 'boostDown' });
      return 450 / ctx.acceleration;
    },
  },

  '-weather': {
    afterStateChange: async (ctx) => {
      if (ctx.skipAnims) return 50;
      // Upkeep lines repeat every turn; only the change gets a banner.
      if ((ctx.kwArgs as any)?.upkeep) return 100;
      const id = effectId(ctx.args[1]);
      if (!id || id === 'none') return 100;
      const label = fxLabels().cond(id);
      if (label) void bannerAction(ctx.scene, label, 1200);
      return 600 / ctx.acceleration;
    },
  },

  '-fieldstart': {
    afterStateChange: async (ctx) => {
      if (ctx.skipAnims) return 50;
      const label = fxLabels().cond(effectId(ctx.args[1]));
      if (label) void bannerAction(ctx.scene, label, 1200);
      return 600 / ctx.acceleration;
    },
  },

  '-sidestart': {
    afterStateChange: async (ctx) => {
      if (ctx.skipAnims) return 50;
      const label = fxLabels().cond(effectId(ctx.args[2]));
      if (label) void bannerAction(ctx.scene, label, 1000);
      return 500 / ctx.acceleration;
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
      await ctx.scene.showPopup(pokemonIdent, fxLabels().tera(teraType), 1500, { tone: 'info', scale: 1.1 });
      return 1500 / ctx.acceleration;
    },
  },

  '-mega': {
    afterStateChange: async (ctx) => {
      if (ctx.skipAnims) return 50;
      const pokemonIdent = getRelativeIdent(ctx.args[1] as PokemonIdent, ctx.pov);
      await ctx.scene.showPopup(pokemonIdent, fxLabels().mega, 1500, { tone: 'info', scale: 1.1 });
      return 1500 / ctx.acceleration;
    },
  },

  '-primal': {
    afterStateChange: async (ctx) => {
      if (ctx.skipAnims) return 50;
      const pokemonIdent = getRelativeIdent(ctx.args[1] as PokemonIdent, ctx.pov);
      await ctx.scene.showPopup(pokemonIdent, fxLabels().primal, 1500, { tone: 'info', scale: 1.1 });
      return 1500 / ctx.acceleration;
    },
  },

  '-burst': {
    afterStateChange: async (ctx) => {
      if (ctx.skipAnims) return 50;
      const pokemonIdent = getRelativeIdent(ctx.args[1] as PokemonIdent, ctx.pov);
      await ctx.scene.showPopup(pokemonIdent, fxLabels().burst, 1500, { tone: 'info', scale: 1.1 });
      return 1500 / ctx.acceleration;
    },
  },

  '-zpower': {
    afterStateChange: async (ctx) => {
      if (ctx.skipAnims) return 50;
      const pokemonIdent = getRelativeIdent(ctx.args[1] as PokemonIdent, ctx.pov);
      await ctx.scene.showPopup(pokemonIdent, fxLabels().zmove, 1000, { tone: 'info', scale: 1.1 });
      return 1000 / ctx.acceleration;
    },
  },

  '-zbroken': {
    afterStateChange: async (ctx) => {
      if (ctx.skipAnims) return 50;
      const pokemonIdent = getRelativeIdent(ctx.args[1] as PokemonIdent, ctx.pov);
      await ctx.scene.showPopup(pokemonIdent, fxLabels().zbroken, 1000, { tone: 'muted' });
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
  'inactive', 't:', '', 'join', 'gametype', 'player',
  'teamsize', 'gen', 'tier', 'rated', 'rule', 'clearpoke', 'poke', 'start',
]);

export function getEventHandler(type: string): EventHandler | undefined {
  return eventHandlers[type];
}

export function getDefaultTimeout(accel: number): number {
  return defaultTimeout(accel);
}
