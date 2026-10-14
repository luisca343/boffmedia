/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ConcursosConfigurationDto = {
    mode?: ConcursosConfigurationDto.mode;
    pacing?: ConcursosConfigurationDto.pacing;
    resultSeconds?: number;
};
export namespace ConcursosConfigurationDto {
    export enum mode {
        INDIVIDUAL = 'individual',
        TEAMS = 'teams',
    }
    export enum pacing {
        AUTOMATIC = 'automatic',
        DIRECTED = 'directed',
    }
}

