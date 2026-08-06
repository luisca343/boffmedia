/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type TeamsheetMonDto = {
    /**
     * Slot number (1-6).
     */
    slot?: number;
    /**
     * National dex number (sprite lookup).
     */
    dex?: number;
    name: string;
    item?: string;
    ability?: string;
    /**
     * Tera type.
     */
    tera?: string;
    moves: Array<string>;
};

