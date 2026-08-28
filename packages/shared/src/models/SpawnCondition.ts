/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type SpawnCondition = {
    /**
     * Time conditions
     */
    times?: Array<string>;
    /**
     * Weather conditions
     */
    weathers?: Array<string>;
    /**
     * Biome conditions (Pixelmon 9.4.0+). Tag references or literal biome ids.
     */
    biomes?: Array<string>;
    /**
     * Biome conditions, legacy key. Pixelmon 1.16.5 and the custom overlay use it exclusively; 9.4.0 keeps it on 2 spawnInfos. Read both.
     */
    stringBiomes?: Array<string>;
};

