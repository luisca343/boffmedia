/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ConcursosRecoverySettingsDto = {
    version: ConcursosRecoverySettingsDto.version;
    hostGraceSeconds: Record<string, any>;
    hostRetentionMinutes: Record<string, any>;
    allowLocalSelectionWhilePaused: Record<string, any>;
    hideQuestionWhilePaused: Record<string, any>;
    resumeCountdownSeconds: Record<string, any>;
};
export namespace ConcursosRecoverySettingsDto {
    export enum version {
        '_1' = 1,
    }
}

