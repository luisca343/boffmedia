/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PokemonModelLocator } from './PokemonModelLocator';
export type PokemonPalette = {
    /**
     * Palette name
     */
    name: string;
    /**
     * Texture path
     */
    texture: string;
    /**
     * Sprite path
     */
    sprite?: string;
    /**
     * Particle effect
     */
    particle?: string;
    /**
     * Emissive texture path
     */
    emissive?: string;
    /**
     * Model locator
     */
    modelLocator?: PokemonModelLocator;
    /**
     * Sound effects
     */
    sounds?: Array<string>;
};

