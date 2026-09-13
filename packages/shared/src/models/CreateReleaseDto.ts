/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CreateReleaseDto = {
    version: string;
    requiredSurfaces: Array<'web' | 'api' | 'desktop'>;
    changelogMode?: CreateReleaseDto.changelogMode;
    sourceCommitSha?: string;
    versionFileSha: string;
};
export namespace CreateReleaseDto {
    export enum changelogMode {
        ENTRIES = 'entries',
        NONE = 'none',
    }
}

