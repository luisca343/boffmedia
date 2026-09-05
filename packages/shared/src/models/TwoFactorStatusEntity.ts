/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type TwoFactorStatusEntity = {
    /**
     * Whether this account holds a role that requires 2FA
     */
    required: boolean;
    /**
     * Whether a confirmed second factor exists
     */
    enrolled: boolean;
    /**
     * Backup codes not yet spent
     */
    backup_codes_remaining: number;
};

