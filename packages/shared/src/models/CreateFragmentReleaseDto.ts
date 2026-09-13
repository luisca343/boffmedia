/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ReleaseFragmentDto } from './ReleaseFragmentDto';
export type CreateFragmentReleaseDto = {
    version: string;
    requiredSurfaces: Array<'web' | 'api' | 'desktop'>;
    changelogMode?: CreateFragmentReleaseDto.changelogMode;
    sourceCommitSha?: string;
    versionFileSha: string;
    fragments: Array<ReleaseFragmentDto>;
};
export namespace CreateFragmentReleaseDto {
    export enum changelogMode {
        ENTRIES = 'entries',
        NONE = 'none',
    }
}

