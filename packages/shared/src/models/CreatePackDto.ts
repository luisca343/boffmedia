/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PackServerDto } from './PackServerDto';
export type CreatePackDto = {
    slug: string;
    name: string;
    summary?: string;
    description?: string;
    iconUrl?: string;
    gallery?: Array<{
        url?: string;
        alt?: string;
    }>;
    accessKind: CreatePackDto.accessKind;
    /**
     * Obligatoria cuando accessKind es "password"
     */
    password?: string;
    server?: PackServerDto;
};
export namespace CreatePackDto {
    export enum accessKind {
        PUBLIC = 'public',
        PASSWORD = 'password',
        ALLOWLIST = 'allowlist',
    }
}

