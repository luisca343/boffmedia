import { Battle } from "@pkmn/client";
import { ArgType, BattleArgsKWArgsTypes } from "@pkmn/protocol";
import { getEventHandler } from "./eventHandlers";

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
  const handler = getEventHandler(type);
  if (handler?.getPayload) {
    return { type, payload: handler.getPayload(args, kwArgs, battle) };
  }
  return { type, payload: null };
}
