import { Battle } from "@pkmn/client";
import { ArgType, BattleArgsKWArgsTypes, PokemonIdent } from "@pkmn/protocol";
import { AnimationContext } from "./AnimationRegistry";
import {
  faintAction, turnAction, moveAction, damageAction, healAction, missAction,
  textPopupAction, critAction, bannerAction, recallAction, summonAction,
  prepareMoveAction, getPokemonIdentCode,
} from "./battleActions";
import { getRelativeIdent } from "./replayUtils";
import { fxLabels } from "./fxLabels";
import { playCry } from "./BattleAudio";

export interface EventHandler {
  getPayload?(args: ArgType, kwArgs: BattleArgsKWArgsTypes, battle: Battle): any;
  /**
   * Runs BEFORE `battle.add`. The only place that can still read what the line
   * is about to overwrite — the Pokemon leaving a slot, the HP before a hit.
   */
  preApply?(ctx: AnimationContext): Promise<void>;
  /** Runs after `battle.add`. Returns how long to hold before the next line. */
  postApply?(ctx: AnimationContext): Promise<number>;
}

const defaultTimeout = (accel: number) => 300 / Math.max(1, accel);

const toId = (s: unknown) => String(s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
/** "move: Stealth Rock" → "stealthrock"; "Sandstorm" → "sandstorm". */
const effectId = (s: unknown) => toId(String(s ?? "").split(":").pop());
/** "move: Stealth Rock" → "Stealth Rock"; "ability: Intimidate" → "Intimidate". */
const effectName = (s: unknown) => String(s ?? "").split(":").pop()!.trim();

const rel = (ctx: AnimationContext, i = 1) => getRelativeIdent(ctx.args[i] as PokemonIdent, ctx.pov);

const arrows = (n: number, up: boolean) => (up ? "▲" : "▼").repeat(Math.max(1, Math.min(3, n)));

/** `ms` at the current speed. 0 while skipping. */
const hold = (ctx: AnimationContext, ms: number) => (ctx.skipAnims ? 0 : ms / Math.max(1, ctx.acceleration));

/**
 * The Pokemon currently occupying the slot an ident names — read BEFORE the
 * line is applied, so it is the one being recalled.
 */
function activeAt(battle: Battle, ident: string): any | null {
  const sideId = String(ident).slice(0, 2) === 'p2' ? 'p2' : 'p1';
  const side: any = (battle as any)[sideId];
  if (!side) return null;
  const slotChar = String(ident).charAt(2);
  const slot = slotChar >= 'a' && slotChar <= 'z' ? slotChar.charCodeAt(0) - 97 : 0;
  return side.active?.[slot] ?? null;
}

/**
 * Cries are FIRE AND FORGET. Awaiting one puts a network fetch (and, for a
 * missing forme file, a 404 round-trip) in the middle of the animation
 * pipeline — the battle visibly stalled on a sound that may never arrive.
 */
function cry(ctx: AnimationContext, speciesId: string | undefined | null): void {
  if (!ctx.audioState || !speciesId) return;
  void playCry(speciesId, ctx.audioState);
}

/** The species id the client holds for an ident, after the line is applied. */
function speciesIdAt(ctx: AnimationContext, i = 1): string | undefined {
  const ident = ctx.args[i] as PokemonIdent;
  const poke = activeAt(ctx.battle, String(ident)) ?? ctx.battle.getPokemon?.(ident);
  const fromState = (poke as any)?.species?.id;
  if (fromState) return String(fromState);
  const details = ctx.args[2];
  if (typeof details === 'string') return toId(details.split(',')[0]);
  return undefined;
}

/**
 * switch / drag / replace.
 *
 * `preApply` recalls whoever is standing there — it MUST run before
 * `battle.add`, because after it the slot holds the newcomer and there is
 * nothing left to recall. `postApply` waits for React to mount the new sprite
 * (`ctx.commit`) before animating it: the element is keyed by identity, so it
 * does not exist until the render that follows the state change.
 */
function switchHandler(mode: 'switch' | 'drag' | 'replace'): EventHandler {
  return {
    preApply: async (ctx) => {
      const ident = String(ctx.args[1] ?? '');
      const code = rel(ctx);
      const outgoing = activeAt(ctx.battle, ident);
      const changing = !!outgoing && outgoing.ident !== ident;
      if (!changing) return;
      // Cancels anything still queued on the old occupant.
      ctx.scene.bumpSlot(code);
      // `replace` is an Illusion reveal: the same body, a corrected identity.
      if (mode === 'replace' || ctx.skipAnims) return;
      // A KO'd Pokemon is not recalled — `|faint|` already shrank and faded it,
      // and Showdown shows only the summon for the replacement. Playing the
      // recall anyway threw a ball at an invisible sprite and cost half a
      // second of dead field on every knockout.
      if (outgoing.fainted || (outgoing.hp ?? 1) <= 0) return;
      await recallAction(ctx.scene, code);
    },
    postApply: async (ctx) => {
      const code = rel(ctx);
      // React mounts the incoming <img> here. Nothing may touch it before.
      await ctx.commit();
      if (!ctx.skipAnims && mode !== 'replace') {
        await summonAction(ctx.scene, code);
      }
      cry(ctx, speciesIdAt(ctx));
      return hold(ctx, 150);
    },
  };
}

/** bumpSlot + commit: the sprite's identity changed, so React remounts it. */
function identityChangeHandler(ms = 500): EventHandler {
  return {
    preApply: async (ctx) => {
      ctx.scene.bumpSlot(rel(ctx));
    },
    postApply: async (ctx) => {
      await ctx.commit();
      return hold(ctx, ms);
    },
  };
}

/** A popup carrying the effect's own name, when the catalog knows it. */
function labelledPopup(argIndex: number, tone: 'info' | 'muted' | 'status' = 'info', ms = 700): EventHandler {
  return {
    postApply: async (ctx) => {
      if (ctx.skipAnims) return 0;
      const raw = ctx.args[argIndex];
      const label = fxLabels().cond(effectId(raw)) ?? effectName(raw);
      if (label) void textPopupAction(ctx.scene, rel(ctx), label, 900, { tone, scale: 0.9 });
      return hold(ctx, ms);
    },
  };
}

/** Muted "nothing happened" popup — cant, fail, block, no target. */
function mutedPopup(labelArg?: number, ms = 500): EventHandler {
  return {
    postApply: async (ctx) => {
      if (ctx.skipAnims) return 0;
      const raw = labelArg === undefined ? null : ctx.args[labelArg];
      const label = (raw && (fxLabels().cond(effectId(raw)) ?? effectName(raw))) || fxLabels().miss;
      void textPopupAction(ctx.scene, rel(ctx), label, 800, { tone: 'muted', scale: 0.9 });
      return hold(ctx, ms);
    },
  };
}

/** A field banner when the catalog has a word for the condition. */
function bannerHandler(argIndex: number, ms = 400): EventHandler {
  return {
    postApply: async (ctx) => {
      if (ctx.skipAnims) return 0;
      const label = fxLabels().cond(effectId(ctx.args[argIndex]));
      if (label) void bannerAction(ctx.scene, label, 900);
      return hold(ctx, ms);
    },
  };
}

/** A boost operation with no arrows of its own (clear / set / swap / copy). */
const boostOpHandler: EventHandler = {
  postApply: async (ctx) => {
    if (ctx.skipAnims) return 0;
    void textPopupAction(ctx.scene, rel(ctx), '↕', 700, { tone: 'muted', scale: 0.9 });
    return hold(ctx, 350);
  },
};

const winHandler: EventHandler = {
  postApply: async (ctx) => {
    ctx.battle.winner = ctx.args[1] as string;
    return 0;
  },
};

export const eventHandlers: Record<string, EventHandler> = {
  'switch': switchHandler('switch'),
  'drag': switchHandler('drag'),
  'replace': switchHandler('replace'),

  'swap': {
    preApply: async (ctx) => {
      ctx.scene.bumpSlot(rel(ctx));
      const other = String(ctx.args[2] ?? '');
      if (other) ctx.scene.bumpSlot(getPokemonIdentCode(other));
    },
    postApply: async (ctx) => {
      await ctx.commit();
      return hold(ctx, 300);
    },
  },

  'detailschange': identityChangeHandler(600),
  '-formechange': identityChangeHandler(600),
  '-transform': identityChangeHandler(600),

  'faint': {
    preApply: async (ctx) => {
      const code = rel(ctx);
      cry(ctx, (activeAt(ctx.battle, String(ctx.args[1] ?? '')) as any)?.species?.id);
      if (!ctx.skipAnims) await faintAction(ctx.battle, ctx.scene, code as PokemonIdent);
      ctx.scene.bumpSlot(code);
    },
    postApply: async (ctx) => hold(ctx, 400),
  },

  'turn': {
    postApply: async (ctx) => {
      if (ctx.skipAnims) return 0;
      ctx.battle.setTurn(parseInt(ctx.args[1] as string));
      await turnAction(ctx.battle, ctx.args[1] as any);
      return hold(ctx, 500);
    },
  },

  'move': {
    postApply: async (ctx) => {
      if (ctx.skipAnims) return 0;
      const defender = (ctx.args[3] as PokemonIdent) || (ctx.args[1] as PokemonIdent);
      await moveAction(
        ctx.battle, ctx.scene,
        rel(ctx),
        ctx.args[2] as string,
        getRelativeIdent(defender, ctx.pov)
      );
      return hold(ctx, 400);
    },
  },

  '-prepare': {
    postApply: async (ctx) => {
      if (ctx.skipAnims) return 0;
      const defender = (ctx.args[3] as PokemonIdent) || (ctx.args[1] as PokemonIdent);
      await prepareMoveAction(
        ctx.battle, ctx.scene,
        rel(ctx),
        ctx.args[2] as string,
        getRelativeIdent(defender, ctx.pov)
      );
      return hold(ctx, 400);
    },
  },

  '-damage': {
    getPayload: (args, _kwArgs, battle) => {
      const damage = battle.damagePercentage(args[1] as PokemonIdent, args[2] as any);
      return { damage };
    },
    postApply: async (ctx) => {
      if (ctx.skipAnims) return 0;
      void damageAction(ctx.battle, ctx.scene, rel(ctx), ctx.data?.damage as string);
      return hold(ctx, 800);
    },
  },

  '-heal': {
    getPayload: (args, kwArgs, battle) => {
      const fromEffect = kwArgs.from && battle.get('conditions', kwArgs.from);
      const revival = (fromEffect as any)?.id === 'revivalblessing';
      const poke = battle.getPokemon(args[1] as PokemonIdent, revival);
      const health = poke?.healthParse(args[2] as string);
      return { health };
    },
    postApply: async (ctx) => {
      if (ctx.skipAnims) return 0;
      void healAction(ctx.battle, ctx.scene, rel(ctx), ctx.data?.health as number[]);
      return hold(ctx, 800);
    },
  },

  '-sethp': {
    postApply: async (ctx) => hold(ctx, 300),
  },

  '-hitcount': {
    postApply: async (ctx) => {
      if (ctx.skipAnims) return 0;
      const n = parseInt(String(ctx.args[2] ?? '1'), 10) || 1;
      void textPopupAction(ctx.scene, rel(ctx), `×${n}`, 800, { tone: 'info', scale: 0.9 });
      return hold(ctx, 350);
    },
  },

  '-miss': {
    postApply: async (ctx) => {
      if (ctx.skipAnims) return 0;
      // |-miss|SOURCE|TARGET — the popup belongs over the one that was missed.
      const target = (ctx.args[2] as PokemonIdent) || (ctx.args[1] as PokemonIdent);
      await missAction(ctx.battle, ctx.scene, getRelativeIdent(target, ctx.pov));
      return hold(ctx, 400);
    },
  },

  '-crit': {
    postApply: async (ctx) => {
      if (ctx.skipAnims) return 0;
      await critAction(ctx.scene, rel(ctx));
      return hold(ctx, 300);
    },
  },

  '-supereffective': {
    postApply: async (ctx) => {
      if (ctx.skipAnims) return 0;
      void textPopupAction(ctx.scene, rel(ctx), fxLabels().super, 1000, { tone: 'crit', scale: 1.1 });
      return hold(ctx, 500);
    },
  },

  '-resisted': {
    postApply: async (ctx) => {
      if (ctx.skipAnims) return 0;
      void textPopupAction(ctx.scene, rel(ctx), fxLabels().resisted, 900, { tone: 'muted', scale: 0.9 });
      return hold(ctx, 400);
    },
  },

  '-immune': {
    postApply: async (ctx) => {
      if (ctx.skipAnims) return 0;
      void textPopupAction(ctx.scene, rel(ctx), fxLabels().immune, 900, { tone: 'muted' });
      return hold(ctx, 400);
    },
  },

  '-ohko': {
    postApply: async (ctx) => hold(ctx, 400),
  },

  '-status': {
    postApply: async (ctx) => {
      if (ctx.skipAnims) return 0;
      void textPopupAction(ctx.scene, rel(ctx), fxLabels().status(String(ctx.args[2])), 1000, { tone: 'status' });
      return hold(ctx, 500);
    },
  },

  '-curestatus': {
    postApply: async (ctx) => {
      if (ctx.skipAnims) return 0;
      void textPopupAction(ctx.scene, rel(ctx), fxLabels().cured, 900, { tone: 'heal' });
      return hold(ctx, 400);
    },
  },

  '-item': labelledPopup(2, 'info'),
  '-enditem': labelledPopup(2, 'muted'),
  '-ability': labelledPopup(2, 'info'),
  '-endability': labelledPopup(2, 'muted'),

  '-start': labelledPopup(2, 'status', 600),
  '-end': labelledPopup(2, 'muted', 500),
  '-activate': labelledPopup(2, 'info', 600),
  '-singleturn': labelledPopup(2, 'info', 500),
  '-singlemove': labelledPopup(2, 'info', 500),

  'cant': mutedPopup(2),
  '-fail': mutedPopup(2),
  '-block': mutedPopup(2),
  '-notarget': mutedPopup(),

  '-boost': {
    postApply: async (ctx) => {
      if (ctx.skipAnims) return 0;
      const n = parseInt(String(ctx.args[3] ?? "1"), 10) || 1;
      void textPopupAction(ctx.scene, rel(ctx), `${arrows(n, true)} ${fxLabels().stat(String(ctx.args[2]))}`, 900, { tone: 'boostUp' });
      return hold(ctx, 450);
    },
  },

  '-unboost': {
    postApply: async (ctx) => {
      if (ctx.skipAnims) return 0;
      const n = parseInt(String(ctx.args[3] ?? "1"), 10) || 1;
      void textPopupAction(ctx.scene, rel(ctx), `${arrows(n, false)} ${fxLabels().stat(String(ctx.args[2]))}`, 900, { tone: 'boostDown' });
      return hold(ctx, 450);
    },
  },

  '-setboost': boostOpHandler,
  '-swapboost': boostOpHandler,
  '-copyboost': boostOpHandler,
  '-invertboost': boostOpHandler,
  '-clearboost': boostOpHandler,
  '-clearallboost': boostOpHandler,
  '-clearnegativeboost': boostOpHandler,
  '-clearpositiveboost': boostOpHandler,

  '-weather': {
    postApply: async (ctx) => {
      if (ctx.skipAnims) return 0;
      // Upkeep lines repeat every turn; only the change gets a banner.
      if ((ctx.kwArgs as any)?.upkeep) return hold(ctx, 100);
      const id = effectId(ctx.args[1]);
      if (!id || id === 'none') return hold(ctx, 100);
      const label = fxLabels().cond(id);
      if (label) void bannerAction(ctx.scene, label, 1200);
      return hold(ctx, 600);
    },
  },

  '-fieldstart': bannerHandler(1, 600),
  '-fieldend': bannerHandler(1, 400),
  '-sidestart': bannerHandler(2, 500),
  '-sideend': bannerHandler(2, 400),
  '-swapsideconditions': {
    postApply: async (ctx) => hold(ctx, 400),
  },

  'win': winHandler,
  'tie': winHandler,

  '-terastallize': {
    postApply: async (ctx) => {
      if (ctx.skipAnims) return 0;
      await textPopupAction(ctx.scene, rel(ctx), fxLabels().tera(String(ctx.args[2])), 1500, { tone: 'info', scale: 1.1 });
      return hold(ctx, 300);
    },
  },

  '-mega': {
    postApply: async (ctx) => {
      if (ctx.skipAnims) return 0;
      await textPopupAction(ctx.scene, rel(ctx), fxLabels().mega, 1500, { tone: 'info', scale: 1.1 });
      return hold(ctx, 300);
    },
  },

  '-primal': {
    postApply: async (ctx) => {
      if (ctx.skipAnims) return 0;
      await textPopupAction(ctx.scene, rel(ctx), fxLabels().primal, 1500, { tone: 'info', scale: 1.1 });
      return hold(ctx, 300);
    },
  },

  '-burst': {
    postApply: async (ctx) => {
      if (ctx.skipAnims) return 0;
      await textPopupAction(ctx.scene, rel(ctx), fxLabels().burst, 1500, { tone: 'info', scale: 1.1 });
      return hold(ctx, 300);
    },
  },

  '-zpower': {
    postApply: async (ctx) => {
      if (ctx.skipAnims) return 0;
      await textPopupAction(ctx.scene, rel(ctx), fxLabels().zmove, 1000, { tone: 'info', scale: 1.1 });
      return hold(ctx, 300);
    },
  },

  '-zbroken': {
    postApply: async (ctx) => {
      if (ctx.skipAnims) return 0;
      await textPopupAction(ctx.scene, rel(ctx), fxLabels().zbroken, 1000, { tone: 'muted' });
      return hold(ctx, 300);
    },
  },
};

/**
 * Lines that are bookkeeping, chat or metadata. They cost 0 ms and never reach
 * a handler — every one of them used to fall through to the 300 ms default, so
 * a room with an active chat played back in slow motion and the opening
 * `|player|`/`|poke|` block took seconds of dead air before the first switch.
 */
export const noAnimEvents = new Set<string>([
  'inactive', 'inactiveoff', 't:', '',
  'join', 'j', 'leave', 'l', 'n', 'name',
  'gametype', 'player', 'teamsize', 'gen', 'tier', 'rated', 'rule',
  'clearpoke', 'poke', 'start', 'teampreview', 'upkeep',
  '-hint', 'raw', 'html', 'uhtml', 'uhtmlchange',
  'c', 'c:', 'chat', 'callback', 'error', 'debug', 'bigerror', 'seed',
  '-message', '-anim', '-center', '-combine', '-waiting', 'request',
]);

export function getEventHandler(type: string): EventHandler | undefined {
  return eventHandlers[type];
}

export function getDefaultTimeout(accel: number): number {
  return defaultTimeout(accel);
}
