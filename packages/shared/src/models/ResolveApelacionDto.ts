/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ResolveApelacionDto = {
    /**
     * Server UUID (automatically added by middleware)
     */
    server?: string;
    outcome: ResolveApelacionDto.outcome;
    decision: string;
    reviewerUuid: string;
};
export namespace ResolveApelacionDto {
    export enum outcome {
        UPHELD = 'upheld',
        OVERTURNED = 'overturned',
    }
}

