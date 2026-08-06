/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type MovePokemonDto = {
    /**
     * Server UUID (automatically added by middleware)
     */
    server?: string;
    /**
     * Player UUID
     */
    uuid: string;
    /**
     * Source box (-1 = party)
     */
    sourceBox: number;
    /**
     * Source slot index within the box
     */
    sourceIndex: number;
    /**
     * Destination box (-1 = party)
     */
    destinationBox: number;
    /**
     * Destination slot index within the box
     */
    destinationIndex: number;
};

