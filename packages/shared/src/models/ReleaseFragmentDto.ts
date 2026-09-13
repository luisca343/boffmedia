/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ReleaseFragmentDto = {
    fragmentId: string;
    sourcePath: string;
    contentHash: string;
    type: ReleaseFragmentDto.type;
    titleEn: string;
    descriptionEn: string;
    titleEs?: string;
    descriptionEs?: string;
};
export namespace ReleaseFragmentDto {
    export enum type {
        NEW = 'new',
        IMPROVEMENT = 'improvement',
        FIX = 'fix',
        SECURITY = 'security',
        DEPRECATED = 'deprecated',
        REMOVED = 'removed',
    }
}

