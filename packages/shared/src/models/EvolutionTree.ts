/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { EvolutionNode } from './EvolutionNode';
export type EvolutionTree = {
    /**
     * Maximum depth of the evolution tree
     */
    depth: number;
    /**
     * Evolution tree structure
     */
    tree: Record<string, EvolutionNode>;
};

