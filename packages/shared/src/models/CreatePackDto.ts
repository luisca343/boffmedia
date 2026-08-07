/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PackServerDto } from './PackServerDto';
export type CreatePackDto = {
    slug: string;
    name: string;
    /**
     * Qué juego usa el pack. PERMANENTE: no se puede cambiar tras crear el pack (rompería toda instancia instalada). Ausente = minecraft.
     */
    gameType?: CreatePackDto.gameType;
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
    /**
     * Qué juego usa el pack. PERMANENTE: no se puede cambiar tras crear el pack (rompería toda instancia instalada). Ausente = minecraft.
     */
    export enum gameType {
        MINECRAFT = 'minecraft',
        EMULATOR = 'emulator',
        ZOMBOID = 'zomboid',
        STARDEW = 'stardew',
    }
    export enum accessKind {
        PUBLIC = 'public',
        PASSWORD = 'password',
        ALLOWLIST = 'allowlist',
    }
}

