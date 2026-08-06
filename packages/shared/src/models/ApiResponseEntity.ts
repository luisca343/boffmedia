/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ApiResponseEntity = {
    /**
     * Whether the request completed successfully
     */
    success: boolean;
    /**
     * HTTP status code of the response
     */
    statusCode: number;
    /**
     * Human-readable message describing the result
     */
    message: string;
    /**
     * Response payload, shape depends on the endpoint
     */
    data?: Record<string, any>;
};

