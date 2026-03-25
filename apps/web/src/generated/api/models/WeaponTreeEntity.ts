/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { WeaponTreeNodeEntity } from './WeaponTreeNodeEntity';
export type WeaponTreeEntity = {
    /**
     * Complete weapon upgrade tree
     */
    tree: Array<WeaponTreeNodeEntity>;
    /**
     * Weapons grouped by weapon kind
     */
    treeByKind: Record<string, any>;
    /**
     * Total number of weapons in the tree
     */
    totalWeapons: number;
    /**
     * Available weapon kinds
     */
    weaponKinds: Array<string>;
};

