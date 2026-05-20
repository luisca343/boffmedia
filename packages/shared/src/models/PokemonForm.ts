/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PokemonAbilities } from './PokemonAbilities';
import type { PokemonAggression } from './PokemonAggression';
import type { PokemonBattleStats } from './PokemonBattleStats';
import type { PokemonDimensions } from './PokemonDimensions';
import type { PokemonEvolution } from './PokemonEvolution';
import type { PokemonEvYields } from './PokemonEvYields';
import type { PokemonGenderProperties } from './PokemonGenderProperties';
import type { PokemonGigantamax } from './PokemonGigantamax';
import type { PokemonMovement } from './PokemonMovement';
import type { PokemonSpawn } from './PokemonSpawn';
export type PokemonForm = {
    /**
     * Form name
     */
    name?: string;
    /**
     * Experience group
     */
    experienceGroup?: string;
    /**
     * Pokémon types
     */
    types: Array<string>;
    /**
     * Pokémon dimensions
     */
    dimensions?: PokemonDimensions;
    /**
     * Weight in kilograms
     */
    weight?: number;
    /**
     * Pokémon abilities
     */
    abilities?: PokemonAbilities;
    /**
     * Pokémon moves by category
     */
    moves?: Record<string, any>;
    /**
     * Movement capabilities
     */
    movement?: PokemonMovement;
    /**
     * Aggression stats
     */
    aggression?: PokemonAggression;
    /**
     * Battle stats
     */
    battleStats?: PokemonBattleStats;
    /**
     * Tags
     */
    tags?: Array<string>;
    /**
     * Spawn information
     */
    spawn?: PokemonSpawn;
    /**
     * Possible genders
     */
    possibleGenders?: Array<string>;
    /**
     * Gender properties with palettes
     */
    genderProperties?: Array<PokemonGenderProperties>;
    /**
     * Egg groups
     */
    eggGroups?: Array<string>;
    /**
     * Pre-evolution names
     */
    preEvolutions?: Array<string>;
    /**
     * Default base form
     */
    defaultBaseForm?: string;
    /**
     * Mega items
     */
    megaItems?: Array<string>;
    /**
     * Mega forms
     */
    megas?: Array<string>;
    /**
     * Gigantamax information
     */
    gigantamax?: PokemonGigantamax;
    /**
     * Egg cycles
     */
    eggCycles?: number;
    /**
     * Catch rate
     */
    catchRate?: number;
    /**
     * Male percentage
     */
    malePercentage?: number;
    /**
     * Possible evolutions
     */
    evolutions?: Array<PokemonEvolution>;
    /**
     * EV yields
     */
    evYields?: PokemonEvYields;
};

