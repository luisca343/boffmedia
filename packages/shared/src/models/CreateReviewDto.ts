/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CreateReviewDto = {
    /**
     * Server UUID (automatically added by middleware)
     */
    server?: string;
    orderId: number;
    reviewerUuid: string;
    rating: number;
    body?: string;
};

