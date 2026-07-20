/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type GiveLootboxDto = {
    /**
     * Server UUID (automatically added by middleware)
     */
    server?: string;
    /**
     * Player UUID
     */
    uuid: string;
    /**
     * Lootbox type ID
     */
    lootboxType: string;
    /**
     * Amount of lootboxes to give
     */
    amount?: number;
};

