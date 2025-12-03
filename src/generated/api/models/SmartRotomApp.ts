/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type SmartRotomApp = {
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
    url: string;
    /**
     * Whether the app is active
     */
    active: SmartRotomApp.active;

    /**
     * Order of the app in the list (lower numbers appear first)
     * Nullable, as some apps may not have a set order
     * Example: 0
     */
    order?: number | null;
};
export namespace SmartRotomApp {
    /**
     * Whether the app is active
     */
    export enum active {
        '_0' = 0,
        '_1' = 1,
    }
}

