/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ResolveDenunciaDto = {
    /**
     * Server UUID (automatically added by middleware)
     */
    server?: string;
    status: ResolveDenunciaDto.status;
    resolution: string;
    resolvedBy: string;
};
export namespace ResolveDenunciaDto {
    export enum status {
        RESOLVED = 'resolved',
        DISMISSED = 'dismissed',
    }
}

