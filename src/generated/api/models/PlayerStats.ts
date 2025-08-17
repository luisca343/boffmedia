/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MinecraftCustomStats } from './MinecraftCustomStats';
export type PlayerStats = {
    /**
     * minecraft:killed stats
     */
    'minecraft:killed'?: Record<string, number>;
    /**
     * minecraft:picked_up stats
     */
    'minecraft:picked_up'?: Record<string, number>;
    /**
     * minecraft:crafted stats
     */
    'minecraft:crafted'?: Record<string, number>;
    /**
     * minecraft:used stats
     */
    'minecraft:used'?: Record<string, number>;
    /**
     * minecraft:custom stats
     */
    'minecraft:custom'?: MinecraftCustomStats;
    /**
     * minecraft:dropped stats
     */
    'minecraft:dropped'?: Record<string, number>;
    /**
     * minecraft:mined stats
     */
    'minecraft:mined'?: Record<string, number>;
    /**
     * Minecraft data version
     */
    DataVersion: number;
};

