/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PackServerDto } from './PackServerDto';
export type UpdatePackDto = {
    name?: string;
    summary?: string;
    description?: string;
    iconUrl?: string;
    gallery?: Array<{
        url?: string;
        alt?: string;
    }>;
    accessKind?: UpdatePackDto.accessKind;
    /**
     * Cadena vacía para quitar la contraseña
     */
    password?: string;
    /**
     * null para dejar de ser un pack de servidor
     */
    server?: PackServerDto | null;
    archived?: boolean;
};
export namespace UpdatePackDto {
    export enum accessKind {
        PUBLIC = 'public',
        PASSWORD = 'password',
        ALLOWLIST = 'allowlist',
    }
}

