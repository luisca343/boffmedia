/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CreateAppDto = {
    /**
     * Server UUID (automatically added by middleware)
     */
    server?: string;
    /**
     * The name of the app
     */
    name: string;
    /**
     * The URL of the app
     */
    url?: string;
    /**
     * The active status of the app
     */
    active?: CreateAppDto.active;
};
export namespace CreateAppDto {
    /**
     * The active status of the app
     */
    export enum active {
        '_0' = 0,
        '_1' = 1,
    }
}

