// types.ts
import { ArgType, BattleArgsKWArgType } from "@pkmn/protocol";

export type BattleState = 'IDLE' | 'PLAYING' | 'PAUSED' | 'SEEKING' | 'ANIMATING';

export type BattleAction = {
    type: string;
    args: ArgType;
    kwArgs: BattleArgsKWArgType;
    timestamp: number;
    line: string;
};

export type ActionParams = {
    args: ArgType;
    kwArgs: BattleArgsKWArgType;
    data?: any;
};

export type BattleStatus = {
    currentTurn: number;
    activePokemon: {
        p1: (string | null)[];
        p2: (string | null)[];
    };
    lastAction: string | null;
    isValid: boolean;
};

export function validateBattleState(status: BattleStatus): boolean {
    if (status.currentTurn < 0) return false;
    if (!status.activePokemon.p1.length || !status.activePokemon.p2.length) return false;
    return true;
}

export function isValidAction(args: ArgType): boolean {
    if (!args || !args[0]) return false;
    // Add specific validation rules for different action types
    switch (args[0]) {
        case 'move':
            return args.length >= 3; // Needs at least: move, pokemon, moveName
        case 'switch':
            return args.length >= 3; // Needs at least: switch, pokemon, details
        case 'turn':
            return args.length >= 2 && !isNaN(Number(args[1])); // Needs valid turn number
        default:
            return true;
    }
}