/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ClaimItemsResponseDto = {
    /**
     * Item IDs that were successfully claimed and consumed
     */
    claimedItems: Array<string>;
    /**
     * Item IDs that could not be found or consumed
     */
    failedItems: Array<string>;
    /**
     * Pokemon items that were given to the player
     */
    pokemonItems: Array<string>;
    /**
     * Regular items that were given to the player
     */
    regularItems: Array<string>;
    /**
     * Overall success status
     */
    success: boolean;
    /**
     * Message describing the result
     */
    message: string;
};

