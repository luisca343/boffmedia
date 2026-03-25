/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type EnergyStatus = {
    /**
     * Current energy amount
     */
    energy: number;
    /**
     * Maximum energy capacity
     */
    maxEnergy: number;
    /**
     * Last energy charge time
     */
    lastCharge: string;
    /**
     * Time in milliseconds until next energy charge
     */
    timeToNextCharge?: number;
};

