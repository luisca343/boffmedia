/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ConcursosRecoverySettingsDto } from './ConcursosRecoverySettingsDto';
export type ConcursosConfigurationDto = {
    recoverySettings?: ConcursosRecoverySettingsDto;
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

