import { Battle } from "@pkmn/client";
import { ArgType, BattleArgsKWArgsTypes, PokemonHPStatus, PokemonIdent } from "@pkmn/protocol";

export interface EventPayload {
  type: string;
  payload: any;
}

export function getEventPayload(
  type: string,
  args: ArgType,
  kwArgs: BattleArgsKWArgsTypes,
  battle: Battle
): EventPayload {
  switch (type) {
    case '-damage': {
      const damage = battle.damagePercentage(args[1] as PokemonIdent, args[2] as PokemonHPStatus);
      return { type, payload: { damage } };
    }
    case '-heal': {
      const fromEffect = kwArgs.from && battle.get('conditions', kwArgs.from);
      const revival = fromEffect?.id === 'revivalblessing';
      const poke = battle.getPokemon(args[1], revival)!;
      const health = poke.healthParse(args[2]);
      return { type, payload: { health } };
    }
    default:
      return { type, payload: null };
  }
}
