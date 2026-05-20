/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type UserValidationResponseEntity = {
    /**
     * Whether a user matching the identifier exists
     */
    exists: boolean;
    /**
     * Identifier type used for lookup
     */
    type: string;
    /**
     * Identifier value that was looked up
     */
    identifier: string;
};

