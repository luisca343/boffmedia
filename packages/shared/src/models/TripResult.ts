/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type TripResult = {
    /**
     * Where the player was taken
     */
    stopId: string;
    /**
     * What was charged, decided by the server
     */
    price: number;
    /**
     * Blocks travelled, as priced
     */
    distance: number;
    /**
     * Ledger transaction id of the fare
     */
    transactionId: number;
    /**
     * True when the mod never confirmed the teleport and the trip was settled by reading the player's position back. Included so support can tell those apart in a report.
     */
    confirmedByPosition: boolean;
};

