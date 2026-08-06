/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type PasaporteStandingEntity = {
    /**
     * Battles fought inside the season window.
     */
    battles: number;
    wins: number;
    losses: number;
    /**
     * Current consecutive wins, counting back from the most recent battle.
     */
    streak: number;
    /**
     * DERIVED, never stored: max(0, wins * 20 - losses * 12) over the season’s real replays.
     */
    lp: number;
    /**
     * The highest lp reached walking the season’s battles chronologically.
     */
    peakLp: number;
    tierKey: PasaporteStandingEntity.tierKey;
    tier: string;
    /**
     * How deep into the tier band the lp sits — the top quarter is I.
     */
    division: PasaporteStandingEntity.division;
    /**
     * lp needed for the next rung. Null at Maestro.
     */
    nextAt?: number | null;
    /**
     * 1-based position among every player with at least one battle this season, by derived lp. 0 when the trainer has not fought.
     */
    regionRank: number;
};
export namespace PasaporteStandingEntity {
    export enum tierKey {
        BRONCE = 'bronce',
        PLATA = 'plata',
        ORO = 'oro',
        PLATINO = 'platino',
        DIAMANTE = 'diamante',
        MAESTRO = 'maestro',
    }
    /**
     * How deep into the tier band the lp sits — the top quarter is I.
     */
    export enum division {
        I = 'I',
        II = 'II',
        III = 'III',
        IV = 'IV',
    }
}

