/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MinecraftCustomStats } from './MinecraftCustomStats';
export type PlayerStats = {
    /**
     * minecraft:killed stats
     */
    'minecraft:killed'?: Record<string, any>;
    /**
     * minecraft:picked_up stats
     */
    'minecraft:picked_up'?: Record<string, any>;
    /**
     * minecraft:crafted stats
     */
    'minecraft:crafted'?: Record<string, any>;
    /**
     * minecraft:used stats
     */
    'minecraft:used'?: Record<string, any>;
    /**
     * minecraft:custom stats
     */
    'minecraft:custom'?: MinecraftCustomStats;
    /**
     * minecraft:dropped stats
     */
    'minecraft:dropped'?: Record<string, any>;
    /**
     * minecraft:mined stats
     */
    'minecraft:mined'?: Record<string, any>;
    /**
     * Minecraft data version
     */
    DataVersion: number;
};

