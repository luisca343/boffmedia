/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type PokemonW = {
    /**
     * Pokédex number
     */
    dex: number;
    /**
     * Nature
     */
    nature: string;
    /**
     * Species
     */
    species: string;
    /**
     * Form (if any)
     */
    form?: string;
    /**
     * Palette (if any)
     */
    palette?: string;
    /**
     * Nickname or name
     */
    name: string;
    /**
     * Level
     */
    level: number;
    /**
     * Held item
     */
    item: string;
    /**
     * Ability
     */
    ability: string;
    /**
     * Moveset (up to 4 moves)
     */
    moves: Array<string>;
    /**
     * IVs (HP, Atk, Def, SpA, SpD, Spe)
     */
    ivs: Array<string>;
    /**
     * EVs (HP, Atk, Def, SpA, SpD, Spe)
     */
    evs: Array<string>;
    /**
     * Stats (HP, Atk, Def, SpA, SpD, Spe)
     */
    stats: Array<string>;
};

