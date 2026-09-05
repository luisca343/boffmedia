/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type TwoFactorStepUpEntity = {
    /**
     * Short-lived token to send as the X-Step-Up-Token header on a sensitive action
     */
    step_up_token: string;
    /**
     * Lifetime in seconds
     */
    expires_in: number;
};

