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
    /**
     * Fijo tras la creación: cambiar el juego de un pack con versiones publicadas rompería cada instalación existente
     */
    gameType?: CreatePackDto.gameType;
};
export namespace CreatePackDto {
    export enum accessKind {
        PUBLIC = 'public',
        PASSWORD = 'password',
        ALLOWLIST = 'allowlist',
    }
    /**
     * Fijo tras la creación: cambiar el juego de un pack con versiones publicadas rompería cada instalación existente
     */
    export enum gameType {
        MINECRAFT = 'minecraft',
        EMULATOR = 'emulator',
    }
}

