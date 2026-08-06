/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type RookerTrainerStatsEntity = {
    /**
     * rotom_pokedex rows with caught_at
     */
    captures: number;
    /**
     * caught rows with palette_id <> "none"
     */
    shinies: number;
    /**
     * rotom_replays where side1|side2 = uuid
     */
    battles: number;
    /**
     * distinct caught species / total species * 100, 1 decimal
     */
    dexPct: number;
};

