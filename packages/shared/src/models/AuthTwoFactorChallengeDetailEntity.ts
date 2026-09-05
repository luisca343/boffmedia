/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type AuthTwoFactorChallengeDetailEntity = {
    required: boolean;
    /**
     * false = the account has no second factor yet and must be walked through enrolment before it can sign in. Admin 2FA is mandatory, so this is a step, not an offer.
     */
    enrolled: boolean;
    /**
     * Short-lived typ:'mfa' token. Authenticates the /auth/2fa/challenge* routes and nothing else.
     */
    challenge_token: string;
};

