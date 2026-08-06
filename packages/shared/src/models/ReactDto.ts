/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ReactDto = {
    /**
     * Server UUID (automatically added by middleware)
     */
    server?: string;
    /**
     * Acting user UUID
     */
    uuid: string;
    type: ReactDto.type;
};
export namespace ReactDto {
    export enum type {
        HEART = 'heart',
        POKEBALL = 'pokeball',
        CHOQUE = 'choque',
        SHINY = 'shiny',
        FUEGO = 'fuego',
    }
}

