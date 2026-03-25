/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MoveEffect } from './MoveEffect';
import type { MoveTargetingInfo } from './MoveTargetingInfo';
import type { ZMove } from './ZMove';
export type FullMove = {
    /**
     * Attack index
     */
    attackIndex: number;
    /**
     * Move name
     */
    attackName: string;
    /**
     * Move type
     */
    attackType: string;
    /**
     * Move category
     */
    attackCategory: FullMove.attackCategory;
    /**
     * Base power
     */
    basePower: number;
    /**
     * Base PP
     */
    ppBase: number;
    /**
     * Maximum PP
     */
    ppMax: number;
    /**
     * Accuracy percentage
     */
    accuracy: number;
    /**
     * Whether move makes contact
     */
    makesContact: boolean;
    /**
     * Move effects
     */
    effects: Array<MoveEffect>;
    /**
     * Move animations
     */
    animations: Array<string>;
    /**
     * Targeting information
     */
    targetingInfo: MoveTargetingInfo;
    /**
     * Z-Move variants
     */
    'z': Array<ZMove>;
};
export namespace FullMove {
    /**
     * Move category
     */
    export enum attackCategory {
        PHYSICAL = 'PHYSICAL',
        SPECIAL = 'SPECIAL',
        STATUS = 'STATUS',
    }
}

