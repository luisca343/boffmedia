/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type RotomUser = {
    /**
     * Unique identifier for the user
     */
    id: number;
    /**
     * UUID of the user
     */
    uuid: string;
    /**
     * Username of the user
     */
    username: string;
    /**
     * World of the user
     */
    world?: string;
    /**
     * Current energy of the user
     */
    energy: number;
    /**
     * Last time the user charged energy
     */
    lastCharge: string;
};

