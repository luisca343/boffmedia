/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type SharexTokenEntity = {
    id: number;
    label: string;
    /**
     * Boffmedia account that issued it, if any.
     */
    createdBy?: number | null;
    createdAt: string;
    /**
     * Last upload accepted with this token.
     */
    usedAt?: string | null;
    /**
     * Revoked tokens are kept so their uploads stay attributable.
     */
    revoked: boolean;
};

