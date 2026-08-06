/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type RotomApp = {
    /**
     * Unique identifier for the app
     */
    id: number;
    /**
     * Name of the app
     */
    name: string;
    /**
     * URL or path to the app
     */
    url: string | null;
    /**
     * Whether the app is active
     */
    active: RotomApp.active | null;
};
export namespace RotomApp {
    /**
     * Whether the app is active
     */
    export enum active {
        '_0' = 0,
        '_1' = 1,
    }
}

