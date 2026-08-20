/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SharexTokenEntity } from './SharexTokenEntity';
export type CreatedSharexTokenEntity = {
    /**
     * The plaintext token. Returned ONCE, on creation — only its hash is stored, so a lost token is reissued rather than recovered.
     */
    token: string;
    summary: SharexTokenEntity;
};

