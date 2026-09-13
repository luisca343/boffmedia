/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ReleaseReadinessEntity = {
    releaseId: number;
    version: string;
    requiredSurfaces: Array<'web' | 'api' | 'desktop'>;
    verifiedSurfaces: Array<'web' | 'api' | 'desktop'>;
    missingSurfaces: Array<'web' | 'api' | 'desktop'>;
    eligible: boolean;
};

