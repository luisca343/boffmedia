/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ReviewSuggestionDto = {
    status: ReviewSuggestionDto.status;
    reviewNote?: string;
};
export namespace ReviewSuggestionDto {
    export enum status {
        PENDING = 'pending',
        APPROVED = 'approved',
        REJECTED = 'rejected',
    }
}

