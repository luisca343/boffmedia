/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { HeldItem } from './HeldItem';
import type { SpawnCondition } from './SpawnCondition';
export type SpawnInfo = {
    /**
     * Species specification
     */
    spec: string;
    /**
     * Location types where Pokemon spawns
     */
    stringLocationTypes: Array<string>;
    /**
     * Minimum spawn level
     */
    minLevel: number;
    /**
     * Maximum spawn level
     */
    maxLevel: number;
    /**
     * Type ID
     */
    typeID: string;
    /**
     * Held items with drop chances
     */
    heldItems?: Array<HeldItem>;
    /**
     * Spawn conditions
     */
    condition: SpawnCondition;
    /**
     * Spawn rarity
     */
    rarity: number;
    /**
     * Spawn type
     */
    spawnType: string;
    /**
     * Pokémon name
     */
    pokemonName: string;
    /**
     * Pokémon form
     */
    pokemonForm: string;
    /**
     * Pokémon palette
     */
    pokemonPalette?: string;
    /**
     * Pokédex number
     */
    pokemonDex: number;
    /**
     * Gender
     */
    gender?: string;
};

